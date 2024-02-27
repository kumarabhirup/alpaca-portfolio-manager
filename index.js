require('dotenv').config()
const Alpaca = require('@alpacahq/alpaca-trade-api')
const { distributeStockOrders, calculatePortfolioTodoActions, placeOrders } = require('./utils')
const requireJSON5 = require('require-json5');
const PORTFOLIO_MODELS = requireJSON5('./models.json')

const MODELS = PORTFOLIO_MODELS.models
const PAPER = !PORTFOLIO_MODELS.live
const ALPACA_KEY = PAPER ? process.env.PAPER_ALPACA_KEY : process.env.ALPACA_KEY
const ALPACA_SECRET = PAPER ? process.env.PAPER_ALPACA_SECRET : process.env.ALPACA_SECRET

const alpaca = new Alpaca({
  keyId: ALPACA_KEY,
  secretKey: ALPACA_SECRET,
  paper: PAPER,
  usePolygon: false
})

async function main() {
  const account = await alpaca.getAccount()

  console.log('Account Number:', account.account_number)
  console.log('Current Portfolio Value:', `$${account.portfolio_value}`)
  console.log('Available Cash:', `$${account.cash}`)
  console.log('Available Buying Power:', `$${account.buying_power}`)

  const positions = await alpaca.getPositions()
  console.log('\n\nYour current positions:', positions.length)
  positions.length > 0 &&
    console.table(positions.map(position => {
      return {
        Symbol: position.symbol,
        Quantity: position.qty,

        // Show Amount Invested
        AmountInvested: position.cost_basis,

        // Show the Price
        InitialPrice: position.avg_entry_price,
        CurrentPrice: position.current_price,

        // Show P&L: Market Value - Cost Basis
        PnL: position.market_value - position.cost_basis,

        // Show P&L %: (Market Value - Cost Basis) / Cost Basis
        PnLPercent: `${Math.sign(position.market_value - position.cost_basis) * Math.abs(((position.market_value - position.cost_basis) / position.cost_basis) * 100).toFixed(4)}%`
      }
    }))

  // Current Orders
  const orders = await alpaca.getOrders({
    status: 'open'
  })
  const openOrdersSymbols = orders.map(order => order.symbol)
  console.log('\n\nYour open orders:', positions.length)
  orders.length > 0 && 
    console.table(orders.map(order => {
      return {
        Symbol: order.symbol,
        Quantity: order.qty,
        Type: order.type,
        Side: order.side,
        Price: order.limit_price,
        Status: order.status
      }
    }))

    // Distribute the available cash into the models
    let ordersToPlace = [];
    if (PORTFOLIO_MODELS.sellEnabled) {
      // if sellEnabled is true, distribute the current portfolio value, and find out what needs to be sold.
      const targetPortfolio = distributeStockOrders(parseFloat(account.portfolio_value), MODELS);
      const previewOrders = calculatePortfolioTodoActions(targetPortfolio, positions)

      // Remove the orders that are already placed (open orders) (match by symbol)
      let ordersToSell = previewOrders.ordersToSell.filter(order => !openOrdersSymbols.includes(order.symbol))
      let ordersToBuy = previewOrders.ordersToBuy.filter(order => !openOrdersSymbols.includes(order.symbol))

      console.log('\nPreview Orders to Sell:', ordersToSell)
      console.log('\nPreview Orders to Buy:', ordersToBuy)

      ordersToPlace = [...ordersToSell, ...ordersToBuy]
    } else {
      // just distribute the available cash
      ordersToPlace = distributeStockOrders(parseFloat(account.buying_power), MODELS);

      // Remove the orders that are already placed (open orders) (match by symbol)
      ordersToPlace = ordersToPlace.filter(order => !openOrdersSymbols.includes(order.symbol))

      console.log('\nPreview Orders to Buy:', ordersToPlace)
    }

    // Ask Y or N to place the orders
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    readline.question('\n\nDo you want to place these orders? (Y/N)', async answer => {
      if (answer.toUpperCase() === 'Y') {
        await placeOrders(ordersToPlace, alpaca);
      }

      readline.close();
      return;
    });

    readline.on('close', () => {
      console.log('\n\nOperation ended.');
      return;
    });

    return;
}

main()
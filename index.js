require('dotenv').config()

const PAPER = false
const ALPACA_KEY = PAPER ? process.env.PAPER_ALPACA_KEY : process.env.ALPACA_KEY
const ALPACA_SECRET = PAPER ? process.env.PAPER_ALPACA_SECRET : process.env.ALPACA_SECRET
const PORTFOLIO_MODELS = require('./models.json')
const MODELS = PORTFOLIO_MODELS.models

const Alpaca = require('@alpacahq/alpaca-trade-api')
const { distributeStockOrders } = require('./utils')

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

  const previewOrders = distributeStockOrders(account.cash, MODELS)
  console.log('\n\nPreview Orders:', previewOrders)
}

main()
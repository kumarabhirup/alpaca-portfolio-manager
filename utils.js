function distributeStockOrders(availableCash, models) {
    const orders = [];
    const modelMap = new Map();

    // Create a map of models for easy lookup
    models.forEach(model => {
        if (model.models) {
            modelMap.set(model.symbol, model.models);
        }
    });

    // Recursive function to distribute orders
    function distribute(cash, items, parentPercent = 100) {
        // Validate that percentages add up to 100 if parentPercent is not 0
        const totalPercent = items.reduce((sum, item) => sum + item.percent, 0);
        if (parentPercent !== 0 && totalPercent > 100 && totalPercent !== 0) {
            throw new Error('Percentages do not add up to 100 in a model.');
        }

        items.forEach(item => {
            const itemCash = cash * (item.percent / 100) * (parentPercent / 100);

            if (modelMap.has(item.symbol)) {
                // If the symbol is a model, recursively distribute orders
                const nestedModel = modelMap.get(item.symbol);
                distribute(cash, nestedModel, item.percent);
            } else if (item.percent > 0) {
                // If the symbol is a stock and percent is greater than 0, create an order
                const stockOrder = {
                    symbol: item.symbol,
                    amount: itemCash
                };
                orders.push(stockOrder);
            }
        });
    }

    // Start distribution from top-level models
    distribute(availableCash, models);

    // Aggregate orders by symbol
    const aggregatedOrders = orders.reduce((acc, order) => {
        if (acc[order.symbol]) {
            acc[order.symbol].amount += order.amount;
        } else {
            acc[order.symbol] = { symbol: order.symbol, amount: order.amount };
        }
        return acc;
    }, {});

    return Object.values(aggregatedOrders);
}

function calculatePortfolioTodoActions(previewOrders, positions) {
    // Convert current positions to a Map for easy lookup
    const currentPositions = new Map(positions.map(position => [position.symbol, parseFloat(position.market_value)]));

    // Determine orders to sell
    let ordersToSell = [];
    currentPositions.forEach((currentValue, symbol) => {
    const targetValue = previewOrders.find(order => order.symbol === symbol)?.amount || 0;
    if (currentValue > targetValue) {
        ordersToSell.push({
            symbol,
            amount: (currentValue - targetValue) * -1
        });
    }
    });

    // Determine orders to buy
    let ordersToBuy = previewOrders.filter(order => {
        const currentValue = currentPositions.get(order.symbol) || 0;
        return order.amount > currentValue;
    }).map(order => ({
        symbol: order.symbol,
        amount: order.amount - (currentPositions.get(order.symbol) || 0)
    }));

    return {
        ordersToSell,
        ordersToBuy
    };
}

async function placeOrders(orders, alpaca) {
    for (const order of orders) {
        const roundedAmount = Math.floor(Math.abs(order.amount) * 100) / 100;

        const orderSide = order.amount < 0 ? 'sell' : 'buy';
        console.log(`\n\n${orderSide === 'sell' ? 'Selling' : 'Buying'} $${roundedAmount} of ${order.symbol}...`);

        const _order = await alpaca.createOrder({
            symbol: order.symbol,
            notional: roundedAmount,
            side: orderSide,
            type: 'market',
            time_in_force: 'day'
        }).then((order) => {
            console.log('Order placed.');
            return order;
        })
        .catch(err => {
            console.log(err?.response?.data.message);
            return err?.response?.data.message;
        });

        if (typeof _order === 'string' && _order.includes('is not fractionable')) {
            console.log(`Placing a share quantity order instead...`);

            // Calculate the share quantity based on the current price
            const quote = await alpaca.getLatestQuote(order.symbol);
            const askPrice = quote.AskPrice || quote.BidPrice;
            const shareQuantity = Math.floor(roundedAmount / askPrice);

            console.log(`Buying ${shareQuantity} shares of ${order.symbol} for $${shareQuantity * askPrice}...`);

            await alpaca.createOrder({
                symbol: order.symbol,
                qty: shareQuantity,
                side: orderSide,
                type: 'market',
                time_in_force: 'day'
            }).then((order) => {
                console.log('Order placed.');
                return order;
            })
            .catch(err => {
                console.log(err?.response?.data.message);
                return err?.response?.data.message;
            });
        }
    }
}

module.exports = {
  distributeStockOrders,
  calculatePortfolioTodoActions,
  placeOrders
}

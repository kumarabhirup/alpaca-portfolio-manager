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
        if (parentPercent !== 0 && totalPercent !== 100 && totalPercent !== 0) {
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

module.exports = {
  distributeStockOrders
}

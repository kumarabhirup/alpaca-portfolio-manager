# Alpaca Portfolio Manager

Alpaca Portfolio Manager is a Node.js Script designed to automate and optimize your investment strategy across various asset classes including indexes, cryptocurrencies, and treasuries. By leveraging the Alpaca API for live or paper trading, users can configure their portfolio according to predefined models or customize their own. The system supports dynamic allocation percentages for each asset, enabling a tailored investment approach that aligns with individual risk tolerance and financial goals. Whether you're looking to diversify your holdings or focus on specific sectors, Alpaca Portfolio Manager offers a flexible and nerdy platform to help you achieve your investment objectives.

## Run using a simple command

```bash
npx alpaca-portfolio-manager --model models.json --env .env
```

### models.json
```jsonc
{
  // Alpaca Live vs Paper Trading
  "live": true,

  // if sellEnabled is false, the bot will work with the remaining buying power 
  // and will not sell any assets to achieve the desired portfolio.
  "sellEnabled": true,

  // Portfolio models
  "models": [
    {
      "symbol": "Model::Indexes-Crypto-Treasuries::Q1:2024",
      "models": [
        {
          "symbol": "SPY", // S&P 500
          "percent": 30
        },
        {
          "symbol": "DJIA", // DOW Jones Industrial Average
          "percent": 25
        },
        {
          "symbol": "QQQ", // NASDAQ
          "percent": 25
        },
        {
          "symbol": "GBTC", // Bitcoin ETF
          "percent": 10
        },
        {
          "symbol": "STCE", // Top Crypto ETF
          "percent": 5
        },
        {
          "symbol": "SCHO", // Short-Term Treasury ETF
          "percent": 5
        }
      ],
      "percent": 100
    },

    // Supports multiple models and symbols, percentage-wise which can be used to create a portfolio of portfolios
    {
      "symbol": "AAPL",
      "percent": 0
    },

    // You may reuse models like this into other models
    {
      "symbol": "Model::Indexes-Crypto-Treasuries::Q1:2024", // Reuse the model above
      "percent": 0 // 0 percent means it will be ignored
    }
  ]
}
```

### .env

```
ALPACA_KEY=AK***
ALPACA_SECRET=***
PAPER_ALPACA_KEY=PK***
PAPER_ALPACA_SECRET=***
```

# License

**MIT © [Kumar Abhirup](https://www.twitter.com/kumareth)**
<br />
_Follow me 👋 **on Twitter**_ → [![Twitter](https://img.shields.io/twitter/follow/kumareth.svg?style=social&label=@kumareth)](https://twitter.com/kumareth/)

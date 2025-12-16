# Multibagger Stock Screener - Backend API

Backend API for screening stocks using the Yartseva (2025) methodology from "The Alchemy of Multibagger Stocks."

## Overview

This API implements a comprehensive stock screening system based on 9 fundamental factors:

1. **Valuation** - P/E, P/B ratios
2. **Growth** - Asset and EBITDA growth rates
3. **Profitability** - ROA, ROE, EBITDA margins
4. **Quality** - Balance sheet strength
5. **Price Momentum** - 52-week position
6. **Earnings Momentum** - Profitability trends
7. **Small Cap Premium** - Market cap scoring
8. **Low Volatility** - Beta-based risk
9. **Financial Strength** - FCF and asset quality

Each factor scores 0-5 points, with a maximum total score of 45 points.

### Classification

- **Multibagger (35-45)**: Strong multibagger potential
- **Potential (25-34)**: Moderate potential
- **Neutral (15-24)**: Average stock
- **Poor (0-14)**: Weak fundamentals

## Features

- SQLite database with automatic caching
- Rate-limited API calls to Financial Modeling Prep
- Web search integration via Anthropic for growth metrics
- Historical screening results tracking
- Comprehensive scoring system
- RESTful API endpoints

## Prerequisites

- Node.js 18+ and npm
- Financial Modeling Prep API key (free tier available)
- Anthropic API key

## Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Edit .env and add your API keys
nano .env
```

## Configuration

Edit `.env` file:

```env
PORT=3000
NODE_ENV=development
FMP_API_KEY=your_fmp_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### Get API Keys

- **FMP API Key**: https://financialmodelingprep.com/developer/docs/
- **Anthropic API Key**: https://console.anthropic.com/

## Usage

### Development Mode

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

## API Endpoints

### Screen a Single Ticker

```bash
GET /api/screen/ticker/:ticker
```

Example:
```bash
curl http://localhost:3000/api/screen/ticker/AAPL
```

Response:
```json
{
  "ticker": "AAPL",
  "companyName": "Apple Inc.",
  "sector": "Technology",
  "marketCap": 2900000000000,
  "price": 185.50,
  "metrics": {
    "peRatio": 28.5,
    "pbRatio": 42.3,
    "dividendYield": 0.5,
    "roa": 27.8,
    "ebitdaMargin": 33.2,
    "assetGrowth": 8.5,
    "ebitdaGrowth": 12.3,
    "fcf": 99000000000,
    "high52w": 199.62,
    "low52w": 164.08
  },
  "scores": {
    "valuation": 2,
    "growth": 3,
    "profitability": 5,
    "quality": 4,
    "priceMomentum": 3,
    "earningsMomentum": 4,
    "smallCap": 0,
    "lowVolatility": 3,
    "financialStrength": 5,
    "total": 29,
    "classification": "potential"
  },
  "dataSource": "api",
  "timestamp": 1702850400000
}
```

### Get Top Scoring Stocks

```bash
GET /api/screen/top?limit=50&minScore=25
```

Parameters:
- `limit`: Number of results (default: 50)
- `minScore`: Minimum total score (default: 25)

### Get Historical Results for a Ticker

```bash
GET /api/screen/history/:ticker?limit=10
```

### Cache Management

```bash
# Get cache statistics
GET /api/cache/stats

# Clear expired cache entries
DELETE /api/cache/expired

# Clear all cache entries
DELETE /api/cache/all
```

## Database Schema

### stock_cache
Cached stock data (refreshed every 24 hours):
- ticker, company_name, sector, industry
- market_cap, price, 52-week high/low
- fcf, book_value, total_assets
- ebitda, ebitda_margin, roa
- asset_growth, ebitda_growth
- dividend_yield, pe_ratio, pb_ratio

### screening_results
Historical screening results with scores:
- All stock metrics
- 9 individual scores (0-5 each)
- total_score (0-45)
- classification

### Additional Tables
- bulk_screening_jobs: Track bulk screening progress
- historical_prices: For backtesting
- historical_fundamentals: For backtesting

## Rate Limits

- **FMP API**: 250 requests/minute
- **Anthropic API**: 50 requests/minute

The system automatically handles rate limiting using Bottleneck.

## Architecture

```
src/
├── config/
│   └── database.ts          # SQLite setup and schema
├── services/
│   ├── fmp-api.service.ts   # Financial Modeling Prep API
│   ├── anthropic.service.ts # Anthropic web search
│   ├── cache.service.ts     # Database caching
│   └── scoring.service.ts   # Yartseva scoring logic
├── controllers/
│   └── screen.controller.ts # Screening endpoints
├── routes/
│   ├── screen.routes.ts     # Screen routes
│   └── cache.routes.ts      # Cache routes
└── index.ts                 # Express server
```

## Development

### Project Structure

- TypeScript for type safety
- Express for API server
- better-sqlite3 for database
- Bottleneck for rate limiting
- Zod for validation

### Adding New Metrics

1. Add to `ScoringInput` interface in `scoring.service.ts`
2. Implement scoring function
3. Update `calculateScores()` method
4. Add to database schema if needed

## Troubleshooting

### API Key Issues

If you see "MISSING" for API keys:
```bash
# Verify .env file exists
cat .env

# Restart the server
npm run dev
```

### Database Issues

The database is created automatically in `data/multibaggers.db`. To reset:
```bash
rm -rf data/
npm run dev
```

### Rate Limit Errors

The system automatically throttles requests. If you hit limits:
- Wait a few minutes
- Check your API key tier limits
- Consider upgrading API plans

## Performance

- First request: ~2-3 seconds (fetches from APIs)
- Cached request: ~50-100ms
- Cache duration: 24 hours
- Concurrent requests: Handled via rate limiter

## License

MIT

## References

Yartseva, A. (2025). "The Alchemy of Multibagger Stocks." CAFE Working Paper 33.

# Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd /home/brett/multibaggers/backend
npm install
```

### 2. Configure Environment Variables
```bash
# Copy the template
cp .env.example .env

# Edit with your API keys
nano .env
```

Required API keys:
- **FMP_API_KEY**: Get free key at https://financialmodelingprep.com/developer/docs/
- **ANTHROPIC_API_KEY**: Get key at https://console.anthropic.com/

### 3. Start the Server
```bash
npm run dev
```

The server will start on http://localhost:3000

## Test the API

### Screen a Stock
```bash
curl http://localhost:3000/api/screen/ticker/AAPL | jq
```

### Get Top Scoring Stocks
```bash
curl http://localhost:3000/api/screen/top?limit=10&minScore=30 | jq
```

### Check Cache Stats
```bash
curl http://localhost:3000/api/cache/stats | jq
```

## Example Response

When screening a ticker (e.g., AAPL), you'll get:

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

## Understanding the Scores

### Classification System
- **Multibagger (35-45)**: Strong multibagger potential
- **Potential (25-34)**: Moderate potential
- **Neutral (15-24)**: Average stock
- **Poor (0-14)**: Weak fundamentals

### 9 Scoring Factors (0-5 each)

1. **Valuation**: Lower P/E and P/B ratios are better
2. **Growth**: Higher asset and EBITDA growth rates
3. **Profitability**: Higher ROA, ROE, margins
4. **Quality**: Strong balance sheet (current ratio, low debt)
5. **Price Momentum**: Position in 52-week range
6. **Earnings Momentum**: Recent profitability trends
7. **Small Cap**: Smaller companies score higher
8. **Low Volatility**: Lower beta = lower risk
9. **Financial Strength**: Strong FCF and asset quality

## Common Use Cases

### Find Potential Multibaggers
```bash
# Get stocks with score 30+
curl http://localhost:3000/api/screen/top?minScore=30&limit=50 | jq
```

### Screen Multiple Tickers
```bash
# Screen a list of tickers
for ticker in AAPL MSFT GOOGL AMZN; do
  echo "Screening $ticker..."
  curl http://localhost:3000/api/screen/ticker/$ticker | jq '.scores'
  sleep 1
done
```

### Track a Stock Over Time
```bash
# Get historical screening results
curl http://localhost:3000/api/screen/history/AAPL | jq
```

### Clear Old Cache
```bash
# Clear expired entries (older than 24 hours)
curl -X DELETE http://localhost:3000/api/cache/expired | jq
```

## Performance Notes

- **First request**: 2-3 seconds (fetches from APIs)
- **Cached request**: 50-100ms (from database)
- **Cache duration**: 24 hours
- **Rate limits**: Automatically handled

## Troubleshooting

### API Keys Not Working
```bash
# Check if keys are loaded
curl http://localhost:3000/health
# Look for "configured" next to API keys in server logs
```

### Rate Limit Errors
Wait 1-2 minutes and try again. The system automatically throttles requests.

### Database Issues
```bash
# Reset database
rm -rf data/
npm run dev  # Database recreates automatically
```

### TypeScript Errors
```bash
# Rebuild
npm run build
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Review [STRUCTURE.md](STRUCTURE.md) for architecture details
3. Explore the API endpoints with Postman or curl
4. Customize scoring logic in `src/services/scoring.service.ts`

## Production Deployment

```bash
# Build for production
npm run build

# Set production environment
export NODE_ENV=production
export PORT=3000

# Start
npm start
```

Consider using:
- PM2 for process management
- Nginx as reverse proxy
- SSL/TLS certificates
- Environment-specific .env files

## Support

For issues or questions:
1. Check the README.md
2. Review STRUCTURE.md
3. Examine the TypeScript source files
4. Check API key validity and rate limits

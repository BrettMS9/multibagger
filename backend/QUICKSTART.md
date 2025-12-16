# Quick Start Guide

## Setup (5 minutes)

### 1. Install Dependencies
```bash
cd backend
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
- **FMP_API_KEY** (required): Get free key at https://financialmodelingprep.com/developer/docs/
- **GEMINI_API_KEY** (optional): Get key at https://aistudio.google.com/apikey

### 3. Start the Server
```bash
npm run dev
```

The server will start on http://localhost:3001

## Test the API

### Screen a Stock
```bash
curl http://localhost:3001/api/screen/ticker/AAPL | jq
```

### Get Top Scoring Stocks
```bash
curl "http://localhost:3001/api/screen/top?limit=10&minPercentage=55" | jq
```

### Check Cache Stats
```bash
curl http://localhost:3001/api/cache/stats | jq
```

## Understanding the Scores

### Yartseva 9-Factor System (110 points max)

| Factor | Max | Description |
|--------|-----|-------------|
| FCF Yield | 25 | **MOST IMPORTANT** - Free cash flow / market cap |
| Size | 15 | Smaller companies (<$350M) score higher |
| Book-to-Market | 15 | Higher B/M ratio = better value |
| Investment Pattern | 15 | **UNIQUE** - EBITDA growth > Asset growth |
| EBITDA Margin | 10 | Operating profitability |
| ROA | 10 | Return on assets efficiency |
| Price Range | 10 | **CONTRARIAN** - Near 52-week lows = good |
| Momentum | 5 | **CONTRARIAN** - Negative momentum = good |
| Dividend | 5 | 78% of multibaggers paid dividends |

### Classification System

| Classification | Threshold | Meaning |
|----------------|-----------|---------|
| STRONG BUY | ≥70% | Strong multibagger potential |
| MODERATE BUY | ≥55% | Moderate potential |
| WEAK BUY | ≥40% | Limited potential |
| AVOID | <40% | Weak fundamentals |

## Common Use Cases

### Find Potential Multibaggers
```bash
# Get stocks with 55%+ score (MODERATE BUY or better)
curl "http://localhost:3001/api/screen/top?minPercentage=55&limit=50" | jq
```

### Screen Multiple Tickers
```bash
for ticker in AAPL MSFT GOOGL AMZN; do
  echo "Screening $ticker..."
  curl -s "http://localhost:3001/api/screen/ticker/$ticker" | jq '{ticker, percentage, classification}'
  sleep 1
done
```

### Track a Stock Over Time
```bash
curl http://localhost:3001/api/screen/history/AAPL | jq
```

## Performance Notes

- **First request**: 2-3 seconds (fetches from APIs)
- **Cached request**: 50-100ms (from database)
- **Cache duration**: 24 hours
- **Rate limits**: Automatically handled

## Troubleshooting

### API Keys Not Working
```bash
# Server logs show key status on startup
npm run dev
# Look for "configured" or "MISSING" next to API keys
```

### Rate Limit Errors
Wait 1-2 minutes and try again. The system automatically throttles requests.

### Database Issues
```bash
# Reset database
rm -rf data/
npm run dev  # Database recreates automatically
```

## Next Steps

1. Read the full [README.md](README.md) for detailed documentation
2. Start the frontend: `cd ../frontend && npm run dev`
3. Explore the scoring logic in `src/services/scoring.service.ts`

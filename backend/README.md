# Multibagger Stock Screener - Backend API

Backend API for screening stocks using the Yartseva (2025) methodology from "The Alchemy of Multibagger Stocks" - CAFE Working Paper No.33.

## Overview

This API implements the empirically-validated Yartseva 9-Factor Scoring System, based on analysis of 464 stocks achieving 10x+ returns from 2009-2024.

### Scoring System (110 points max)

| Factor | Max Points | Key Insight |
|--------|------------|-------------|
| **FCF Yield** | 25 | MOST IMPORTANT - highest predictive power |
| **Size** | 15 | Market cap < $350M optimal |
| **Book-to-Market** | 15 | Value factor (B/M > 1.0 ideal) |
| **Investment Pattern** | 15 | UNIQUE FINDING - EBITDA growth > Asset growth |
| **EBITDA Margin** | 10 | Operating profitability |
| **ROA** | 10 | Asset efficiency |
| **Price Range** | 10 | CONTRARIAN - buy near 52-week lows |
| **Momentum** | 5 | CONTRARIAN - negative momentum preferred |
| **Dividend** | 5 | 78% of multibaggers paid dividends |

### Classification

- **STRONG BUY (≥70%)**: Strong multibagger potential
- **MODERATE BUY (≥55%)**: Moderate potential
- **WEAK BUY (≥40%)**: Limited potential
- **AVOID (<40%)**: Weak fundamentals

## Features

- SQLite database with automatic 24-hour caching
- Rate-limited API calls to Financial Modeling Prep
- Hybrid growth metrics: FMP historical data (primary) + Gemini search (fallback)
- Historical screening results tracking
- Comprehensive 9-factor scoring system
- RESTful API endpoints

## Prerequisites

- Node.js 18+ and npm
- Financial Modeling Prep API key (free tier: 250 requests/day)
- Gemini API key (optional, for fallback - free tier: 1,500 searches/day)

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
PORT=3001
NODE_ENV=development
FMP_API_KEY=your_fmp_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here  # Optional
```

### Get API Keys

- **FMP API Key** (required): https://financialmodelingprep.com/developer/docs/
- **Gemini API Key** (optional): https://aistudio.google.com/apikey

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
curl http://localhost:3001/api/screen/ticker/AAPL
```

Response:
```json
{
  "ticker": "AAPL",
  "name": "Apple Inc.",
  "sector": "Technology",
  "industry": "Consumer Electronics",
  "price": 185.50,
  "marketCap": 2900000000000,
  "high52w": 199.62,
  "low52w": 164.08,
  "factors": {
    "fcfYield": { "score": 8, "maxScore": 25, "value": "3.4%", "rationale": "..." },
    "size": { "score": 0, "maxScore": 15, "value": "$2.90T", "rationale": "..." },
    "bookToMarket": { "score": 4, "maxScore": 15, "value": "0.02", "rationale": "..." },
    ...
  },
  "totalScore": 42,
  "maxScore": 110,
  "percentage": 38.2,
  "classification": "AVOID",
  "dataSource": "api",
  "timestamp": 1702850400000
}
```

### Get Top Scoring Stocks

```bash
GET /api/screen/top?limit=50&minPercentage=55
```

Parameters:
- `limit`: Number of results (default: 50)
- `minPercentage`: Minimum score percentage (default: 40)

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

## Growth Metrics: Hybrid Approach

The system uses a cost-optimized hybrid approach for calculating EBITDA and Asset growth rates:

1. **Primary (FMP Historical Data)**: Calculates 3-year CAGR from income statements and balance sheets
   - FREE: No additional API costs
   - FAST: Data already fetched in screening flow
   - ACCURATE: Direct from SEC filings

2. **Fallback (Gemini 2.0 Flash)**: Uses Google Search grounding when FMP data is incomplete
   - Only triggered when FMP historical data insufficient
   - 1,500 free searches/day, then $0.035/search
   - Gracefully degrades if GEMINI_API_KEY not configured

## Architecture

```
src/
├── config/
│   └── database.ts          # SQLite setup and schema
├── services/
│   ├── fmp-api.service.ts   # Financial Modeling Prep API + CAGR calculation
│   ├── gemini.service.ts    # Gemini fallback for growth metrics
│   ├── cache.service.ts     # Database caching
│   └── scoring.service.ts   # Yartseva 9-factor scoring logic
├── controllers/
│   └── screen.controller.ts # Screening endpoints
├── routes/
│   ├── screen.routes.ts     # Screen routes
│   └── cache.routes.ts      # Cache routes
└── index.ts                 # Express server
```

## Rate Limits

- **FMP API**: 250 requests/day (free tier)
- **Gemini API**: 1,500 grounded searches/day (free tier)

The system automatically handles rate limiting using Bottleneck.

## Performance

- First request: ~2-3 seconds (fetches from APIs)
- Cached request: ~50-100ms
- Cache duration: 24 hours
- Growth metrics from FMP: ~0ms additional (data already fetched)
- Growth metrics from Gemini fallback: ~1-2 seconds

## License

MIT

## References

Yartseva, A. (2025). "The Alchemy of Multibagger Stocks." CAFE Working Paper No.33.

# Backend Structure

## Directory Layout

```
backend/
├── .env.example              # Environment variables template
├── .gitignore               # Git ignore rules
├── README.md                # Main documentation
├── package.json             # Node dependencies
├── tsconfig.json            # TypeScript configuration
│
└── src/
    ├── index.ts             # Main server entry point
    │
    ├── config/
    │   └── database.ts      # SQLite database setup and schema
    │
    ├── services/
    │   ├── fmp-api.service.ts       # Financial Modeling Prep API client + CAGR calculation
    │   ├── gemini.service.ts        # Gemini 2.0 Flash fallback for growth metrics
    │   ├── cache.service.ts         # Database caching layer
    │   └── scoring.service.ts       # Yartseva scoring implementation (110 pts)
    │
    ├── controllers/
    │   └── screen.controller.ts     # Screening logic and endpoints
    │
    └── routes/
        ├── screen.routes.ts         # Screen API routes
        └── cache.routes.ts          # Cache management routes
```

## Key Files

### 1. Database Configuration (`src/config/database.ts`)
- Initializes better-sqlite3 connection
- Creates 5 tables on startup:
  - `stock_cache`: Cached stock data (24-hour TTL)
  - `screening_results`: Historical screening results with scores
  - `bulk_screening_jobs`: Job tracking for bulk operations
  - `historical_prices`: Price data for backtesting
  - `historical_fundamentals`: Fundamental data for backtesting

### 2. FMP API Service (`src/services/fmp-api.service.ts`)
- Rate-limited (250/min) API client for Financial Modeling Prep
- Fetches: profiles, quotes, key metrics, ratios, financials
- Returns structured TypeScript interfaces
- Parallel data fetching for efficiency
- **calculateGrowthMetrics()**: Calculates 3-year CAGR from historical data

### 3. Gemini Service (`src/services/gemini.service.ts`)
- Rate-limited (60/min) fallback using Gemini 2.0 Flash
- Google Search grounding for growth metrics when FMP data incomplete
- Only triggered when FMP historical data is unavailable
- 1,500 free grounded searches/day

### 4. Cache Service (`src/services/cache.service.ts`)
- Check/save stock data to SQLite cache
- 24-hour freshness window
- Cache statistics and management
- Clear expired/all entries

### 5. Scoring Service (`src/services/scoring.service.ts`)
- Implements Yartseva 9-factor scoring system (110 points max):
  1. FCF Yield (25 pts) - MOST IMPORTANT
  2. Size (15 pts) - Market cap <$350M optimal
  3. Book-to-Market (15 pts) - Value factor
  4. Investment Pattern (15 pts) - EBITDA growth > Asset growth
  5. EBITDA Margin (10 pts) - Profitability
  6. ROA (10 pts) - Asset efficiency
  7. Price Range (10 pts) - CONTRARIAN: near 52-week lows
  8. Momentum (5 pts) - CONTRARIAN: negative is good
  9. Dividend (5 pts) - 78% of multibaggers paid dividends
- Classification: STRONG BUY (>=70%), MODERATE BUY (>=55%), WEAK BUY (>=40%), AVOID (<40%)

### 6. Screen Controller (`src/controllers/screen.controller.ts`)
- Main screening endpoint logic
- **Hybrid approach**: FMP data (primary) + Gemini (fallback)
- Calculates Yartseva scores
- Saves results to database
- Returns complete screening result

### 7. Routes
- `screen.routes.ts`: Screen ticker, top scorers, history
- `cache.routes.ts`: Cache stats and management

### 8. Main Server (`src/index.ts`)
- Express server setup
- CORS middleware
- Health check endpoint
- API route mounting
- Error handling

## Database Schema

### stock_cache
```sql
CREATE TABLE stock_cache (
  ticker TEXT PRIMARY KEY,
  company_name TEXT,
  sector TEXT,
  industry TEXT,
  market_cap REAL,
  price REAL,
  high_52w REAL,
  low_52w REAL,
  fcf REAL,
  book_value REAL,
  total_assets REAL,
  ebitda REAL,
  ebitda_margin REAL,
  roa REAL,
  asset_growth REAL,
  ebitda_growth REAL,
  dividend_yield REAL,
  pe_ratio REAL,
  pb_ratio REAL,
  data_fetched_at INTEGER NOT NULL
);
```

### screening_results
```sql
CREATE TABLE screening_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticker TEXT NOT NULL,
  screened_at INTEGER NOT NULL,

  -- Company info
  company_name TEXT,
  sector TEXT,
  market_cap REAL,

  -- Raw metrics
  price REAL,
  high_52w REAL,
  low_52w REAL,
  fcf REAL,
  book_value REAL,
  total_assets REAL,
  ebitda REAL,
  ebitda_margin REAL,
  roa REAL,
  asset_growth REAL,
  ebitda_growth REAL,
  dividend_yield REAL,
  pe_ratio REAL,
  pb_ratio REAL,

  -- Yartseva scores
  score_fcf_yield INTEGER,
  score_size INTEGER,
  score_book_to_market INTEGER,
  score_investment_pattern INTEGER,
  score_ebitda_margin INTEGER,
  score_roa INTEGER,
  score_price_range INTEGER,
  score_momentum INTEGER,
  score_dividend INTEGER,

  -- Total score (0-110)
  total_score INTEGER NOT NULL,

  -- Classification
  classification TEXT CHECK(classification IN ('STRONG BUY', 'MODERATE BUY', 'WEAK BUY', 'AVOID')) NOT NULL
);
```

## API Endpoints

### Screen Single Ticker
```
GET /api/screen/ticker/:ticker
```
Returns complete screening result with metrics and scores.

### Get Top Scorers
```
GET /api/screen/top?limit=50&minPercentage=55
```
Returns list of highest-scoring stocks.

### Get Ticker History
```
GET /api/screen/history/:ticker?limit=10
```
Returns historical screening results for a ticker.

### Cache Stats
```
GET /api/cache/stats
```
Returns cache statistics (total, fresh, expired).

### Clear Expired Cache
```
DELETE /api/cache/expired
```
Removes expired cache entries.

### Clear All Cache
```
DELETE /api/cache/all
```
Removes all cache entries.

## Technology Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express 5
- **Database**: SQLite (better-sqlite3)
- **Rate Limiting**: Bottleneck
- **External APIs**:
  - Financial Modeling Prep (stock data + historical CAGR)
  - Gemini 2.0 Flash (fallback for growth metrics)

## Rate Limits

- FMP API: 250 requests/day free tier
- Gemini API: 1,500 grounded searches/day free tier

## Environment Variables

```env
PORT=3001
NODE_ENV=development
FMP_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here  # Optional - for fallback
```

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your API keys

# Run in development
npm run dev

# Build for production
npm run build
npm start
```

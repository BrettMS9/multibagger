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
    │   ├── fmp-api.service.ts       # Financial Modeling Prep API client
    │   ├── anthropic.service.ts     # Anthropic web search for growth metrics
    │   ├── cache.service.ts         # Database caching layer
    │   └── scoring.service.ts       # Yartseva scoring implementation
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

### 3. Anthropic Service (`src/services/anthropic.service.ts`)
- Rate-limited (50/min) web search via Anthropic API
- Searches for complex growth metrics (asset growth, EBITDA growth)
- Uses Claude Sonnet 4.5 with web_search tool
- Returns structured JSON responses

### 4. Cache Service (`src/services/cache.service.ts`)
- Check/save stock data to SQLite cache
- 24-hour freshness window
- Cache statistics and management
- Clear expired/all entries

### 5. Scoring Service (`src/services/scoring.service.ts`)
- Implements Yartseva 9-factor scoring system:
  1. Valuation (P/E, P/B)
  2. Growth (asset, EBITDA)
  3. Profitability (ROA, ROE, margins)
  4. Quality (balance sheet)
  5. Price Momentum (52-week position)
  6. Earnings Momentum (trends)
  7. Small Cap Premium
  8. Low Volatility
  9. Financial Strength (FCF, assets)
- Each factor: 0-5 points
- Total: 0-45 points
- Classification: multibagger (35+), potential (25-34), neutral (15-24), poor (0-14)

### 6. Screen Controller (`src/controllers/screen.controller.ts`)
- Main screening endpoint logic
- Combines FMP + Anthropic data
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
  
  -- Yartseva scores (0-5 each)
  score_valuation INTEGER,
  score_growth INTEGER,
  score_profitability INTEGER,
  score_quality INTEGER,
  score_price_momentum INTEGER,
  score_earnings_momentum INTEGER,
  score_small_cap INTEGER,
  score_low_vol INTEGER,
  score_financial_strength INTEGER,
  
  -- Total score (0-45)
  total_score INTEGER NOT NULL,
  
  -- Classification
  classification TEXT CHECK(classification IN ('multibagger', 'potential', 'neutral', 'poor')) NOT NULL
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
GET /api/screen/top?limit=50&minScore=25
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
- **Framework**: Express
- **Database**: SQLite (better-sqlite3)
- **Rate Limiting**: Bottleneck
- **External APIs**:
  - Financial Modeling Prep (stock data)
  - Anthropic (web search for growth metrics)

## Rate Limits

- FMP API: 250 requests/minute (240ms between requests)
- Anthropic API: 50 requests/minute (1200ms between requests)

## Environment Variables

```env
PORT=3000
NODE_ENV=development
FMP_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
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

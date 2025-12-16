import Database, { Database as DatabaseType } from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'multibaggers.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// Initialize database connection
export const db: DatabaseType = new Database(DB_PATH, {
  verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
});

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create all tables
export function initializeDatabase() {
  // Stock cache table - stores fetched stock data
  db.prepare(`
    CREATE TABLE IF NOT EXISTS stock_cache (
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
      pays_dividend INTEGER DEFAULT 0,
      pe_ratio REAL,
      pb_ratio REAL,
      price_6_months_ago REAL,
      data_fetched_at INTEGER NOT NULL,
      UNIQUE(ticker)
    )
  `).run();

  // Screening results table - historical screening results with Yartseva scores
  db.prepare(`
    CREATE TABLE IF NOT EXISTS screening_results (
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

      -- Yartseva scores (9 factors, 110 points max)
      score_fcf_yield REAL,
      score_size REAL,
      score_book_to_market REAL,
      score_investment_pattern REAL,
      score_ebitda_margin REAL,
      score_roa REAL,
      score_price_range REAL,
      score_momentum REAL,
      score_dividend REAL,

      -- Total score (0-110) and percentage
      total_score REAL NOT NULL,
      percentage REAL NOT NULL,

      -- Classification
      classification TEXT CHECK(classification IN ('STRONG BUY', 'MODERATE BUY', 'WEAK BUY', 'AVOID')) NOT NULL,

      -- Index for querying by ticker and date
      UNIQUE(ticker, screened_at)
    )
  `).run();

  // Create index for efficient queries
  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_screening_results_ticker
    ON screening_results(ticker)
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_screening_results_screened_at
    ON screening_results(screened_at DESC)
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_screening_results_percentage
    ON screening_results(percentage DESC)
  `).run();

  // Bulk screening jobs table - tracks bulk screening progress
  db.prepare(`
    CREATE TABLE IF NOT EXISTS bulk_screening_jobs (
      job_id TEXT PRIMARY KEY,
      exchange TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'running', 'completed', 'failed')) NOT NULL,
      total_tickers INTEGER,
      processed_tickers INTEGER DEFAULT 0,
      started_at INTEGER,
      completed_at INTEGER,
      error_message TEXT
    )
  `).run();

  // Historical prices table - for backtesting
  db.prepare(`
    CREATE TABLE IF NOT EXISTS historical_prices (
      ticker TEXT NOT NULL,
      date TEXT NOT NULL,
      close_price REAL NOT NULL,
      adjusted_close REAL NOT NULL,
      volume INTEGER,
      PRIMARY KEY (ticker, date)
    )
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_historical_prices_ticker
    ON historical_prices(ticker, date DESC)
  `).run();

  // Historical fundamentals table - for backtesting
  db.prepare(`
    CREATE TABLE IF NOT EXISTS historical_fundamentals (
      ticker TEXT NOT NULL,
      fiscal_date TEXT NOT NULL,
      market_cap REAL,
      fcf REAL,
      book_value REAL,
      total_assets REAL,
      ebitda REAL,
      roa REAL,
      revenue REAL,
      net_income REAL,
      PRIMARY KEY (ticker, fiscal_date)
    )
  `).run();

  db.prepare(`
    CREATE INDEX IF NOT EXISTS idx_historical_fundamentals_ticker
    ON historical_fundamentals(ticker, fiscal_date DESC)
  `).run();

  console.log('Database initialized successfully');
}

// Initialize on module load
initializeDatabase();

export default db;

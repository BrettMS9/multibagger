/**
 * Yartseva Multibagger Scoring System
 * 
 * 9 factors, 110 points maximum
 * Based on value investing, contrarian indicators, and capital efficiency
 */

export const YARTSEVA_THRESHOLDS = {
  // SIZE: Smaller companies (15 points max)
  SIZE: {
    EXCELLENT: { max: 350_000_000, points: 15 },  // < $350M
    GOOD: { max: 500_000_000, points: 12 },       // < $500M
    FAIR: { max: 1_000_000_000, points: 8 },      // < $1B
    POOR: { max: 2_000_000_000, points: 4 },      // < $2B
    DEFAULT: 0
  },

  // FCF_YIELD: Free Cash Flow Yield (25 points max) - MOST IMPORTANT
  FCF_YIELD: {
    EXCELLENT: { min: 0.12, points: 25 },  // > 12%
    GOOD: { min: 0.08, points: 20 },       // > 8%
    FAIR: { min: 0.05, points: 15 },       // > 5%
    POOR: { min: 0.0, points: 8 },         // > 0%
    DEFAULT: 0
  },

  // BOOK_TO_MARKET: Book Value / Market Cap (15 points max)
  BOOK_TO_MARKET: {
    EXCELLENT: { min: 1.0, points: 15 },   // > 1.0 (trading below book)
    GOOD: { min: 0.6, points: 12 },        // > 0.6
    FAIR: { min: 0.4, points: 8 },         // > 0.4
    POOR: { min: 0.0, points: 4 },         // > 0
    DEFAULT: 0
  },

  // EBITDA_MARGIN: Operational efficiency (10 points max)
  EBITDA_MARGIN: {
    EXCELLENT: { min: 0.20, points: 10 },  // > 20%
    GOOD: { min: 0.15, points: 8 },        // > 15%
    FAIR: { min: 0.10, points: 6 },        // > 10%
    POOR: { min: 0.0, points: 3 },         // > 0%
    DEFAULT: 0
  },

  // ROA: Return on Assets (10 points max)
  ROA: {
    EXCELLENT: { min: 0.12, points: 10 },  // > 12%
    GOOD: { min: 0.08, points: 8 },        // > 8%
    FAIR: { min: 0.05, points: 6 },        // > 5%
    POOR: { min: 0.0, points: 3 },         // > 0%
    DEFAULT: 0
  },

  // INVESTMENT_PATTERN: Capital efficiency (15 points max)
  INVESTMENT_PATTERN: {
    EXCELLENT: 15,  // EBITDA growth > Asset growth (efficient capital allocation)
    GOOD: 8,        // Both EBITDA and Assets growing
    DEFAULT: 0
  },

  // PRICE_RANGE: 52-week price position (10 points max) - CONTRARIAN
  PRICE_RANGE: {
    EXCELLENT: { percentile: 0.20, points: 10 },  // Bottom 20% of 52-week range
    DEFAULT: 0
  },

  // MOMENTUM: Recent price momentum (5 points max) - CONTRARIAN
  MOMENTUM: {
    EXCELLENT: { max: -0.15, points: 5 },  // < -15% (beaten down)
    GOOD: { max: -0.05, points: 4 },       // < -5%
    FAIR: { max: 0.0, points: 3 },         // < 0%
    DEFAULT: 0
  },

  // DIVIDEND: Dividend payment (5 points max)
  DIVIDEND: {
    PAYS: 5,
    DEFAULT: 0
  }
} as const;

// Classification thresholds (percentage of max 110 points)
export const CLASSIFICATION = {
  STRONG: 70,      // >= 70% (77+ points)
  MODERATE: 55,    // >= 55% (60.5+ points)
  WEAK: 40,        // >= 40% (44+ points)
  AVOID: 0         // < 40%
} as const;

export const MAX_SCORE = 110;

export const CLASSIFICATION_LABELS = {
  STRONG: 'Strong Multibagger',
  MODERATE: 'Moderate Potential',
  WEAK: 'Weak Signal',
  AVOID: 'Avoid'
} as const;

// API configuration
export const API_CONFIG = {
  PORT: process.env.PORT || 3001,
  RATE_LIMIT: {
    MAX_REQUESTS: 100,
    WINDOW_MS: 15 * 60 * 1000  // 15 minutes
  }
} as const;

// Database configuration
export const DB_CONFIG = {
  PATH: process.env.DB_PATH || './data/multibaggers.db',
  WAL_MODE: true
} as const;

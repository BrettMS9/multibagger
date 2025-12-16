export interface FactorScore {
  score: number;
  maxScore: number;
  value: string;
  rationale: string;
}

export interface YartsevaFactors {
  fcfYield: FactorScore;        // Factor 1: Max 25 pts - MOST IMPORTANT
  size: FactorScore;            // Factor 2: Max 15 pts
  bookToMarket: FactorScore;    // Factor 3: Max 15 pts
  investmentPattern: FactorScore; // Factor 4: Max 15 pts - UNIQUE FINDING
  ebitdaMargin: FactorScore;    // Factor 5: Max 10 pts
  roa: FactorScore;             // Factor 6: Max 10 pts
  priceRange: FactorScore;      // Factor 7: Max 10 pts - CONTRARIAN
  momentum: FactorScore;        // Factor 8: Max 5 pts - CONTRARIAN
  dividend: FactorScore;        // Factor 9: Max 5 pts
}

export interface StockScreenResult {
  ticker: string;
  name: string;
  sector: string;
  industry: string;
  exchange: string;
  price: number;
  marketCap: number;
  high52w: number;
  low52w: number;

  // Yartseva scoring
  factors: YartsevaFactors;
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID';

  // Metadata
  dataSource: 'cache' | 'api';
  timestamp: number;
}

export interface BulkScreenResult {
  ticker: string;
  name: string;
  totalScore: number;
  percentage: number;
  classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID';
  price: number;
  marketCap: number;
  sector?: string;
  industry?: string;
  high52w?: number;
  low52w?: number;
  factors?: YartsevaFactors;
}

export type Exchange = 'NYSE' | 'NASDAQ';  // Legacy, kept for compatibility

export type Sector = 'all' | 'technology' | 'healthcare' | 'energy' | 'consumer' | 'industrial' | 'financial';

export const SECTOR_LABELS: Record<Sector, string> = {
  all: 'All Russell 2000',
  technology: 'Technology',
  healthcare: 'Healthcare & Biotech',
  energy: 'Energy',
  consumer: 'Consumer',
  industrial: 'Industrial',
  financial: 'Financial',
};

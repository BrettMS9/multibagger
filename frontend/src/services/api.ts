import type { StockScreenResult, BulkScreenResult, Exchange, Sector } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface BulkScreenResponse {
  universe: string;
  screened: number;
  errors: number;
  totalSymbols: number;
  cachedSymbols: number;
  preScreened: number;
  results: StockScreenResult[];
  errorDetails: { ticker: string; error: string }[];
}

export interface BulkScreenStats {
  universe: string;
  totalSymbols: number;
  cachedSymbols: number;
  preScreened: number;
  screened: number;
  errors: number;
}

export const api = {
  async screenStock(ticker: string): Promise<StockScreenResult> {
    const response = await fetch(`${API_BASE_URL}/api/screen/ticker/${ticker}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to screen stock' }));
      throw new Error(error.message || error.detail || 'Failed to screen stock');
    }
    return response.json();
  },

  async getTopStocks(limit: number = 50, minPercentage: number = 55): Promise<BulkScreenResult[]> {
    const response = await fetch(`${API_BASE_URL}/api/screen/top?limit=${limit}&minPercentage=${minPercentage}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get top stocks' }));
      throw new Error(error.message || error.detail || 'Failed to get top stocks');
    }
    return response.json();
  },

  async bulkScreen(sector: Sector = 'all', limit: number = 25): Promise<{ results: BulkScreenResult[]; stats: BulkScreenStats }> {
    const sectorParam = sector === 'all' ? '' : `&sector=${sector}`;
    const response = await fetch(`${API_BASE_URL}/api/screen/bulk/R2000?limit=${limit}${sectorParam}`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to bulk screen' }));
      throw new Error(error.message || error.detail || 'Failed to bulk screen');
    }
    const data: BulkScreenResponse = await response.json();

    // Map full results to BulkScreenResult format, preserving factors for detail view
    const results = data.results.map(r => ({
      ticker: r.ticker,
      name: r.name,
      totalScore: r.totalScore,
      percentage: r.percentage,
      classification: r.classification,
      price: r.price,
      marketCap: r.marketCap,
      sector: r.sector,
      industry: r.industry,
      high52w: r.high52w,
      low52w: r.low52w,
      factors: r.factors,
    }));

    const stats: BulkScreenStats = {
      universe: data.universe,
      totalSymbols: data.totalSymbols,
      cachedSymbols: data.cachedSymbols,
      preScreened: data.preScreened || 0,
      screened: data.screened,
      errors: data.errors,
    };

    return { results, stats };
  },

  async getExchangeResults(exchange: Exchange, limit: number = 100, minPercentage: number = 0): Promise<BulkScreenResult[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/screen/exchange/${exchange}?limit=${limit}&minPercentage=${minPercentage}`
    );
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to get exchange results' }));
      throw new Error(error.message || error.detail || 'Failed to get exchange results');
    }
    const data = await response.json();
    return data.results;
  },
};

import type { StockScreenResult, BulkScreenResult, Exchange } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = {
  async screenStock(ticker: string): Promise<StockScreenResult> {
    const response = await fetch(`${API_BASE_URL}/screen/${ticker}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to screen stock');
    }
    return response.json();
  },

  async bulkScreen(exchange: Exchange): Promise<BulkScreenResult[]> {
    const response = await fetch(`${API_BASE_URL}/bulk-screen/${exchange}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to bulk screen');
    }
    return response.json();
  },
};

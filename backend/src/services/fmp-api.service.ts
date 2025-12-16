import Bottleneck from 'bottleneck';

// Rate limiter: 250 requests per minute for FMP API
const fmpLimiter = new Bottleneck({
  maxConcurrent: 5,
  minTime: 240, // 250/min = ~240ms between requests
});

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  description?: string;
}

export interface Quote {
  symbol: string;
  price: number;
  dayHigh: number;
  dayLow: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  pe?: number;
  eps?: number;
}

export interface KeyMetrics {
  symbol: string;
  date: string;
  marketCap: number;
  peRatio?: number;
  pbRatio?: number;
  priceToSalesRatio?: number;
  dividendYield?: number;
  roe?: number;
  roa?: number;
  debtToEquity?: number;
  freeCashFlowPerShare?: number;
  bookValuePerShare?: number;
}

export interface FinancialRatios {
  symbol: string;
  date: string;
  returnOnAssets?: number;
  returnOnEquity?: number;
  ebitdaMargin?: number;
  profitMargin?: number;
  assetTurnover?: number;
  currentRatio?: number;
  quickRatio?: number;
}

export interface IncomeStatement {
  symbol: string;
  date: string;
  revenue: number;
  ebitda?: number;
  netIncome: number;
  eps?: number;
}

export interface BalanceSheet {
  symbol: string;
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
}

export interface CashFlowStatement {
  symbol: string;
  date: string;
  freeCashFlow: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
}

export interface StockData {
  profile: CompanyProfile;
  quote: Quote;
  keyMetrics: KeyMetrics[];
  ratios: FinancialRatios[];
  income: IncomeStatement[];
  balance: BalanceSheet[];
  cashFlow: CashFlowStatement[];
}

class FMPApiService {
  private apiKey: string;
  private baseUrl = 'https://financialmodelingprep.com/api/v3';

  constructor() {
    this.apiKey = process.env.FMP_API_KEY || '';
    if (!this.apiKey) {
      console.warn('FMP_API_KEY not set in environment variables');
    }
  }

  private async fetchWithRateLimit<T>(url: string): Promise<T> {
    return fmpLimiter.schedule(async () => {
      const fullUrl = url.includes('?') ? `${url}&apikey=${this.apiKey}` : `${url}?apikey=${this.apiKey}`;
      const response = await fetch(fullUrl);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`FMP API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as T;
      return data;
    });
  }

  async getCompanyProfile(ticker: string): Promise<CompanyProfile> {
    const url = `${this.baseUrl}/profile/${ticker}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      throw new Error(`No profile data found for ticker: ${ticker}`);
    }

    const profile = data[0];
    return {
      symbol: profile.symbol,
      companyName: profile.companyName || profile.symbol,
      sector: profile.sector || 'Unknown',
      industry: profile.industry || 'Unknown',
      marketCap: profile.mktCap || 0,
      description: profile.description,
    };
  }

  async getQuote(ticker: string): Promise<Quote> {
    const url = `${this.baseUrl}/quote/${ticker}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      throw new Error(`No quote data found for ticker: ${ticker}`);
    }

    const quote = data[0];
    return {
      symbol: quote.symbol,
      price: quote.price || 0,
      dayHigh: quote.dayHigh || 0,
      dayLow: quote.dayLow || 0,
      yearHigh: quote.yearHigh || 0,
      yearLow: quote.yearLow || 0,
      volume: quote.volume || 0,
      pe: quote.pe,
      eps: quote.eps,
    };
  }

  async getKeyMetrics(ticker: string, period: 'annual' | 'quarter' = 'annual', limit = 5): Promise<KeyMetrics[]> {
    const url = `${this.baseUrl}/key-metrics/${ticker}?period=${period}&limit=${limit}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      symbol: item.symbol,
      date: item.date,
      marketCap: item.marketCap || 0,
      peRatio: item.peRatio,
      pbRatio: item.pbRatio,
      priceToSalesRatio: item.priceToSalesRatio,
      dividendYield: item.dividendYield,
      roe: item.roe,
      roa: item.returnOnAssets,
      debtToEquity: item.debtToEquity,
      freeCashFlowPerShare: item.freeCashFlowPerShare,
      bookValuePerShare: item.bookValuePerShare,
    }));
  }

  async getFinancialRatios(ticker: string, period: 'annual' | 'quarter' = 'annual', limit = 5): Promise<FinancialRatios[]> {
    const url = `${this.baseUrl}/ratios/${ticker}?period=${period}&limit=${limit}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      symbol: item.symbol,
      date: item.date,
      returnOnAssets: item.returnOnAssets,
      returnOnEquity: item.returnOnEquity,
      ebitdaMargin: item.ebitdaMargin,
      profitMargin: item.netProfitMargin,
      assetTurnover: item.assetTurnover,
      currentRatio: item.currentRatio,
      quickRatio: item.quickRatio,
    }));
  }

  async getIncomeStatement(ticker: string, period: 'annual' | 'quarter' = 'annual', limit = 5): Promise<IncomeStatement[]> {
    const url = `${this.baseUrl}/income-statement/${ticker}?period=${period}&limit=${limit}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      symbol: item.symbol,
      date: item.date,
      revenue: item.revenue || 0,
      ebitda: item.ebitda,
      netIncome: item.netIncome || 0,
      eps: item.eps,
    }));
  }

  async getBalanceSheet(ticker: string, period: 'annual' | 'quarter' = 'annual', limit = 5): Promise<BalanceSheet[]> {
    const url = `${this.baseUrl}/balance-sheet-statement/${ticker}?period=${period}&limit=${limit}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      symbol: item.symbol,
      date: item.date,
      totalAssets: item.totalAssets || 0,
      totalLiabilities: item.totalLiabilities || 0,
      totalStockholdersEquity: item.totalStockholdersEquity || 0,
    }));
  }

  async getCashFlowStatement(ticker: string, period: 'annual' | 'quarter' = 'annual', limit = 5): Promise<CashFlowStatement[]> {
    const url = `${this.baseUrl}/cash-flow-statement/${ticker}?period=${period}&limit=${limit}`;
    const data = await this.fetchWithRateLimit<any[]>(url);
    
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      symbol: item.symbol,
      date: item.date,
      freeCashFlow: item.freeCashFlow || 0,
      operatingCashFlow: item.operatingCashFlow || 0,
      capitalExpenditure: item.capitalExpenditure || 0,
    }));
  }

  async getStockData(ticker: string): Promise<StockData> {
    // Fetch all data in parallel for efficiency
    const [profile, quote, keyMetrics, ratios, income, balance, cashFlow] = await Promise.all([
      this.getCompanyProfile(ticker),
      this.getQuote(ticker),
      this.getKeyMetrics(ticker, 'annual', 5),
      this.getFinancialRatios(ticker, 'annual', 5),
      this.getIncomeStatement(ticker, 'annual', 5),
      this.getBalanceSheet(ticker, 'annual', 5),
      this.getCashFlowStatement(ticker, 'annual', 5),
    ]);

    return {
      profile,
      quote,
      keyMetrics,
      ratios,
      income,
      balance,
      cashFlow,
    };
  }

  async getExchangeSymbols(exchange: 'NYSE' | 'NASDAQ'): Promise<string[]> {
    const url = `${this.baseUrl}/symbol/${exchange}`;
    const data = await this.fetchWithRateLimit<any[]>(url);

    if (!data || data.length === 0) {
      return [];
    }

    return data
      .filter(item => item.symbol && item.type === 'stock')
      .map(item => item.symbol);
  }

  /**
   * Get historical daily prices for momentum calculation
   * Returns price from approximately 6 months ago
   */
  async getHistoricalPrice(ticker: string, daysAgo: number = 180): Promise<number | null> {
    try {
      const url = `${this.baseUrl}/historical-price-full/${ticker}?serietype=line`;
      const data = await this.fetchWithRateLimit<{ historical: Array<{ date: string; close: number }> }>(url);

      if (!data || !data.historical || data.historical.length === 0) {
        return null;
      }

      // Find the price closest to daysAgo
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - daysAgo);

      // Historical data is sorted newest first
      const historical = data.historical;

      // Find the entry closest to our target date
      for (const entry of historical) {
        const entryDate = new Date(entry.date);
        if (entryDate <= targetDate) {
          return entry.close;
        }
      }

      // If we didn't find an exact match, return the oldest available
      return historical[historical.length - 1]?.close || null;
    } catch (error) {
      console.warn(`Could not fetch historical price for ${ticker}:`, error);
      return null;
    }
  }

  /**
   * Get dividend information
   */
  async getDividendInfo(ticker: string): Promise<{ paysDividend: boolean; dividendYield: number | null }> {
    try {
      const metrics = await this.getKeyMetrics(ticker, 'annual', 1);
      if (metrics.length > 0 && metrics[0].dividendYield) {
        return {
          paysDividend: metrics[0].dividendYield > 0,
          dividendYield: metrics[0].dividendYield * 100, // Convert to percentage
        };
      }
      return { paysDividend: false, dividendYield: null };
    } catch {
      return { paysDividend: false, dividendYield: null };
    }
  }
}

export const fmpApiService = new FMPApiService();

import Bottleneck from 'bottleneck';

// Rate limiter: 5 requests per minute, 25 per day (free tier)
const avLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 12000, // 5 requests per minute = 12 seconds between requests
});

export interface AVIncomeStatement {
  fiscalDateEnding: string;
  ebitda: number | null;
  totalRevenue: number | null;
  operatingIncome: number | null;
}

export interface AVBalanceSheet {
  fiscalDateEnding: string;
  totalAssets: number | null;
}

export interface AVGrowthMetrics {
  ebitdaGrowth: number | null;  // 3-year CAGR as percentage
  assetGrowth: number | null;   // 3-year CAGR as percentage
  source: 'alphavantage' | 'unavailable';
}

// Simple in-memory cache to preserve our 25 calls/day limit
const cache = new Map<string, { data: AVGrowthMetrics; timestamp: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

class AlphaVantageService {
  private baseUrl = 'https://www.alphavantage.co/query';
  private _apiKey: string | null = null;
  private dailyCallCount = 0;
  private dailyCallReset = Date.now();
  private readonly DAILY_LIMIT = 25;

  private get apiKey(): string {
    if (this._apiKey === null) {
      this._apiKey = process.env.ALPHAVANTAGE_API_KEY || '';
    }
    return this._apiKey;
  }

  /**
   * Check if we have API calls remaining today
   */
  private canMakeCall(): boolean {
    // Reset counter if it's a new day
    const now = Date.now();
    if (now - this.dailyCallReset > 24 * 60 * 60 * 1000) {
      this.dailyCallCount = 0;
      this.dailyCallReset = now;
    }
    return this.dailyCallCount < this.DAILY_LIMIT;
  }

  private recordCall(): void {
    this.dailyCallCount++;
    console.log(`Alpha Vantage: ${this.dailyCallCount}/${this.DAILY_LIMIT} daily calls used`);
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return !!this.apiKey && this.canMakeCall();
  }

  /**
   * Get income statements for EBITDA history
   */
  async getIncomeStatements(ticker: string): Promise<AVIncomeStatement[]> {
    if (!this.apiKey || !this.canMakeCall()) {
      return [];
    }

    return avLimiter.schedule(async () => {
      try {
        const url = `${this.baseUrl}?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${this.apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Alpha Vantage returned ${response.status} for ${ticker} income statement`);
          return [];
        }

        const data = await response.json();

        // Check for API limit message
        if (data.Note || data.Information) {
          console.warn('Alpha Vantage API limit reached:', data.Note || data.Information);
          return [];
        }

        this.recordCall();

        const annualReports = data.annualReports || [];
        return annualReports.map((report: any) => ({
          fiscalDateEnding: report.fiscalDateEnding,
          ebitda: report.ebitda && report.ebitda !== 'None' ? parseFloat(report.ebitda) : null,
          totalRevenue: report.totalRevenue && report.totalRevenue !== 'None' ? parseFloat(report.totalRevenue) : null,
          operatingIncome: report.operatingIncome && report.operatingIncome !== 'None' ? parseFloat(report.operatingIncome) : null,
        }));
      } catch (error) {
        console.error(`Error fetching Alpha Vantage income statement for ${ticker}:`, error);
        return [];
      }
    });
  }

  /**
   * Get balance sheets for total assets history
   */
  async getBalanceSheets(ticker: string): Promise<AVBalanceSheet[]> {
    if (!this.apiKey || !this.canMakeCall()) {
      return [];
    }

    return avLimiter.schedule(async () => {
      try {
        const url = `${this.baseUrl}?function=BALANCE_SHEET&symbol=${ticker}&apikey=${this.apiKey}`;
        const response = await fetch(url);

        if (!response.ok) {
          console.warn(`Alpha Vantage returned ${response.status} for ${ticker} balance sheet`);
          return [];
        }

        const data = await response.json();

        // Check for API limit message
        if (data.Note || data.Information) {
          console.warn('Alpha Vantage API limit reached:', data.Note || data.Information);
          return [];
        }

        this.recordCall();

        const annualReports = data.annualReports || [];
        return annualReports.map((report: any) => ({
          fiscalDateEnding: report.fiscalDateEnding,
          totalAssets: report.totalAssets && report.totalAssets !== 'None' ? parseFloat(report.totalAssets) : null,
        }));
      } catch (error) {
        console.error(`Error fetching Alpha Vantage balance sheet for ${ticker}:`, error);
        return [];
      }
    });
  }

  /**
   * Calculate CAGR from historical data
   */
  private calculateCAGR(values: { date: string; value: number }[], years: number = 3): number | null {
    if (values.length < 2) return null;

    // Sort by date descending (most recent first)
    const sorted = [...values].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const recent = sorted[0];
    const targetDate = new Date(recent.date);
    targetDate.setFullYear(targetDate.getFullYear() - years);

    // Find the value closest to 3 years ago
    let oldest: { date: string; value: number } | null = null;
    for (const v of sorted) {
      const vDate = new Date(v.date);
      if (vDate <= targetDate) {
        oldest = v;
        break;
      }
    }

    if (!oldest || oldest.value <= 0 || recent.value <= 0) {
      // Try with whatever oldest data we have
      if (sorted.length >= 2) {
        oldest = sorted[sorted.length - 1];
        if (oldest.value <= 0 || recent.value <= 0) return null;
      } else {
        return null;
      }
    }

    const actualYears = (new Date(recent.date).getTime() - new Date(oldest.date).getTime()) / (365 * 24 * 60 * 60 * 1000);
    if (actualYears < 1) return null;

    // CAGR formula: (endValue/startValue)^(1/years) - 1
    const cagr = (Math.pow(recent.value / oldest.value, 1 / actualYears) - 1) * 100;
    return cagr;
  }

  /**
   * Get growth metrics (EBITDA and Asset growth CAGRs)
   * Uses caching to preserve API calls
   */
  async getGrowthMetrics(ticker: string): Promise<AVGrowthMetrics> {
    // Check cache first
    const cached = cache.get(ticker);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached Alpha Vantage data for ${ticker}`);
      return cached.data;
    }

    if (!this.apiKey) {
      return { ebitdaGrowth: null, assetGrowth: null, source: 'unavailable' };
    }

    if (!this.canMakeCall()) {
      console.log('Alpha Vantage daily limit reached, skipping');
      return { ebitdaGrowth: null, assetGrowth: null, source: 'unavailable' };
    }

    try {
      console.log(`Fetching Alpha Vantage data for ${ticker}...`);

      // Fetch both statements (2 API calls)
      const [incomeStatements, balanceSheets] = await Promise.all([
        this.getIncomeStatements(ticker),
        this.getBalanceSheets(ticker),
      ]);

      // Calculate EBITDA growth
      const ebitdaValues = incomeStatements
        .filter(s => s.ebitda !== null)
        .map(s => ({ date: s.fiscalDateEnding, value: s.ebitda! }));
      const ebitdaGrowth = this.calculateCAGR(ebitdaValues, 3);

      // Calculate Asset growth
      const assetValues = balanceSheets
        .filter(s => s.totalAssets !== null)
        .map(s => ({ date: s.fiscalDateEnding, value: s.totalAssets! }));
      const assetGrowth = this.calculateCAGR(assetValues, 3);

      const result: AVGrowthMetrics = {
        ebitdaGrowth,
        assetGrowth,
        source: (ebitdaGrowth !== null || assetGrowth !== null) ? 'alphavantage' : 'unavailable',
      };

      if (result.source === 'alphavantage') {
        console.log(`  Alpha Vantage: EBITDA growth=${ebitdaGrowth?.toFixed(1)}%, Asset growth=${assetGrowth?.toFixed(1)}%`);
      }

      // Cache the result
      cache.set(ticker, { data: result, timestamp: Date.now() });

      return result;
    } catch (error) {
      console.error(`Error getting Alpha Vantage growth metrics for ${ticker}:`, error);
      return { ebitdaGrowth: null, assetGrowth: null, source: 'unavailable' };
    }
  }

  /**
   * Get remaining daily calls
   */
  getRemainingCalls(): number {
    const now = Date.now();
    if (now - this.dailyCallReset > 24 * 60 * 60 * 1000) {
      return this.DAILY_LIMIT;
    }
    return Math.max(0, this.DAILY_LIMIT - this.dailyCallCount);
  }
}

export const alphaVantageService = new AlphaVantageService();

import Bottleneck from 'bottleneck';

// Rate limiter: Be respectful to Yahoo Finance
const yahooLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 500, // 2 requests per second max
});

export interface YahooHistoricalPrice {
  date: Date;
  close: number;
}

export interface YahooFinancials {
  // Historical prices
  price6MonthsAgo: number | null;
  currentPrice: number | null;

  // Growth metrics (calculated from historical data)
  ebitdaGrowth: number | null;  // 3-year CAGR
  assetGrowth: number | null;   // 3-year CAGR

  // Additional fundamentals
  ebitdaMargin: number | null;
  totalAssets: number | null;
  freeCashFlow: number | null;
}

class YahooFinanceService {
  private baseUrl = 'https://query1.finance.yahoo.com';

  /**
   * Get historical stock prices
   */
  async getHistoricalPrices(ticker: string, days: number = 200): Promise<YahooHistoricalPrice[]> {
    return yahooLimiter.schedule(async () => {
      try {
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (days * 24 * 60 * 60);

        const url = `${this.baseUrl}/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          console.warn(`Yahoo Finance returned ${response.status} for ${ticker}`);
          return [];
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp || !result.indicators?.quote?.[0]?.close) {
          return [];
        }

        const timestamps = result.timestamp as number[];
        const closes = result.indicators.quote[0].close as (number | null)[];

        const prices: YahooHistoricalPrice[] = [];
        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null) {
            prices.push({
              date: new Date(timestamps[i] * 1000),
              close: closes[i],
            });
          }
        }

        return prices;
      } catch (error) {
        console.error(`Error fetching Yahoo historical prices for ${ticker}:`, error);
        return [];
      }
    });
  }

  /**
   * Get price from approximately 6 months ago
   */
  async getPrice6MonthsAgo(ticker: string): Promise<number | null> {
    const prices = await this.getHistoricalPrices(ticker, 200);

    if (prices.length === 0) {
      return null;
    }

    // Find price closest to 180 days ago
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - 180);

    let closestPrice: YahooHistoricalPrice | null = null;
    let closestDiff = Infinity;

    for (const price of prices) {
      const diff = Math.abs(price.date.getTime() - targetDate.getTime());
      if (diff < closestDiff) {
        closestDiff = diff;
        closestPrice = price;
      }
    }

    return closestPrice?.close || null;
  }

  /**
   * Get key statistics and financial data
   */
  async getKeyStats(ticker: string): Promise<{
    ebitdaMargin: number | null;
    totalAssets: number | null;
    freeCashFlow: number | null;
    trailingEps: number | null;
    bookValue: number | null;
  }> {
    return yahooLimiter.schedule(async () => {
      try {
        const url = `${this.baseUrl}/v10/finance/quoteSummary/${ticker}?modules=defaultKeyStatistics,financialData,balanceSheetHistory`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          return { ebitdaMargin: null, totalAssets: null, freeCashFlow: null, trailingEps: null, bookValue: null };
        }

        const data = await response.json();
        const result = data?.quoteSummary?.result?.[0];

        if (!result) {
          return { ebitdaMargin: null, totalAssets: null, freeCashFlow: null, trailingEps: null, bookValue: null };
        }

        const financialData = result.financialData || {};
        const keyStats = result.defaultKeyStatistics || {};
        const balanceSheet = result.balanceSheetHistory?.balanceSheetStatements?.[0] || {};

        return {
          ebitdaMargin: financialData.ebitdaMargins?.raw ?? null,
          totalAssets: balanceSheet.totalAssets?.raw ?? null,
          freeCashFlow: financialData.freeCashflow?.raw ?? null,
          trailingEps: keyStats.trailingEps?.raw ?? null,
          bookValue: keyStats.bookValue?.raw ?? null,
        };
      } catch (error) {
        console.error(`Error fetching Yahoo key stats for ${ticker}:`, error);
        return { ebitdaMargin: null, totalAssets: null, freeCashFlow: null, trailingEps: null, bookValue: null };
      }
    });
  }

  /**
   * Get historical financial statements for growth calculation
   */
  async getHistoricalFinancials(ticker: string): Promise<{
    ebitdaHistory: { year: number; value: number }[];
    assetHistory: { year: number; value: number }[];
  }> {
    return yahooLimiter.schedule(async () => {
      try {
        // Get income statement and balance sheet history
        const url = `${this.baseUrl}/v10/finance/quoteSummary/${ticker}?modules=incomeStatementHistory,balanceSheetHistory`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          return { ebitdaHistory: [], assetHistory: [] };
        }

        const data = await response.json();
        const result = data?.quoteSummary?.result?.[0];

        if (!result) {
          return { ebitdaHistory: [], assetHistory: [] };
        }

        const incomeStatements = result.incomeStatementHistory?.incomeStatementHistory || [];
        const balanceSheets = result.balanceSheetHistory?.balanceSheetStatements || [];

        // Extract EBITDA history (Yahoo provides EBIT, we'd need to add D&A for true EBITDA)
        // For simplicity, we'll use operating income as a proxy
        const ebitdaHistory: { year: number; value: number }[] = [];
        for (const stmt of incomeStatements) {
          const date = new Date(stmt.endDate?.raw * 1000);
          const ebit = stmt.ebit?.raw;
          if (ebit) {
            ebitdaHistory.push({
              year: date.getFullYear(),
              value: ebit,
            });
          }
        }

        // Extract total assets history
        const assetHistory: { year: number; value: number }[] = [];
        for (const stmt of balanceSheets) {
          const date = new Date(stmt.endDate?.raw * 1000);
          const assets = stmt.totalAssets?.raw;
          if (assets) {
            assetHistory.push({
              year: date.getFullYear(),
              value: assets,
            });
          }
        }

        return { ebitdaHistory, assetHistory };
      } catch (error) {
        console.error(`Error fetching Yahoo historical financials for ${ticker}:`, error);
        return { ebitdaHistory: [], assetHistory: [] };
      }
    });
  }

  /**
   * Calculate 3-year CAGR from historical data
   */
  private calculateCAGR(history: { year: number; value: number }[], years: number = 3): number | null {
    if (history.length < 2) return null;

    // Sort by year descending (most recent first)
    const sorted = [...history].sort((a, b) => b.year - a.year);

    const recent = sorted[0];
    const oldest = sorted.find(h => h.year <= recent.year - years);

    if (!oldest || oldest.value <= 0 || recent.value <= 0) {
      return null;
    }

    const actualYears = recent.year - oldest.year;
    if (actualYears < 2) return null;

    // CAGR formula: (endValue/startValue)^(1/years) - 1
    const cagr = (Math.pow(recent.value / oldest.value, 1 / actualYears) - 1) * 100;
    return cagr;
  }

  /**
   * Get complete financial data including growth metrics
   * Note: Yahoo Finance's quoteSummary API requires authentication (crumb)
   * So we focus on historical prices which don't require auth
   */
  async getCompleteFinancials(ticker: string): Promise<YahooFinancials> {
    try {
      // Only fetch historical prices - quoteSummary requires auth
      const [price6MonthsAgo, currentPrices] = await Promise.all([
        this.getPrice6MonthsAgo(ticker),
        this.getHistoricalPrices(ticker, 5), // Just last 5 days for current price
      ]);

      // Get current price from most recent historical data
      const currentPrice = currentPrices.length > 0
        ? currentPrices[currentPrices.length - 1].close
        : null;

      return {
        price6MonthsAgo,
        currentPrice,
        // These require auth, return null - rely on Gemini for these
        ebitdaGrowth: null,
        assetGrowth: null,
        ebitdaMargin: null,
        totalAssets: null,
        freeCashFlow: null,
      };
    } catch (error) {
      console.error(`Error getting Yahoo financials for ${ticker}:`, error);
      return {
        price6MonthsAgo: null,
        currentPrice: null,
        ebitdaGrowth: null,
        assetGrowth: null,
        ebitdaMargin: null,
        totalAssets: null,
        freeCashFlow: null,
      };
    }
  }

  /**
   * Check if Yahoo Finance service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v8/finance/chart/AAPL?range=1d&interval=1d`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const yahooFinanceService = new YahooFinanceService();

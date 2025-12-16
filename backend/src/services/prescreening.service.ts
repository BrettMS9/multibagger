import Bottleneck from 'bottleneck';

/**
 * Pre-Screening Service
 *
 * Uses Yahoo Finance to quickly scan all stocks and filter to best candidates
 * before running expensive Gemini analysis.
 *
 * Scoring based on Yartseva contrarian factors (price-based, freely available):
 * - Price Range: 0-10 pts (lower in 52-week range = better)
 * - Momentum: 0-5 pts (negative 6-month returns = better)
 * - Total: 15 pts possible
 *
 * This pre-filter typically reduces candidate pool by 60-80%
 */

// Rate limiter for Yahoo Finance - batch optimized
const batchLimiter = new Bottleneck({
  maxConcurrent: 5,  // More concurrent for batch operations
  minTime: 200,      // 5 requests per second
});

export interface PreScreenResult {
  ticker: string;
  currentPrice: number;
  high52w: number;
  low52w: number;
  price6MonthsAgo: number | null;
  marketCap: number | null;

  // Pre-calculated scores
  priceRangeScore: number;      // 0-10
  momentumScore: number;        // 0-5
  preScreenScore: number;       // Total 0-15

  // Calculated metrics
  priceRangePercent: number;    // 0-100, where in 52-week range
  momentumPercent: number | null; // 6-month return %
}

export interface PreScreenSummary {
  totalScanned: number;
  passedFilter: number;
  scanTimeMs: number;
  candidates: PreScreenResult[];
}

class PreScreeningService {
  private baseUrl = 'https://query1.finance.yahoo.com';

  /**
   * Fetch price data for a single ticker (52-week range + 6-month history)
   */
  private async fetchTickerData(ticker: string): Promise<PreScreenResult | null> {
    return batchLimiter.schedule(async () => {
      try {
        // Fetch 200 days of history to get 52-week high/low and 6-month ago price
        const period2 = Math.floor(Date.now() / 1000);
        const period1 = period2 - (365 * 24 * 60 * 60); // 1 year of data

        const url = `${this.baseUrl}/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`;

        const response = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        });

        if (!response.ok) {
          return null;
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
          return null;
        }

        const meta = result.meta || {};
        const timestamps = result.timestamp as number[];
        const quotes = result.indicators.quote[0];
        const closes = quotes.close as (number | null)[];
        const highs = quotes.high as (number | null)[];
        const lows = quotes.low as (number | null)[];

        // Get current price
        const currentPrice = meta.regularMarketPrice || closes[closes.length - 1];
        if (!currentPrice) return null;

        // Calculate 52-week high and low from historical data
        let high52w = -Infinity;
        let low52w = Infinity;

        for (let i = 0; i < highs.length; i++) {
          if (highs[i] !== null && highs[i]! > high52w) high52w = highs[i]!;
          if (lows[i] !== null && lows[i]! < low52w) low52w = lows[i]!;
        }

        // Use meta values if available (more accurate)
        high52w = meta.fiftyTwoWeekHigh || high52w;
        low52w = meta.fiftyTwoWeekLow || low52w;

        if (high52w === -Infinity || low52w === Infinity) return null;

        // Find price from ~6 months ago (180 days)
        const targetTimestamp = period2 - (180 * 24 * 60 * 60);
        let price6MonthsAgo: number | null = null;
        let closestDiff = Infinity;

        for (let i = 0; i < timestamps.length; i++) {
          if (closes[i] !== null) {
            const diff = Math.abs(timestamps[i] - targetTimestamp);
            if (diff < closestDiff) {
              closestDiff = diff;
              price6MonthsAgo = closes[i];
            }
          }
        }

        // Get market cap if available
        const marketCap = meta.marketCap || null;

        // Calculate metrics
        const priceRangePercent = ((currentPrice - low52w) / (high52w - low52w)) * 100;
        const momentumPercent = price6MonthsAgo
          ? ((currentPrice - price6MonthsAgo) / price6MonthsAgo) * 100
          : null;

        // Calculate Yartseva scores
        const priceRangeScore = this.calculatePriceRangeScore(priceRangePercent);
        const momentumScore = this.calculateMomentumScore(momentumPercent);

        return {
          ticker,
          currentPrice,
          high52w,
          low52w,
          price6MonthsAgo,
          marketCap,
          priceRangeScore,
          momentumScore,
          preScreenScore: priceRangeScore + momentumScore,
          priceRangePercent,
          momentumPercent,
        };
      } catch (error) {
        // Silently skip failed tickers in batch mode
        return null;
      }
    });
  }

  /**
   * Yartseva Price Range scoring (contrarian - lower is better)
   * Max 10 points
   */
  private calculatePriceRangeScore(priceRangePercent: number): number {
    if (priceRangePercent <= 20) return 10;  // Bottom 20% of range
    if (priceRangePercent <= 35) return 8;
    if (priceRangePercent <= 50) return 5;
    if (priceRangePercent <= 70) return 2;
    return 0;  // Near 52-week high
  }

  /**
   * Yartseva Momentum scoring (contrarian - negative is better)
   * Max 5 points
   */
  private calculateMomentumScore(momentumPercent: number | null): number {
    if (momentumPercent === null) return 2;  // Unknown, give average
    if (momentumPercent <= -15) return 5;    // Down 15%+ = best
    if (momentumPercent <= -5) return 4;
    if (momentumPercent <= 0) return 3;      // Slightly negative
    if (momentumPercent <= 10) return 1;
    return 0;  // Strong positive momentum (bad per Yartseva)
  }

  /**
   * Batch pre-screen multiple tickers
   * Returns candidates sorted by pre-screen score (highest first)
   */
  async preScreenTickers(
    tickers: string[],
    options: {
      minPreScreenScore?: number;  // Minimum score to pass filter (default: 8/15 = 53%)
      maxCandidates?: number;      // Maximum candidates to return
      verbose?: boolean;           // Log progress
    } = {}
  ): Promise<PreScreenSummary> {
    const {
      minPreScreenScore = 8,
      maxCandidates = 100,
      verbose = false,
    } = options;

    const startTime = Date.now();

    if (verbose) {
      console.log(`Pre-screening ${tickers.length} tickers...`);
    }

    // Fetch data for all tickers in parallel (with rate limiting)
    const results = await Promise.all(
      tickers.map(ticker => this.fetchTickerData(ticker))
    );

    // Filter out nulls and apply score threshold
    const validResults = results.filter(
      (r): r is PreScreenResult => r !== null && r.preScreenScore >= minPreScreenScore
    );

    // Sort by pre-screen score (highest first)
    validResults.sort((a, b) => b.preScreenScore - a.preScreenScore);

    // Limit results
    const candidates = validResults.slice(0, maxCandidates);

    const scanTimeMs = Date.now() - startTime;

    if (verbose) {
      console.log(`Pre-screening complete in ${(scanTimeMs / 1000).toFixed(1)}s`);
      console.log(`  Scanned: ${tickers.length}`);
      console.log(`  Valid data: ${results.filter(r => r !== null).length}`);
      console.log(`  Passed filter (>=${minPreScreenScore}/15): ${validResults.length}`);
      console.log(`  Returning top: ${candidates.length}`);
    }

    return {
      totalScanned: tickers.length,
      passedFilter: validResults.length,
      scanTimeMs,
      candidates,
    };
  }

  /**
   * Quick pre-screen with sector filtering
   * Used by bulk screener to prioritize candidates
   */
  async preScreenForBulk(
    tickers: string[],
    limit: number = 50
  ): Promise<PreScreenResult[]> {
    const summary = await this.preScreenTickers(tickers, {
      minPreScreenScore: 6,  // Lower threshold to get more candidates
      maxCandidates: limit * 2,  // Get extra in case some fail full screening
      verbose: true,
    });

    return summary.candidates;
  }
}

export const preScreeningService = new PreScreeningService();

import { Request, Response } from 'express';
import { geminiService, GeminiStockData } from '../services/gemini.service';
import { yahooFinanceService } from '../services/yahoo-finance.service';
import { alphaVantageService } from '../services/alphavantage.service';
import { edgarService } from '../services/edgar.service';
import { preScreeningService, PreScreenResult } from '../services/prescreening.service';
import { cacheService, CachedStockData } from '../services/cache.service';
import { scoringService, ScoringInput, YartsevaScores } from '../services/scoring.service';
import { RUSSELL_2000_STOCKS, SECTORS } from '../data/russell2000';
import db from '../config/database';

export interface ScreeningResult {
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
  factors: YartsevaScores;
  totalScore: number;
  maxScore: number;
  percentage: number;
  classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID';

  // Metadata
  dataSource: 'cache' | 'api';
  timestamp: number;
}

class ScreenController {
  async screenTicker(req: Request, res: Response): Promise<void> {
    try {
      const { ticker } = req.params;

      if (!ticker) {
        res.status(400).json({ error: 'Ticker parameter is required' });
        return;
      }

      const upperTicker = ticker.toUpperCase();
      console.log(`Screening ticker: ${upperTicker}`);

      // Check cache first
      const cached = cacheService.getCachedStock(upperTicker);

      let stockData: CachedStockData;
      let dataSource: 'cache' | 'api' = 'api';

      if (cached) {
        console.log(`Using cached data for ${upperTicker}`);
        stockData = cached;
        dataSource = 'cache';
      } else {
        console.log(`Fetching fresh data for ${upperTicker} via Gemini`);

        // Fetch from Gemini with Google Search grounding
        const geminiData = await geminiService.getStockData(upperTicker);

        console.log(`Got data for ${upperTicker}: ${geminiData.companyName}, price=$${geminiData.price}`);

        // Build cached data from Gemini response
        stockData = {
          ticker: upperTicker,
          companyName: geminiData.companyName,
          sector: geminiData.sector,
          industry: geminiData.industry,
          marketCap: geminiData.marketCap,
          price: geminiData.price,
          high52w: geminiData.high52w,
          low52w: geminiData.low52w,
          fcf: geminiData.freeCashFlow,
          bookValue: geminiData.bookValue,
          totalAssets: geminiData.totalAssets,
          ebitda: null, // Not used directly
          ebitdaMargin: geminiData.ebitdaMargin,
          roa: geminiData.roa,
          assetGrowth: geminiData.assetGrowth,
          ebitdaGrowth: geminiData.ebitdaGrowth,
          dividendYield: geminiData.dividendYield,
          paysDividend: geminiData.paysDividend,
          peRatio: null, // Not fetched via Gemini
          pbRatio: null, // Not fetched via Gemini
          price6MonthsAgo: geminiData.price6MonthsAgo,
          dataFetchedAt: Date.now(),
        };

        // Check if we're missing critical data - use fallback sources
        const missingHistoricalPrice = stockData.price6MonthsAgo === null;
        const missingGrowthMetrics = stockData.ebitdaGrowth === null || stockData.assetGrowth === null;

        // Step 1: Yahoo Finance for historical prices
        if (missingHistoricalPrice) {
          console.log(`Missing historical price for ${upperTicker}, fetching from Yahoo Finance...`);
          try {
            const yahooData = await yahooFinanceService.getCompleteFinancials(upperTicker);
            if (stockData.price6MonthsAgo === null && yahooData.price6MonthsAgo !== null) {
              stockData.price6MonthsAgo = yahooData.price6MonthsAgo;
              console.log(`  - Got price6MonthsAgo from Yahoo: $${yahooData.price6MonthsAgo.toFixed(2)}`);
            }
          } catch (yahooError) {
            console.warn(`Yahoo Finance fallback failed for ${upperTicker}:`, yahooError);
          }
        }

        // Step 2: SEC EDGAR for growth metrics (PRIMARY SOURCE - most accurate)
        if (missingGrowthMetrics) {
          console.log(`Missing growth metrics for ${upperTicker}, fetching from SEC EDGAR...`);
          try {
            const edgarData = await edgarService.getGrowthMetrics(upperTicker);
            if (stockData.ebitdaGrowth === null && edgarData.ebitdaGrowth !== null) {
              stockData.ebitdaGrowth = edgarData.ebitdaGrowth;
              console.log(`  - Got ebitdaGrowth from EDGAR: ${edgarData.ebitdaGrowth.toFixed(1)}%`);
            }
            if (stockData.assetGrowth === null && edgarData.assetGrowth !== null) {
              stockData.assetGrowth = edgarData.assetGrowth;
              console.log(`  - Got assetGrowth from EDGAR: ${edgarData.assetGrowth.toFixed(1)}%`);
            }
          } catch (edgarError) {
            console.warn(`EDGAR fallback failed for ${upperTicker}:`, edgarError);
          }
        }

        // Step 3: Alpha Vantage as last resort (if EDGAR didn't have data)
        const stillMissingGrowth = stockData.ebitdaGrowth === null || stockData.assetGrowth === null;
        if (stillMissingGrowth && alphaVantageService.isAvailable()) {
          console.log(`Still missing growth metrics for ${upperTicker}, trying Alpha Vantage...`);
          try {
            const avData = await alphaVantageService.getGrowthMetrics(upperTicker);
            if (stockData.ebitdaGrowth === null && avData.ebitdaGrowth !== null) {
              stockData.ebitdaGrowth = avData.ebitdaGrowth;
              console.log(`  - Got ebitdaGrowth from Alpha Vantage: ${avData.ebitdaGrowth.toFixed(1)}%`);
            }
            if (stockData.assetGrowth === null && avData.assetGrowth !== null) {
              stockData.assetGrowth = avData.assetGrowth;
              console.log(`  - Got assetGrowth from Alpha Vantage: ${avData.assetGrowth.toFixed(1)}%`);
            }
          } catch (avError) {
            console.warn(`Alpha Vantage fallback failed for ${upperTicker}:`, avError);
          }
        }

        // Save to cache
        cacheService.saveStockData(stockData);
      }

      // Prepare scoring input
      const scoringInput: ScoringInput = {
        price: stockData.price,
        marketCap: stockData.marketCap,
        high52w: stockData.high52w,
        low52w: stockData.low52w,
        freeCashFlow: stockData.fcf || undefined,
        bookValue: stockData.bookValue || undefined,
        ebitdaGrowth: stockData.ebitdaGrowth || undefined,
        assetGrowth: stockData.assetGrowth || undefined,
        ebitdaMargin: stockData.ebitdaMargin || undefined,
        roa: stockData.roa || undefined,
        price6MonthsAgo: stockData.price6MonthsAgo || undefined,
        paysDividend: stockData.paysDividend || false,
        dividendYield: stockData.dividendYield || undefined,
      };

      // Calculate Yartseva scores
      const scores = scoringService.calculateScores(scoringInput);

      // Save to screening results
      this.saveScreeningResult(stockData, scores);

      // Build response matching frontend types
      const result: ScreeningResult = {
        ticker: upperTicker,
        name: stockData.companyName,
        sector: stockData.sector,
        industry: stockData.industry || 'Unknown',
        exchange: 'N/A', // FMP profile doesn't include exchange in free tier
        price: stockData.price,
        marketCap: stockData.marketCap,
        high52w: stockData.high52w,
        low52w: stockData.low52w,
        factors: scores,
        totalScore: scores.total,
        maxScore: scores.maxTotal,
        percentage: scores.percentage,
        classification: scores.classification,
        dataSource,
        timestamp: Date.now(),
      };

      res.json(result);
    } catch (error) {
      console.error('Error screening ticker:', error);
      res.status(500).json({
        error: 'Failed to screen ticker',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private saveScreeningResult(stockData: CachedStockData, scores: YartsevaScores): void {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO screening_results (
          ticker,
          screened_at,
          company_name,
          sector,
          market_cap,
          price,
          high_52w,
          low_52w,
          fcf,
          book_value,
          total_assets,
          ebitda,
          ebitda_margin,
          roa,
          asset_growth,
          ebitda_growth,
          dividend_yield,
          pe_ratio,
          pb_ratio,
          score_fcf_yield,
          score_size,
          score_book_to_market,
          score_investment_pattern,
          score_ebitda_margin,
          score_roa,
          score_price_range,
          score_momentum,
          score_dividend,
          total_score,
          percentage,
          classification
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )
      `);

      stmt.run(
        stockData.ticker,
        Date.now(),
        stockData.companyName,
        stockData.sector,
        stockData.marketCap,
        stockData.price,
        stockData.high52w,
        stockData.low52w,
        stockData.fcf,
        stockData.bookValue,
        stockData.totalAssets,
        stockData.ebitda,
        stockData.ebitdaMargin,
        stockData.roa,
        stockData.assetGrowth,
        stockData.ebitdaGrowth,
        stockData.dividendYield,
        stockData.peRatio,
        stockData.pbRatio,
        scores.fcfYield.score,
        scores.size.score,
        scores.bookToMarket.score,
        scores.investmentPattern.score,
        scores.ebitdaMargin.score,
        scores.roa.score,
        scores.priceRange.score,
        scores.momentum.score,
        scores.dividend.score,
        scores.total,
        scores.percentage,
        scores.classification
      );
    } catch (error) {
      console.error('Error saving screening result:', error);
    }
  }

  async getTopScorers(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const minPercentage = parseFloat(req.query.minPercentage as string) || 40;

      const stmt = db.prepare(`
        SELECT
          ticker,
          company_name as name,
          sector,
          market_cap as marketCap,
          total_score as totalScore,
          percentage,
          classification,
          price,
          screened_at as screenedAt
        FROM screening_results
        WHERE percentage >= ?
        ORDER BY percentage DESC, screened_at DESC
        LIMIT ?
      `);

      const results = stmt.all(minPercentage, limit);
      res.json(results);
    } catch (error) {
      console.error('Error getting top scorers:', error);
      res.status(500).json({ error: 'Failed to get top scorers' });
    }
  }

  async getTickerHistory(req: Request, res: Response): Promise<void> {
    try {
      const { ticker } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const stmt = db.prepare(`
        SELECT
          screened_at as screenedAt,
          total_score as totalScore,
          percentage,
          classification,
          price,
          market_cap as marketCap
        FROM screening_results
        WHERE ticker = ?
        ORDER BY screened_at DESC
        LIMIT ?
      `);

      const results = stmt.all(ticker.toUpperCase(), limit);
      res.json(results);
    } catch (error) {
      console.error('Error getting ticker history:', error);
      res.status(500).json({ error: 'Failed to get ticker history' });
    }
  }

  /**
   * Bulk screen stocks from Russell 2000 index
   * Uses 2-tier screening: Yahoo pre-filter → Gemini full analysis
   */
  async bulkScreen(req: Request, res: Response): Promise<void> {
    try {
      const { exchange } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 25, 50);
      const minMarketCap = parseFloat(req.query.minMarketCap as string) || 0;
      const maxMarketCap = parseFloat(req.query.maxMarketCap as string) || Infinity;
      const sector = req.query.sector as string | undefined;
      const skipPreScreen = req.query.skipPreScreen === 'true';

      // Support both old exchange params and new sector params
      let allSymbols: string[];
      let screeningLabel: string;

      if (sector && SECTORS[sector.toLowerCase() as keyof typeof SECTORS]) {
        allSymbols = SECTORS[sector.toLowerCase() as keyof typeof SECTORS];
        screeningLabel = `${sector} sector`;
      } else if (exchange && ['NYSE', 'NASDAQ', 'RUSSELL2000', 'R2000'].includes(exchange.toUpperCase())) {
        allSymbols = RUSSELL_2000_STOCKS;
        screeningLabel = 'Russell 2000';
      } else {
        allSymbols = RUSSELL_2000_STOCKS;
        screeningLabel = 'Russell 2000';
      }

      console.log(`\n${'='.repeat(60)}`);
      console.log(`Bulk screening ${screeningLabel} (limit: ${limit})`);
      console.log(`Universe: ${allSymbols.length} stocks`);

      // Check which symbols we've already screened (within last 24 hours)
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const cachedStmt = db.prepare(`
        SELECT ticker FROM screening_results
        WHERE screened_at > ?
        GROUP BY ticker
      `);
      const cachedTickers = new Set(
        (cachedStmt.all(oneDayAgo) as { ticker: string }[]).map(r => r.ticker)
      );

      // Get uncached symbols
      const uncachedSymbols = allSymbols.filter(s => !cachedTickers.has(s));
      console.log(`Cached (24h): ${cachedTickers.size}, Uncached: ${uncachedSymbols.length}`);

      let symbolsToScreen: string[];
      let preScreenResults: PreScreenResult[] = [];

      if (skipPreScreen || uncachedSymbols.length <= limit) {
        // Skip pre-screening if explicitly requested or few stocks to screen
        symbolsToScreen = uncachedSymbols.slice(0, limit);
        console.log(`Skipping pre-screen, using first ${symbolsToScreen.length} symbols`);
      } else {
        // TIER 1: Yahoo Finance Pre-Screening
        console.log(`\nTIER 1: Pre-screening ${uncachedSymbols.length} stocks with Yahoo Finance...`);
        const preScreenStart = Date.now();

        preScreenResults = await preScreeningService.preScreenForBulk(
          uncachedSymbols,
          limit * 2  // Get 2x candidates in case some fail
        );

        const preScreenTime = ((Date.now() - preScreenStart) / 1000).toFixed(1);
        console.log(`Pre-screen complete in ${preScreenTime}s`);
        console.log(`Top candidates by contrarian score (Price Range + Momentum):`);

        // Log top 10 pre-screen results
        preScreenResults.slice(0, 10).forEach((r, i) => {
          const momentum = r.momentumPercent !== null ? `${r.momentumPercent.toFixed(1)}%` : 'N/A';
          console.log(
            `  ${i + 1}. ${r.ticker}: ${r.preScreenScore}/15 pts ` +
            `(Range: ${r.priceRangePercent.toFixed(0)}% = ${r.priceRangeScore}pts, ` +
            `Mom: ${momentum} = ${r.momentumScore}pts)`
          );
        });

        symbolsToScreen = preScreenResults.slice(0, limit).map(r => r.ticker);
      }

      console.log(`\nTIER 2: Full Gemini analysis for ${symbolsToScreen.length} candidates...`);

      // TIER 2: Full Gemini + Yartseva Scoring
      const results: ScreeningResult[] = [];
      const errors: { ticker: string; error: string }[] = [];

      for (const symbol of symbolsToScreen) {
        try {
          const result = await this.screenTickerInternal(symbol);
          if (result) {
            if (result.marketCap >= minMarketCap && result.marketCap <= maxMarketCap) {
              results.push(result);
            }
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ ticker: symbol, error: message });
          console.warn(`Failed to screen ${symbol}: ${message}`);
        }
      }

      // Sort by full Yartseva percentage score
      results.sort((a, b) => b.percentage - a.percentage);

      console.log(`\nResults: ${results.length} stocks scored, ${errors.length} errors`);
      if (results.length > 0) {
        console.log(`Top result: ${results[0].ticker} - ${results[0].percentage.toFixed(1)}% (${results[0].classification})`);
      }
      console.log(`${'='.repeat(60)}\n`);

      res.json({
        universe: screeningLabel,
        screened: results.length,
        errors: errors.length,
        totalSymbols: allSymbols.length,
        cachedSymbols: cachedTickers.size,
        preScreened: preScreenResults.length,
        results,
        errorDetails: errors.slice(0, 10),
      });
    } catch (error) {
      console.error('Error in bulk screen:', error);
      res.status(500).json({
        error: 'Failed to bulk screen',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Internal method to screen a ticker and return the result directly
   */
  private async screenTickerInternal(ticker: string): Promise<ScreeningResult | null> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first
    const cached = cacheService.getCachedStock(upperTicker);

    let stockData: CachedStockData;
    let dataSource: 'cache' | 'api' = 'api';

    if (cached) {
      stockData = cached;
      dataSource = 'cache';
    } else {
      // Fetch from Gemini with Google Search grounding
      const geminiData = await geminiService.getStockData(upperTicker);

      stockData = {
        ticker: upperTicker,
        companyName: geminiData.companyName,
        sector: geminiData.sector,
        industry: geminiData.industry,
        marketCap: geminiData.marketCap,
        price: geminiData.price,
        high52w: geminiData.high52w,
        low52w: geminiData.low52w,
        fcf: geminiData.freeCashFlow,
        bookValue: geminiData.bookValue,
        totalAssets: geminiData.totalAssets,
        ebitda: null,
        ebitdaMargin: geminiData.ebitdaMargin,
        roa: geminiData.roa,
        assetGrowth: geminiData.assetGrowth,
        ebitdaGrowth: geminiData.ebitdaGrowth,
        dividendYield: geminiData.dividendYield,
        paysDividend: geminiData.paysDividend,
        peRatio: null,
        pbRatio: null,
        price6MonthsAgo: geminiData.price6MonthsAgo,
        dataFetchedAt: Date.now(),
      };

      // Check if we're missing critical data - use fallback sources
      const missingHistoricalPrice = stockData.price6MonthsAgo === null;
      const missingGrowthMetrics = stockData.ebitdaGrowth === null || stockData.assetGrowth === null;

      // Step 1: Yahoo Finance for historical prices
      if (missingHistoricalPrice) {
        try {
          const yahooData = await yahooFinanceService.getCompleteFinancials(upperTicker);
          if (stockData.price6MonthsAgo === null && yahooData.price6MonthsAgo !== null) {
            stockData.price6MonthsAgo = yahooData.price6MonthsAgo;
          }
        } catch {
          // Silently ignore Yahoo failures in bulk mode
        }
      }

      // Step 2: SEC EDGAR for growth metrics (PRIMARY - cached permanently, no limits)
      if (missingGrowthMetrics) {
        try {
          const edgarData = await edgarService.getGrowthMetrics(upperTicker);
          if (stockData.ebitdaGrowth === null && edgarData.ebitdaGrowth !== null) {
            stockData.ebitdaGrowth = edgarData.ebitdaGrowth;
          }
          if (stockData.assetGrowth === null && edgarData.assetGrowth !== null) {
            stockData.assetGrowth = edgarData.assetGrowth;
          }
        } catch {
          // Silently ignore EDGAR failures in bulk mode
        }
      }

      // Step 3: Alpha Vantage as last resort (if EDGAR didn't have data)
      const stillMissingGrowth = stockData.ebitdaGrowth === null || stockData.assetGrowth === null;
      if (stillMissingGrowth && alphaVantageService.isAvailable() && alphaVantageService.getRemainingCalls() > 5) {
        try {
          const avData = await alphaVantageService.getGrowthMetrics(upperTicker);
          if (stockData.ebitdaGrowth === null && avData.ebitdaGrowth !== null) {
            stockData.ebitdaGrowth = avData.ebitdaGrowth;
          }
          if (stockData.assetGrowth === null && avData.assetGrowth !== null) {
            stockData.assetGrowth = avData.assetGrowth;
          }
        } catch {
          // Silently ignore Alpha Vantage failures in bulk mode
        }
      }

      cacheService.saveStockData(stockData);
    }

    // Prepare scoring input
    const scoringInput: ScoringInput = {
      price: stockData.price,
      marketCap: stockData.marketCap,
      high52w: stockData.high52w,
      low52w: stockData.low52w,
      freeCashFlow: stockData.fcf || undefined,
      bookValue: stockData.bookValue || undefined,
      ebitdaGrowth: stockData.ebitdaGrowth || undefined,
      assetGrowth: stockData.assetGrowth || undefined,
      ebitdaMargin: stockData.ebitdaMargin || undefined,
      roa: stockData.roa || undefined,
      price6MonthsAgo: stockData.price6MonthsAgo || undefined,
      paysDividend: stockData.paysDividend || false,
      dividendYield: stockData.dividendYield || undefined,
    };

    const scores = scoringService.calculateScores(scoringInput);
    this.saveScreeningResult(stockData, scores);

    return {
      ticker: upperTicker,
      name: stockData.companyName,
      sector: stockData.sector,
      industry: stockData.industry || 'Unknown',
      exchange: 'N/A',
      price: stockData.price,
      marketCap: stockData.marketCap,
      high52w: stockData.high52w,
      low52w: stockData.low52w,
      factors: scores,
      totalScore: scores.total,
      maxScore: scores.maxTotal,
      percentage: scores.percentage,
      classification: scores.classification,
      dataSource,
      timestamp: Date.now(),
    };
  }

  /**
   * Get all screened results for an exchange from database
   */
  async getExchangeResults(req: Request, res: Response): Promise<void> {
    try {
      const { exchange } = req.params;
      const limit = parseInt(req.query.limit as string) || 100;
      const minPercentage = parseFloat(req.query.minPercentage as string) || 0;

      // Get recent screening results
      const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
      const stmt = db.prepare(`
        SELECT
          ticker,
          company_name as name,
          sector,
          market_cap as marketCap,
          total_score as totalScore,
          percentage,
          classification,
          price,
          screened_at as screenedAt
        FROM screening_results
        WHERE screened_at > ? AND percentage >= ?
        ORDER BY percentage DESC
        LIMIT ?
      `);

      const results = stmt.all(oneDayAgo, minPercentage, limit);
      res.json({
        exchange: exchange?.toUpperCase() || 'ALL',
        count: results.length,
        results,
      });
    } catch (error) {
      console.error('Error getting exchange results:', error);
      res.status(500).json({ error: 'Failed to get exchange results' });
    }
  }
}

export const screenController = new ScreenController();

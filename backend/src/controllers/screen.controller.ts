import { Request, Response } from 'express';
import { fmpApiService, GrowthMetrics } from '../services/fmp-api.service';
import { geminiService } from '../services/gemini.service';
import { cacheService, CachedStockData } from '../services/cache.service';
import { scoringService, ScoringInput, YartsevaScores } from '../services/scoring.service';
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
        console.log(`Fetching fresh data for ${upperTicker}`);

        // Fetch from FMP API
        const fmpData = await fmpApiService.getStockData(upperTicker);

        // Extract latest metrics
        const latestMetrics = fmpData.keyMetrics[0];
        const latestRatios = fmpData.ratios[0];
        const latestCashFlow = fmpData.cashFlow[0];
        const latestBalance = fmpData.balance[0];

        // Get historical price for momentum (6 months ago)
        const price6MonthsAgo = await fmpApiService.getHistoricalPrice(upperTicker, 180);

        // Get dividend info
        const dividendInfo = await fmpApiService.getDividendInfo(upperTicker);

        // HYBRID APPROACH: Get growth metrics
        // 1. Primary: Calculate from FMP historical data (free, fast, accurate)
        // 2. Fallback: Use Gemini with Google Search grounding if FMP data insufficient
        let growthMetrics: GrowthMetrics = await fmpApiService.calculateGrowthMetrics(upperTicker);

        // If FMP couldn't calculate both metrics, try Gemini as fallback
        if ((growthMetrics.ebitdaGrowth === null || growthMetrics.assetGrowth === null)
            && geminiService.isAvailable()) {
          console.log(`FMP data incomplete for ${upperTicker}, trying Gemini fallback...`);
          const geminiMetrics = await geminiService.searchGrowthMetrics(
            upperTicker,
            fmpData.profile.companyName
          );

          // Merge: prefer FMP data, fill gaps with Gemini
          growthMetrics = {
            ebitdaGrowth: growthMetrics.ebitdaGrowth ?? geminiMetrics.ebitdaGrowth,
            assetGrowth: growthMetrics.assetGrowth ?? geminiMetrics.assetGrowth,
            source: growthMetrics.source === 'fmp' ? 'fmp' : geminiMetrics.source,
          };
        }

        const assetGrowth = growthMetrics.assetGrowth ?? undefined;
        const ebitdaGrowth = growthMetrics.ebitdaGrowth ?? undefined;
        console.log(`Growth metrics for ${upperTicker}: EBITDA=${ebitdaGrowth}, Assets=${assetGrowth} (source: ${growthMetrics.source})`);

        // Calculate book value from balance sheet
        const bookValue = latestBalance?.totalStockholdersEquity || null;

        // Build cached data
        stockData = {
          ticker: upperTicker,
          companyName: fmpData.profile.companyName,
          sector: fmpData.profile.sector,
          industry: fmpData.profile.industry,
          marketCap: fmpData.profile.marketCap,
          price: fmpData.quote.price,
          high52w: fmpData.quote.yearHigh,
          low52w: fmpData.quote.yearLow,
          fcf: latestCashFlow?.freeCashFlow || null,
          bookValue: bookValue,
          totalAssets: latestBalance?.totalAssets || null,
          ebitda: null, // Not used directly
          ebitdaMargin: latestRatios?.ebitdaMargin ? latestRatios.ebitdaMargin * 100 : null, // Convert to percentage
          roa: latestRatios?.returnOnAssets ? latestRatios.returnOnAssets * 100 : null, // Convert to percentage
          assetGrowth: assetGrowth ?? null,
          ebitdaGrowth: ebitdaGrowth ?? null,
          dividendYield: dividendInfo.dividendYield,
          paysDividend: dividendInfo.paysDividend,
          peRatio: latestMetrics?.peRatio || fmpData.quote.pe || null,
          pbRatio: latestMetrics?.pbRatio || null,
          price6MonthsAgo: price6MonthsAgo,
          dataFetchedAt: Date.now(),
        };

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
}

export const screenController = new ScreenController();

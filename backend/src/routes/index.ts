import { Router, Request, Response } from 'express';
import { scoringService, ScoringInput } from '../services/scoring.service';
import { asyncHandler, validationError } from '../middleware/error-handler';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Multibagger Stock Screener API'
  });
});

/**
 * Get scoring methodology explanation
 */
router.get('/scoring/methodology', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      methodology: 'Yartseva 9-Factor Scoring System (2025)',
      source: 'The Alchemy of Multibagger Stocks - CAFE Working Paper No.33',
      empiricalBasis: '464 stocks achieving 10x+ returns, 2009-2024',
      maxScore: 110,
      factors: [
        { name: 'FCF Yield', maxScore: 25, description: 'Free Cash Flow / Market Cap - MOST IMPORTANT' },
        { name: 'Size', maxScore: 15, description: 'Market Cap < $350M optimal' },
        { name: 'Book-to-Market', maxScore: 15, description: 'Book Value / Market Cap (value factor)' },
        { name: 'Investment Pattern', maxScore: 15, description: 'EBITDA growth > Asset growth - UNIQUE FINDING' },
        { name: 'EBITDA Margin', maxScore: 10, description: 'Operating profitability' },
        { name: 'ROA', maxScore: 10, description: 'Return on Assets efficiency' },
        { name: 'Price Range', maxScore: 10, description: '52-week position - CONTRARIAN (near lows = good)' },
        { name: 'Momentum', maxScore: 5, description: '6-month return - CONTRARIAN (negative = good)' },
        { name: 'Dividend', maxScore: 5, description: '78% of multibaggers paid dividends' }
      ],
      classifications: {
        'STRONG BUY': { threshold: '>=70%', description: 'Strong multibagger potential' },
        'MODERATE BUY': { threshold: '>=55%', description: 'Moderate potential' },
        'WEAK BUY': { threshold: '>=40%', description: 'Limited potential' },
        'AVOID': { threshold: '<40%', description: 'Weak fundamentals' }
      },
      keyInsights: [
        'Earnings growth is NOT a significant predictor (contrary to popular belief)',
        'P/E ratio is problematic for quantitative analysis',
        'Entry timing is critical - buy near 52-week lows with negative momentum',
        'Investment pattern (EBITDA growth > Asset growth) indicates sustainable growth'
      ]
    }
  });
});

/**
 * Score a single stock
 * POST /api/scoring/score
 * Body: ScoringInput
 */
router.post('/scoring/score', asyncHandler(async (req: Request, res: Response) => {
  const stockData: ScoringInput = req.body;

  // Validate required fields
  if (typeof stockData.price !== 'number') {
    throw validationError('price is required');
  }
  if (typeof stockData.marketCap !== 'number') {
    throw validationError('marketCap is required');
  }
  if (typeof stockData.high52w !== 'number') {
    throw validationError('high52w is required');
  }
  if (typeof stockData.low52w !== 'number') {
    throw validationError('low52w is required');
  }

  // Calculate score
  const result = scoringService.calculateScores(stockData);

  res.json({
    success: true,
    data: result
  });
}));

/**
 * Batch score multiple stocks
 * POST /api/scoring/batch
 * Body: { stocks: ScoringInput[] }
 */
router.post('/scoring/batch', asyncHandler(async (req: Request, res: Response) => {
  const { stocks } = req.body;

  if (!Array.isArray(stocks) || stocks.length === 0) {
    throw validationError('stocks must be a non-empty array');
  }

  if (stocks.length > 100) {
    throw validationError('Maximum 100 stocks per batch request');
  }

  // Calculate scores for all stocks
  const results = stocks.map((stock: ScoringInput) => {
    const scores = scoringService.calculateScores(stock);
    return scores;
  });

  // Sort by percentage descending
  results.sort((a, b) => b.percentage - a.percentage);

  res.json({
    success: true,
    count: results.length,
    data: results
  });
}));

/**
 * Test endpoint with sample data
 * GET /api/scoring/test
 */
router.get('/scoring/test', (_req: Request, res: Response) => {
  // Sample stock data for testing - a strong multibagger candidate
  const sampleStock: ScoringInput = {
    // Required
    price: 25,
    marketCap: 280_000_000, // $280M (micro-cap)
    high52w: 45,
    low52w: 20,

    // FCF Yield data
    freeCashFlow: 42_000_000, // 15% FCF yield

    // Book-to-Market
    bookValue: 350_000_000, // B/M = 1.25

    // Investment Pattern
    ebitdaGrowth: 25,
    assetGrowth: 12,

    // Profitability
    ebitdaMargin: 22,
    roa: 14,

    // Momentum (contrarian - negative is good)
    price6MonthsAgo: 32, // -22% momentum

    // Dividend
    paysDividend: true,
    dividendYield: 2.5
  };

  const result = scoringService.calculateScores(sampleStock);

  res.json({
    success: true,
    message: 'Sample scoring result - strong multibagger candidate',
    sampleInput: sampleStock,
    data: result
  });
});

/**
 * Filter stocks by classification
 * POST /api/scoring/filter
 * Body: { stocks: ScoringInput[], classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID' }
 */
router.post('/scoring/filter', asyncHandler(async (req: Request, res: Response) => {
  const { stocks, classification } = req.body;

  if (!Array.isArray(stocks) || stocks.length === 0) {
    throw validationError('stocks must be a non-empty array');
  }

  const validClassifications = ['STRONG BUY', 'MODERATE BUY', 'WEAK BUY', 'AVOID'];
  if (!classification || !validClassifications.includes(classification)) {
    throw validationError('classification must be one of: STRONG BUY, MODERATE BUY, WEAK BUY, AVOID');
  }

  // Score all stocks and filter by classification
  const results = stocks.map((stock: ScoringInput) => scoringService.calculateScores(stock));
  const filtered = results.filter(r => r.classification === classification);

  // Sort by percentage descending
  filtered.sort((a, b) => b.percentage - a.percentage);

  res.json({
    success: true,
    classification,
    count: filtered.length,
    totalScored: results.length,
    data: filtered
  });
}));

export default router;

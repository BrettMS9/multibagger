/**
 * Yartseva Scoring System Implementation
 * Based on "The Alchemy of Multibagger Stocks" (2025) - CAFE Working Paper No.33
 *
 * Empirically validated against 464 multibagger stocks (10x returns 2009-2024)
 *
 * 9 Factors, Total Max: 110 points
 *
 * Classification (by percentage):
 * - STRONG BUY: >= 70% (77+ points)
 * - MODERATE BUY: >= 55% (60.5+ points)
 * - WEAK BUY: >= 40% (44+ points)
 * - AVOID: < 40%
 */

export interface ScoringInput {
  // Required
  price: number;
  marketCap: number; // in dollars
  high52w: number;
  low52w: number;

  // For FCF Yield (most important factor)
  freeCashFlow?: number;

  // For Book-to-Market
  bookValue?: number; // Total book value

  // For Investment Pattern
  ebitdaGrowth?: number; // YoY or 3-year CAGR percentage
  assetGrowth?: number; // YoY or 3-year CAGR percentage

  // For EBITDA Margin
  ebitdaMargin?: number; // percentage

  // For ROA
  roa?: number; // percentage

  // For Momentum (6-month return)
  price6MonthsAgo?: number;

  // For Dividend
  paysDividend?: boolean;
  dividendYield?: number;
}

export interface FactorScore {
  score: number;
  maxScore: number;
  value: string;
  rationale: string;
}

export interface YartsevaScores {
  // Individual factors
  fcfYield: FactorScore;
  size: FactorScore;
  bookToMarket: FactorScore;
  investmentPattern: FactorScore;
  ebitdaMargin: FactorScore;
  roa: FactorScore;
  priceRange: FactorScore;
  momentum: FactorScore;
  dividend: FactorScore;

  // Totals
  total: number;
  maxTotal: number;
  percentage: number;
  classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID';
}

class ScoringService {
  /**
   * Factor 1: FCF Yield (Max 25 points) - MOST IMPORTANT
   * Free Cash Flow / Market Cap
   * Higher FCF yield indicates undervaluation and cash generation ability
   */
  scoreFcfYield(input: ScoringInput): FactorScore {
    const maxScore = 25;

    if (!input.freeCashFlow || input.marketCap <= 0) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: 'Free cash flow data not available',
      };
    }

    const fcfYield = (input.freeCashFlow / input.marketCap) * 100;
    let score = 0;
    let rationale = '';

    if (fcfYield > 12) {
      score = 25;
      rationale = `Exceptional FCF yield of ${fcfYield.toFixed(1)}% (>12%) indicates strong cash generation and potential undervaluation`;
    } else if (fcfYield > 8) {
      score = 20;
      rationale = `Strong FCF yield of ${fcfYield.toFixed(1)}% (>8%) shows healthy cash generation`;
    } else if (fcfYield > 5) {
      score = 15;
      rationale = `Good FCF yield of ${fcfYield.toFixed(1)}% (>5%) indicates reasonable cash generation`;
    } else if (fcfYield > 0) {
      score = 8;
      rationale = `Positive FCF yield of ${fcfYield.toFixed(1)}% shows the company generates cash`;
    } else {
      score = 0;
      rationale = `Negative FCF yield of ${fcfYield.toFixed(1)}% - company is burning cash`;
    }

    return { score, maxScore, value: `${fcfYield.toFixed(1)}%`, rationale };
  }

  /**
   * Factor 2: Size/Market Cap (Max 15 points)
   * Smaller companies have higher multibagger potential
   * Research shows <$350M is optimal
   */
  scoreSize(input: ScoringInput): FactorScore {
    const maxScore = 15;
    const marketCapM = input.marketCap / 1_000_000; // Convert to millions

    let score = 0;
    let rationale = '';

    if (marketCapM < 350) {
      score = 15;
      rationale = `Micro-cap ($${marketCapM.toFixed(0)}M) - optimal size for multibagger potential per Yartseva research`;
    } else if (marketCapM < 500) {
      score = 12;
      rationale = `Small micro-cap ($${marketCapM.toFixed(0)}M) - strong size advantage`;
    } else if (marketCapM < 1000) {
      score = 8;
      rationale = `Small-cap ($${marketCapM.toFixed(0)}M) - still good growth runway`;
    } else if (marketCapM < 2000) {
      score = 4;
      rationale = `Mid-small cap ($${marketCapM.toFixed(0)}M) - moderate size advantage`;
    } else {
      score = 0;
      rationale = `Large cap ($${(marketCapM/1000).toFixed(1)}B) - limited multibagger potential due to size`;
    }

    return { score, maxScore, value: marketCapM < 1000 ? `$${marketCapM.toFixed(0)}M` : `$${(marketCapM/1000).toFixed(2)}B`, rationale };
  }

  /**
   * Factor 3: Book-to-Market (Max 15 points)
   * Book Value / Market Cap - classic value factor
   * Higher B/M indicates undervaluation
   */
  scoreBookToMarket(input: ScoringInput): FactorScore {
    const maxScore = 15;

    if (!input.bookValue || input.marketCap <= 0) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: 'Book value data not available',
      };
    }

    const btm = input.bookValue / input.marketCap;
    let score = 0;
    let rationale = '';

    if (btm > 1.0) {
      score = 15;
      rationale = `Trading below book value (B/M: ${btm.toFixed(2)}) - potentially deep value`;
    } else if (btm > 0.6) {
      score = 12;
      rationale = `Good value (B/M: ${btm.toFixed(2)}) - reasonably priced relative to assets`;
    } else if (btm > 0.4) {
      score = 8;
      rationale = `Moderate value (B/M: ${btm.toFixed(2)}) - some value characteristics`;
    } else if (btm > 0) {
      score = 4;
      rationale = `Growth valuation (B/M: ${btm.toFixed(2)}) - priced for growth expectations`;
    } else {
      score = 0;
      rationale = `Negative book value - potential financial distress`;
    }

    return { score, maxScore, value: btm.toFixed(2), rationale };
  }

  /**
   * Factor 4: Investment Pattern (Max 15 points) - UNIQUE YARTSEVA FINDING
   * EBITDA Growth > Asset Growth indicates sustainable, efficient investment
   * Companies growing profits faster than assets are investing wisely
   */
  scoreInvestmentPattern(input: ScoringInput): FactorScore {
    const maxScore = 15;

    if (input.ebitdaGrowth === undefined || input.assetGrowth === undefined) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: 'Growth metrics not available - requires EBITDA and asset growth data',
      };
    }

    const pattern = input.ebitdaGrowth - input.assetGrowth;
    let score = 0;
    let rationale = '';

    if (input.ebitdaGrowth > input.assetGrowth && input.ebitdaGrowth > 0) {
      score = 15;
      rationale = `Sustainable investment pattern: EBITDA growth (${input.ebitdaGrowth.toFixed(1)}%) exceeds asset growth (${input.assetGrowth.toFixed(1)}%) - efficient capital deployment`;
    } else if (input.ebitdaGrowth > 0 && input.assetGrowth > 0) {
      score = 7;
      rationale = `Growing but asset-intensive: Asset growth (${input.assetGrowth.toFixed(1)}%) exceeds EBITDA growth (${input.ebitdaGrowth.toFixed(1)}%)`;
    } else if (input.ebitdaGrowth > 0) {
      score = 10;
      rationale = `Growing EBITDA (${input.ebitdaGrowth.toFixed(1)}%) with stable/shrinking assets - improving efficiency`;
    } else {
      score = 0;
      rationale = `Declining EBITDA (${input.ebitdaGrowth.toFixed(1)}%) - concerning trend`;
    }

    return { score, maxScore, value: `${pattern > 0 ? '+' : ''}${pattern.toFixed(1)}%`, rationale };
  }

  /**
   * Factor 5: EBITDA Margin (Max 10 points)
   * Operating profitability before accounting adjustments
   */
  scoreEbitdaMargin(input: ScoringInput): FactorScore {
    const maxScore = 10;

    if (input.ebitdaMargin === undefined) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: 'EBITDA margin data not available',
      };
    }

    const margin = input.ebitdaMargin;
    let score = 0;
    let rationale = '';

    if (margin > 20) {
      score = 10;
      rationale = `Excellent profitability with ${margin.toFixed(1)}% EBITDA margin (>20%)`;
    } else if (margin > 15) {
      score = 8;
      rationale = `Strong profitability with ${margin.toFixed(1)}% EBITDA margin (>15%)`;
    } else if (margin > 10) {
      score = 6;
      rationale = `Decent profitability with ${margin.toFixed(1)}% EBITDA margin (>10%)`;
    } else if (margin > 0) {
      score = 3;
      rationale = `Low profitability with ${margin.toFixed(1)}% EBITDA margin`;
    } else {
      score = 0;
      rationale = `Negative EBITDA margin (${margin.toFixed(1)}%) - operating at a loss`;
    }

    return { score, maxScore, value: `${margin.toFixed(1)}%`, rationale };
  }

  /**
   * Factor 6: ROA - Return on Assets (Max 10 points)
   * Measures how efficiently the company uses its assets to generate profit
   */
  scoreRoa(input: ScoringInput): FactorScore {
    const maxScore = 10;

    if (input.roa === undefined) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: 'ROA data not available',
      };
    }

    const roa = input.roa;
    let score = 0;
    let rationale = '';

    if (roa > 12) {
      score = 10;
      rationale = `Exceptional asset efficiency with ${roa.toFixed(1)}% ROA (>12%)`;
    } else if (roa > 8) {
      score = 8;
      rationale = `Strong asset efficiency with ${roa.toFixed(1)}% ROA (>8%)`;
    } else if (roa > 5) {
      score = 6;
      rationale = `Good asset efficiency with ${roa.toFixed(1)}% ROA (>5%)`;
    } else if (roa > 0) {
      score = 3;
      rationale = `Low asset efficiency with ${roa.toFixed(1)}% ROA`;
    } else {
      score = 0;
      rationale = `Negative ROA (${roa.toFixed(1)}%) - assets not generating returns`;
    }

    return { score, maxScore, value: `${roa.toFixed(1)}%`, rationale };
  }

  /**
   * Factor 7: Price Range / Entry Point (Max 10 points) - CONTRARIAN
   * Position within 52-week range
   * LOWER is BETTER - buy near 52-week lows
   */
  scorePriceRange(input: ScoringInput): FactorScore {
    const maxScore = 10;

    if (!input.high52w || !input.low52w || input.high52w === input.low52w) {
      return {
        score: 0,
        maxScore,
        value: 'N/A',
        rationale: '52-week price range data not available',
      };
    }

    const range = input.high52w - input.low52w;
    const positionPct = ((input.price - input.low52w) / range) * 100;
    let score = 0;
    let rationale = '';

    // CONTRARIAN: Near 52-week LOW is GOOD
    if (positionPct <= 20) {
      score = 10;
      rationale = `Excellent entry point: ${positionPct.toFixed(0)}% of 52-week range (near lows) - contrarian buy signal`;
    } else if (positionPct <= 35) {
      score = 8;
      rationale = `Good entry point: ${positionPct.toFixed(0)}% of 52-week range (lower third)`;
    } else if (positionPct <= 50) {
      score = 5;
      rationale = `Neutral entry: ${positionPct.toFixed(0)}% of 52-week range (middle)`;
    } else if (positionPct <= 75) {
      score = 2;
      rationale = `Elevated price: ${positionPct.toFixed(0)}% of 52-week range (upper half)`;
    } else {
      score = 0;
      rationale = `Near 52-week highs (${positionPct.toFixed(0)}%) - poor entry point per Yartseva`;
    }

    return { score, maxScore, value: `${positionPct.toFixed(0)}%`, rationale };
  }

  /**
   * Factor 8: Momentum (Max 5 points) - CONTRARIAN
   * 6-month price return
   * NEGATIVE momentum is BETTER - contrarian approach
   */
  scoreMomentum(input: ScoringInput): FactorScore {
    const maxScore = 5;

    if (!input.price6MonthsAgo || input.price6MonthsAgo <= 0) {
      // Estimate from 52-week range if not available
      // Use midpoint assumption
      return {
        score: 2.5,
        maxScore,
        value: 'Est.',
        rationale: '6-month price data not available - using neutral estimate',
      };
    }

    const momentum = ((input.price - input.price6MonthsAgo) / input.price6MonthsAgo) * 100;
    let score = 0;
    let rationale = '';

    // CONTRARIAN: Negative momentum is GOOD
    if (momentum < -15) {
      score = 5;
      rationale = `Strong contrarian signal: ${momentum.toFixed(1)}% 6-month return - beaten down, potential rebound`;
    } else if (momentum < -5) {
      score = 4;
      rationale = `Good contrarian setup: ${momentum.toFixed(1)}% 6-month return - underperforming`;
    } else if (momentum < 0) {
      score = 3;
      rationale = `Mild weakness: ${momentum.toFixed(1)}% 6-month return - slight contrarian signal`;
    } else if (momentum < 15) {
      score = 1;
      rationale = `Positive momentum (${momentum.toFixed(1)}%) - less attractive entry per Yartseva`;
    } else {
      score = 0;
      rationale = `Strong positive momentum (${momentum.toFixed(1)}%) - potentially overheated`;
    }

    return { score, maxScore, value: `${momentum.toFixed(1)}%`, rationale };
  }

  /**
   * Factor 9: Dividend (Max 5 points)
   * 78% of multibaggers paid dividends per Yartseva research
   */
  scoreDividend(input: ScoringInput): FactorScore {
    const maxScore = 5;

    const paysDividend = input.paysDividend || (input.dividendYield && input.dividendYield > 0);

    if (paysDividend) {
      const yieldStr = input.dividendYield ? `${input.dividendYield.toFixed(2)}%` : 'Yes';
      return {
        score: 5,
        maxScore,
        value: yieldStr,
        rationale: `Pays dividend${input.dividendYield ? ` (${input.dividendYield.toFixed(2)}% yield)` : ''} - 78% of multibaggers paid dividends`,
      };
    } else {
      return {
        score: 0,
        maxScore,
        value: 'No',
        rationale: 'No dividend - most multibaggers (78%) pay dividends',
      };
    }
  }

  /**
   * Calculate all Yartseva scores
   */
  calculateScores(input: ScoringInput): YartsevaScores {
    const fcfYield = this.scoreFcfYield(input);
    const size = this.scoreSize(input);
    const bookToMarket = this.scoreBookToMarket(input);
    const investmentPattern = this.scoreInvestmentPattern(input);
    const ebitdaMargin = this.scoreEbitdaMargin(input);
    const roa = this.scoreRoa(input);
    const priceRange = this.scorePriceRange(input);
    const momentum = this.scoreMomentum(input);
    const dividend = this.scoreDividend(input);

    const maxTotal = 110;
    const total =
      fcfYield.score +
      size.score +
      bookToMarket.score +
      investmentPattern.score +
      ebitdaMargin.score +
      roa.score +
      priceRange.score +
      momentum.score +
      dividend.score;

    const percentage = (total / maxTotal) * 100;

    let classification: 'STRONG BUY' | 'MODERATE BUY' | 'WEAK BUY' | 'AVOID';
    if (percentage >= 70) {
      classification = 'STRONG BUY';
    } else if (percentage >= 55) {
      classification = 'MODERATE BUY';
    } else if (percentage >= 40) {
      classification = 'WEAK BUY';
    } else {
      classification = 'AVOID';
    }

    return {
      fcfYield,
      size,
      bookToMarket,
      investmentPattern,
      ebitdaMargin,
      roa,
      priceRange,
      momentum,
      dividend,
      total,
      maxTotal,
      percentage,
      classification,
    };
  }
}

export const scoringService = new ScoringService();

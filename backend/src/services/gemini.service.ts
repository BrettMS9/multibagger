import { GoogleGenerativeAI } from '@google/generative-ai';
import Bottleneck from 'bottleneck';
import type { GrowthMetrics } from './fmp-api.service';

// Rate limiter: Stay well within free tier (1,500 grounded requests/day)
const geminiLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1000, // 1 request per second max
});

/**
 * Complete stock data for Yartseva scoring
 */
export interface GeminiStockData {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;

  // Price data
  price: number;
  marketCap: number;
  high52w: number;
  low52w: number;
  price6MonthsAgo: number | null;

  // Financial metrics
  freeCashFlow: number | null;
  bookValue: number | null;
  totalAssets: number | null;
  ebitdaMargin: number | null;  // as percentage
  roa: number | null;           // as percentage

  // Growth metrics
  ebitdaGrowth: number | null;  // 3-year CAGR as percentage
  assetGrowth: number | null;   // 3-year CAGR as percentage

  // Dividend
  paysDividend: boolean;
  dividendYield: number | null; // as percentage
}

class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private initialized = false;

  private initialize(): boolean {
    if (this.initialized) return this.client !== null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set - Gemini service disabled');
      this.initialized = true;
      return false;
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.initialized = true;
    return true;
  }

  /**
   * Get complete stock data using Gemini with Google Search grounding
   * This is the PRIMARY data source for stock screening
   */
  async getStockData(ticker: string): Promise<GeminiStockData> {
    if (!this.initialize() || !this.client) {
      throw new Error('Gemini service not available - check GEMINI_API_KEY');
    }

    return geminiLimiter.schedule(async () => {
      const model = this.client!.getGenerativeModel({
        model: 'gemini-2.0-flash',
        tools: [{ googleSearch: {} } as any],
      });

      const prompt = `You are a financial data analyst. Search for comprehensive financial data for stock ticker "${ticker}" trading on US exchanges.

CRITICAL: Use Google Search to find current, accurate data from sources like Yahoo Finance, MarketWatch, Seeking Alpha, SEC filings, and company investor relations pages.

## Required Data Points

### 1. Company Identification
- Full legal company name
- GICS Sector (Technology, Healthcare, Financials, Consumer Discretionary, etc.)
- GICS Industry (Software, Biotechnology, Banks, Retail, etc.)

### 2. Current Market Data (as of today)
- Current stock price in USD
- Market capitalization in USD (full number, e.g., 50000000000 for $50B)
- 52-week high price
- 52-week low price

### 3. Historical Price (IMPORTANT for momentum calculation)
- Stock price from approximately 6 months ago (around June 2024)
- Search for "${ticker} stock price June 2024" or "${ticker} 6 month price history"

### 4. Financial Metrics (from most recent annual report/10-K)
- Free Cash Flow (Operating Cash Flow minus CapEx) in USD
- Book Value / Total Stockholders' Equity in USD
- Total Assets in USD
- EBITDA Margin as percentage (EBITDA / Revenue × 100)
- Return on Assets (ROA) as percentage (Net Income / Total Assets × 100)

### 5. Growth Metrics (3-Year CAGR - IMPORTANT)
Calculate or find the 3-year compound annual growth rate:
- EBITDA Growth: Compare EBITDA from 2021 to 2024, calculate CAGR
  Formula: ((EBITDA_2024 / EBITDA_2021)^(1/3) - 1) × 100
- Asset Growth: Compare Total Assets from 2021 to 2024, calculate CAGR
  Formula: ((Assets_2024 / Assets_2021)^(1/3) - 1) × 100

Search for "${ticker} EBITDA history" or "${ticker} annual report" to find historical values.

### 6. Dividend Information
- Does the company currently pay a regular dividend? (true/false)
- Current annual dividend yield as percentage

## Output Format
Return ONLY valid JSON (no markdown, no explanation, no code blocks):

{"companyName":"string","sector":"string","industry":"string","price":number,"marketCap":number,"high52w":number,"low52w":number,"price6MonthsAgo":number_or_null,"freeCashFlow":number_or_null,"bookValue":number_or_null,"totalAssets":number_or_null,"ebitdaMargin":number_or_null,"roa":number_or_null,"ebitdaGrowth":number_or_null,"assetGrowth":number_or_null,"paysDividend":boolean,"dividendYield":number_or_null}

## Rules
- All monetary values as full integers (2500000000 not 2.5B)
- Percentages as plain numbers (15.5 for 15.5%, -5.2 for -5.2%)
- Use null ONLY if data truly cannot be found after searching
- Prefer recent 10-K/annual report data over quarterly for consistency
- For growth metrics, if you can find 2021 and 2024 values, calculate the CAGR yourself`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Parse JSON from response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(`Could not parse Gemini response for ${ticker}:`, text);
        throw new Error(`Failed to parse stock data for ${ticker}`);
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Log what Gemini returned for debugging
      console.log(`Gemini data for ${ticker}:`, JSON.stringify({
        fcf: parsed.freeCashFlow,
        bookValue: parsed.bookValue,
        ebitdaMargin: parsed.ebitdaMargin,
        roa: parsed.roa,
        ebitdaGrowth: parsed.ebitdaGrowth,
        assetGrowth: parsed.assetGrowth,
        price6MonthsAgo: parsed.price6MonthsAgo,
      }));

      // Validate required fields
      if (!parsed.companyName || typeof parsed.price !== 'number' || typeof parsed.marketCap !== 'number') {
        console.error(`Missing required fields for ${ticker}:`, parsed);
        throw new Error(`Incomplete stock data for ${ticker}`);
      }

      return {
        ticker: ticker.toUpperCase(),
        companyName: parsed.companyName,
        sector: parsed.sector || 'Unknown',
        industry: parsed.industry || 'Unknown',
        price: parsed.price,
        marketCap: parsed.marketCap,
        high52w: parsed.high52w || parsed.price * 1.1,
        low52w: parsed.low52w || parsed.price * 0.9,
        price6MonthsAgo: typeof parsed.price6MonthsAgo === 'number' ? parsed.price6MonthsAgo : null,
        freeCashFlow: typeof parsed.freeCashFlow === 'number' ? parsed.freeCashFlow : null,
        bookValue: typeof parsed.bookValue === 'number' ? parsed.bookValue : null,
        totalAssets: typeof parsed.totalAssets === 'number' ? parsed.totalAssets : null,
        ebitdaMargin: typeof parsed.ebitdaMargin === 'number' ? parsed.ebitdaMargin : null,
        roa: typeof parsed.roa === 'number' ? parsed.roa : null,
        ebitdaGrowth: typeof parsed.ebitdaGrowth === 'number' ? parsed.ebitdaGrowth : null,
        assetGrowth: typeof parsed.assetGrowth === 'number' ? parsed.assetGrowth : null,
        paysDividend: parsed.paysDividend === true,
        dividendYield: typeof parsed.dividendYield === 'number' ? parsed.dividendYield : null,
      };
    });
  }

  /**
   * Search for growth metrics using Gemini with Google Search grounding
   * Used as fallback when FMP historical data is insufficient
   */
  async searchGrowthMetrics(ticker: string, companyName: string): Promise<GrowthMetrics> {
    if (!this.initialize() || !this.client) {
      return {
        ebitdaGrowth: null,
        assetGrowth: null,
        source: 'unavailable',
      };
    }

    return geminiLimiter.schedule(async () => {
      try {
        const model = this.client!.getGenerativeModel({
          model: 'gemini-2.0-flash',
          tools: [{ googleSearch: {} } as any],
        });

        const prompt = `Find the 3-year compound annual growth rate (CAGR) for ${companyName} (ticker: ${ticker}):

1. EBITDA 3-year CAGR (earnings before interest, taxes, depreciation, amortization)
2. Total Assets 3-year CAGR

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{"ebitdaGrowth": <number or null>, "assetGrowth": <number or null>}

Express growth rates as percentages (e.g., 15.5 for 15.5% growth).
Use null if the data cannot be found.`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            ebitdaGrowth: typeof parsed.ebitdaGrowth === 'number' ? parsed.ebitdaGrowth : null,
            assetGrowth: typeof parsed.assetGrowth === 'number' ? parsed.assetGrowth : null,
            source: 'gemini' as const,
          };
        }

        console.warn(`Could not parse Gemini response for ${ticker}:`, text);
        return {
          ebitdaGrowth: null,
          assetGrowth: null,
          source: 'unavailable',
        };
      } catch (error) {
        console.error(`Gemini search error for ${ticker}:`, error);
        return {
          ebitdaGrowth: null,
          assetGrowth: null,
          source: 'unavailable',
        };
      }
    });
  }

  /**
   * Check if Gemini service is available
   */
  isAvailable(): boolean {
    return this.initialize();
  }
}

export const geminiService = new GeminiService();

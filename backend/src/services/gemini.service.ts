import { GoogleGenerativeAI } from '@google/generative-ai';
import Bottleneck from 'bottleneck';
import type { GrowthMetrics } from './fmp-api.service';

// Rate limiter: Stay well within free tier (1,500 grounded requests/day)
const geminiLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1000, // 1 request per second max
});

class GeminiService {
  private client: GoogleGenerativeAI | null = null;
  private initialized = false;

  private initialize(): boolean {
    if (this.initialized) return this.client !== null;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set - Gemini fallback disabled');
      this.initialized = true;
      return false;
    }

    this.client = new GoogleGenerativeAI(apiKey);
    this.initialized = true;
    return true;
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

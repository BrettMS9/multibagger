import Anthropic from '@anthropic-ai/sdk';
import Bottleneck from 'bottleneck';

// Rate limiter: 50 requests per minute for Anthropic API
const anthropicLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 1200, // 50/min = 1200ms between requests
});

export interface GrowthMetrics {
  assetGrowth?: number; // 3-year CAGR
  ebitdaGrowth?: number; // 3-year CAGR
  revenueGrowth?: number; // 3-year CAGR
  source?: string;
  confidence?: 'high' | 'medium' | 'low';
}

class AnthropicService {
  private client: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY not set in environment variables');
    }
    this.client = new Anthropic({ apiKey });
  }

  async searchGrowthMetrics(ticker: string, companyName: string): Promise<GrowthMetrics> {
    return anthropicLimiter.schedule(async () => {
      try {
        const prompt = `Search for the following financial growth metrics for ${companyName} (ticker: ${ticker}):

1. 3-year CAGR (Compound Annual Growth Rate) for Total Assets
2. 3-year CAGR for EBITDA (Earnings Before Interest, Taxes, Depreciation, and Amortization)
3. 3-year CAGR for Revenue (as additional context)

Please return ONLY a JSON object with the following structure (no additional text):
{
  "assetGrowth": <number or null>,
  "ebitdaGrowth": <number or null>,
  "revenueGrowth": <number or null>,
  "source": "<source name>",
  "confidence": "high|medium|low"
}

The growth rates should be expressed as percentages (e.g., 15.5 for 15.5% growth).
If a metric cannot be found, use null.`;

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          tools: [
            {
              type: 'web_search_20241220' as any,
              name: 'web_search',
              max_uses: 5,
            },
          ],
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        // Extract the JSON response from Claude's message
        const textContent = response.content.find(
          (block) => block.type === 'text'
        ) as Anthropic.Messages.TextBlock | undefined;

        if (!textContent) {
          console.warn(`No text response from Anthropic for ${ticker}`);
          return {};
        }

        // Try to parse JSON from the response
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const metrics = JSON.parse(jsonMatch[0]);
          return {
            assetGrowth: metrics.assetGrowth ?? undefined,
            ebitdaGrowth: metrics.ebitdaGrowth ?? undefined,
            revenueGrowth: metrics.revenueGrowth ?? undefined,
            source: metrics.source ?? 'web_search',
            confidence: metrics.confidence ?? 'medium',
          };
        }

        console.warn(`Could not parse JSON response for ${ticker}:`, textContent.text);
        return {};
      } catch (error) {
        console.error(`Error fetching growth metrics for ${ticker}:`, error);
        return {};
      }
    });
  }

  async searchHistoricalMultiplier(ticker: string, companyName: string, yearsAgo: number): Promise<number | null> {
    return anthropicLimiter.schedule(async () => {
      try {
        const targetYear = new Date().getFullYear() - yearsAgo;
        const prompt = `Search for the historical stock price of ${companyName} (ticker: ${ticker}) around January ${targetYear}.

Please return ONLY a JSON object with the following structure (no additional text):
{
  "price": <number or null>,
  "date": "<YYYY-MM-DD>",
  "source": "<source name>"
}

If the price cannot be found, use null.`;

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 512,
          tools: [
            {
              type: 'web_search_20241220' as any,
              name: 'web_search',
              max_uses: 3,
            },
          ],
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const textContent = response.content.find(
          (block) => block.type === 'text'
        ) as Anthropic.Messages.TextBlock | undefined;

        if (!textContent) {
          return null;
        }

        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          return result.price ?? null;
        }

        return null;
      } catch (error) {
        console.error(`Error fetching historical price for ${ticker}:`, error);
        return null;
      }
    });
  }

  async enrichStockData(ticker: string, companyName: string, sector: string): Promise<{
    growthMetrics?: GrowthMetrics;
    additionalInfo?: string;
  }> {
    return anthropicLimiter.schedule(async () => {
      try {
        const prompt = `Provide a brief analysis of ${companyName} (${ticker}) in the ${sector} sector. Include:
1. Key business model points
2. Competitive advantages
3. Recent growth trends
4. Any red flags or risks

Keep the response concise (2-3 paragraphs maximum).`;

        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 1024,
          tools: [
            {
              type: 'web_search_20241220' as any,
              name: 'web_search',
              max_uses: 3,
            },
          ],
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
        });

        const textContent = response.content.find(
          (block) => block.type === 'text'
        ) as Anthropic.Messages.TextBlock | undefined;

        return {
          additionalInfo: textContent?.text,
        };
      } catch (error) {
        console.error(`Error enriching stock data for ${ticker}:`, error);
        return {};
      }
    });
  }
}

export const anthropicService = new AnthropicService();

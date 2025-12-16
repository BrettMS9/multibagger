import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQSection = ({ title, items }: { title: string; items: FAQItem[] }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-slate-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-4 py-3 text-left bg-slate-50 hover:bg-slate-100 flex justify-between items-center transition-colors"
            >
              <span className="font-medium text-slate-900">{item.question}</span>
              <span className="text-slate-500 text-xl">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="px-4 py-4 bg-white text-slate-700 text-sm leading-relaxed">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const FAQ = () => {
  const scoringFAQ: FAQItem[] = [
    {
      question: 'What is the Yartseva Scoring System?',
      answer: (
        <div>
          <p className="mb-3">
            The scoring system is based on <strong>Yartseva (2025) "The Alchemy of Multibagger Stocks"</strong>,
            a peer-reviewed study analyzing 464 stocks that achieved 10x+ returns between 2009-2024.
          </p>
          <p>
            The research identified 9 key factors that predict multibagger potential, weighted by their
            statistical significance. The maximum score is 110 points.
          </p>
        </div>
      ),
    },
    {
      question: 'How are the 9 factors weighted?',
      answer: (
        <div className="space-y-2">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Factor</th>
                <th className="text-right py-2">Max Points</th>
                <th className="text-left py-2 pl-4">Key Insight</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-green-700">1. FCF Yield</td>
                <td className="text-right">25</td>
                <td className="pl-4 text-slate-600">MOST predictive factor</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">2. Size (Market Cap)</td>
                <td className="text-right">15</td>
                <td className="pl-4 text-slate-600">Small caps outperform</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">3. Book-to-Market</td>
                <td className="text-right">15</td>
                <td className="pl-4 text-slate-600">Value effect</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-blue-700">4. Investment Pattern</td>
                <td className="text-right">15</td>
                <td className="pl-4 text-slate-600">UNIQUE finding</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">5. EBITDA Margin</td>
                <td className="text-right">10</td>
                <td className="pl-4 text-slate-600">Profitability</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">6. ROA</td>
                <td className="text-right">10</td>
                <td className="pl-4 text-slate-600">Asset efficiency</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-orange-700">7. Price Range</td>
                <td className="text-right">10</td>
                <td className="pl-4 text-slate-600">CONTRARIAN - buy low</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2 font-medium text-orange-700">8. Momentum</td>
                <td className="text-right">5</td>
                <td className="pl-4 text-slate-600">CONTRARIAN - negative is good</td>
              </tr>
              <tr>
                <td className="py-2">9. Dividend</td>
                <td className="text-right">5</td>
                <td className="pl-4 text-slate-600">78% paid dividends</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      question: 'What do the classifications mean?',
      answer: (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold">STRONG BUY</span>
            <span>≥70% score - Highest multibagger potential</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold">MODERATE BUY</span>
            <span>≥55% score - Good potential with some concerns</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-bold">WEAK BUY</span>
            <span>≥40% score - Limited potential, proceed with caution</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">AVOID</span>
            <span>&lt;40% score - Does not fit multibagger profile</span>
          </div>
        </div>
      ),
    },
  ];

  const insightsFAQ: FAQItem[] = [
    {
      question: 'Which sectors produce the most multibaggers?',
      answer: (
        <div>
          <p className="mb-3">Based on the Yartseva research (464 multibaggers, 2009-2024):</p>
          <table className="w-full text-sm mb-3">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Sector</th>
                <th className="text-right py-2">% of Multibaggers</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 bg-green-50">
                <td className="py-2 font-medium">Consumer Discretionary</td>
                <td className="text-right font-bold text-green-700">21.6%</td>
              </tr>
              <tr className="border-b border-slate-100 bg-green-50">
                <td className="py-2 font-medium">Technology</td>
                <td className="text-right font-bold text-green-700">18.5%</td>
              </tr>
              <tr className="border-b border-slate-100 bg-green-50">
                <td className="py-2 font-medium">Healthcare</td>
                <td className="text-right font-bold text-green-700">15.1%</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">Industrials</td>
                <td className="text-right">14.0%</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">Financials</td>
                <td className="text-right">10.3%</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">Energy</td>
                <td className="text-right">7.1%</td>
              </tr>
              <tr className="border-b border-slate-100">
                <td className="py-2">Materials</td>
                <td className="text-right">5.8%</td>
              </tr>
              <tr>
                <td className="py-2">Other</td>
                <td className="text-right">7.6%</td>
              </tr>
            </tbody>
          </table>
          <p className="text-slate-600 text-xs">
            <strong>Tip:</strong> Focus on Consumer Discretionary, Technology, and Healthcare for the highest probability of finding multibaggers.
          </p>
        </div>
      ),
    },
    {
      question: 'What is the optimal market cap size?',
      answer: (
        <div>
          <p className="mb-3">Smaller companies have significantly higher multibagger potential:</p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li><strong>Micro-cap (&lt;$350M)</strong> - Highest potential, scores 15/15</li>
            <li><strong>Small-cap ($350M-$500M)</strong> - Excellent potential, scores 12/15</li>
            <li><strong>Small-mid ($500M-$1B)</strong> - Good potential, scores 8/15</li>
            <li><strong>Mid-cap ($1B-$2B)</strong> - Moderate potential, scores 4/15</li>
            <li><strong>Large-cap (&gt;$2B)</strong> - Limited potential, scores 0/15</li>
          </ul>
          <p className="text-slate-600 text-xs">
            <strong>Why Russell 2000?</strong> This index focuses on small-cap stocks, which aligns perfectly with the Yartseva methodology's finding that smaller companies have higher multibagger potential.
          </p>
        </div>
      ),
    },
    {
      question: 'What is the "Investment Pattern" factor?',
      answer: (
        <div>
          <p className="mb-3">
            This is a <strong>unique finding</strong> from the Yartseva research. It measures whether a company's
            investment strategy is sustainable:
          </p>
          <div className="bg-blue-50 p-3 rounded-lg mb-3">
            <p className="font-medium text-blue-900">EBITDA Growth &gt; Asset Growth = Sustainable Investment</p>
            <p className="text-sm text-blue-700 mt-1">
              When earnings grow faster than assets, it means the company is deploying capital efficiently
              and generating increasing returns on its investments.
            </p>
          </div>
          <p className="text-slate-600 text-xs">
            <strong>Scoring:</strong> Companies where EBITDA growth exceeds asset growth by any margin receive the full 15 points.
            This pattern was present in the majority of successful multibaggers.
          </p>
        </div>
      ),
    },
    {
      question: 'Why are the entry point factors "contrarian"?',
      answer: (
        <div>
          <p className="mb-3">
            Two factors reward contrarian behavior - buying when others are selling:
          </p>
          <div className="space-y-3">
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="font-medium text-orange-900">Price Range (Entry Point)</p>
              <p className="text-sm text-orange-700 mt-1">
                Stocks near their 52-week lows (bottom 20% of range) score highest.
                This contrarian approach means buying quality companies when they're temporarily out of favor.
              </p>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <p className="font-medium text-orange-900">6-Month Momentum</p>
              <p className="text-sm text-orange-700 mt-1">
                Negative momentum is actually rewarded! Stocks that have fallen 15%+ in the past 6 months
                score highest. The research found that buying into weakness (not chasing strength)
                produces better multibagger outcomes.
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const tipsFAQ: FAQItem[] = [
    {
      question: 'What factors matter most?',
      answer: (
        <div>
          <p className="mb-3">Focus on these high-impact factors:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>FCF Yield (25 pts)</strong> - The single most predictive factor.
              Look for companies with FCF yield &gt;12% for maximum score.
            </li>
            <li>
              <strong>Size + Book-to-Market (30 pts combined)</strong> - Small, undervalued companies
              have the highest potential.
            </li>
            <li>
              <strong>Investment Pattern (15 pts)</strong> - Sustainable growth is key.
              EBITDA growth should exceed asset growth.
            </li>
          </ol>
          <p className="mt-3 text-slate-600 text-xs">
            <strong>Note:</strong> Earnings growth (EPS) was NOT found to be statistically significant in the research.
            Don't overpay for earnings growth stories.
          </p>
        </div>
      ),
    },
    {
      question: 'What about P/E ratio?',
      answer: (
        <div>
          <p className="mb-3">
            The Yartseva research specifically notes that <strong>P/E ratio is problematic</strong> for quantitative analysis:
          </p>
          <ul className="list-disc list-inside space-y-1 mb-3">
            <li>Negative earnings make P/E meaningless</li>
            <li>Extreme values distort analysis</li>
            <li>Many successful multibaggers had negative or very high P/E at entry</li>
          </ul>
          <p className="text-slate-600">
            Instead, focus on <strong>FCF Yield</strong> (free cash flow / market cap) which is more reliable
            and was the strongest predictor of multibagger success.
          </p>
        </div>
      ),
    },
    {
      question: 'When is the best time to buy?',
      answer: (
        <div>
          <p className="mb-3">The research identified optimal entry conditions:</p>
          <ul className="list-disc list-inside space-y-2 mb-3">
            <li><strong>Price near 52-week low</strong> - Bottom 20% of range is ideal</li>
            <li><strong>Negative 6-month momentum</strong> - Buy into weakness, not strength</li>
            <li><strong>Low interest rate environment</strong> - Rising rates depress returns by 8-12%</li>
          </ul>
          <div className="bg-yellow-50 p-3 rounded-lg">
            <p className="font-medium text-yellow-900">Market Timing Note</p>
            <p className="text-sm text-yellow-700 mt-1">
              Interest rates significantly impact multibagger returns. In rising rate environments,
              even high-scoring stocks may underperform. The 2009-2024 study period included extended
              low-rate conditions.
            </p>
          </div>
        </div>
      ),
    },
    {
      question: 'How should I use this screener?',
      answer: (
        <div>
          <p className="mb-3">Recommended workflow:</p>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Start with sectors</strong> - Focus on Consumer Discretionary, Technology,
              or Healthcare for highest probability.
            </li>
            <li>
              <strong>Filter by classification</strong> - Prioritize STRONG BUY and MODERATE BUY stocks.
            </li>
            <li>
              <strong>Check individual factors</strong> - Use single-stock analysis to understand
              why a stock scores well or poorly.
            </li>
            <li>
              <strong>Verify entry timing</strong> - Look for stocks near 52-week lows with
              negative recent momentum.
            </li>
            <li>
              <strong>Do your own research</strong> - This screener identifies candidates;
              always verify with fundamental analysis.
            </li>
          </ol>
        </div>
      ),
    },
    {
      question: 'What are the limitations?',
      answer: (
        <div>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <strong>Historical analysis</strong> - The model is based on 2009-2024 data.
              Future market conditions may differ.
            </li>
            <li>
              <strong>Data availability</strong> - Some metrics (especially growth rates) may not
              be available for all stocks.
            </li>
            <li>
              <strong>No guarantee</strong> - High scores indicate higher probability, not certainty.
              Many high-scoring stocks will not become multibaggers.
            </li>
            <li>
              <strong>Survivorship bias</strong> - The research studied successful multibaggers.
              Many similar-looking stocks failed.
            </li>
            <li>
              <strong>Timing matters</strong> - Entry point and holding period significantly impact returns.
            </li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📚</span>
          <h2 className="text-2xl font-bold">How It Works</h2>
        </div>
        <p className="text-slate-300 text-sm">
          Understanding the Yartseva Multibagger Methodology
        </p>
      </div>

      {/* Research Citation */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Research Source:</strong> Yartseva, A. (2025). "The Alchemy of Multibagger Stocks:
          Decoding the DNA of Extraordinary Returns." CAFE Working Paper No. 33.
          Analysis of 464 stocks achieving 10x+ returns, 2009-2024.
        </p>
      </div>

      {/* FAQ Sections */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <FAQSection title="Scoring System" items={scoringFAQ} />
        <FAQSection title="Key Research Insights" items={insightsFAQ} />
        <FAQSection title="Tips & Best Practices" items={tipsFAQ} />
      </div>

      {/* Quick Reference Card */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Quick Reference: Ideal Multibagger Profile</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Financial Characteristics</h4>
            <ul className="space-y-1 text-slate-600">
              <li>✓ FCF Yield &gt; 12%</li>
              <li>✓ Market Cap &lt; $500M</li>
              <li>✓ Book-to-Market &gt; 0.6</li>
              <li>✓ EBITDA Margin &gt; 15%</li>
              <li>✓ ROA &gt; 8%</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-slate-700 mb-2">Entry Conditions</h4>
            <ul className="space-y-1 text-slate-600">
              <li>✓ Near 52-week low (bottom 20%)</li>
              <li>✓ Negative 6-month momentum</li>
              <li>✓ EBITDA growth &gt; Asset growth</li>
              <li>✓ Pays a dividend</li>
              <li>✓ Low interest rate environment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

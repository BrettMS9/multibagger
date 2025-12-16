import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: React.ReactNode;
}

const FAQSection = ({ title, items, icon }: { title: string; items: FAQItem[]; icon: React.ReactElement }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mb-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 flex items-center justify-center">
          {icon}
        </div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="premium-card rounded-xl overflow-hidden transition-all duration-300"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="w-full px-5 py-4 text-left flex justify-between items-center gap-4 hover:bg-[var(--color-bg-tertiary)]/50 transition-colors"
            >
              <span className="font-medium text-[var(--color-text-primary)]">{item.question}</span>
              <span className={`text-[var(--color-accent-primary)] transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${openIndex === index ? 'max-h-[1000px]' : 'max-h-0'}`}>
              <div className="px-5 py-4 border-t border-[var(--color-border)] text-[var(--color-text-secondary)] text-sm leading-relaxed">
                {item.answer}
              </div>
            </div>
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
        <div className="space-y-3">
          <p>
            The scoring system is based on <strong className="text-[var(--color-accent-primary)]">Yartseva (2025) "The Alchemy of Multibagger Stocks"</strong>,
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)]">
                <th className="text-left py-3 text-[var(--color-text-muted)] font-medium">Factor</th>
                <th className="text-right py-3 text-[var(--color-text-muted)] font-medium">Max Pts</th>
                <th className="text-left py-3 pl-4 text-[var(--color-text-muted)] font-medium">Key Insight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              <tr>
                <td className="py-3 font-medium text-emerald-400">1. FCF Yield</td>
                <td className="text-right font-mono">25</td>
                <td className="pl-4 text-[var(--color-text-muted)]">MOST predictive factor</td>
              </tr>
              <tr>
                <td className="py-3">2. Size (Market Cap)</td>
                <td className="text-right font-mono">15</td>
                <td className="pl-4 text-[var(--color-text-muted)]">Small caps outperform</td>
              </tr>
              <tr>
                <td className="py-3">3. Book-to-Market</td>
                <td className="text-right font-mono">15</td>
                <td className="pl-4 text-[var(--color-text-muted)]">Value effect</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-amber-400">4. Investment Pattern</td>
                <td className="text-right font-mono">15</td>
                <td className="pl-4 text-[var(--color-text-muted)]">UNIQUE finding</td>
              </tr>
              <tr>
                <td className="py-3">5. EBITDA Margin</td>
                <td className="text-right font-mono">10</td>
                <td className="pl-4 text-[var(--color-text-muted)]">Profitability</td>
              </tr>
              <tr>
                <td className="py-3">6. ROA</td>
                <td className="text-right font-mono">10</td>
                <td className="pl-4 text-[var(--color-text-muted)]">Asset efficiency</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-purple-400">7. Price Range</td>
                <td className="text-right font-mono">10</td>
                <td className="pl-4 text-[var(--color-text-muted)]">CONTRARIAN - buy low</td>
              </tr>
              <tr>
                <td className="py-3 font-medium text-purple-400">8. Momentum</td>
                <td className="text-right font-mono">5</td>
                <td className="pl-4 text-[var(--color-text-muted)]">CONTRARIAN - negative is good</td>
              </tr>
              <tr>
                <td className="py-3">9. Dividend</td>
                <td className="text-right font-mono">5</td>
                <td className="pl-4 text-[var(--color-text-muted)]">78% paid dividends</td>
              </tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      question: 'What do the classifications mean?',
      answer: (
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">STRONG BUY</span>
            <span className="text-[var(--color-text-secondary)]">≥70% score — Highest multibagger potential</span>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold">MODERATE BUY</span>
            <span className="text-[var(--color-text-secondary)]">≥55% score — Good potential with some concerns</span>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs font-bold">WEAK BUY</span>
            <span className="text-[var(--color-text-secondary)]">≥40% score — Limited potential, proceed with caution</span>
          </div>
          <div className="flex items-center gap-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">AVOID</span>
            <span className="text-[var(--color-text-secondary)]">&lt;40% score — Does not fit multibagger profile</span>
          </div>
        </div>
      ),
    },
  ];

  const insightsFAQ: FAQItem[] = [
    {
      question: 'Which sectors produce the most multibaggers?',
      answer: (
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">Based on the Yartseva research (464 multibaggers, 2009-2024):</p>
          <div className="space-y-2">
            {[
              { sector: 'Consumer Discretionary', pct: 21.6, highlight: true },
              { sector: 'Technology', pct: 18.5, highlight: true },
              { sector: 'Healthcare', pct: 15.1, highlight: true },
              { sector: 'Industrials', pct: 14.0, highlight: false },
              { sector: 'Financials', pct: 10.3, highlight: false },
              { sector: 'Energy', pct: 7.1, highlight: false },
              { sector: 'Materials', pct: 5.8, highlight: false },
              { sector: 'Other', pct: 7.6, highlight: false },
            ].map((item) => (
              <div key={item.sector} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={item.highlight ? 'text-[var(--color-text-primary)] font-medium' : 'text-[var(--color-text-muted)]'}>
                      {item.sector}
                    </span>
                    <span className={item.highlight ? 'text-[var(--color-accent-primary)] font-bold' : 'text-[var(--color-text-muted)]'}>
                      {item.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${item.highlight ? 'bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)]' : 'bg-[var(--color-border-light)]'}`}
                      style={{ width: `${(item.pct / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-accent-primary)]/10 border border-[var(--color-accent-primary)]/20 text-xs text-[var(--color-accent-primary)]">
            <strong>Tip:</strong> Focus on Consumer Discretionary, Technology, and Healthcare for the highest probability of finding multibaggers.
          </div>
        </div>
      ),
    },
    {
      question: 'What is the optimal market cap size?',
      answer: (
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">Smaller companies have significantly higher multibagger potential:</p>
          <div className="space-y-2">
            {[
              { label: 'Micro-cap (<$350M)', score: '15/15', desc: 'Highest potential', pct: 100 },
              { label: 'Small-cap ($350M-$500M)', score: '12/15', desc: 'Excellent potential', pct: 80 },
              { label: 'Small-mid ($500M-$1B)', score: '8/15', desc: 'Good potential', pct: 53 },
              { label: 'Mid-cap ($1B-$2B)', score: '4/15', desc: 'Moderate potential', pct: 27 },
              { label: 'Large-cap (>$2B)', score: '0/15', desc: 'Limited potential', pct: 0 },
            ].map((item) => (
              <div key={item.label} className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-[var(--color-text-primary)]">{item.label}</span>
                  <span className="font-mono text-[var(--color-accent-primary)]">{item.score}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-accent-secondary)]/10 border border-[var(--color-accent-secondary)]/20 text-xs text-[var(--color-accent-secondary)]">
            <strong>Why Russell 2000?</strong> This index focuses on small-cap stocks, which aligns perfectly with the Yartseva methodology's finding that smaller companies have higher multibagger potential.
          </div>
        </div>
      ),
    },
    {
      question: 'What is the "Investment Pattern" factor?',
      answer: (
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">
            This is a <strong className="text-amber-400">unique finding</strong> from the Yartseva research. It measures whether a company's
            investment strategy is sustainable:
          </p>
          <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-500/5 border border-amber-500/20">
            <p className="font-semibold text-amber-400 mb-2">EBITDA Growth &gt; Asset Growth = Sustainable Investment</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              When earnings grow faster than assets, it means the company is deploying capital efficiently
              and generating increasing returns on its investments.
            </p>
          </div>
          <p className="text-xs text-[var(--color-text-muted)]">
            <strong>Scoring:</strong> Companies where EBITDA growth exceeds asset growth by any margin receive the full 15 points.
            This pattern was present in the majority of successful multibaggers.
          </p>
        </div>
      ),
    },
    {
      question: 'Why are the entry point factors "contrarian"?',
      answer: (
        <div className="space-y-4">
          <p className="text-[var(--color-text-muted)]">
            Two factors reward contrarian behavior — buying when others are selling:
          </p>
          <div className="space-y-3">
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="font-semibold text-purple-400 mb-2">Price Range (Entry Point)</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Stocks trading near their 52-week lows scored highest. This is counterintuitive — most investors avoid "falling knives,"
                but the data shows buying near lows significantly increases multibagger probability.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <p className="font-semibold text-purple-400 mb-2">6-Month Momentum</p>
              <p className="text-sm text-[var(--color-text-muted)]">
                Negative momentum (price decline over 6 months) was actually a positive signal. Stocks that had fallen
                before becoming multibaggers outperformed those with positive momentum.
              </p>
            </div>
          </div>
          <div className="p-3 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
            <strong>Key Insight:</strong> The best time to buy future multibaggers is when they're unloved and underperforming — 
            the opposite of what most momentum-based strategies suggest.
          </div>
        </div>
      ),
    },
  ];

  const technicalFAQ: FAQItem[] = [
    {
      question: 'Where does the data come from?',
      answer: (
        <div className="space-y-3">
          <p className="text-[var(--color-text-muted)]">We use multiple data sources for comprehensive coverage:</p>
          <div className="grid gap-3">
            {[
              { name: 'Yahoo Finance', desc: 'Real-time prices, market cap, 52-week ranges' },
              { name: 'Financial Modeling Prep', desc: 'Fundamental data, financial statements' },
              { name: 'SEC EDGAR', desc: 'Official filings for US companies' },
              { name: 'Gemini AI', desc: 'Intelligent data extraction and analysis' },
            ].map((source) => (
              <div key={source.name} className="flex items-start gap-3 p-3 rounded-lg bg-[var(--color-bg-secondary)]">
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-primary)] mt-1.5" />
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">{source.name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{source.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      question: 'How often is data updated?',
      answer: (
        <div className="space-y-3">
          <p className="text-[var(--color-text-muted)]">
            Data freshness varies by type:
          </p>
          <div className="space-y-2">
            <div className="flex justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
              <span className="text-[var(--color-text-primary)]">Price data</span>
              <span className="text-[var(--color-accent-primary)] font-mono">Real-time</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
              <span className="text-[var(--color-text-primary)]">Fundamental data</span>
              <span className="text-[var(--color-accent-primary)] font-mono">Daily</span>
            </div>
            <div className="flex justify-between p-3 rounded-lg bg-[var(--color-bg-secondary)]">
              <span className="text-[var(--color-text-primary)]">Cached results</span>
              <span className="text-[var(--color-accent-primary)] font-mono">24 hours</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold gradient-text mb-3">How It Works</h2>
        <p className="text-[var(--color-text-muted)] max-w-2xl mx-auto">
          Understanding the Yartseva Quality Factor Model and how to use this screener effectively
        </p>
      </div>

      <FAQSection 
        title="Scoring System" 
        items={scoringFAQ}
        icon={
          <svg className="w-5 h-5 text-[var(--color-accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        }
      />
      
      <FAQSection 
        title="Research Insights" 
        items={insightsFAQ}
        icon={
          <svg className="w-5 h-5 text-[var(--color-accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        }
      />
      
      <FAQSection 
        title="Technical Details" 
        items={technicalFAQ}
        icon={
          <svg className="w-5 h-5 text-[var(--color-accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      {/* Disclaimer */}
      <div className="mt-10 p-6 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h4 className="font-semibold text-amber-400 mb-2">Investment Disclaimer</h4>
            <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
              This tool is for educational and research purposes only. Past performance does not guarantee future results.
              The Yartseva methodology identifies characteristics common to historical multibaggers but cannot predict
              future stock performance. Always conduct your own due diligence and consider consulting a financial advisor
              before making investment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import type { StockScreenResult, FactorScore } from '../types';
import { ScoreGauge } from './ScoreGauge';

interface ScoreCardProps {
  data: StockScreenResult;
}

interface FactorRowProps {
  label: string;
  factor: FactorScore;
  badge?: 'important' | 'contrarian' | 'unique';
  index: number;
}

const FactorRow = ({ label, factor, badge, index }: FactorRowProps) => {
  const percentage = (factor.score / factor.maxScore) * 100;

  const getBarGradient = () => {
    if (percentage >= 75) return 'from-emerald-500 to-emerald-400';
    if (percentage >= 50) return 'from-amber-500 to-amber-400';
    if (percentage >= 25) return 'from-orange-500 to-orange-400';
    return 'from-red-500 to-red-400';
  };

  const getTextColor = () => {
    if (percentage >= 75) return 'text-emerald-400';
    if (percentage >= 50) return 'text-amber-400';
    if (percentage >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getBadgeClass = () => {
    switch (badge) {
      case 'important':
        return 'badge badge-primary';
      case 'contrarian':
        return 'badge badge-purple';
      case 'unique':
        return 'badge badge-warning';
      default:
        return '';
    }
  };

  const getBadgeText = () => {
    switch (badge) {
      case 'important':
        return 'KEY FACTOR';
      case 'contrarian':
        return 'CONTRARIAN';
      case 'unique':
        return 'UNIQUE';
      default:
        return '';
    }
  };

  return (
    <div 
      className="group py-4 px-4 -mx-4 rounded-lg hover:bg-[var(--color-bg-tertiary)]/50 transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-[var(--color-text-primary)]">{label}</span>
          {badge && <span className={getBadgeClass()}>{getBadgeText()}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--color-text-muted)] font-mono">{factor.value}</span>
          <span className={`font-bold ${getTextColor()} font-mono`}>
            {factor.score.toFixed(1)}/{factor.maxScore}
          </span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-1.5 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden mb-2">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getBarGradient()} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      
      {/* Rationale */}
      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed group-hover:text-[var(--color-text-secondary)] transition-colors">
        {factor.rationale}
      </p>
    </div>
  );
};

export const ScoreCard = ({ data }: ScoreCardProps) => {
  const getClassificationStyle = () => {
    switch (data.classification) {
      case 'STRONG BUY':
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/30',
          text: 'text-emerald-400',
          glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]'
        };
      case 'MODERATE BUY':
        return {
          bg: 'bg-amber-500/10',
          border: 'border-amber-500/30',
          text: 'text-amber-400',
          glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]'
        };
      case 'WEAK BUY':
        return {
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/30',
          text: 'text-orange-400',
          glow: 'shadow-[0_0_20px_rgba(249,115,22,0.3)]'
        };
      case 'AVOID':
        return {
          bg: 'bg-red-500/10',
          border: 'border-red-500/30',
          text: 'text-red-400',
          glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]'
        };
      default:
        return {
          bg: 'bg-slate-500/10',
          border: 'border-slate-500/30',
          text: 'text-slate-400',
          glow: ''
        };
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const classStyle = getClassificationStyle();

  return (
    <div className="premium-card rounded-2xl overflow-hidden animate-fade-in">
      {/* Header Section */}
      <div className="p-6 border-b border-[var(--color-border)]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          {/* Stock Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">{data.ticker}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${classStyle.bg} ${classStyle.border} ${classStyle.text} ${classStyle.glow}`}>
                {data.classification}
              </span>
            </div>
            <p className="text-lg text-[var(--color-text-secondary)] mb-1">{data.name}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{data.sector} • {data.industry}</p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="stat-card">
                <p className="stat-label">Price</p>
                <p className="stat-value">${data.price.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">Market Cap</p>
                <p className="stat-value">{formatNumber(data.marketCap)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">52W High</p>
                <p className="stat-value text-emerald-400">${data.high52w.toFixed(2)}</p>
              </div>
              <div className="stat-card">
                <p className="stat-label">52W Low</p>
                <p className="stat-value text-red-400">${data.low52w.toFixed(2)}</p>
              </div>
            </div>
          </div>
          
          {/* Score Gauge */}
          <div className="flex flex-col items-center gap-3">
            <ScoreGauge score={data.totalScore} maxScore={data.maxScore} size="lg" />
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">Yartseva Score</p>
              <p className="text-xs text-[var(--color-text-muted)]">{data.percentage.toFixed(1)}% of maximum</p>
            </div>
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            Factor Analysis
          </h3>
          <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] px-3 py-1 rounded-full">
            Based on 464 multibaggers (2009-2024)
          </span>
        </div>
        
        <div className="divide-y divide-[var(--color-border)]">
          <FactorRow
            label="1. Free Cash Flow Yield"
            factor={data.factors.fcfYield}
            badge="important"
            index={0}
          />
          <FactorRow
            label="2. Size (Market Cap)"
            factor={data.factors.size}
            index={1}
          />
          <FactorRow
            label="3. Book-to-Market"
            factor={data.factors.bookToMarket}
            index={2}
          />
          <FactorRow
            label="4. Investment Pattern"
            factor={data.factors.investmentPattern}
            badge="unique"
            index={3}
          />
          <FactorRow
            label="5. EBITDA Margin"
            factor={data.factors.ebitdaMargin}
            index={4}
          />
          <FactorRow
            label="6. Return on Assets"
            factor={data.factors.roa}
            index={5}
          />
          <FactorRow
            label="7. Price Range (Entry)"
            factor={data.factors.priceRange}
            badge="contrarian"
            index={6}
          />
          <FactorRow
            label="8. 6-Month Momentum"
            factor={data.factors.momentum}
            badge="contrarian"
            index={7}
          />
          <FactorRow
            label="9. Dividend"
            factor={data.factors.dividend}
            index={8}
          />
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mx-6 mb-6 p-4 rounded-xl bg-gradient-to-r from-[var(--color-accent-secondary)]/10 to-[var(--color-accent-primary)]/10 border border-[var(--color-accent-secondary)]/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--color-accent-secondary)]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-[var(--color-accent-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-1">Yartseva Methodology (2025)</p>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              FCF Yield is the strongest predictor. Price Range and Momentum are <em>contrarian</em> — buying near 52-week lows with negative momentum historically outperformed. Investment Pattern (EBITDA growth &gt; Asset growth) indicates sustainable, efficient capital deployment. 78% of multibaggers paid dividends.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-3 bg-[var(--color-bg-tertiary)] border-t border-[var(--color-border)] flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-muted)]">
          Data source: {data.dataSource}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">
          Updated: {new Date(data.timestamp).toLocaleString()}
        </span>
      </div>
    </div>
  );
};

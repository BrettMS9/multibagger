import React, { useState } from 'react';
import { useBulkScreen } from '../hooks/useStockScreen';
import type { Sector, BulkScreenResult, FactorScore } from '../types';
import { SECTOR_LABELS } from '../types';

const SECTORS: Sector[] = ['all', 'technology', 'healthcare', 'energy', 'consumer', 'industrial', 'financial'];

const SECTOR_ICONS: Record<Sector, React.ReactElement> = {
  all: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  technology: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
  healthcare: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />,
  energy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  consumer: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />,
  industrial: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  financial: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

// Factor row component for detail modal
const FactorRow = ({
  label,
  factor,
  badge
}: {
  label: string;
  factor: FactorScore;
  badge?: 'important' | 'contrarian' | 'unique';
}) => {
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
      case 'important': return 'badge badge-primary';
      case 'contrarian': return 'badge badge-purple';
      case 'unique': return 'badge badge-warning';
      default: return '';
    }
  };

  return (
    <div className="py-2.5">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-[var(--color-text-primary)] text-sm">{label}</span>
          {badge && <span className={`${getBadgeClass()} text-[10px]`}>{badge.toUpperCase()}</span>}
        </div>
        <span className={`font-bold text-sm ${getTextColor()} font-mono`}>
          {factor.score.toFixed(1)}/{factor.maxScore}
        </span>
      </div>
      <div className="relative h-1 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden mb-1">
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getBarGradient()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">{factor.value}</p>
    </div>
  );
};

// Detail modal component
const StockDetailModal = ({
  stock,
  onClose
}: {
  stock: BulkScreenResult;
  onClose: () => void;
}) => {
  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  const getClassificationStyle = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY':
        return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' };
      case 'MODERATE BUY':
        return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400' };
      case 'WEAK BUY':
        return { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400' };
      case 'AVOID':
        return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' };
      default:
        return { bg: 'bg-slate-500/10', border: 'border-slate-500/30', text: 'text-slate-400' };
    }
  };

  const style = getClassificationStyle(stock.classification);

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="premium-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] px-6 py-4 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{stock.ticker}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${style.bg} ${style.border} ${style.text}`}>
                {stock.classification}
              </span>
            </div>
            <p className="text-[var(--color-text-secondary)] text-sm mt-1">{stock.name}</p>
            {stock.sector && (
              <p className="text-[var(--color-text-muted)] text-xs mt-0.5">
                {stock.sector}{stock.industry ? ` • ${stock.industry}` : ''}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-2 hover:bg-[var(--color-bg-secondary)] rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Score summary */}
        <div className="px-6 py-4 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                {stock.totalScore.toFixed(1)} 
                <span className="text-lg font-normal text-[var(--color-text-muted)]">/ 110</span>
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">{stock.percentage.toFixed(1)}% Yartseva Score</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-sm">
                <span className="text-[var(--color-text-muted)]">Price:</span>{' '}
                <span className="font-semibold text-[var(--color-text-primary)]">${stock.price.toFixed(2)}</span>
              </p>
              <p className="text-sm">
                <span className="text-[var(--color-text-muted)]">Mkt Cap:</span>{' '}
                <span className="font-semibold text-[var(--color-text-primary)]">{formatNumber(stock.marketCap)}</span>
              </p>
              {stock.high52w && stock.low52w && (
                <p className="text-sm">
                  <span className="text-[var(--color-text-muted)]">52W:</span>{' '}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    ${stock.low52w.toFixed(2)} - ${stock.high52w.toFixed(2)}
                  </span>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Factor Breakdown</h3>

          {stock.factors ? (
            <div className="space-y-1 divide-y divide-[var(--color-border)]">
              <FactorRow label="1. FCF Yield" factor={stock.factors.fcfYield} badge="important" />
              <FactorRow label="2. Size (Market Cap)" factor={stock.factors.size} />
              <FactorRow label="3. Book-to-Market" factor={stock.factors.bookToMarket} />
              <FactorRow label="4. Investment Pattern" factor={stock.factors.investmentPattern} badge="unique" />
              <FactorRow label="5. EBITDA Margin" factor={stock.factors.ebitdaMargin} />
              <FactorRow label="6. ROA" factor={stock.factors.roa} />
              <FactorRow label="7. Price Range" factor={stock.factors.priceRange} badge="contrarian" />
              <FactorRow label="8. 6-Mo Momentum" factor={stock.factors.momentum} badge="contrarian" />
              <FactorRow label="9. Dividend" factor={stock.factors.dividend} />
            </div>
          ) : (
            <p className="text-[var(--color-text-muted)] text-sm italic">Factor details not available.</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gradient-to-r from-[var(--color-accent-secondary)]/10 to-[var(--color-accent-primary)]/10 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
          Based on Yartseva (2025) methodology • 464 multibagger stocks (10x+ returns, 2009-2024)
        </div>
      </div>
    </div>
  );
};

export const BulkScreener = () => {
  const [selectedSector, setSelectedSector] = useState<Sector>('all');
  const [isScreening, setIsScreening] = useState(false);
  const [selectedStock, setSelectedStock] = useState<BulkScreenResult | null>(null);

  const { data, isLoading, error, refetch } = useBulkScreen(selectedSector, isScreening);

  const handleScreen = () => {
    setIsScreening(true);
    refetch();
  };

  const getClassificationStyle = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY':
        return { bg: 'bg-emerald-500/10', text: 'text-emerald-400' };
      case 'MODERATE BUY':
        return { bg: 'bg-amber-500/10', text: 'text-amber-400' };
      case 'WEAK BUY':
        return { bg: 'bg-orange-500/10', text: 'text-orange-400' };
      case 'AVOID':
        return { bg: 'bg-red-500/10', text: 'text-red-400' };
      default:
        return { bg: 'bg-slate-500/10', text: 'text-slate-400' };
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="w-full space-y-6">
      {/* Russell 2000 Header */}
      <div className="premium-card rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-accent-primary)]/10 via-transparent to-[var(--color-accent-secondary)]/10" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Russell 2000 Screener</h2>
              <p className="text-[var(--color-text-muted)] text-sm">
                Small-cap universe optimized for multibagger discovery
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sector Selection */}
      <div className="premium-card rounded-2xl p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Select Sector</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 ${
                selectedSector === sector
                  ? 'bg-[var(--color-accent-primary)]/10 border-[var(--color-accent-primary)]/50 text-[var(--color-accent-primary)]'
                  : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-border-light)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {SECTOR_ICONS[sector]}
              </svg>
              <span className="text-xs font-medium text-center">{SECTOR_LABELS[sector]}</span>
            </button>
          ))}
        </div>
        <button
          onClick={handleScreen}
          disabled={isLoading}
          className="w-full btn-premium rounded-xl flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Screening...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Screen {SECTOR_LABELS[selectedSector]}</span>
            </>
          )}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="premium-card rounded-2xl p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-accent-primary)]/10 mb-4">
            <svg className="animate-spin h-8 w-8 text-[var(--color-accent-primary)]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <p className="text-[var(--color-text-primary)] font-medium">Analyzing {SECTOR_LABELS[selectedSector]} stocks...</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">Pre-screening candidates, then running full analysis</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="premium-card rounded-2xl p-6 border-red-500/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-red-400">Error</p>
              <p className="text-[var(--color-text-muted)] text-sm mt-1">{(error as Error).message}</p>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Screening Stats */}
      {data && data.stats && data.stats.preScreened > 0 && (
        <div className="premium-card rounded-2xl p-6 border-[var(--color-accent-secondary)]/30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-[var(--color-accent-secondary)] animate-pulse" />
            <span className="text-[var(--color-accent-secondary)] font-semibold">Pre-Screening Complete</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="stat-card">
              <p className="stat-label">Universe</p>
              <p className="stat-value">{data.stats.totalSymbols}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Pre-Screened</p>
              <p className="stat-value text-[var(--color-accent-secondary)]">{data.stats.preScreened}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Full Analysis</p>
              <p className="stat-value text-[var(--color-accent-primary)]">{data.stats.screened}</p>
            </div>
            <div className="stat-card">
              <p className="stat-label">Cached</p>
              <p className="stat-value">{data.stats.cachedSymbols}</p>
            </div>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] mt-4">
            Tier 1 filters by contrarian signals (near 52-week lows + negative momentum). Tier 2 runs full Yartseva analysis.
          </p>
        </div>
      )}

      {/* Results Table */}
      {data && data.results && data.results.length > 0 && (
        <div className="premium-card rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-[var(--color-bg-tertiary)] border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                {SECTOR_LABELS[selectedSector]} Results
                <span className="text-[var(--color-text-muted)] font-normal ml-2">({data.results.length} stocks)</span>
              </h2>
              <p className="text-sm text-[var(--color-text-muted)]">Click row for details</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Ticker</th>
                  <th>Name</th>
                  <th className="text-right">Score</th>
                  <th className="text-right">%</th>
                  <th className="text-center">Signal</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Market Cap</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((stock, index) => {
                  const style = getClassificationStyle(stock.classification);
                  return (
                    <tr
                      key={stock.ticker}
                      className="cursor-pointer"
                      onClick={() => setSelectedStock(stock)}
                    >
                      <td className="font-bold text-[var(--color-text-muted)]">#{index + 1}</td>
                      <td className="font-semibold text-[var(--color-accent-primary)]">{stock.ticker}</td>
                      <td className="text-[var(--color-text-primary)]">{stock.name}</td>
                      <td className="text-right font-bold font-mono text-[var(--color-text-primary)]">
                        {stock.totalScore.toFixed(1)}
                      </td>
                      <td className="text-right font-mono text-[var(--color-text-secondary)]">
                        {stock.percentage.toFixed(1)}%
                      </td>
                      <td className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
                          {stock.classification}
                        </span>
                      </td>
                      <td className="text-right font-mono text-[var(--color-text-primary)]">
                        ${stock.price.toFixed(2)}
                      </td>
                      <td className="text-right font-mono text-[var(--color-text-secondary)]">
                        {formatNumber(stock.marketCap)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && data.results && data.results.length === 0 && (
        <div className="premium-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-[var(--color-bg-secondary)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--color-text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <p className="text-[var(--color-text-primary)] font-medium">No new results found</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            {data.stats?.cachedSymbols && data.stats.cachedSymbols > 0
              ? `${data.stats.cachedSymbols} stocks already cached. Try a different sector.`
              : 'Try a different sector.'}
          </p>
        </div>
      )}

      {/* Stock Detail Modal */}
      {selectedStock && (
        <StockDetailModal
          stock={selectedStock}
          onClose={() => setSelectedStock(null)}
        />
      )}
    </div>
  );
};

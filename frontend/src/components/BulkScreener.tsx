import { useState } from 'react';
import { useBulkScreen } from '../hooks/useStockScreen';
import type { Sector, BulkScreenResult, FactorScore } from '../types';
import { SECTOR_LABELS } from '../types';

const SECTORS: Sector[] = ['all', 'technology', 'healthcare', 'energy', 'consumer', 'industrial', 'financial'];

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

  const getBarColor = () => {
    if (percentage >= 75) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (percentage >= 75) return 'text-green-700';
    if (percentage >= 50) return 'text-yellow-700';
    if (percentage >= 25) return 'text-orange-700';
    return 'text-red-700';
  };

  return (
    <div className="py-2 border-b border-slate-100 last:border-b-0">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-slate-800 text-sm">{label}</span>
          {badge === 'important' && (
            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
              KEY
            </span>
          )}
          {badge === 'contrarian' && (
            <span className="text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded">
              CONTRARIAN
            </span>
          )}
          {badge === 'unique' && (
            <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
              UNIQUE
            </span>
          )}
        </div>
        <span className={`font-bold text-sm ${getTextColor()}`}>
          {factor.score.toFixed(1)}/{factor.maxScore}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-1">
        <div
          className={`h-1.5 rounded-full ${getBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{factor.value}</p>
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

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY': return 'bg-green-100 text-green-800 border-green-300';
      case 'MODERATE BUY': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'WEAK BUY': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'AVOID': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-900">{stock.ticker}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getClassificationColor(stock.classification)}`}>
                {stock.classification}
              </span>
            </div>
            <p className="text-slate-600 text-sm mt-1">{stock.name}</p>
            {stock.sector && (
              <p className="text-slate-500 text-xs mt-0.5">{stock.sector}{stock.industry ? ` - ${stock.industry}` : ''}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Score summary */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-slate-900">{stock.totalScore.toFixed(1)} <span className="text-lg font-normal text-slate-500">/ 110</span></p>
              <p className="text-sm text-slate-600">{stock.percentage.toFixed(1)}% Yartseva Score</p>
            </div>
            <div className="text-right text-sm">
              <p><span className="text-slate-500">Price:</span> <span className="font-semibold">${stock.price.toFixed(2)}</span></p>
              <p><span className="text-slate-500">Mkt Cap:</span> <span className="font-semibold">{formatNumber(stock.marketCap)}</span></p>
              {stock.high52w && stock.low52w && (
                <p><span className="text-slate-500">52W:</span> <span className="font-semibold">${stock.low52w.toFixed(2)} - ${stock.high52w.toFixed(2)}</span></p>
              )}
            </div>
          </div>
        </div>

        {/* Factor breakdown */}
        <div className="px-6 py-4">
          <h3 className="font-semibold text-slate-900 mb-3">Yartseva Factor Breakdown</h3>

          {stock.factors ? (
            <div className="space-y-1">
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
            <p className="text-slate-500 text-sm italic">Factor details not available for this stock.</p>
          )}
        </div>

        {/* Footer note */}
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100 text-xs text-blue-800">
          Based on Yartseva (2025) methodology analyzing 464 multibagger stocks (10x+ returns, 2009-2024)
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

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY':
        return 'bg-green-100 text-green-800';
      case 'MODERATE BUY':
        return 'bg-yellow-100 text-yellow-800';
      case 'WEAK BUY':
        return 'bg-orange-100 text-orange-800';
      case 'AVOID':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="w-full">
      {/* Russell 2000 Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">📈</span>
          <h2 className="text-2xl font-bold">Russell 2000 Screener</h2>
        </div>
        <p className="text-blue-100 text-sm">
          Small-cap stocks optimized for Yartseva multibagger methodology (644 stocks)
        </p>
      </div>

      {/* Sector Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Select Sector</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {SECTORS.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                selectedSector === sector
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {SECTOR_LABELS[sector]}
            </button>
          ))}
        </div>
        <button
          onClick={handleScreen}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Screening...' : `Screen ${SECTOR_LABELS[selectedSector]}`}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mb-4"></div>
          <p className="text-slate-600">Analyzing {SECTOR_LABELS[selectedSector]} stocks...</p>
          <p className="text-sm text-slate-500 mt-2">Pre-screening candidates, then running full analysis...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-700 mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Pre-Screening Stats */}
      {data && data.stats && data.stats.preScreened > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold">Pre-Screening Complete</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">2-TIER FILTER</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Universe</p>
              <p className="font-semibold text-slate-900">{data.stats.totalSymbols} stocks</p>
            </div>
            <div>
              <p className="text-slate-500">Pre-Screened (Yahoo)</p>
              <p className="font-semibold text-slate-900">{data.stats.preScreened} passed filter</p>
            </div>
            <div>
              <p className="text-slate-500">Full Analysis (Gemini)</p>
              <p className="font-semibold text-slate-900">{data.stats.screened} stocks</p>
            </div>
            <div>
              <p className="text-slate-500">Already Cached</p>
              <p className="font-semibold text-slate-900">{data.stats.cachedSymbols} stocks</p>
            </div>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Tier 1 filters by contrarian signals (near 52-week lows + negative momentum). Tier 2 runs full Yartseva analysis.
          </p>
        </div>
      )}

      {/* Results Table */}
      {data && data.results && data.results.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-100 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {SECTOR_LABELS[selectedSector]} Results ({data.results.length} stocks)
              </h2>
              <p className="text-sm text-slate-500">Click any row for score breakdown</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b-2 border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Classification
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Market Cap
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {data.results.map((stock, index) => (
                  <tr
                    key={stock.ticker}
                    className="hover:bg-blue-50 transition-colors cursor-pointer group"
                    onClick={() => setSelectedStock(stock)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600 group-hover:underline">
                      {stock.ticker}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{stock.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-slate-900">
                      {stock.totalScore.toFixed(1)} / 110
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-700">
                      {stock.percentage.toFixed(1)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${getClassificationColor(
                          stock.classification
                        )}`}
                      >
                        {stock.classification}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      ${stock.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-900">
                      {formatNumber(stock.marketCap)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {data && data.results && data.results.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-slate-600">No new results found for {SECTOR_LABELS[selectedSector]}</p>
          <p className="text-sm text-slate-500 mt-2">
            {data.stats.cachedSymbols > 0
              ? `${data.stats.cachedSymbols} stocks already cached. Try a different sector or wait for cache to expire.`
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

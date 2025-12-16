import type { StockScreenResult, FactorScore } from '../types';
import { ScoreGauge } from './ScoreGauge';

interface ScoreCardProps {
  data: StockScreenResult;
}

interface FactorRowProps {
  label: string;
  factor: FactorScore;
  isImportant?: boolean;
  isContrarian?: boolean;
  isUnique?: boolean;
}

const FactorRow = ({ label, factor, isImportant, isContrarian, isUnique }: FactorRowProps) => {
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
    <div className="py-3 border-b border-slate-200 last:border-b-0">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-slate-900">{label}</span>
          {isImportant && (
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
              MOST IMPORTANT
            </span>
          )}
          {isContrarian && (
            <span className="text-xs font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
              CONTRARIAN
            </span>
          )}
          {isUnique && (
            <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
              UNIQUE FINDING
            </span>
          )}
          <span className="text-sm text-slate-500">({factor.value})</span>
        </div>
        <span className={`font-bold ${getTextColor()} whitespace-nowrap`}>
          {factor.score.toFixed(1)} / {factor.maxScore}
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getBarColor()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{factor.rationale}</p>
    </div>
  );
};

export const ScoreCard = ({ data }: ScoreCardProps) => {
  const getClassificationColor = () => {
    switch (data.classification) {
      case 'STRONG BUY':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'MODERATE BUY':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'WEAK BUY':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'AVOID':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-6 border-b-2 border-slate-200">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1">{data.ticker}</h2>
          <p className="text-slate-600 mb-1">{data.name}</p>
          <p className="text-sm text-slate-500 mb-3">{data.sector} - {data.industry}</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-slate-500">Price: </span>
              <span className="font-semibold text-slate-900">${data.price.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-slate-500">Market Cap: </span>
              <span className="font-semibold text-slate-900">{formatNumber(data.marketCap)}</span>
            </div>
            <div>
              <span className="text-slate-500">52W Range: </span>
              <span className="font-semibold text-slate-900">
                ${data.low52w.toFixed(2)} - ${data.high52w.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center gap-3">
          <ScoreGauge score={data.totalScore} maxScore={data.maxScore} size="lg" />
          <div className="text-center">
            <span
              className={`px-4 py-2 rounded-lg font-bold text-sm border-2 ${getClassificationColor()}`}
            >
              {data.classification}
            </span>
            <p className="text-xs text-slate-500 mt-2">{data.percentage.toFixed(1)}% score</p>
          </div>
        </div>
      </div>

      {/* Factor Breakdown */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Yartseva Factor Breakdown
          <span className="text-sm font-normal text-slate-500 ml-2">
            (Based on 464 multibagger stocks, 2009-2024)
          </span>
        </h3>
        <div className="space-y-1">
          <FactorRow
            label="1. Free Cash Flow Yield"
            factor={data.factors.fcfYield}
            isImportant={true}
          />
          <FactorRow
            label="2. Size (Market Cap)"
            factor={data.factors.size}
          />
          <FactorRow
            label="3. Book-to-Market"
            factor={data.factors.bookToMarket}
          />
          <FactorRow
            label="4. Investment Pattern"
            factor={data.factors.investmentPattern}
            isUnique={true}
          />
          <FactorRow
            label="5. EBITDA Margin"
            factor={data.factors.ebitdaMargin}
          />
          <FactorRow
            label="6. Return on Assets (ROA)"
            factor={data.factors.roa}
          />
          <FactorRow
            label="7. Price Range (Entry Point)"
            factor={data.factors.priceRange}
            isContrarian={true}
          />
          <FactorRow
            label="8. 6-Month Momentum"
            factor={data.factors.momentum}
            isContrarian={true}
          />
          <FactorRow
            label="9. Dividend"
            factor={data.factors.dividend}
          />
        </div>
      </div>

      {/* Methodology Note */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-900 leading-relaxed">
          <strong>Yartseva Methodology (2025):</strong> Based on empirical analysis of 464 stocks
          achieving 10x+ returns from 2009-2024. Key findings: FCF Yield is the strongest predictor.
          Price Range and Momentum are <em>contrarian</em> - buying near 52-week lows with negative
          momentum historically outperformed. Investment Pattern (EBITDA growth &gt; Asset growth)
          is a unique finding indicating sustainable, efficient capital deployment. 78% of
          multibaggers paid dividends.
        </p>
      </div>

      {/* Data source indicator */}
      <div className="mt-4 text-xs text-slate-400 text-right">
        Data source: {data.dataSource} | Updated: {new Date(data.timestamp).toLocaleString()}
      </div>
    </div>
  );
};

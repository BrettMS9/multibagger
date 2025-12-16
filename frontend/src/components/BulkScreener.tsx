import { useState } from 'react';
import { useBulkScreen } from '../hooks/useStockScreen';
import type { Exchange } from '../types';

export const BulkScreener = () => {
  const [selectedExchange, setSelectedExchange] = useState<Exchange>('NYSE');
  const [isScreening, setIsScreening] = useState(false);

  const { data, isLoading, error, refetch } = useBulkScreen(selectedExchange, isScreening);

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
      {/* Exchange Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Select Exchange</h2>
        <div className="flex gap-3 mb-4">
          {(['NYSE', 'NASDAQ'] as Exchange[]).map((exchange) => (
            <button
              key={exchange}
              onClick={() => setSelectedExchange(exchange)}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                selectedExchange === exchange
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {exchange}
            </button>
          ))}
        </div>
        <button
          onClick={handleScreen}
          disabled={isLoading}
          className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Screening...' : `Screen All ${selectedExchange} Stocks`}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mb-4"></div>
          <p className="text-slate-600">Analyzing stocks on {selectedExchange}...</p>
          <p className="text-sm text-slate-500 mt-2">This may take a few minutes</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <p className="text-red-800 font-semibold">Error:</p>
          <p className="text-red-700 mt-1">{(error as Error).message}</p>
        </div>
      )}

      {/* Results Table */}
      {data && data.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-slate-100 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">
              Screening Results - {selectedExchange} ({data.length} stocks)
            </h2>
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
                {data.map((stock, index) => (
                  <tr key={stock.ticker} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900">
                      #{index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">
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
      {data && data.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-12 text-center">
          <p className="text-slate-600">No results found for {selectedExchange}</p>
        </div>
      )}
    </div>
  );
};

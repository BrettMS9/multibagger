import { useState } from 'react';

interface TickerSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export const TickerSearch = ({ onSearch, isLoading = false }: TickerSearchProps) => {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSearch(ticker.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex gap-3">
        <div className="flex-1">
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase())}
            placeholder="Enter ticker symbol (e.g., AAPL, RELIANCE.NS)"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !ticker.trim()}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Analyzing...' : 'Analyze'}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-600">
        For Indian stocks, use .NS (NSE) or .BO (BSE) suffix. Example: RELIANCE.NS
      </p>
    </form>
  );
};

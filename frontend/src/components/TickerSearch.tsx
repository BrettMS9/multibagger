import { useState } from 'react';

interface TickerSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export const TickerSearch = ({ onSearch, isLoading = false }: TickerSearchProps) => {
  const [ticker, setTicker] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSearch(ticker.trim().toUpperCase());
    }
  };

  const popularTickers = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN'];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className={`relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
          {/* Glow effect when focused */}
          {isFocused && (
            <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-2xl blur-lg opacity-20" />
          )}
          
          <div className="relative flex gap-3 p-2 rounded-xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl">
            {/* Search Icon */}
            <div className="flex items-center pl-4">
              <svg 
                className={`w-5 h-5 transition-colors duration-300 ${isFocused ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)]'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            
            {/* Input */}
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Enter ticker symbol..."
              className="flex-1 bg-transparent text-lg font-medium text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none py-3"
              disabled={isLoading}
            />
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !ticker.trim()}
              className="btn-premium flex items-center gap-2 rounded-lg disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Analyzing</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
      
      {/* Quick Access Tickers */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs text-[var(--color-text-muted)] mr-2">Quick access:</span>
        {popularTickers.map((t) => (
          <button
            key={t}
            onClick={() => {
              setTicker(t);
              onSearch(t);
            }}
            disabled={isLoading}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent-primary)] hover:text-[var(--color-accent-primary)] transition-all duration-200 disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
      
      {/* Help text */}
      <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
        For Indian stocks, use .NS (NSE) or .BO (BSE) suffix • Example: RELIANCE.NS
      </p>
    </div>
  );
};

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Header } from './components/Header';
import { TickerSearch } from './components/TickerSearch';
import { ScoreCard } from './components/ScoreCard';
import { BulkScreener } from './components/BulkScreener';
import { FAQ } from './components/FAQ';
import { useStockScreen } from './hooks/useStockScreen';

const queryClient = new QueryClient();

type Tab = 'single' | 'bulk' | 'faq';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const [searchTicker, setSearchTicker] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, isLoading, error } = useStockScreen(searchTicker, shouldFetch);

  const handleSearch = (ticker: string) => {
    setSearchTicker(ticker);
    setShouldFetch(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-6">
        <div className="flex gap-2 border-b-2 border-slate-200">
          <button
            onClick={() => setActiveTab('single')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'single'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Single Stock Analysis
            {activeTab === 'single' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'bulk'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Bulk Screener
            {activeTab === 'bulk' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`px-6 py-3 font-semibold transition-colors relative ${
              activeTab === 'faq'
                ? 'text-blue-600'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            How It Works
            {activeTab === 'faq' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'single' && (
          <div>
            <div className="mb-8">
              <TickerSearch onSearch={handleSearch} isLoading={isLoading} />
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-slate-300 border-t-blue-600 mb-4"></div>
                <p className="text-slate-600">Analyzing {searchTicker}...</p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
                <p className="text-red-800 font-semibold">Error:</p>
                <p className="text-red-700 mt-1">{(error as Error).message}</p>
              </div>
            )}

            {/* Results */}
            {data && !isLoading && <ScoreCard data={data} />}

            {/* Empty State */}
            {!data && !isLoading && !error && (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-slate-400 mb-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Enter a ticker to analyze
                </h3>
                <p className="text-slate-600">
                  Search for any stock to see its Yartseva Quality Factor score and detailed breakdown
                </p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'bulk' && <BulkScreener />}
        {activeTab === 'faq' && <FAQ />}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;

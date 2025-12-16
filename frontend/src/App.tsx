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

const TabIcon = ({ tab, isActive }: { tab: Tab; isActive: boolean }) => {
  const iconClass = `w-5 h-5 transition-colors duration-300 ${isActive ? 'text-[var(--color-accent-primary)]' : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]'}`;
  
  switch (tab) {
    case 'single':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case 'bulk':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case 'faq':
      return (
        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('single');
  const [searchTicker, setSearchTicker] = useState('');
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, isLoading, error } = useStockScreen(searchTicker, shouldFetch);

  const handleSearch = (ticker: string) => {
    setSearchTicker(ticker);
    setShouldFetch(true);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'single', label: 'Single Stock' },
    { id: 'bulk', label: 'Bulk Screener' },
    { id: 'faq', label: 'How It Works' },
  ];

  return (
    <div className="min-h-screen">
      <Header />

      {/* Navigation Tabs */}
      <div className="sticky top-0 z-40 bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group flex items-center gap-2 px-5 py-4 font-medium transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'text-[var(--color-accent-primary)]'
                    : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
                }`}
              >
                <TabIcon tab={tab.id} isActive={activeTab === tab.id} />
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'single' && (
          <div className="space-y-8 animate-fade-in">
            {/* Search Section */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
                Analyze Any Stock
              </h2>
              <p className="text-[var(--color-text-muted)]">
                Enter a ticker symbol to get the Yartseva Quality Factor score
              </p>
            </div>
            
            <TickerSearch onSearch={handleSearch} isLoading={isLoading} />

            {/* Loading State */}
            {isLoading && (
              <div className="premium-card rounded-2xl p-12 text-center animate-fade-in">
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-[var(--color-bg-tertiary)]" />
                  {/* Spinning ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent-primary)] animate-spin" />
                  {/* Inner content */}
                  <svg className="w-8 h-8 text-[var(--color-accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <p className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                  Analyzing {searchTicker}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  Fetching data and calculating Yartseva factors...
                </p>
              </div>
            )}

            {/* Error State */}
            {error && !isLoading && (
              <div className="premium-card rounded-2xl p-6 border-red-500/30 animate-fade-in">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-red-400 text-lg">Analysis Failed</p>
                    <p className="text-[var(--color-text-muted)] mt-1">{(error as Error).message}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results */}
            {data && !isLoading && <ScoreCard data={data} />}

            {/* Empty State */}
            {!data && !isLoading && !error && (
              <div className="premium-card rounded-2xl p-12 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--color-accent-primary)]/20 to-[var(--color-accent-secondary)]/20 flex items-center justify-center mx-auto mb-6">
                  <svg
                    className="w-10 h-10 text-[var(--color-accent-primary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Ready to Analyze
                </h3>
                <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
                  Enter a ticker symbol above to see its Yartseva Quality Factor score and detailed breakdown
                </p>
                
                {/* Feature highlights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8 text-left">
                  {[
                    { icon: '📊', title: '9 Factors', desc: 'Comprehensive analysis based on empirical research' },
                    { icon: '🎯', title: 'Clear Signals', desc: 'Strong Buy, Moderate Buy, Weak Buy, or Avoid' },
                    { icon: '📈', title: 'Proven Model', desc: 'Based on 464 stocks with 10x+ returns' },
                  ].map((feature) => (
                    <div key={feature.title} className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
                      <span className="text-2xl mb-2 block">{feature.icon}</span>
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">{feature.title}</h4>
                      <p className="text-xs text-[var(--color-text-muted)]">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'bulk' && (
          <div className="animate-fade-in">
            <BulkScreener />
          </div>
        )}
        
        {activeTab === 'faq' && (
          <div className="animate-fade-in">
            <FAQ />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] mt-12">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--color-accent-primary)] to-[var(--color-accent-secondary)] flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="font-semibold text-[var(--color-text-secondary)]">Multibagger Research</span>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] text-center md:text-right">
              Based on Yartseva (2025) "The Alchemy of Multibagger Stocks" • For educational purposes only
            </p>
          </div>
        </div>
      </footer>
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

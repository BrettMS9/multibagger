import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useStockScreen, useBulkScreen } from './hooks/useStockScreen';
import type { Sector, StockScreenResult, BulkScreenResult, YartsevaFactors } from './types';
import { SECTOR_LABELS } from './types';

const queryClient = new QueryClient();

const SECTORS: { id: Sector; name: string; icon: string }[] = [
  { id: 'all', name: 'All Sectors', icon: '◉' },
  { id: 'technology', name: 'Technology', icon: '⚡' },
  { id: 'healthcare', name: 'Healthcare', icon: '♥' },
  { id: 'energy', name: 'Energy', icon: '⛽' },
  { id: 'consumer', name: 'Consumer', icon: '🛒' },
  { id: 'industrial', name: 'Industrial', icon: '⚙' },
  { id: 'financial', name: 'Financial', icon: '$' },
];

type ViewMode = 'single' | 'screener' | 'methodology';

// Terminal Top Bar
const TerminalTopBar: React.FC<{
  activeView: ViewMode;
  setActiveView: (view: ViewMode) => void;
}> = ({ activeView, setActiveView }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="terminal-top-bar">
      <div className="terminal-logo">
        <div className="terminal-logo-icon">M</div>
        <div className="terminal-logo-text">
          <span>MULTI</span>BAGGER
        </div>
      </div>

      <div className="terminal-nav">
        <button
          className={`nav-btn ${activeView === 'single' ? 'active' : ''}`}
          onClick={() => setActiveView('single')}
        >
          Analysis
        </button>
        <button
          className={`nav-btn ${activeView === 'screener' ? 'active' : ''}`}
          onClick={() => setActiveView('screener')}
        >
          Screener
        </button>
        <button
          className={`nav-btn ${activeView === 'methodology' ? 'active' : ''}`}
          onClick={() => setActiveView('methodology')}
        >
          Methodology
        </button>
      </div>

      <div className="terminal-status">
        <div className="status-item">
          <span className="status-dot"></span>
          <span>LIVE</span>
        </div>
        <div className="status-item">
          <span>R2000</span>
        </div>
        <div className="status-time">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>
    </div>
  );
};

// Left Panel - Command Input (for single ticker analysis)
const LeftPanel: React.FC<{
  searchTicker: string;
  setSearchTicker: (ticker: string) => void;
  onSearch: () => void;
}> = ({ searchTicker, setSearchTicker, onSearch }) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') onSearch();
  };

  return (
    <div className="terminal-panel left-panel">
      <div className="panel-header">
        <span className="panel-title">Ticker Search</span>
      </div>

      <div className="command-input-container">
        <div className="command-input-wrapper">
          <span className="command-prefix">&gt;</span>
          <input
            type="text"
            className="command-input"
            placeholder="Enter ticker..."
            value={searchTicker}
            onChange={(e) => setSearchTicker(e.target.value.toUpperCase())}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button
          className="quick-action-btn"
          style={{ marginTop: '8px', width: '100%' }}
          onClick={onSearch}
        >
          Analyze
        </button>
      </div>

      <div className="methodology-note" style={{ margin: 'var(--space-md)' }}>
        <div className="methodology-title">How to Use</div>
        <div className="methodology-text">
          Enter any stock ticker symbol (e.g., AAPL, TSLA, HPK) and press Enter or click Analyze to
          evaluate its multibagger potential using the Yartseva Quality Factor Model.
        </div>
      </div>

      <div className="methodology-note" style={{ margin: 'var(--space-md)', marginTop: 0 }}>
        <div className="methodology-title">Data Sources</div>
        <div className="methodology-text">
          Financial data sourced from Yahoo Finance, SEC EDGAR filings, and Financial Modeling Prep API.
          Growth metrics calculated from official 10-K filings for maximum accuracy.
        </div>
      </div>
    </div>
  );
};

// Screener Left Panel - with Sector Selection
const ScreenerLeftPanel: React.FC<{
  selectedSector: Sector;
  setSelectedSector: (sector: Sector) => void;
}> = ({ selectedSector, setSelectedSector }) => {
  return (
    <div className="terminal-panel left-panel">
      <div className="panel-header">
        <span className="panel-title">Sectors</span>
        <span className="panel-subtitle">Russell 2000</span>
      </div>

      <div className="sector-list">
        {SECTORS.map((sector) => (
          <div
            key={sector.id}
            className={`sector-item ${selectedSector === sector.id ? 'active' : ''}`}
            onClick={() => setSelectedSector(sector.id)}
          >
            <div className="sector-info">
              <span className="sector-icon">{sector.icon}</span>
              <span className="sector-name">{sector.name}</span>
            </div>
            <span className="sector-count">
              {sector.id === 'all' ? '2000' : '~300'}
            </span>
          </div>
        ))}
      </div>

      <div className="methodology-note" style={{ margin: 'var(--space-md)' }}>
        <div className="methodology-title">Bulk Screening</div>
        <div className="methodology-text">
          Select a sector and click "Run Screen" to analyze the top candidates from the Russell 2000
          universe based on Yartseva factor scores.
        </div>
      </div>
    </div>
  );
};

// Score Circle Component
const ScoreCircle: React.FC<{ score: number; maxScore: number }> = ({ score, maxScore }) => {
  const percentage = (score / maxScore) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getScoreClass = () => {
    if (percentage >= 70) return 'strong';
    if (percentage >= 55) return 'moderate';
    if (percentage >= 40) return 'weak';
    return 'avoid';
  };

  return (
    <div className="score-circle-container">
      <svg className="score-circle" viewBox="0 0 100 100">
        <circle className="score-circle-bg" cx="50" cy="50" r="45" />
        <circle
          className={`score-circle-progress ${getScoreClass()}`}
          cx="50"
          cy="50"
          r="45"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      <div className="score-value">
        <div className={`score-number ${getScoreClass()}`}>{score}</div>
        <div className="score-max">/ {maxScore}</div>
      </div>
    </div>
  );
};

// Helper to convert factors to array for display
interface FactorDisplayItem {
  name: string;
  score: number;
  maxScore: number;
  value: string;
  rationale: string;
  tag?: string;
}

const factorsToArray = (factors: YartsevaFactors): FactorDisplayItem[] => [
  { name: 'FCF Yield', ...factors.fcfYield, tag: 'key' },
  { name: 'Size', ...factors.size },
  { name: 'Book/Market', ...factors.bookToMarket },
  { name: 'Investment Pattern', ...factors.investmentPattern, tag: 'unique' },
  { name: 'EBITDA Margin', ...factors.ebitdaMargin },
  { name: 'ROA', ...factors.roa },
  { name: 'Price Range', ...factors.priceRange, tag: 'contrarian' },
  { name: 'Momentum', ...factors.momentum, tag: 'contrarian' },
  { name: 'Dividend', ...factors.dividend },
];

// Center Panel - Analysis Display
const CenterPanel: React.FC<{
  data: StockScreenResult | undefined;
  isLoading: boolean;
  error: Error | null;
}> = ({ data, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="terminal-panel center-panel">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Analyzing...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="terminal-panel center-panel">
        <div className="empty-state">
          <div className="empty-state-title" style={{ color: 'var(--terminal-red)' }}>
            Analysis Failed
          </div>
          <div className="empty-state-text">{error.message}</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="terminal-panel center-panel">
        <div className="empty-state">
          <svg className="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <div className="empty-state-title">Ready for Analysis</div>
          <div className="empty-state-text">
            Enter a ticker symbol to analyze its multibagger potential using the Yartseva Quality Factor Model
          </div>
          <div className="empty-state-hint">
            Type ticker and press <code>Enter</code> or use quick access buttons
          </div>
        </div>
      </div>
    );
  }

  const getClassificationClass = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY': return 'strong';
      case 'MODERATE BUY': return 'moderate';
      case 'WEAK BUY': return 'weak';
      default: return 'avoid';
    }
  };

  const classClass = getClassificationClass(data.classification);
  const factorArray = factorsToArray(data.factors);

  const getBarClass = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 70) return 'high';
    if (pct >= 40) return 'medium';
    return 'low';
  };

  // Calculate price range position
  const priceRangePos = data.high52w && data.low52w && data.price
    ? ((data.price - data.low52w) / (data.high52w - data.low52w) * 100).toFixed(0)
    : 'N/A';

  return (
    <div className="terminal-panel center-panel">
      <div className="score-display">
        <div className="score-header">
          <div className="stock-info">
            <div className="stock-symbol-row">
              <span className="stock-symbol">{data.ticker}</span>
              <span className="stock-exchange">{data.exchange || 'NYSE'}</span>
            </div>
            <div className="stock-name">{data.name || 'Company Name'}</div>
            <div className="stock-meta">
              <span className="meta-item">
                Sector:<span className="meta-value">{data.sector || 'N/A'}</span>
              </span>
              <span className="meta-item">
                MCap:<span className="meta-value">${data.marketCap ? (data.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}</span>
              </span>
            </div>
            <div className={`classification-badge ${classClass}`}>
              ● {data.classification}
            </div>
          </div>
          <ScoreCircle score={data.totalScore} maxScore={data.maxScore} />
        </div>

        <div className="stats-grid">
          <div className="stat-cell">
            <div className="stat-label">Price</div>
            <div className="stat-value">${data.price?.toFixed(2) || 'N/A'}</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">52W Range</div>
            <div className="stat-value">{priceRangePos}%</div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">FCF Yield</div>
            <div className={`stat-value ${parseFloat(data.factors.fcfYield.value) > 0 ? 'positive' : ''}`}>
              {data.factors.fcfYield.value || 'N/A'}
            </div>
          </div>
          <div className="stat-cell">
            <div className="stat-label">6M Momentum</div>
            <div className={`stat-value ${parseFloat(data.factors.momentum.value) > 0 ? 'positive' : 'negative'}`}>
              {data.factors.momentum.value || 'N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="panel-header">
        <span className="panel-title">Factor Analysis</span>
        <span className="panel-subtitle">9 Yartseva Factors</span>
      </div>

      <div className="factor-table">
        <div className="factor-table-header">
          <span>Factor</span>
          <span style={{ textAlign: 'right' }}>Score</span>
          <span style={{ textAlign: 'right' }}>Max</span>
          <span>Progress</span>
        </div>

        {factorArray.map((factor, index) => (
          <div key={index} className="factor-row">
            <div className="factor-name">
              <span className="factor-name-text">{factor.name}</span>
              {factor.tag && <span className={`factor-tag ${factor.tag}`}>{factor.tag}</span>}
            </div>
            <div className="factor-score">{factor.score}</div>
            <div className="factor-max">{factor.maxScore}</div>
            <div className="factor-bar">
              <div
                className={`factor-bar-fill ${getBarClass(factor.score, factor.maxScore)}`}
                style={{ width: `${(factor.score / factor.maxScore) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Right Panel - Additional Info
const RightPanel: React.FC<{ data: StockScreenResult | undefined }> = ({ data }) => {
  return (
    <div className="terminal-panel right-panel">
      <div className="panel-header">
        <span className="panel-title">Details</span>
      </div>

      <div className="panel-content">
        {data ? (
          <>
            <div className="data-block">
              <div className="data-block-title">▸ Valuation</div>
              <div className="data-row">
                <span className="data-label">Market Cap</span>
                <span className="data-value">
                  ${data.marketCap ? (data.marketCap / 1e9).toFixed(2) + 'B' : 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Book/Market</span>
                <span className="data-value">
                  {data.factors.bookToMarket.value || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">FCF Yield</span>
                <span className="data-value">
                  {data.factors.fcfYield.value || 'N/A'}
                </span>
              </div>
            </div>

            <div className="data-block">
              <div className="data-block-title">▸ Profitability</div>
              <div className="data-row">
                <span className="data-label">EBITDA Margin</span>
                <span className="data-value">
                  {data.factors.ebitdaMargin.value || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">ROA</span>
                <span className="data-value">
                  {data.factors.roa.value || 'N/A'}
                </span>
              </div>
              <div className="data-row">
                <span className="data-label">Dividend</span>
                <span className="data-value">
                  {data.factors.dividend.value || 'N/A'}
                </span>
              </div>
            </div>

            <div className="data-block">
              <div className="data-block-title">▸ Technical</div>
              <div className="data-row">
                <span className="data-label">Current Price</span>
                <span className="data-value">${data.price?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">52W High</span>
                <span className="data-value">${data.high52w?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">52W Low</span>
                <span className="data-value">${data.low52w?.toFixed(2) || 'N/A'}</span>
              </div>
              <div className="data-row">
                <span className="data-label">6M Momentum</span>
                <span className="data-value">
                  {data.factors.momentum.value || 'N/A'}
                </span>
              </div>
            </div>

            <div className="methodology-note">
              <div className="methodology-title">Yartseva Model</div>
              <div className="methodology-text">
                Based on analysis of 464 stocks achieving 10x+ returns (2009-2024). 
                FCF Yield is the strongest predictor. Contrarian entry points 
                (buying near lows with negative momentum) historically outperform.
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
            <div className="empty-state-text">
              Select a stock to view detailed metrics
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Screener View
const ScreenerView: React.FC<{
  selectedSector: Sector;
  onSelectStock: (ticker: string) => void;
}> = ({ selectedSector, onSelectStock }) => {
  const [shouldFetch, setShouldFetch] = useState(false);
  const { data, isLoading, error } = useBulkScreen(selectedSector, shouldFetch);

  const getScoreClass = (classification: string) => {
    switch (classification) {
      case 'STRONG BUY': return 'strong';
      case 'MODERATE BUY': return 'moderate';
      case 'WEAK BUY': return 'weak';
      default: return 'avoid';
    }
  };

  const results = data?.results || [];

  return (
    <div className="terminal-panel center-panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <span className="panel-title">Russell 2000 Screener</span>
        <span className="panel-subtitle">{SECTOR_LABELS[selectedSector]}</span>
        <div className="panel-actions">
          <button
            className="quick-action-btn"
            style={{ height: '20px', fontSize: '9px' }}
            onClick={() => setShouldFetch(true)}
            disabled={isLoading}
          >
            {isLoading ? 'Scanning...' : 'Run Screen'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <div className="loading-text">Screening {SECTOR_LABELS[selectedSector]}...</div>
        </div>
      ) : error ? (
        <div className="empty-state">
          <div className="empty-state-title" style={{ color: 'var(--terminal-red)' }}>
            Screening Failed
          </div>
          <div className="empty-state-text">{(error as Error).message}</div>
        </div>
      ) : results.length > 0 ? (
        <div className="screener-table-container">
          <table className="screener-table">
            <thead>
              <tr>
                <th className="sortable">Ticker</th>
                <th className="sortable">Company</th>
                <th className="sortable">Score</th>
                <th>Signal</th>
                <th className="sortable">MCap</th>
                <th className="sortable">Price</th>
              </tr>
            </thead>
            <tbody>
              {results.map((stock: BulkScreenResult) => {
                const scoreClass = getScoreClass(stock.classification);
                return (
                  <tr key={stock.ticker}>
                    <td
                      className="ticker-cell"
                      onClick={() => onSelectStock(stock.ticker)}
                    >
                      {stock.ticker}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {stock.name || '-'}
                    </td>
                    <td>
                      <span className={`score-cell ${scoreClass}`}>
                        {stock.totalScore}
                      </span>
                      <div className="mini-score-bar">
                        <div
                          className="mini-score-bar-fill"
                          style={{
                            width: `${stock.percentage}%`,
                            background: `var(--terminal-${scoreClass === 'strong' ? 'green' : scoreClass === 'moderate' ? 'yellow' : scoreClass === 'weak' ? 'orange' : 'red'})`
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`classification-badge ${scoreClass}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                        {stock.classification}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      {stock.marketCap ? `$${(stock.marketCap / 1e9).toFixed(1)}B` : '-'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>
                      ${stock.price?.toFixed(2) || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-title">No Results</div>
          <div className="empty-state-text">
            Click "Run Screen" to scan {SECTOR_LABELS[selectedSector]} for multibagger candidates
          </div>
        </div>
      )}
    </div>
  );
};

// Methodology View
const MethodologyView: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('scoring');

  const sections = [
    {
      id: 'scoring',
      title: 'What is the Yartseva Scoring System?',
      content: (
        <div>
          <p style={{ marginBottom: '12px' }}>
            The scoring system is based on <strong style={{ color: 'var(--terminal-green)' }}>Yartseva (2025) "The Alchemy of Multibagger Stocks"</strong>,
            a peer-reviewed study analyzing 464 stocks that achieved 10x+ returns between 2009-2024.
          </p>
          <p style={{ marginBottom: '12px' }}>
            The research identified 9 key factors that predict multibagger potential, weighted by their
            statistical significance. The maximum score is 110 points.
          </p>
          <table className="screener-table" style={{ fontSize: '10px' }}>
            <thead>
              <tr>
                <th>Factor</th>
                <th>Max Points</th>
                <th>Insight</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ color: 'var(--terminal-green)' }}>FCF Yield</td><td>25</td><td>MOST predictive factor</td></tr>
              <tr><td>Size (Market Cap)</td><td>15</td><td>Small caps outperform</td></tr>
              <tr><td>Book-to-Market</td><td>15</td><td>Value effect</td></tr>
              <tr><td style={{ color: 'var(--terminal-yellow)' }}>Investment Pattern</td><td>15</td><td>UNIQUE finding</td></tr>
              <tr><td>EBITDA Margin</td><td>10</td><td>Profitability</td></tr>
              <tr><td>ROA</td><td>10</td><td>Asset efficiency</td></tr>
              <tr><td style={{ color: '#a855f7' }}>Price Range</td><td>10</td><td>CONTRARIAN - buy low</td></tr>
              <tr><td style={{ color: '#a855f7' }}>Momentum</td><td>5</td><td>CONTRARIAN - negative is good</td></tr>
              <tr><td>Dividend</td><td>5</td><td>78% paid dividends</td></tr>
            </tbody>
          </table>
        </div>
      ),
    },
    {
      id: 'classification',
      title: 'What do the classifications mean?',
      content: (
        <div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)' }}>
              <strong style={{ color: 'var(--terminal-green)' }}>STRONG BUY (≥70%)</strong>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Highest multibagger potential</p>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)' }}>
              <strong style={{ color: 'var(--terminal-yellow)' }}>MODERATE BUY (≥55%)</strong>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Good potential with some concerns</p>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255, 107, 0, 0.1)', border: '1px solid rgba(255, 107, 0, 0.3)' }}>
              <strong style={{ color: 'var(--terminal-orange)' }}>WEAK BUY (≥40%)</strong>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Limited potential, proceed with caution</p>
            </div>
            <div style={{ padding: '8px', background: 'rgba(255, 59, 59, 0.1)', border: '1px solid rgba(255, 59, 59, 0.3)' }}>
              <strong style={{ color: 'var(--terminal-red)' }}>AVOID (&lt;40%)</strong>
              <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>Does not fit multibagger profile</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'sectors',
      title: 'Which sectors produce the most multibaggers?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Based on the Yartseva research (464 multibaggers, 2009-2024):</p>
          <div style={{ display: 'grid', gap: '6px' }}>
            {[
              { sector: 'Consumer Discretionary', pct: 21.6, highlight: true },
              { sector: 'Technology', pct: 18.5, highlight: true },
              { sector: 'Healthcare', pct: 15.1, highlight: true },
              { sector: 'Industrials', pct: 14.0, highlight: false },
              { sector: 'Financials', pct: 10.3, highlight: false },
              { sector: 'Energy', pct: 7.1, highlight: false },
              { sector: 'Materials', pct: 5.8, highlight: false },
            ].map((item) => (
              <div key={item.sector} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '140px',
                  fontSize: '10px',
                  color: item.highlight ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>{item.sector}</span>
                <div style={{ flex: 1, height: '6px', background: 'var(--bg-tertiary)', borderRadius: '3px' }}>
                  <div style={{
                    width: `${(item.pct / 25) * 100}%`,
                    height: '100%',
                    borderRadius: '3px',
                    background: item.highlight ? 'var(--terminal-green)' : 'var(--text-dim)'
                  }} />
                </div>
                <span style={{
                  width: '40px',
                  textAlign: 'right',
                  fontSize: '10px',
                  color: item.highlight ? 'var(--terminal-green)' : 'var(--text-secondary)'
                }}>{item.pct}%</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0, 255, 136, 0.1)', border: '1px solid rgba(0, 255, 136, 0.3)', fontSize: '10px' }}>
            <strong style={{ color: 'var(--terminal-green)' }}>Tip:</strong> Focus on Consumer Discretionary, Technology, and Healthcare for the highest probability of finding multibaggers.
          </div>
        </div>
      ),
    },
    {
      id: 'marketcap',
      title: 'What is the optimal market cap size?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Smaller companies have significantly higher multibagger potential:</p>
          <div style={{ display: 'grid', gap: '6px' }}>
            {[
              { label: 'Micro-cap (<$350M)', score: '15/15', desc: 'Highest potential' },
              { label: 'Small-cap ($350M-$500M)', score: '12/15', desc: 'Excellent potential' },
              { label: 'Small-mid ($500M-$1B)', score: '8/15', desc: 'Good potential' },
              { label: 'Mid-cap ($1B-$2B)', score: '4/15', desc: 'Moderate potential' },
              { label: 'Large-cap (>$2B)', score: '0/15', desc: 'Limited potential' },
            ].map((item) => (
              <div key={item.label} style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{item.desc}</div>
                </div>
                <span style={{ fontFamily: 'monospace', color: 'var(--terminal-green)' }}>{item.score}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '8px', background: 'rgba(0, 200, 255, 0.1)', border: '1px solid rgba(0, 200, 255, 0.3)', fontSize: '10px' }}>
            <strong style={{ color: 'var(--terminal-cyan)' }}>Why Russell 2000?</strong> This index focuses on small-cap stocks, which aligns perfectly with the Yartseva methodology's finding that smaller companies have higher multibagger potential.
          </div>
        </div>
      ),
    },
    {
      id: 'investment',
      title: 'What is the "Investment Pattern" factor?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            This is a <strong style={{ color: 'var(--terminal-yellow)' }}>unique finding</strong> from the Yartseva research. It measures whether a company's
            investment strategy is sustainable:
          </p>
          <div style={{ padding: '12px', background: 'rgba(255, 215, 0, 0.1)', border: '1px solid rgba(255, 215, 0, 0.3)', marginBottom: '12px' }}>
            <p style={{ fontWeight: 'bold', color: 'var(--terminal-yellow)', marginBottom: '8px' }}>EBITDA Growth &gt; Asset Growth = Sustainable Investment</p>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
              When earnings grow faster than assets, it means the company is deploying capital efficiently
              and generating increasing returns on its investments.
            </p>
          </div>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            <strong>Scoring:</strong> Companies where EBITDA growth exceeds asset growth by any margin receive the full 15 points.
            This pattern was present in the majority of successful multibaggers.
          </p>
        </div>
      ),
    },
    {
      id: 'contrarian',
      title: 'Why are the entry point factors "contrarian"?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>
            Two factors reward contrarian behavior — buying when others are selling:
          </p>
          <div style={{ padding: '12px', background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)', marginBottom: '8px' }}>
            <strong style={{ color: '#a855f7' }}>Price Range (Entry Point)</strong>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Stocks trading near their 52-week lows scored highest. This is counterintuitive — most investors avoid "falling knives,"
              but the data shows buying near lows significantly increases multibagger probability.
            </p>
          </div>
          <div style={{ padding: '12px', background: 'rgba(138, 43, 226, 0.1)', border: '1px solid rgba(138, 43, 226, 0.3)', marginBottom: '8px' }}>
            <strong style={{ color: '#a855f7' }}>6-Month Momentum</strong>
            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Negative momentum (price decline over 6 months) was actually a positive signal. Stocks that had fallen
              before becoming multibaggers outperformed those with positive momentum.
            </p>
          </div>
          <div style={{ padding: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '10px', color: 'var(--text-secondary)' }}>
            <strong>Key Insight:</strong> The best time to buy future multibaggers is when they're unloved and underperforming —
            the opposite of what most momentum-based strategies suggest.
          </div>
        </div>
      ),
    },
    {
      id: 'data',
      title: 'Where does the data come from?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>We use multiple data sources for comprehensive coverage:</p>
          <div style={{ display: 'grid', gap: '6px' }}>
            {[
              { name: 'Yahoo Finance', desc: 'Real-time prices, market cap, 52-week ranges' },
              { name: 'Financial Modeling Prep', desc: 'Fundamental data, financial statements' },
              { name: 'SEC EDGAR', desc: 'Official filings for US companies (EBITDA, Assets, Revenue)' },
              { name: 'Gemini AI', desc: 'Intelligent data extraction and analysis' },
            ].map((source) => (
              <div key={source.name} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '8px', background: 'var(--bg-secondary)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--terminal-green)', marginTop: '5px' }} />
                <div>
                  <p style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: '500' }}>{source.name}</p>
                  <p style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{source.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'updates',
      title: 'How often is data updated?',
      content: (
        <div>
          <p style={{ marginBottom: '12px', color: 'var(--text-secondary)' }}>Data freshness varies by type:</p>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>Price data</span>
              <span style={{ color: 'var(--terminal-green)', fontFamily: 'monospace', fontSize: '11px' }}>Real-time</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>Fundamental data</span>
              <span style={{ color: 'var(--terminal-green)', fontFamily: 'monospace', fontSize: '11px' }}>Daily</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'var(--bg-secondary)' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '11px' }}>Cached results</span>
              <span style={{ color: 'var(--terminal-green)', fontFamily: 'monospace', fontSize: '11px' }}>24 hours</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="terminal-panel center-panel" style={{ gridColumn: 'span 2' }}>
      <div className="panel-header">
        <span className="panel-title">Methodology</span>
        <span className="panel-subtitle">Yartseva Quality Factor Model</span>
      </div>
      <div className="panel-content" style={{ padding: 'var(--space-lg)', overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
        <div className="faq-container" style={{ maxWidth: '100%' }}>
          {sections.map((section) => (
            <div key={section.id} className="faq-item">
              <button
                className="faq-question"
                onClick={() => setOpenSection(openSection === section.id ? null : section.id)}
              >
                <span>{section.title}</span>
                <span className={`faq-question-icon ${openSection === section.id ? 'open' : ''}`}>
                  ▼
                </span>
              </button>
              {openSection === section.id && (
                <div className="faq-answer">{section.content}</div>
              )}
            </div>
          ))}

          <div className="methodology-note" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="methodology-title">⚠ Investment Disclaimer</div>
            <div className="methodology-text">
              This tool is for educational and research purposes only. Past performance does not
              guarantee future results. The Yartseva methodology identifies characteristics common
              to historical multibaggers but cannot predict future stock performance. Always conduct
              your own due diligence and consider consulting a financial advisor before making
              investment decisions.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Bar
const StatusBar: React.FC = () => (
  <div className="terminal-status-bar">
    <div className="status-bar-left">
      <div className="status-bar-item">
        <span className="label">DATA:</span>
        <span className="value live">LIVE</span>
      </div>
      <div className="status-bar-item">
        <span className="label">SOURCE:</span>
        <span className="value">Yahoo Finance / FMP</span>
      </div>
    </div>
    <div className="status-bar-right">
      <div className="status-bar-item">
        <span className="label">MODEL:</span>
        <span className="value">Yartseva (2025)</span>
      </div>
      <div className="status-bar-item">
        <span className="value" style={{ color: 'var(--text-dim)' }}>
          For educational purposes only
        </span>
      </div>
    </div>
  </div>
);

// Main App Content
function AppContent() {
  const [activeView, setActiveView] = useState<ViewMode>('single');
  const [searchTicker, setSearchTicker] = useState('');
  const [selectedSector, setSelectedSector] = useState<Sector>('all');
  const [shouldFetch, setShouldFetch] = useState(false);

  const { data, isLoading, error } = useStockScreen(searchTicker, shouldFetch);

  const handleSearch = () => {
    if (searchTicker.trim()) {
      setShouldFetch(true);
      setActiveView('single');
    }
  };

  const handleSelectStock = (ticker: string) => {
    setSearchTicker(ticker);
    setShouldFetch(true);
    setActiveView('single');
  };

  return (
    <div className="terminal-container terminal-boot">
      <TerminalTopBar activeView={activeView} setActiveView={setActiveView} />

      <div className="terminal-main">
        {activeView === 'screener' ? (
          <ScreenerLeftPanel
            selectedSector={selectedSector}
            setSelectedSector={setSelectedSector}
          />
        ) : (
          <LeftPanel
            searchTicker={searchTicker}
            setSearchTicker={setSearchTicker}
            onSearch={handleSearch}
          />
        )}

        {activeView === 'single' && (
          <>
            <CenterPanel data={data} isLoading={isLoading} error={error as Error | null} />
            <RightPanel data={data} />
          </>
        )}

        {activeView === 'screener' && (
          <ScreenerView
            selectedSector={selectedSector}
            onSelectStock={handleSelectStock}
          />
        )}

        {activeView === 'methodology' && <MethodologyView />}
      </div>

      <StatusBar />
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

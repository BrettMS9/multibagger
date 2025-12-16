import Bottleneck from 'bottleneck';
import db from '../config/database';

/**
 * SEC EDGAR Service
 *
 * Fetches financial data directly from SEC filings for maximum accuracy.
 * Uses aggressive caching since historical data never changes.
 *
 * Data through FY2024 can be cached permanently (it's now 2025).
 */

// SEC rate limit: 10 requests per second
const edgarLimiter = new Bottleneck({
  maxConcurrent: 2,
  minTime: 150, // ~6-7 requests per second to be safe
});

// User-Agent required by SEC
const SEC_USER_AGENT = 'MultibaggerScreener/1.0 (contact@example.com)';

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

/**
 * Fetch with exponential backoff retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': SEC_USER_AGENT,
          ...options.headers,
        },
      });

      // Don't retry on client errors (4xx) except rate limits (429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response;
      }

      // Retry on server errors (5xx) and rate limits (429)
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxRetries) {
          const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
          console.log(`SEC API returned ${response.status}, retrying in ${backoffTime}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          continue;
        }
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      // Network errors - retry with backoff
      if (attempt < maxRetries) {
        const backoffTime = INITIAL_BACKOFF_MS * Math.pow(2, attempt);
        console.log(`Network error fetching ${url}, retrying in ${backoffTime}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
    }
  }

  throw lastError || new Error(`Failed to fetch ${url} after ${maxRetries} retries`);
}

export interface EdgarFinancials {
  ticker: string;
  cik: string;
  companyName: string;

  // Historical EBITDA (Operating Income + D&A)
  ebitdaHistory: { year: number; value: number }[];

  // Historical Total Assets
  assetHistory: { year: number; value: number }[];

  // Historical Free Cash Flow
  fcfHistory: { year: number; value: number }[];

  // Historical Book Value (Stockholders Equity)
  bookValueHistory: { year: number; value: number }[];

  // Calculated growth rates (3-year CAGR)
  ebitdaGrowth: number | null;
  assetGrowth: number | null;

  // Latest values
  latestEbitda: number | null;
  latestAssets: number | null;
  latestFcf: number | null;
  latestBookValue: number | null;

  // Metadata
  lastFiscalYear: number;
  dataSource: 'edgar';
  fetchedAt: number;
}

// CIK cache (ticker -> CIK mapping)
const cikCache = new Map<string, string>();

class EdgarService {
  private dataUrl = 'https://data.sec.gov';
  private wwwUrl = 'https://www.sec.gov';

  /**
   * Initialize database tables for EDGAR caching
   */
  initializeCache(): void {
    // Create CIK mapping table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS edgar_cik_mapping (
        ticker TEXT PRIMARY KEY,
        cik TEXT NOT NULL,
        company_name TEXT,
        created_at INTEGER NOT NULL
      )
    `).run();

    // Create financials table
    db.prepare(`
      CREATE TABLE IF NOT EXISTS edgar_financials (
        ticker TEXT NOT NULL,
        fiscal_year INTEGER NOT NULL,
        ebitda REAL,
        total_assets REAL,
        free_cash_flow REAL,
        book_value REAL,
        operating_income REAL,
        depreciation REAL,
        operating_cash_flow REAL,
        capex REAL,
        stockholders_equity REAL,
        fetched_at INTEGER NOT NULL,
        PRIMARY KEY (ticker, fiscal_year)
      )
    `).run();

    // Create index
    const indexExists = db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='index' AND name='idx_edgar_financials_ticker'
    `).get();

    if (!indexExists) {
      db.prepare(`
        CREATE INDEX idx_edgar_financials_ticker ON edgar_financials(ticker)
      `).run();
    }
  }

  /**
   * Get CIK for a ticker symbol
   */
  async getCik(ticker: string): Promise<string | null> {
    const upperTicker = ticker.toUpperCase();

    // Check memory cache
    if (cikCache.has(upperTicker)) {
      return cikCache.get(upperTicker)!;
    }

    // Check database cache
    const cached = db.prepare(
      'SELECT cik FROM edgar_cik_mapping WHERE ticker = ?'
    ).get(upperTicker) as { cik: string } | undefined;

    if (cached) {
      cikCache.set(upperTicker, cached.cik);
      return cached.cik;
    }

    // Fetch from SEC
    return edgarLimiter.schedule(async () => {
      try {
        // SEC provides a company tickers JSON file (on www.sec.gov, not data.sec.gov)
        const response = await fetchWithRetry(
          `${this.wwwUrl}/files/company_tickers.json`
        );

        if (!response.ok) {
          console.error(`SEC company_tickers.json returned ${response.status}`);
          return null;
        }

        const data = await response.json() as Record<string, { ticker: string; cik_str: string; title: string }>;

        // Find ticker in the list
        for (const key in data) {
          const entry = data[key];
          if (entry.ticker === upperTicker) {
            const cik = String(entry.cik_str).padStart(10, '0');
            const companyName = entry.title;

            // Cache in database (permanent)
            db.prepare(`
              INSERT OR REPLACE INTO edgar_cik_mapping (ticker, cik, company_name, created_at)
              VALUES (?, ?, ?, ?)
            `).run(upperTicker, cik, companyName, Date.now());

            cikCache.set(upperTicker, cik);
            return cik;
          }
        }

        console.warn(`CIK not found for ticker: ${upperTicker}`);
        return null;
      } catch (error) {
        console.error(`Error fetching CIK for ${upperTicker}:`, error);
        return null;
      }
    });
  }

  /**
   * Fetch company facts from SEC EDGAR
   */
  async getCompanyFacts(cik: string): Promise<any | null> {
    return edgarLimiter.schedule(async () => {
      try {
        const url = `${this.dataUrl}/api/xbrl/companyfacts/CIK${cik}.json`;

        const response = await fetchWithRetry(url);

        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`No XBRL data found for CIK ${cik}`);
            return null;
          }
          console.error(`SEC API returned ${response.status} for CIK ${cik}`);
          return null;
        }

        return await response.json();
      } catch (error) {
        console.error(`Error fetching company facts for CIK ${cik}:`, error);
        return null;
      }
    });
  }

  /**
   * Extract annual values from XBRL facts
   */
  private extractAnnualValues(
    facts: any,
    namespace: string,
    concept: string
  ): { year: number; value: number }[] {
    const results: { year: number; value: number }[] = [];

    try {
      const conceptData = facts?.facts?.[namespace]?.[concept];
      if (!conceptData?.units) return results;

      // Try USD first, then pure numbers
      const units = conceptData.units.USD || conceptData.units.pure || [];

      for (const entry of units) {
        // Only want annual (10-K) data, not quarterly
        if (entry.form !== '10-K' && entry.form !== '10-K/A') continue;

        // Extract fiscal year from end date
        const endDate = entry.end;
        if (!endDate) continue;

        const year = parseInt(endDate.substring(0, 4));
        const value = entry.val;

        if (year && value !== undefined && value !== null) {
          // Check if we already have this year (keep the most recent filing)
          const existing = results.find(r => r.year === year);
          if (!existing) {
            results.push({ year, value });
          }
        }
      }

      // Sort by year descending
      results.sort((a, b) => b.year - a.year);
    } catch (error) {
      // Silently fail - not all companies have all concepts
    }

    return results;
  }

  /**
   * Calculate CAGR from historical values
   */
  private calculateCAGR(
    history: { year: number; value: number }[],
    years: number = 3
  ): number | null {
    if (history.length < 2) return null;

    const sorted = [...history].sort((a, b) => b.year - a.year);
    const recent = sorted[0];
    const older = sorted.find(h => h.year <= recent.year - years && h.year >= recent.year - years - 1);

    if (!older) return null;
    if (older.value <= 0 || recent.value <= 0) return null;

    const actualYears = recent.year - older.year;
    if (actualYears < 2) return null;

    // CAGR = (end/start)^(1/years) - 1
    const cagr = (Math.pow(recent.value / older.value, 1 / actualYears) - 1) * 100;
    return cagr;
  }

  /**
   * Get cached financials from database
   */
  private getCachedFinancials(ticker: string): EdgarFinancials | null {
    const rows = db.prepare(`
      SELECT * FROM edgar_financials
      WHERE ticker = ?
      ORDER BY fiscal_year DESC
    `).all(ticker.toUpperCase()) as any[];

    if (rows.length === 0) return null;

    // Get CIK and company name
    const cikRow = db.prepare(
      'SELECT cik, company_name FROM edgar_cik_mapping WHERE ticker = ?'
    ).get(ticker.toUpperCase()) as { cik: string; company_name: string } | undefined;

    if (!cikRow) return null;

    // Build history arrays
    const ebitdaHistory: { year: number; value: number }[] = [];
    const assetHistory: { year: number; value: number }[] = [];
    const fcfHistory: { year: number; value: number }[] = [];
    const bookValueHistory: { year: number; value: number }[] = [];

    for (const row of rows) {
      if (row.ebitda !== null) {
        ebitdaHistory.push({ year: row.fiscal_year, value: row.ebitda });
      }
      if (row.total_assets !== null) {
        assetHistory.push({ year: row.fiscal_year, value: row.total_assets });
      }
      if (row.free_cash_flow !== null) {
        fcfHistory.push({ year: row.fiscal_year, value: row.free_cash_flow });
      }
      if (row.book_value !== null) {
        bookValueHistory.push({ year: row.fiscal_year, value: row.book_value });
      }
    }

    return {
      ticker: ticker.toUpperCase(),
      cik: cikRow.cik,
      companyName: cikRow.company_name,
      ebitdaHistory,
      assetHistory,
      fcfHistory,
      bookValueHistory,
      ebitdaGrowth: this.calculateCAGR(ebitdaHistory),
      assetGrowth: this.calculateCAGR(assetHistory),
      latestEbitda: ebitdaHistory[0]?.value || null,
      latestAssets: assetHistory[0]?.value || null,
      latestFcf: fcfHistory[0]?.value || null,
      latestBookValue: bookValueHistory[0]?.value || null,
      lastFiscalYear: rows[0].fiscal_year,
      dataSource: 'edgar',
      fetchedAt: rows[0].fetched_at,
    };
  }

  /**
   * Save financials to cache
   */
  private saveFinancials(
    ticker: string,
    year: number,
    data: {
      ebitda?: number | null;
      totalAssets?: number | null;
      fcf?: number | null;
      bookValue?: number | null;
      operatingIncome?: number | null;
      depreciation?: number | null;
      operatingCashFlow?: number | null;
      capex?: number | null;
      stockholdersEquity?: number | null;
    }
  ): void {
    db.prepare(`
      INSERT OR REPLACE INTO edgar_financials (
        ticker, fiscal_year, ebitda, total_assets, free_cash_flow, book_value,
        operating_income, depreciation, operating_cash_flow, capex,
        stockholders_equity, fetched_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      ticker.toUpperCase(),
      year,
      data.ebitda ?? null,
      data.totalAssets ?? null,
      data.fcf ?? null,
      data.bookValue ?? null,
      data.operatingIncome ?? null,
      data.depreciation ?? null,
      data.operatingCashFlow ?? null,
      data.capex ?? null,
      data.stockholdersEquity ?? null,
      Date.now()
    );
  }

  /**
   * Fetch and parse financials for a ticker
   */
  async getFinancials(ticker: string, forceRefresh: boolean = false): Promise<EdgarFinancials | null> {
    const upperTicker = ticker.toUpperCase();

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = this.getCachedFinancials(upperTicker);
      if (cached && cached.lastFiscalYear >= 2024) {
        // We have data through 2024, no need to refresh
        console.log(`EDGAR: Using cached data for ${upperTicker} (through FY${cached.lastFiscalYear})`);
        return cached;
      }
    }

    console.log(`EDGAR: Fetching fresh data for ${upperTicker}...`);

    // Get CIK
    const cik = await this.getCik(upperTicker);
    if (!cik) {
      console.warn(`EDGAR: Could not find CIK for ${upperTicker}`);
      return null;
    }

    // Fetch company facts
    const facts = await this.getCompanyFacts(cik);
    if (!facts) {
      console.warn(`EDGAR: Could not fetch company facts for ${upperTicker}`);
      return null;
    }

    const companyName = facts.entityName || upperTicker;

    // Extract financial metrics using US-GAAP namespace
    const namespace = 'us-gaap';

    // Operating Income
    let operatingIncome = this.extractAnnualValues(facts, namespace, 'OperatingIncomeLoss');
    if (operatingIncome.length === 0) {
      operatingIncome = this.extractAnnualValues(facts, namespace, 'IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest');
    }

    // Depreciation & Amortization
    let depreciation = this.extractAnnualValues(facts, namespace, 'DepreciationDepletionAndAmortization');
    if (depreciation.length === 0) {
      depreciation = this.extractAnnualValues(facts, namespace, 'DepreciationAndAmortization');
    }

    // Calculate EBITDA = Operating Income + D&A
    const ebitdaHistory: { year: number; value: number }[] = [];
    for (const oi of operatingIncome) {
      const da = depreciation.find(d => d.year === oi.year);
      if (da) {
        ebitdaHistory.push({ year: oi.year, value: oi.value + da.value });
      } else {
        // Use operating income alone if no D&A data
        ebitdaHistory.push({ year: oi.year, value: oi.value });
      }
    }

    // Total Assets
    const assetHistory = this.extractAnnualValues(facts, namespace, 'Assets');

    // Operating Cash Flow
    let operatingCashFlow = this.extractAnnualValues(facts, namespace, 'NetCashProvidedByUsedInOperatingActivities');
    if (operatingCashFlow.length === 0) {
      operatingCashFlow = this.extractAnnualValues(facts, namespace, 'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations');
    }

    // Capital Expenditures
    let capex = this.extractAnnualValues(facts, namespace, 'PaymentsToAcquirePropertyPlantAndEquipment');
    if (capex.length === 0) {
      capex = this.extractAnnualValues(facts, namespace, 'PaymentsToAcquireProductiveAssets');
    }

    // Calculate FCF = Operating Cash Flow - CapEx
    const fcfHistory: { year: number; value: number }[] = [];
    for (const ocf of operatingCashFlow) {
      const cx = capex.find(c => c.year === ocf.year);
      fcfHistory.push({
        year: ocf.year,
        value: ocf.value - (cx?.value || 0)
      });
    }

    // Stockholders Equity (Book Value)
    let bookValueHistory = this.extractAnnualValues(facts, namespace, 'StockholdersEquity');
    if (bookValueHistory.length === 0) {
      bookValueHistory = this.extractAnnualValues(facts, namespace, 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest');
    }

    // Save all years to cache
    const allYears = new Set<number>();
    [...ebitdaHistory, ...assetHistory, ...fcfHistory, ...bookValueHistory]
      .forEach(h => allYears.add(h.year));

    for (const year of allYears) {
      const ebitda = ebitdaHistory.find(h => h.year === year)?.value;
      const assets = assetHistory.find(h => h.year === year)?.value;
      const fcf = fcfHistory.find(h => h.year === year)?.value;
      const bookValue = bookValueHistory.find(h => h.year === year)?.value;
      const oi = operatingIncome.find(h => h.year === year)?.value;
      const da = depreciation.find(h => h.year === year)?.value;
      const ocf = operatingCashFlow.find(h => h.year === year)?.value;
      const cx = capex.find(h => h.year === year)?.value;

      this.saveFinancials(upperTicker, year, {
        ebitda,
        totalAssets: assets,
        fcf,
        bookValue,
        operatingIncome: oi,
        depreciation: da,
        operatingCashFlow: ocf,
        capex: cx,
        stockholdersEquity: bookValue,
      });
    }

    // Update CIK mapping with company name
    db.prepare(`
      INSERT OR REPLACE INTO edgar_cik_mapping (ticker, cik, company_name, created_at)
      VALUES (?, ?, ?, ?)
    `).run(upperTicker, cik, companyName, Date.now());

    const result: EdgarFinancials = {
      ticker: upperTicker,
      cik,
      companyName,
      ebitdaHistory,
      assetHistory,
      fcfHistory,
      bookValueHistory,
      ebitdaGrowth: this.calculateCAGR(ebitdaHistory),
      assetGrowth: this.calculateCAGR(assetHistory),
      latestEbitda: ebitdaHistory[0]?.value || null,
      latestAssets: assetHistory[0]?.value || null,
      latestFcf: fcfHistory[0]?.value || null,
      latestBookValue: bookValueHistory[0]?.value || null,
      lastFiscalYear: Math.max(...Array.from(allYears), 0),
      dataSource: 'edgar',
      fetchedAt: Date.now(),
    };

    console.log(`EDGAR: ${upperTicker} - EBITDA growth: ${result.ebitdaGrowth?.toFixed(1) ?? 'N/A'}%, Asset growth: ${result.assetGrowth?.toFixed(1) ?? 'N/A'}%`);

    return result;
  }

  /**
   * Check if we have cached data for a ticker
   */
  hasCachedData(ticker: string): boolean {
    const row = db.prepare(
      'SELECT COUNT(*) as count FROM edgar_financials WHERE ticker = ?'
    ).get(ticker.toUpperCase()) as { count: number };
    return row.count > 0;
  }

  /**
   * Get growth metrics for scoring (convenience method)
   */
  async getGrowthMetrics(ticker: string): Promise<{
    ebitdaGrowth: number | null;
    assetGrowth: number | null;
    source: 'edgar';
  }> {
    const financials = await this.getFinancials(ticker);
    return {
      ebitdaGrowth: financials?.ebitdaGrowth ?? null,
      assetGrowth: financials?.assetGrowth ?? null,
      source: 'edgar',
    };
  }
}

export const edgarService = new EdgarService();

// Initialize cache tables on module load
console.log('EDGAR: Initializing SEC EDGAR service...');
edgarService.initializeCache();
console.log('EDGAR: Cache tables initialized');

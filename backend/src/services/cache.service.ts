import db from '../config/database';

export interface CachedStockData {
  ticker: string;
  companyName: string;
  sector: string;
  industry: string;
  marketCap: number;
  price: number;
  high52w: number;
  low52w: number;
  fcf: number | null;
  bookValue: number | null;
  totalAssets: number | null;
  ebitda: number | null;
  ebitdaMargin: number | null;
  roa: number | null;
  assetGrowth: number | null;
  ebitdaGrowth: number | null;
  dividendYield: number | null;
  paysDividend: boolean;
  peRatio: number | null;
  pbRatio: number | null;
  price6MonthsAgo: number | null;
  dataFetchedAt: number;
}

class CacheService {
  private readonly CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

  isFresh(fetchedAt: number): boolean {
    const now = Date.now();
    return now - fetchedAt < this.CACHE_DURATION_MS;
  }

  getCachedStock(ticker: string): CachedStockData | null {
    const stmt = db.prepare(`
      SELECT
        ticker,
        company_name as companyName,
        sector,
        industry,
        market_cap as marketCap,
        price,
        high_52w as high52w,
        low_52w as low52w,
        fcf,
        book_value as bookValue,
        total_assets as totalAssets,
        ebitda,
        ebitda_margin as ebitdaMargin,
        roa,
        asset_growth as assetGrowth,
        ebitda_growth as ebitdaGrowth,
        dividend_yield as dividendYield,
        pays_dividend as paysDividend,
        pe_ratio as peRatio,
        pb_ratio as pbRatio,
        price_6_months_ago as price6MonthsAgo,
        data_fetched_at as dataFetchedAt
      FROM stock_cache
      WHERE ticker = ?
    `);

    const row = stmt.get(ticker.toUpperCase()) as Record<string, unknown> | undefined;

    if (!row) {
      return null;
    }

    // Check if cache is still fresh
    if (!this.isFresh(row.dataFetchedAt as number)) {
      console.log(`Cache expired for ${ticker}`);
      return null;
    }

    // Convert SQLite row to typed object, handling boolean conversion
    return {
      ticker: row.ticker as string,
      companyName: row.companyName as string,
      sector: row.sector as string,
      industry: row.industry as string,
      marketCap: row.marketCap as number,
      price: row.price as number,
      high52w: row.high52w as number,
      low52w: row.low52w as number,
      fcf: row.fcf as number | null,
      bookValue: row.bookValue as number | null,
      totalAssets: row.totalAssets as number | null,
      ebitda: row.ebitda as number | null,
      ebitdaMargin: row.ebitdaMargin as number | null,
      roa: row.roa as number | null,
      assetGrowth: row.assetGrowth as number | null,
      ebitdaGrowth: row.ebitdaGrowth as number | null,
      dividendYield: row.dividendYield as number | null,
      paysDividend: Boolean(row.paysDividend),
      peRatio: row.peRatio as number | null,
      pbRatio: row.pbRatio as number | null,
      price6MonthsAgo: row.price6MonthsAgo as number | null,
      dataFetchedAt: row.dataFetchedAt as number,
    };
  }

  saveStockData(data: CachedStockData): void {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO stock_cache (
        ticker,
        company_name,
        sector,
        industry,
        market_cap,
        price,
        high_52w,
        low_52w,
        fcf,
        book_value,
        total_assets,
        ebitda,
        ebitda_margin,
        roa,
        asset_growth,
        ebitda_growth,
        dividend_yield,
        pays_dividend,
        pe_ratio,
        pb_ratio,
        price_6_months_ago,
        data_fetched_at
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      data.ticker.toUpperCase(),
      data.companyName,
      data.sector,
      data.industry,
      data.marketCap,
      data.price,
      data.high52w,
      data.low52w,
      data.fcf,
      data.bookValue,
      data.totalAssets,
      data.ebitda,
      data.ebitdaMargin,
      data.roa,
      data.assetGrowth,
      data.ebitdaGrowth,
      data.dividendYield,
      data.paysDividend ? 1 : 0,
      data.peRatio,
      data.pbRatio,
      data.price6MonthsAgo,
      data.dataFetchedAt
    );
  }

  clearExpiredCache(): number {
    const cutoff = Date.now() - this.CACHE_DURATION_MS;
    const stmt = db.prepare('DELETE FROM stock_cache WHERE data_fetched_at < ?');
    const result = stmt.run(cutoff);
    return result.changes;
  }

  clearAllCache(): number {
    const stmt = db.prepare('DELETE FROM stock_cache');
    const result = stmt.run();
    return result.changes;
  }

  getCacheStats(): {
    totalCached: number;
    freshCount: number;
    expiredCount: number;
  } {
    const total = db.prepare('SELECT COUNT(*) as count FROM stock_cache').get() as { count: number };
    const cutoff = Date.now() - this.CACHE_DURATION_MS;
    const fresh = db.prepare('SELECT COUNT(*) as count FROM stock_cache WHERE data_fetched_at >= ?').get(cutoff) as { count: number };

    return {
      totalCached: total.count,
      freshCount: fresh.count,
      expiredCount: total.count - fresh.count,
    };
  }
}

export const cacheService = new CacheService();

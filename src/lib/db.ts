import { createClient } from "@libsql/client";

function getDatabaseUrl(): string {
  // Use configured Turso URL if available (remote or local)
  if (process.env.TURSO_ARBITRAGE_DATABASE_URL) {
    return process.env.TURSO_ARBITRAGE_DATABASE_URL;
  }
  // On Vercel (serverless), use /tmp which is writable
  if (process.env.VERCEL) {
    return "file:/tmp/arbitrage.db";
  }
  // Local development fallback
  return "file:data/arbitrage.db";
}

const db = createClient({
  url: getDatabaseUrl(),
  authToken: process.env.TURSO_ARBITRAGE_AUTH_TOKEN || undefined,
});

export default db;

export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      image_url TEXT,
      category TEXT,
      upc TEXT,
      asin TEXT,
      source_platform TEXT,
      source_url TEXT,
      source_price REAL NOT NULL,
      source_condition TEXT,
      discovered_at TEXT,
      expires_at TEXT,
      status TEXT DEFAULT 'discovered',
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS resale_opportunities (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id),
      platform TEXT NOT NULL,
      listing_url TEXT,
      estimated_sell_price REAL NOT NULL,
      actual_sell_price REAL,
      platform_fee_percent REAL,
      platform_fee_fixed REAL DEFAULT 0,
      estimated_shipping_cost REAL,
      estimated_profit REAL,
      estimated_roi REAL,
      status TEXT DEFAULT 'opportunity'
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      product_id TEXT REFERENCES products(id),
      quantity INTEGER DEFAULT 1,
      total_cost REAL NOT NULL,
      purchase_date TEXT,
      order_id TEXT,
      tracking_number TEXT,
      received INTEGER DEFAULT 0,
      received_date TEXT,
      condition_notes TEXT,
      storage_location TEXT
    );

    CREATE TABLE IF NOT EXISTS listings (
      id TEXT PRIMARY KEY,
      purchase_id TEXT REFERENCES purchases(id),
      platform TEXT NOT NULL,
      listing_url TEXT,
      listing_price REAL NOT NULL,
      listing_date TEXT,
      status TEXT DEFAULT 'active',
      views INTEGER DEFAULT 0,
      watchers INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      listing_id TEXT REFERENCES listings(id),
      purchase_id TEXT REFERENCES purchases(id),
      sell_price REAL NOT NULL,
      platform_fees REAL NOT NULL,
      shipping_cost REAL NOT NULL,
      net_profit REAL,
      sale_date TEXT,
      buyer_username TEXT,
      notes TEXT
    );
  `);
}

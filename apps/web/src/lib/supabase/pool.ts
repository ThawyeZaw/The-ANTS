// ──────────────────────────────────────────────────────────────────────────────
// Phase 10: Connection Pooling — Pooled pg Client (for future direct DB access)
//
// If you ever need raw SQL queries on the server (complex reporting, bulk ops),
// use this client with the pooled connection string to avoid exhausting
// the connection pool. Currently not used — delete if never needed.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns a connection config for direct Postgres access using the pooled
 * connection string (port 6543, PgBouncer in transaction mode).
 *
 * To use this, install `pg`:
 *   npm install pg
 *   npm install -D @types/pg
 *
 * Then:
 *   import { Pool } from 'pg'
 *   const pool = new Pool(getPooledDbConfig())
 *   const { rows } = await pool.query('SELECT * FROM profiles LIMIT 10')
 */
export function getPooledDbConfig() {
  const pooledUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  return {
    connectionString: pooledUrl || directUrl,
    max: 5, // Keep small — PgBouncer handles pooling upstream
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  }
}

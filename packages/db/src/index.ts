import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import type { DrizzleD1Database } from 'drizzle-orm/d1';
import type { D1Database } from '@cloudflare/workers-types';
import * as schema from './schema';
import { withD1Retries } from './d1-retry';

export * from './schema';
export { isTransientD1Error, withD1Retries } from './d1-retry';

export type AppSchema = typeof schema;
export type Database = DrizzleD1Database<AppSchema>;

/** Create a Drizzle client bound to Cloudflare D1. */
export function createDb(d1: D1Database): Database {
  return drizzleD1(withD1Retries(d1), { schema });
}

/** @deprecated Removed — throws. Kept so accidental imports fail loudly. */
export function createDbFromConnectionString(_connectionString: string): never {
  throw new Error(
    '[db] Postgres URL clients were removed. Pass a D1Database binding via createDb(env.DB).'
  );
}

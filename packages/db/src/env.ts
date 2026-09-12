import { createDb, type Database } from '@the-ants/db';
import * as schema from '@the-ants/db';

/**
 * Resolve D1 from Cloudflare Worker / OpenNext bindings.
 */
export function getDbFromEnv(env: { DB?: D1Database } | null | undefined): Database {
  if (!env?.DB) {
    throw new Error(
      '[db] Missing D1 binding `DB`. Add d1_databases to wrangler.jsonc and run migrations (docs/migration/d1.md).'
    );
  }
  return createDb(env.DB);
}

export type { Database };
export { createDb, schema };

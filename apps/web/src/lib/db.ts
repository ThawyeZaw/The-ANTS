import { createDb, type Database } from '@the-ants/db';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import type { D1Database } from '@cloudflare/workers-types';

export type { Database };
export * from '@the-ants/db';

/**
 * Drizzle client for server actions / route handlers.
 * Uses OpenNext Cloudflare D1 binding `DB` (local via wrangler / preview / deploy).
 */
export function getDb(): Database {
  try {
    const { env } = getCloudflareContext();
    const d1 = (env as { DB?: D1Database } | undefined)?.DB;
    if (d1) return createDb(d1);
  } catch {
    // Outside Workers runtime (e.g. accidental Node-only call)
  }

  throw new Error(
    '[web/db] D1 binding `DB` unavailable. Use `npm run cf:preview:web` / Workers deploy, ' +
      'or ensure wrangler.jsonc has d1_databases binding DB (see docs/migration/d1.md).'
  );
}

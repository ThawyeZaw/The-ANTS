import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

export * from './schema';

export function createDb(connectionString: string) {
  const cleanUrl = (connectionString || '')
    .replace(/[&?]channel_binding=[^&]+/g, '')
    .trim();
  const sql = neon(cleanUrl);
  return drizzle(sql, { schema });
}

export type Database = ReturnType<typeof createDb>;

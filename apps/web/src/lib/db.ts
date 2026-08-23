import { createDb } from '@the-ants/db';

export function getDb() {
  const dbUrl =
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    '';
  return createDb(dbUrl);
}

export * from '@the-ants/db';

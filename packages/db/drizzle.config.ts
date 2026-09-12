import { defineConfig } from 'drizzle-kit';

/** Local SQLite migration generation (no D1 HTTP credentials required). */
export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle-d1',
  dialect: 'sqlite',
});

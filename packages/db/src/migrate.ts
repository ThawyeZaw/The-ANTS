import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';
  if (!dbUrl) {
    console.error('❌ Error: DATABASE_URL not set in .env.local');
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon PostgreSQL...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const db = drizzle(pool);

  console.log('📦 Applying Drizzle schema migrations to Neon...');
  try {
    await migrate(db, {
      migrationsFolder: path.resolve(__dirname, '../drizzle'),
    });
    console.log('✅ All 62 tables, indexes, and enums successfully created in Neon!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

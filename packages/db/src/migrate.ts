import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Load env from monorepo root (local) then package cwd (CI/deploy overrides).
const rootEnvLocal = path.resolve(__dirname, '../../../.env.local');
const rootEnv = path.resolve(__dirname, '../../../.env');
const pkgEnvLocal = path.resolve(__dirname, '../.env.local');
const pkgEnv = path.resolve(__dirname, '../.env');

for (const envPath of [rootEnv, rootEnvLocal, pkgEnv, pkgEnvLocal]) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: true });
  }
}

const MIGRATIONS_FOLDER = path.resolve(__dirname, '../drizzle');
const MIGRATIONS_SCHEMA = 'drizzle';
const MIGRATIONS_TABLE = '__drizzle_migrations';

type JournalEntry = {
  idx: number;
  version: string;
  when: number;
  tag: string;
  breakpoints: boolean;
};

async function tableExists(pool: Pool, tableName: string): Promise<boolean> {
  const res = await pool.query<{ exists: boolean }>(
    `SELECT to_regclass($1) IS NOT NULL AS exists`,
    [`public.${tableName}`]
  );
  return Boolean(res.rows[0]?.exists);
}

async function columnExists(
  pool: Pool,
  tableName: string,
  columnName: string
): Promise<boolean> {
  const res = await pool.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'public'
         AND table_name = $1
         AND column_name = $2
     ) AS exists`,
    [tableName, columnName]
  );
  return Boolean(res.rows[0]?.exists);
}

/**
 * Detect migrations already reflected in the live schema (e.g. DB was created
 * with drizzle-kit push / partial applies) so we can baseline the journal
 * without replaying destructive or non-idempotent SQL.
 */
async function detectAppliedTags(pool: Pool): Promise<Set<string>> {
  const applied = new Set<string>();

  const hasProfiles = await tableExists(pool, 'profiles');
  if (hasProfiles) {
    applied.add('0000_concerned_liz_osborn');
  }

  if (
    hasProfiles &&
    ((await columnExists(pool, 'profiles', 'onboarding_completed')) ||
      (await tableExists(pool, 'org_mission')))
  ) {
    applied.add('0001_community_persistence');
  }

  if (hasProfiles && (await columnExists(pool, 'profiles', 'telegram_chat_id'))) {
    applied.add('0002_telegram_chat_id');
  }

  // 0003 drops notes/decks/resources. Only baseline when the core schema exists
  // and those legacy tables are already gone.
  if (
    hasProfiles &&
    !(await tableExists(pool, 'notes')) &&
    !(await tableExists(pool, 'decks')) &&
    !(await tableExists(pool, 'resources'))
  ) {
    applied.add('0003_drop_legacy_resources');
  }

  return applied;
}

async function ensureMigrationsTable(pool: Pool): Promise<void> {
  await pool.query(`CREATE SCHEMA IF NOT EXISTS "${MIGRATIONS_SCHEMA}"`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);
}

async function getRecordedCreatedAts(pool: Pool): Promise<Set<number>> {
  const res = await pool.query<{ created_at: string }>(
    `SELECT created_at FROM "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}"`
  );
  return new Set(res.rows.map((row) => Number(row.created_at)));
}

async function baselineJournal(pool: Pool): Promise<string[]> {
  const journalPath = path.join(MIGRATIONS_FOLDER, 'meta', '_journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8')) as {
    entries: JournalEntry[];
  };

  await ensureMigrationsTable(pool);
  const recorded = await getRecordedCreatedAts(pool);
  const schemaApplied = await detectAppliedTags(pool);
  const baselined: string[] = [];

  for (const entry of journal.entries) {
    if (recorded.has(entry.when)) continue;
    if (!schemaApplied.has(entry.tag)) continue;

    const sqlPath = path.join(MIGRATIONS_FOLDER, `${entry.tag}.sql`);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    const hash = crypto.createHash('sha256').update(sql).digest('hex');

    await pool.query(
      `INSERT INTO "${MIGRATIONS_SCHEMA}"."${MIGRATIONS_TABLE}" ("hash", "created_at")
       VALUES ($1, $2)`,
      [hash, entry.when]
    );
    baselined.push(entry.tag);
  }

  return baselined;
}

async function runMigration() {
  const dbUrl =
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    process.env.DIRECT_URL ||
    '';

  if (!dbUrl) {
    console.error(
      '❌ Error: set NEON_DATABASE_URL or DATABASE_URL (local .env.local or CI secrets).'
    );
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon PostgreSQL...');
  const pool = new Pool({
    connectionString: dbUrl,
    // Neon pooler certs are valid; Node may still warn about sslmode aliases.
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🧭 Checking migration journal vs live schema...');
    const baselined = await baselineJournal(pool);
    if (baselined.length > 0) {
      console.log(
        `📌 Baselined already-applied migrations: ${baselined.join(', ')}`
      );
    } else {
      console.log('📌 Journal already matches schema (or fresh database).');
    }

    const db = drizzle(pool);

    console.log('📦 Applying pending Drizzle migrations...');
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    console.log('✅ Migrations applied successfully.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

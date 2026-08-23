import * as dotenv from 'dotenv';
import * as path from 'path';
import { neon } from '@neondatabase/serverless';

// Load .env.local from repo root
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env.local') });

export async function ensureTutorProfilesTable(connectionString?: string) {
  const dbUrl = (
    connectionString ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DIRECT_URL ||
    ''
  ).replace(/[&?]channel_binding=[^&]+/g, '').trim();

  if (!dbUrl) {
    console.warn('[ensureTutorProfilesTable] No DATABASE_URL provided, skipping table verification.');
    return;
  }

  try {
    const sql = neon(dbUrl);

    // 1. Create tutor_profiles table if it does not exist
    await sql`
      CREATE TABLE IF NOT EXISTS "tutor_profiles" (
        "id" uuid PRIMARY KEY REFERENCES "profiles"("id") ON DELETE CASCADE,
        "institution" text,
        "department" text,
        "specialization" text,
        "telegram_handle" text,
        "hourly_rate" text,
        "teaching_curriculums" text[],
        "teaching_subjects" text[],
        "availability_slots" jsonb,
        "is_active" boolean DEFAULT true,
        "verified" boolean DEFAULT false
      );
    `;

    // 2. Ensure all columns exist in case table was created previously with fewer columns
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "institution" text;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "department" text;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "specialization" text;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "telegram_handle" text;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "hourly_rate" text;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "teaching_curriculums" text[];`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "teaching_subjects" text[];`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "availability_slots" jsonb;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT true;`;
    await sql`ALTER TABLE "tutor_profiles" ADD COLUMN IF NOT EXISTS "verified" boolean DEFAULT false;`;

    console.log('✓ Successfully ensured "tutor_profiles" table schema in Neon PostgreSQL.');
  } catch (err: any) {
    console.error('[ensureTutorProfilesTable] Error ensuring table:', err?.message || err);
  }
}

export async function ensureContributorProfilesTable(connectionString?: string) {
  const dbUrl = (
    connectionString ||
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DIRECT_URL ||
    ''
  ).replace(/[&?]channel_binding=[^&]+/g, '').trim();

  if (!dbUrl) return;

  try {
    const sql = neon(dbUrl);

    await sql`
      CREATE TABLE IF NOT EXISTS "contributor_profiles" (
        "id" uuid PRIMARY KEY REFERENCES "profiles"("id") ON DELETE CASCADE,
        "website_url" text,
        "linkedin_url" text,
        "github_url" text,
        "contributor_level" text DEFAULT 'contributor'
      );
    `;

    await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "website_url" text;`;
    await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "linkedin_url" text;`;
    await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "github_url" text;`;
    await sql`ALTER TABLE "contributor_profiles" ADD COLUMN IF NOT EXISTS "contributor_level" text DEFAULT 'contributor';`;

    console.log('✓ Successfully ensured "contributor_profiles" table schema in Neon PostgreSQL.');
  } catch (err: any) {
    console.error('[ensureContributorProfilesTable] Error ensuring table:', err?.message || err);
  }
}

if (
  typeof require !== 'undefined' &&
  typeof module !== 'undefined' &&
  (require.main === module || (typeof process !== 'undefined' && process.argv?.[1]?.includes('ensure-tutor-table')))
) {
  Promise.all([ensureTutorProfilesTable(), ensureContributorProfilesTable()])
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

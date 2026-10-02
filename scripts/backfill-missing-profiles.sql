-- Backfill profiles for auth users missing a profiles row.
-- Enrollment FKs reference profiles.id; without this, Confirm & Enroll fails.
--
-- Preview orphans:
--   npx wrangler d1 execute the-ants-db --remote --command="SELECT u.id, u.email FROM user u LEFT JOIN profiles p ON p.id = u.id WHERE p.id IS NULL"
--
-- Apply:
--   npx wrangler d1 execute the-ants-db --remote --file=scripts/backfill-missing-profiles.sql

INSERT OR IGNORE INTO profiles (
  id, email, name, username, avatar_url, role, roles,
  is_public, onboarding_completed, leaderboard_visible, timezone, created_at, updated_at
)
SELECT
  u.id,
  u.email,
  COALESCE(NULLIF(TRIM(u.name), ''), printf('%s', substr(u.email, 1, instr(u.email, '@') - 1))),
  -- Unique username: email local-part (sanitized) + short id suffix
  lower(
    printf(
      '%s_%s',
      substr(
        replace(replace(replace(substr(u.email, 1, instr(u.email, '@') - 1), '.', '_'), '-', '_'), '+', '_'),
        1,
        18
      ),
      substr(replace(u.id, '-', ''), 1, 6)
    )
  ),
  u.image,
  'student',
  '["student"]',
  1,
  1,
  1,
  'UTC',
  CAST(strftime('%s', 'now') AS integer) * 1000,
  CAST(strftime('%s', 'now') AS integer) * 1000
FROM user u
WHERE NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

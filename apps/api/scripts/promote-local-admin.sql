-- Promote thawyezaw@gmail.com to admin in local D1 (run via npm run promote-admin:local)
UPDATE user
SET role = 'admin', updated_at = CAST(unixepoch() * 1000 AS INTEGER)
WHERE lower(email) = 'thawyezaw@gmail.com';

INSERT INTO profiles (
  id,
  email,
  name,
  username,
  created_at,
  updated_at,
  role,
  roles,
  is_public,
  onboarding_completed,
  timezone
)
SELECT
  u.id,
  u.email,
  u.name,
  'thawyezaw',
  CAST(unixepoch() * 1000 AS INTEGER),
  CAST(unixepoch() * 1000 AS INTEGER),
  'admin',
  '["admin"]',
  1,
  1,
  'UTC'
FROM user u
WHERE lower(u.email) = 'thawyezaw@gmail.com'
  AND NOT EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id);

UPDATE profiles
SET
  role = 'admin',
  roles = '["admin"]',
  is_public = 1,
  updated_at = CAST(unixepoch() * 1000 AS INTEGER)
WHERE lower(email) = 'thawyezaw@gmail.com';

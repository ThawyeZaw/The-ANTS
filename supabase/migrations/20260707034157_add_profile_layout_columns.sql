-- Add profile layout & customization columns to profiles table
-- These columns support the profile editor's layout controls

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS section_order jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS spacing text DEFAULT NULL CHECK (spacing IS NULL OR spacing IN ('compact', 'spacious')),
  ADD COLUMN IF NOT EXISTS width text DEFAULT NULL CHECK (width IS NULL OR width IN ('full', 'contained')),
  ADD COLUMN IF NOT EXISTS section_layout text DEFAULT NULL CHECK (section_layout IS NULL OR section_layout IN ('layout-a', 'layout-b', 'layout-c')),
  ADD COLUMN IF NOT EXISTS theme jsonb DEFAULT NULL;

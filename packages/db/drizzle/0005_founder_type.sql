-- Migration 0005: Add founder_type column to profiles table.
-- Idempotent — safe to re-run. Values: 'founder' | 'co_founder' | null.

ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "founder_type" text DEFAULT NULL;

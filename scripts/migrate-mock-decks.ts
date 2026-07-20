/**
 * migrate-mock-decks.ts
 *
 * One-shot script to migrate mock decks and cards from lib/mock/database.ts
 * into Supabase. Run once during implementation.
 *
 * Usage:
 *   npx tsx scripts/migrate-mock-decks.ts
 *
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from '@supabase/supabase-js';

// Load env (simple dotenv-like parsing)
const env: Record<string, string> = {};
try {
  const fs = require('fs');
  const path = require('path');
  const envPath = path.resolve(__dirname, '..', '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    let value = trimmed.substring(eqIdx + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[key] = value;
  }
} catch {
  console.log('No .env.local found — using process.env');
  Object.assign(env, process.env);
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    '❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.\n' +
    '   Add SUPABASE_SERVICE_ROLE_KEY to your .env.local file.'
  );
  process.exit(1);
}

async function main() {
  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false },
  });

  console.log('🔌 Connected to Supabase:', SUPABASE_URL);

  // ── Step 1: Load mock data ─────────────────────────────────────────────
  let mockDecks: any[] = [];
  let mockCards: any[] = [];

  try {
    // Dynamic import — path relative to project root
    const mockModule = await import('../src/lib/mock/database');
    mockDecks = mockModule.mockDecks ?? [];
    mockCards = mockModule.mockCards ?? [];
  } catch (err) {
    console.error('❌ Failed to load mock database:', err);
    process.exit(1);
  }

  console.log(`📦 Found ${mockDecks.length} mock decks, ${mockCards.length} mock cards`);

  if (mockDecks.length === 0) {
    console.log('No mock decks to migrate. Exiting.');
    process.exit(0);
  }

  // ── Step 2: Upsert decks ──────────────────────────────────────────────
  console.log('📝 Upserting decks...');
  let deckSuccess = 0;
  let deckFail = 0;

  for (const deck of mockDecks) {
    const { error } = await supabase.from('decks').upsert(
      {
        id: deck.id,
        owner_id: deck.owner_id,
        name: deck.name,
        description: deck.description ?? null,
        category: deck.category ?? null,
        curriculum_id: deck.curriculum_id ?? null,
        subject_id: deck.subject_id ?? null,
        exam_board: deck.exam_board ?? null,
        syllabus_code: deck.syllabus_code ?? null,
        is_public: deck.is_public ?? false,
        created_at: deck.created_at ?? new Date().toISOString(),
      },
      { onConflict: 'id' }
    );

    if (error) {
      console.error(`  ❌ Deck "${deck.name}" (${deck.id}):`, error.message);
      deckFail++;
    } else {
      deckSuccess++;
    }
  }

  console.log(`  ✅ ${deckSuccess} decks upserted, ❌ ${deckFail} failed`);

  // ── Step 3: Upsert cards ──────────────────────────────────────────────
  if (mockCards.length > 0) {
    console.log('🃏 Upserting cards...');
    let cardSuccess = 0;
    let cardFail = 0;

    // Batch in groups of 50 to avoid request size limits
    for (let i = 0; i < mockCards.length; i += 50) {
      const batch = mockCards.slice(i, i + 50).map((card: any) => ({
        id: card.id,
        deck_id: card.deck_id,
        front_text: card.front_text,
        back_text: card.back_text,
        hint: card.hint ?? null,
        media_url: card.media_url ?? null,
        created_at: card.created_at ?? new Date().toISOString(),
      }));

      const { error } = await supabase.from('cards').upsert(batch, {
        onConflict: 'id',
      });

      if (error) {
        console.error(`  ❌ Batch ${Math.floor(i / 50) + 1}:`, error.message);
        cardFail += batch.length;
      } else {
        cardSuccess += batch.length;
      }
    }

    console.log(`  ✅ ${cardSuccess} cards upserted, ❌ ${cardFail} failed`);
  }

  console.log('\n🎉 Migration complete!');
  console.log(`   Decks:  ${deckSuccess} succeeded, ${deckFail} failed`);
  console.log(`   Cards:  ${mockCards.length > 0 ? 'processed' : 'none'} (${mockCards.length} total)`);
}

main().catch(console.error);

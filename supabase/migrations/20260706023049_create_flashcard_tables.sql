-- ============================================================================
-- The ANTS — Migration 6: Flashcards
-- Spaced repetition system: decks, cards, and review tracking.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.decks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    curriculum_id   UUID REFERENCES public.curriculums(id) ON DELETE SET NULL,
    subject_id      UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    name            TEXT,
    description     TEXT,
    category        TEXT,
    is_public       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.cards (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id     UUID NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
    front_text  TEXT,
    back_text   TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.card_reviews (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id           UUID NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
    user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    ease_factor       NUMERIC DEFAULT 2.5,
    interval          INT4 DEFAULT 0,
    repetitions       INT4 DEFAULT 0,
    next_review_date  TIMESTAMPTZ,
    last_review_date  TIMESTAMPTZ,
    quality           INT4
);

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Flashcard Deck Detail Loading Skeleton
// ──────────────────────────────────────────────────────────────────────────────

export default function FlashcardLoading() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 animate-pulse">
      <div className="text-4xl">🃏</div>
      <p className="text-sm text-[var(--foreground-muted)]">Loading deck...</p>
    </div>
  );
}

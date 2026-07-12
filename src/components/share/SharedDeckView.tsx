'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — SharedDeckView
// Displays a shared flashcard deck by token.
// ──────────────────────────────────────────────────────────────────────────────

interface SharedDeckViewProps {
  token: string;
}

export default function SharedDeckView({ token }: SharedDeckViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Shared Flashcard Deck</h2>
      <p className="text-sm text-[var(--foreground-muted)]">Token: {token}</p>
    </div>
  );
}

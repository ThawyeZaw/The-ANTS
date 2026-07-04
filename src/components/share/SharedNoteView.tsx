'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — SharedNoteView
// Displays a shared study note by token.
// ──────────────────────────────────────────────────────────────────────────────

interface SharedNoteViewProps {
  token: string;
}

export default function SharedNoteView({ token }: SharedNoteViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Shared Note</h2>
      <p className="text-sm text-[var(--foreground-muted)]">Token: {token}</p>
    </div>
  );
}

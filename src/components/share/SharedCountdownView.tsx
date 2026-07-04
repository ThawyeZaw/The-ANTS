'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — SharedCountdownView
// Displays a shared exam countdown by token.
// ──────────────────────────────────────────────────────────────────────────────

interface SharedCountdownViewProps {
  token: string;
}

export default function SharedCountdownView({ token }: SharedCountdownViewProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <h2 className="text-xl font-bold text-[var(--foreground)] mb-2">Shared Countdown</h2>
      <p className="text-sm text-[var(--foreground-muted)]">Token: {token}</p>
    </div>
  );
}

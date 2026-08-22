'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Join Session Client Component
// Lets a user enter a join code to participate in a live quiz session.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, ArrowRight, Brain, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { actionGetSessionByCode } from '@/actions/quizzes';

export default function JoinSessionClient() {
  const { user } = useAuth();
  const router = useRouter();
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  if (!user) return null;

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!joinCode.trim()) return;

    setJoining(true);
    setError('');

    const result = await actionGetSessionByCode(joinCode.trim().toUpperCase());
    if (result.success) {
      const session = result.data as any;
      router.push(`/quizzes/play/${session.id}`);
    } else {
      setError(result.error ?? 'Session not found. Check your join code.');
    }
    setJoining(false);
  }

  return (
    <div className="space-y-6 max-w-md mx-auto">
      <BackButton href="/quizzes" label="Back to Quizzes" />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Play className="h-6 w-6 text-[var(--warning)]" />
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Join Live Session</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">
              Enter the 6-character code shown on the host&apos;s screen.
            </p>
          </div>
        </div>

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <input
              value={joinCode}
              onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setError(''); }}
              placeholder="Enter join code"
              maxLength={6}
              className="w-full text-center text-2xl font-bold tracking-[0.3em] rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 px-4 py-4 text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] uppercase"
              autoComplete="off"
            />
            {error && (
              <p className="mt-2 text-xs text-[var(--error)]">{error}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={joinCode.length < 4 || joining}
          >
            {joining ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</>
            ) : (
              <><ArrowRight className="mr-2 h-4 w-4" /> Join Session</>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}

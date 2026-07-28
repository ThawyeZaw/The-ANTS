'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Host Live Session Client Component
// Creates a live quiz session and displays the join code + participant list.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Copy, Check, Users, Brain, ArrowLeft, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { actionGetQuizById, actionCreateSession } from '@/actions/quizzes';
import type { QuizStandaloneUser, QuizSession } from '@/types/quiz';

interface HostSessionClientProps {
  quizId: string;
}

export default function HostSessionClient({ quizId }: HostSessionClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [quiz, setQuiz] = useState<QuizStandaloneUser | null>(null);
  const [session, setSession] = useState<QuizSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    actionGetQuizById(quizId).then((result) => {
      if (result.success) {
        setQuiz(result.data as unknown as QuizStandaloneUser);
      } else {
        setError(result.error ?? 'Quiz not found');
      }
      setLoading(false);
    });
  }, [quizId]);

  const handleCreateSession = useCallback(async () => {
    if (!user) return;
    setCreating(true);
    setError('');
    const result = await actionCreateSession(quizId, user.id);
    if (result.success) {
      setSession(result.data as unknown as QuizSession);
    } else {
      setError(result.error ?? 'Failed to create session');
    }
    setCreating(false);
  }, [quizId, user]);

  const handleCopyCode = useCallback(() => {
    if (!session) return;
    navigator.clipboard.writeText(session.join_code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [session]);

  if (!user) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="space-y-6">
        <BackButton href="/quizzes" label="Back to Quizzes" />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <Brain className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          <p className="text-sm font-medium text-[var(--foreground-secondary)]">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <BackButton href={`/quizzes/${quizId}`} label="Back to Quiz" />

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center gap-3 mb-4">
          <Play className="h-6 w-6 text-[var(--warning)]" />
          <div>
            <h1 className="text-lg font-bold text-[var(--foreground)]">Host Live Session</h1>
            <p className="text-sm text-[var(--foreground-secondary)]">{quiz?.title}</p>
          </div>
        </div>

        {!session && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--foreground-secondary)]">
              Start a live quiz session. Players will join using a unique code on their devices.
            </p>
            <Button
              onClick={handleCreateSession}
              disabled={creating}
              className="w-full"
            >
              {creating ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Session...</>
              ) : (
                <><Play className="mr-2 h-4 w-4" /> Start Session</>
              )}
            </Button>
            {error && (
              <p className="text-xs text-[var(--error)]">{error}</p>
            )}
          </div>
        )}

        {session && (
          <div className="space-y-6">
            {/* Join code display */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/50 p-6 text-center">
              <p className="text-xs font-medium text-[var(--foreground-muted)] uppercase tracking-wider mb-2">
                Join Code
              </p>
              <p className="text-5xl font-bold tracking-[0.25em] text-[var(--primary)] mb-3">
                {session.join_code}
              </p>
              <Button variant="secondary" size="sm" onClick={handleCopyCode}>
                {copied ? <><Check className="mr-1 h-3.5 w-3.5" /> Copied!</> : <><Copy className="mr-1 h-3.5 w-3.5" /> Copy Code</>}
              </Button>
            </div>

            {/* Status */}
            <div className="flex items-center justify-center gap-2 text-sm text-[var(--foreground-secondary)]">
              <Users className="h-4 w-4" />
              <span>Waiting for players to join...</span>
            </div>

            {/* Manage */}
            <div className="flex items-center gap-3">
              <Button
                className="flex-1"
                onClick={() => router.push(`/quizzes/play/${session.id}`)}
              >
                <Play className="mr-2 h-4 w-4" /> View Session Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

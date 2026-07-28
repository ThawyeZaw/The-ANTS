'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Play Session Client Component
// The real-time quiz session page (player or host dashboard).
// Shows current question, participants, and scores.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Brain, Loader2, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { actionGetSessionByCode } from '@/actions/quizzes';
import { useQuizSession } from '@/hooks/useQuizSession';
import { useQuizSessionHost } from '@/hooks/useQuizSessionHost';

interface PlaySessionClientProps {
  sessionId: string;
}

export default function PlaySessionClient({ sessionId }: PlaySessionClientProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [joinDisplayName, setJoinDisplayName] = useState('');
  const [joinForm, setJoinForm] = useState(true);

  const { session, participants, currentQuestionIndex, isConnected, submitAnswer } =
    useQuizSession(sessionId, user?.id);

  if (!user) return null;

  // Loading state
  if (!session) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // Determine if this user is the host
  const isHost = session.host_id === user.id;

  return (
    <div className="space-y-6">
      <BackButton href="/quizzes" label="Leave Session" />

      {/* Connection status */}
      <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-[var(--accent)]" />
          <div>
            <p className="text-sm font-semibold text-[var(--foreground)]">
              Live Session
            </p>
            <p className="text-xs text-[var(--foreground-secondary)]">
              Code: <span className="font-mono font-bold text-[var(--primary)]">{session.join_code}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className={`inline-block h-2 w-2 rounded-full ${isConnected ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`} />
          <span className="text-[var(--foreground-muted)]">
            {isConnected ? 'Connected' : 'Connecting...'}
          </span>
          <span className="flex items-center gap-1 ml-2 text-[var(--foreground-muted)]">
            <Users className="h-3.5 w-3.5" />
            {participants.length}
          </span>
        </div>
      </div>

      {/* Status-based content */}
      {session.status === 'waiting' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] py-20 text-center">
          <Users className="h-14 w-14 text-[var(--foreground-muted)] mb-4" />
          <p className="text-sm font-medium text-[var(--foreground-secondary)]">
            {isHost ? 'Waiting for players...' : 'Waiting for the host to start...'}
          </p>
          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
            {isHost
              ? 'Players will appear here as they join.'
              : 'The quiz will begin shortly.'}
          </p>
          {isHost && participants.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {participants.map((p) => (
                <span
                  key={p.id}
                  className="rounded-full bg-[var(--primary-light)] px-3 py-1 text-xs font-medium text-[var(--primary)]"
                >
                  {p.display_name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {session.status === 'active' && (
        <div className="space-y-4">
          <p className="text-center text-sm text-[var(--foreground-secondary)]">
            {isHost ? (
              <span>Question {currentQuestionIndex + 1} — Use the host dashboard to advance.</span>
            ) : (
              <span>Question {currentQuestionIndex + 1} — Select your answer below.</span>
            )}
          </p>
          <div className="flex items-center justify-center py-12 text-[var(--foreground-muted)]">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span className="text-sm">
              {isHost ? 'Host dashboard controls coming soon.' : 'Answer input coming soon.'}
            </span>
          </div>
        </div>
      )}

      {session.status === 'finished' && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)] py-16 text-center">
          <Brain className="h-14 w-14 text-[var(--accent)] mb-4" />
          <p className="text-lg font-bold text-[var(--foreground)]">Session Ended</p>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
            Thanks for participating!
          </p>
          <div className="flex items-center gap-3 mt-6">
            <Button variant="secondary" onClick={() => router.push('/quizzes')}>
              Back to Quizzes
            </Button>
          </div>
        </div>
      )}

      {/* Participants list (sidebar-style) */}
      {participants.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Participants ({participants.length})
          </h3>
          <div className="space-y-2">
            {participants.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg bg-[var(--background-secondary)]/30 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-bold text-[var(--primary)]">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)]">
                    {p.display_name}
                  </span>
                </div>
                <span className="text-sm font-bold text-[var(--primary)]">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

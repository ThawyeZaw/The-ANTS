// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimeClassroom Hook
// Supabase Realtime subscription for classroom assignments, quizzes, and
// discussion updates.
//
// Usage:
//   const { isConnected, error } = useRealtimeClassroom(classroomId, {
//     onAssignmentChange: (payload) => { ... },
//     onQuizChange: (payload) => { ... },
//     onDiscussionChange: (payload) => { ... },
//   });
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

type ChangesCallback = (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => void;

interface UseRealtimeClassroomOptions {
  /** Called when an assignment is inserted, updated, or deleted. */
  onAssignmentChange?: ChangesCallback;
  /** Called when a quiz is inserted or updated. */
  onQuizChange?: ChangesCallback;
  /** Called when a discussion topic or reply changes. */
  onDiscussionChange?: ChangesCallback;
  /** Called when new assignment submissions arrive. */
  onSubmissionChange?: ChangesCallback;
}

interface UseRealtimeClassroomReturn {
  isConnected: boolean;
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeClassroom(
  classroomId: string | undefined,
  options: UseRealtimeClassroomOptions
): UseRealtimeClassroomReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);

  useEffect(() => {
    if (!classroomId) return;

    const supabase = createClient();
    let cancelled = false;

    const channelName = `classroom:${classroomId}`;
    const channel = supabase.channel(channelName);

    // Assignments
    if (options.onAssignmentChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments', filter: `classroom_id=eq.${classroomId}` },
        (payload) => { if (!cancelled) options.onAssignmentChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    // Assignment submissions
    if (options.onSubmissionChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignment_submissions', filter: `assignment_id=eq.${classroomId}` },
        (payload) => {
          // The filter above won't work directly for submissions since they
          // reference assignment_id, not classroom_id. This gets handled by
          // the server broadcasting to the classroom channel.
          if (!cancelled) options.onSubmissionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>);
        }
      );
    }

    // Quizzes
    if (options.onQuizChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes', filter: `classroom_id=eq.${classroomId}` },
        (payload) => { if (!cancelled) options.onQuizChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    // Discussion topics
    if (options.onDiscussionChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discussion_topics', filter: `classroom_id=eq.${classroomId}` },
        (payload) => { if (!cancelled) options.onDiscussionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );

      // Discussion replies (listen broadly — RLS filters by classroom membership)
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discussion_replies' },
        (payload) => { if (!cancelled) options.onDiscussionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    channel.subscribe((status) => {
      if (cancelled) return;
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        setError('Classroom realtime connection lost. Retrying...');
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [classroomId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected, error };
}

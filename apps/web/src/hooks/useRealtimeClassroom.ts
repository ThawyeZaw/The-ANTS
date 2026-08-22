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

type RealtimeChannel = any;
type RealtimePostgresChangesPayload<T = any> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: T;
  schema: string;
  table: string;
  commit_timestamp: string;
  errors: string[];
};

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!classroomId) return;

    const supabase = createClient()!;
    let cancelled = false;

    const channelName = `classroom:${classroomId}`;
    const channel = supabase.channel(channelName);

    // Assignments
    if (options.onAssignmentChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignments', filter: `classroom_id=eq.${classroomId}` },
        (payload: any) => { if (!cancelled) options.onAssignmentChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    // Assignment submissions
    if (options.onSubmissionChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'assignment_submissions' },
        (payload: any) => {
          if (!cancelled) options.onSubmissionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>);
        }
      );
    }

    // Quizzes
    if (options.onQuizChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quizzes', filter: `classroom_id=eq.${classroomId}` },
        (payload: any) => { if (!cancelled) options.onQuizChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    // Discussion topics
    if (options.onDiscussionChange) {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'discussion_topics', filter: `classroom_id=eq.${classroomId}` },
        (payload: any) => { if (!cancelled) options.onDiscussionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );

      // Discussion replies
      channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'discussion_replies' },
        (payload: any) => { if (!cancelled) options.onDiscussionChange?.(payload as RealtimePostgresChangesPayload<Record<string, unknown>>); }
      );
    }

    channel.subscribe((status: any) => {
      if (cancelled) return;
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setError(null);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setError('Classroom realtime connection lost. Retrying...');
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  return { isConnected, error };
}

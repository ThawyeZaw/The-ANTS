// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimeChat Hook
// Supabase Realtime subscription for club chat messages.
//
// Usage:
//   const { messages, sendMessage, isConnected } = useRealtimeChat(clubId, userId);
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

/** A club message row from the database (snake_case). */
export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

/** Sender profile for display. */
export interface MessageSender {
  id: string;
  name: string;
  avatar_url?: string;
}

interface UseRealtimeChatReturn {
  /** Messages for the current session, newest last. */
  messages: ClubMessage[];
  /** Sender profiles keyed by user_id. */
  senders: Map<string, MessageSender>;
  /** Send a message to the club. */
  sendMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  /** Whether the realtime channel is connected. */
  isConnected: boolean;
  /** Whether there's an error with the subscription. */
  error: string | null;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimeChat(
  _clubId: string | undefined,
  _userId: string | undefined
): UseRealtimeChatReturn {
  const sendMessage = useCallback(
    async (_message: string): Promise<{ success: boolean; error?: string }> => {
      return { success: false, error: 'Club chat is no longer available.' };
    },
    []
  );

  return { messages: [], senders: new Map(), sendMessage, isConnected: false, error: 'Club chat has been removed.' };
}

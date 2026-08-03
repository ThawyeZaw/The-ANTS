// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimeChat Hook (Deprecated)
//
// Club chat has been removed from the web app. Members communicate via
// dedicated Telegram groups instead (configured per-club by admins).
//
// This file is retained as a stub to satisfy existing import sites without
// requiring a cascade of component edits. All references should be cleaned up
// in a future sprint.
// ──────────────────────────────────────────────────────────────────────────────

'use client';

// ── Types ────────────────────────────────────────────────────────────────────

/** @deprecated Club chat has moved to Telegram. */
export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

/** @deprecated Club chat has moved to Telegram. */
export interface MessageSender {
  id: string;
  name: string;
  avatar_url?: string;
}

/** @deprecated Club chat has moved to Telegram. */
export function useRealtimeChat(
  _clubId: string | undefined,
  _userId: string | undefined
): {
  messages: ClubMessage[];
  senders: Map<string, MessageSender>;
  sendMessage: (_message: string) => Promise<{ success: boolean; error?: string }>;
  isConnected: boolean;
  error: string | null;
} {
  return {
    messages: [],
    senders: new Map(),
    sendMessage: async () => ({ success: false, error: 'Chat has moved to Telegram.' }),
    isConnected: false,
    error: null, // null — not an error, just not available
  };
}

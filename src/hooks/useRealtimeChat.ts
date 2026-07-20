// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimeChat Hook
// Supabase Realtime subscription for club chat messages.
//
// Usage:
//   const { messages, sendMessage, isConnected } = useRealtimeChat(clubId, userId);
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

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
  clubId: string | undefined,
  userId: string | undefined
): UseRealtimeChatReturn {
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [senders, setSenders] = useState<Map<string, MessageSender>>(new Map());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();
  if (!supabase) return;

  // ── Subscribe to club messages ─────────────────────────────────────────
  useEffect(() => {
    if (!clubId || !userId) return;

    let cancelled = false;

    // Load initial messages
    const loadInitial = async () => {
      const { data, error: fetchErr } = await supabase
        .from('club_messages')
        .select('id, club_id, sender_id, message, created_at')
        .eq('club_id', clubId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (cancelled) return;

      if (fetchErr) {
        setError(fetchErr.message);
        return;
      }

      setMessages((data as unknown as ClubMessage[]) ?? []);

      // Fetch sender profiles for all unique sender_ids
      if (data) {
        const senderIds = [...new Set(data.map((m: any) => m.sender_id))];
        if (senderIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .in('id', senderIds);

          if (profiles) {
            const map = new Map<string, MessageSender>();
            for (const p of profiles) {
              map.set(p.id, { id: p.id, name: p.name ?? 'Unknown', avatar_url: p.avatar_url ?? undefined });
            }
            setSenders(map);
          }
        }
      }
    };

    loadInitial();

    // Subscribe to realtime INSERT on club_messages for this club
    const channel = supabase
      .channel(`club:${clubId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`,
        },
        (payload: RealtimePostgresChangesPayload<ClubMessage>) => {
          if (cancelled) return;
          const newMsg = payload.new as ClubMessage;
          if (newMsg) {
            setMessages((prev) => [...prev, newMsg]);

            // Fetch sender profile if not already cached
            setSenders((prev) => {
              if (prev.has(newMsg.sender_id)) return prev;
              // Trigger profile fetch
              supabase
                .from('profiles')
                .select('id, name, avatar_url')
                .eq('id', newMsg.sender_id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setSenders((current) => {
                      const next = new Map(current);
                      next.set(data.id, { id: data.id, name: data.name ?? 'Unknown', avatar_url: data.avatar_url ?? undefined });
                      return next;
                    });
                  }
                });
              return prev;
            });
          }
        }
      )
      .subscribe((status) => {
        if (cancelled) return;
        if (status === 'SUBSCRIBED') {
          setIsConnected(true);
          setError(null);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setError('Failed to connect to chat. Retrying...');
          setIsConnected(false);
        }
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [clubId, userId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Send message ───────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (message: string): Promise<{ success: boolean; error?: string }> => {
      if (!clubId || !userId) {
        return { success: false, error: 'Not authenticated or no club selected.' };
      }

      if (!message.trim()) {
        return { success: false, error: 'Message cannot be empty.' };
      }

      const { error: insertErr } = await supabase
        .from('club_messages')
        .insert({
          club_id: clubId,
          sender_id: userId,
          message: message.trim(),
        });

      if (insertErr) {
        return { success: false, error: insertErr.message };
      }

      return { success: true };
    },
    [clubId, userId] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return { messages, senders, sendMessage, isConnected, error };
}

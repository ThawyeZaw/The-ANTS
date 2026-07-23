// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimePresence Hook
// Tracks online users in a club or classroom via Supabase Realtime presence.
//
// Usage:
//   const { onlineUsers, isConnected } = useRealtimePresence('club:abc-123', userInfo);
// ──────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel, RealtimePresenceState } from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface PresenceUser {
  user_id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

interface UseRealtimePresenceReturn {
  /** Array of currently online users in the channel. */
  onlineUsers: PresenceUser[];
  /** Whether the presence channel is connected. */
  isConnected: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function flattenPresence(state: RealtimePresenceState): PresenceUser[] {
  const seen = new Set<string>();
  const users: PresenceUser[] = [];

  for (const key of Object.keys(state)) {
    const presences = state[key] as unknown as PresenceUser[];
    for (const p of presences) {
      if (!seen.has(p.user_id)) {
        seen.add(p.user_id);
        users.push(p);
      }
    }
  }

  return users;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useRealtimePresence(
  channelName: string | undefined,
  currentUser: {
    user_id: string;
    name: string;
    avatar_url?: string;
  } | null
): UseRealtimePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!channelName || !currentUser) return;

    const supabase = createClient()!;
    let cancelled = false;

    const channel = supabase.channel(channelName, {
      config: { presence: { key: currentUser.user_id } },
    });

    channel.on('presence', { event: 'sync' }, () => {
      if (cancelled) return;
      const state = channel.presenceState<PresenceUser>();
      setOnlineUsers(flattenPresence(state));
    });

    channel.on('presence', { event: 'join' }, () => {
      if (cancelled) return;
      const state = channel.presenceState<PresenceUser>();
      setOnlineUsers(flattenPresence(state));
    });

    channel.on('presence', { event: 'leave' }, () => {
      if (cancelled) return;
      const state = channel.presenceState<PresenceUser>();
      setOnlineUsers(flattenPresence(state));
    });

    channel.subscribe(async (status) => {
      if (cancelled) return;

      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        await channel.track({
          user_id: currentUser.user_id,
          name: currentUser.name,
          avatar_url: currentUser.avatar_url,
          online_at: new Date().toISOString(),
        });
      } else {
        setIsConnected(false);
      }
    });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
    };
  }, [channelName, currentUser?.user_id]); // eslint-disable-line react-hooks/exhaustive-deps

  return { onlineUsers, isConnected };
}

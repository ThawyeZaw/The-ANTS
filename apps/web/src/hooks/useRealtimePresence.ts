'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — useRealtimePresence Hook (Presence & Online Status)
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export interface PresenceUser {
  user_id: string;
  name: string;
  avatar_url?: string;
  online_at: string;
}

interface UseRealtimePresenceReturn {
  onlineUsers: PresenceUser[];
  isConnected: boolean;
}

export function useRealtimePresence(
  channelName: string | undefined,
  currentUser: {
    user_id: string;
    name: string;
    avatar_url?: string;
  } | null
): UseRealtimePresenceReturn {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    if (!channelName || !currentUser) {
      setOnlineUsers([]);
      setIsConnected(false);
      return;
    }

    setIsConnected(true);
    setOnlineUsers([
      {
        user_id: currentUser.user_id,
        name: currentUser.name,
        avatar_url: currentUser.avatar_url,
        online_at: new Date().toISOString(),
      },
    ]);
  }, [channelName, currentUser?.user_id]);

  return { onlineUsers, isConnected };
}

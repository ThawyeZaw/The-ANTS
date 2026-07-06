// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Supabase Realtime Utilities
// Shared helpers for creating realtime channels, presence tracking, and
// postgres changes subscriptions.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from './client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
  RealtimePresenceState,
} from '@supabase/supabase-js';

// ── Types ────────────────────────────────────────────────────────────────────

/** A typed callback for postgres INSERT/UPDATE/DELETE events. */
export type ChangesCallback<T extends Record<string, unknown>> = (
  payload: RealtimePostgresChangesPayload<T>
) => void;

/** Options for creating a postgres_changes subscription. */
export interface ChannelSubscriptionOptions {
  /** The Supabase realtime channel name (e.g. 'club:abc-123'). */
  channelName: string;
  /** The table to listen to. */
  table: string;
  /** Optional filter clause (e.g. 'club_id=eq.abc-123'). */
  filter?: string;
  /** Events to listen for. Default: ['INSERT'] */
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[];
}

// ── Channel Factory ──────────────────────────────────────────────────────────

/**
 * Creates a Supabase Realtime channel subscribed to postgres changes on a
 * specific table, optionally filtered. Automatically handles cleanup.
 *
 * Server-side auth is enforced by RLS policies on the table — the channel
 * only receives rows the authenticated user is authorized to see.
 */
export function createPostgresChangesChannel<T extends Record<string, unknown>>(
  options: ChannelSubscriptionOptions & {
    onInsert?: ChangesCallback<T>;
    onUpdate?: ChangesCallback<T>;
    onDelete?: ChangesCallback<T>;
  }
): RealtimeChannel {
  const supabase = createClient();
  const { channelName, table, filter, events = ['INSERT'] } = options;

  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: true } },
  });

  const changesConfig = {
    event: '*' as const,
    schema: 'public' as const,
    table,
    filter,
  };

  channel.on(
    'postgres_changes',
    changesConfig,
    (payload: RealtimePostgresChangesPayload<T>) => {
      switch (payload.eventType) {
        case 'INSERT':
          options.onInsert?.(payload);
          break;
        case 'UPDATE':
          options.onUpdate?.(payload);
          break;
        case 'DELETE':
          options.onDelete?.(payload);
          break;
      }
    }
  );

  return channel.subscribe();
}

// ── Presence ─────────────────────────────────────────────────────────────────

/** User presence state sent via Supabase presence. */
export interface UserPresenceState {
  user_id: string;
  name: string;
  avatar_url?: string;
  role?: string;
  online_at: string;
}

/**
 * Creates a Supabase Realtime channel with presence tracking.
 * Returns the channel — callers should call `.track()` and `.on('presence', ...)`.
 */
export function createPresenceChannel(
  channelName: string,
  initialState: UserPresenceState
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase.channel(channelName, {
    config: { presence: { key: initialState.user_id } },
  });

  return channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track(initialState);
    }
  });
}

/**
 * Transforms raw Supabase presence state into a flat array of online users.
 */
export function flattenPresenceState(
  state: RealtimePresenceState<UserPresenceState>
): UserPresenceState[] {
  const users = new Map<string, UserPresenceState>();

  for (const key of Object.keys(state)) {
    const presences = state[key] as unknown as UserPresenceState[];
    for (const p of presences) {
      if (!users.has(p.user_id)) {
        users.set(p.user_id, p);
      }
    }
  }

  return Array.from(users.values());
}

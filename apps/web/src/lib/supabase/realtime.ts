// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Realtime helper (Polling / WebSocket ready)
// ──────────────────────────────────────────────────────────────────────────────

export function createRealtimeChannel(channelName: string) {
  return {
    on: () => ({ subscribe: () => {} }),
    subscribe: () => ({ unsubscribe: () => {} }),
    unsubscribe: () => {},
  };
}

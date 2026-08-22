const DEFAULT_STALE_TIME_MS = 300_000; // 5 minutes
const LS_PREFIX = "ants_cache_";

// ── memory cache ──────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleTimeMs: number;
  persist: boolean;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

// ── localStorage helpers ──────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function cacheGet<T = unknown>(key: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    // validate structure
    if (!entry || typeof entry._timestamp !== "number") return null;
    return entry.data as T;
  } catch {
    return null;
  }
}

export function cacheSet(key: string, value: unknown, staleTimeMs?: number): void {
  if (!isBrowser()) return;
  try {
    const entry = { data: value, _timestamp: Date.now(), staleTimeMs: staleTimeMs ?? DEFAULT_STALE_TIME_MS };
    localStorage.setItem(LS_PREFIX + key, JSON.stringify(entry));
  } catch {
    // storage full or unavailable — silently ignore
  }
}

export function cacheDelete(key: string): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LS_PREFIX + key);
  } catch {
    // ignore
  }
}

function clearAllLS(): void {
  if (!isBrowser()) return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(LS_PREFIX)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ── invalidation via window event ─────────────────────────────────

if (isBrowser()) {
  window.addEventListener("supabase-cache-invalidate", ((e: CustomEvent<string | undefined>) => {
    const key = e.detail;
    if (key) {
      invalidateCache(key);
    } else {
      invalidateCache();
    }
  }) as EventListener);
}

// ── public API ────────────────────────────────────────────────────

function isCacheValid(entry: CacheEntry<unknown>): boolean {
  return Date.now() - entry.timestamp < entry.staleTimeMs;
}

/**
 * Invalidate a single key or the entire cache (memory + localStorage).
 */
export function invalidateCache(key?: string): void {
  if (key) {
    memoryCache.delete(key);
    cacheDelete(key);
  } else {
    memoryCache.clear();
    inFlight.clear(); // also clear in-flight so fresh requests can fire
    clearAllLS();
  }
}

/**
 * Typed async query with in-memory caching, request deduplication, and
 * optional localStorage persistence.
 *
 * @param key        Unique cache key for this query.
 * @param fetcher    Async function that produces fresh data.
 * @param options    staleTimeMs (default 5 min) and persist (default false).
 */
export function cachedQuery<T>(
  key: string,
  fetcher: () => any,
  options?: { staleTimeMs?: number; persist?: boolean },
): Promise<T> {
  const staleTimeMs = options?.staleTimeMs ?? DEFAULT_STALE_TIME_MS;
  const persist = options?.persist ?? false;

  // 1. Check memory cache
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && isCacheValid(cached)) {
    return Promise.resolve(cached.data);
  }

  // 2. Deduplicate: return in-flight promise if exists
  const existing = inFlight.get(key);
  if (existing) {
    return existing as Promise<T>;
  }

  // 3. Check localStorage persistence (only when memory miss)
  if (persist) {
    const lsEntry = cacheGet<{ data: T; _timestamp: number; staleTimeMs: number }>(key);
    if (lsEntry && typeof (lsEntry as any)._timestamp === "number") {
      const raw = lsEntry as unknown as { data: T; _timestamp: number; staleTimeMs: number };
      const lsStaleTimeMs = raw.staleTimeMs ?? DEFAULT_STALE_TIME_MS;
      if (Date.now() - raw._timestamp < lsStaleTimeMs) {
        // Also populate memory cache from LS so next hit is instant
        memoryCache.set(key, { data: raw.data, timestamp: raw._timestamp, staleTimeMs: lsStaleTimeMs, persist: true });
        return Promise.resolve(raw.data);
      }
    }
  }

  // 4. Fetch fresh data
  const promise = fetcher()
    .then((data: T) => {
      // Store in memory cache
      memoryCache.set(key, { data, timestamp: Date.now(), staleTimeMs, persist } as CacheEntry<unknown>);
      // Persist to localStorage if requested
      if (persist) {
        cacheSet(key, data, staleTimeMs);
      }
      return data;
    })
    .finally(() => {
      inFlight.delete(key);
    });

  // Register in-flight
  inFlight.set(key, promise);

  return promise;
}

type CacheEntry<T> = { expiresAt: number; value: T };

const store = new Map<string, CacheEntry<unknown>>();

export function remember<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return Promise.resolve(hit.value);

  return compute().then((value) => {
    store.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  });
}

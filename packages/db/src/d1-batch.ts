/** Cloudflare D1 rejects queries with more than 100 bound parameters. */
export const D1_MAX_BIND_PARAMS = 100;

/** Leave headroom for extra predicates (user_id, status, …) in the same statement. */
export const D1_SAFE_IN_CHUNK = 90;

export function chunkList<T>(items: readonly T[], size = D1_SAFE_IN_CHUNK): T[][] {
  if (items.length === 0) return [];
  if (items.length <= size) return [items as T[]];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size) as T[]);
  }
  return out;
}

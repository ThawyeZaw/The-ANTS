import { text, integer } from 'drizzle-orm/sqlite-core';

/** App / Better Auth IDs as text UUIDs (D1 has no uuid type). */
export function idText(name = 'id') {
  return text(name)
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());
}

export function textId(name: string) {
  return text(name);
}

/** Store Date as unix ms integer — portable across Workers / D1. */
export function ts(name: string) {
  return integer(name, { mode: 'timestamp_ms' });
}

export function tsNow(name: string) {
  return integer(name, { mode: 'timestamp_ms' }).$defaultFn(() => new Date());
}

export function bool(name: string, defaultValue?: boolean) {
  const col = integer(name, { mode: 'boolean' });
  if (defaultValue === undefined) return col;
  return col.default(defaultValue);
}

export function jsonText<T>(name: string) {
  return text(name, { mode: 'json' }).$type<T>();
}

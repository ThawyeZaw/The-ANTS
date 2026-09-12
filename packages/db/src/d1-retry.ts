import type { D1Database, D1DatabaseSession, D1PreparedStatement } from '@cloudflare/workers-types';

const TRANSIENT_D1 =
  /Network connection lost|Failed to parse body as JSON|error code:\s*1031|storage operation exceeded timeout|isolate exceeded its memory limit/i;

function errorText(err: unknown): string {
  const parts: string[] = [];
  let current: unknown = err;
  for (let i = 0; i < 5 && current; i += 1) {
    if (current instanceof Error) {
      parts.push(current.message);
      current = current.cause;
    } else {
      parts.push(String(current));
      break;
    }
  }
  return parts.join(' ');
}

export function isTransientD1Error(err: unknown): boolean {
  return TRANSIENT_D1.test(errorText(err));
}

async function retryD1<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      last = err;
      if (!isTransientD1Error(err) || attempt === 2) throw err;
      await new Promise((resolve) => setTimeout(resolve, 200 * 2 ** attempt));
    }
  }
  throw last;
}

function wrapStatement(stmt: D1PreparedStatement): D1PreparedStatement {
  return {
    bind(...values: unknown[]) {
      return wrapStatement(stmt.bind(...values));
    },
    first(colName?: string) {
      return retryD1(() =>
        colName === undefined ? stmt.first() : stmt.first(colName)
      );
    },
    run() {
      return retryD1(() => stmt.run());
    },
    all() {
      return retryD1(() => stmt.all());
    },
    raw(options?: { columnNames?: boolean }) {
      return retryD1(() => stmt.raw(options as { columnNames: true }));
    },
  } as D1PreparedStatement;
}

function wrapSession(session: D1DatabaseSession): D1DatabaseSession {
  return {
    prepare(query: string) {
      return wrapStatement(session.prepare(query));
    },
    batch(statements) {
      return retryD1(() => session.batch(statements));
    },
    getBookmark() {
      return session.getBookmark();
    },
  } as D1DatabaseSession;
}

/** Retry transient Wrangler/remote-D1 drops (idle proxy, Network connection lost). */
export function withD1Retries(d1: D1Database): D1Database {
  return {
    prepare(query: string) {
      return wrapStatement(d1.prepare(query));
    },
    batch(statements) {
      return retryD1(() => d1.batch(statements));
    },
    exec(query) {
      return retryD1(() => d1.exec(query));
    },
    withSession(constraintOrBookmark) {
      return wrapSession(d1.withSession(constraintOrBookmark));
    },
    dump() {
      return d1.dump();
    },
  } as D1Database;
}

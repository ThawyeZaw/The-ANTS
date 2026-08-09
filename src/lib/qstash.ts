// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — QStash Client Helper
//
// Thin HTTP wrapper around Upstash QStash REST API.
// Used to schedule Telegram notification triggers instead of relying on
// GitHub Actions cron (which has unreliable delivery).
//
// API docs: https://upstash.com/docs/qstash/api/messages
// ──────────────────────────────────────────────────────────────────────────────

const QSTASH_URL = process.env.QSTASH_URL ?? 'https://qstash.upstash.io';
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

// ── Schedule a one-time QStash message ────────────────────────────────────────

export interface ScheduleOptions {
  /** Target URL that QStash will call (defaults to the process-notifications endpoint) */
  url?: string;
  /** Delay in seconds before QStash fires the message */
  delay: number;
  /** Optional JSON body to send */
  body?: Record<string, unknown>;
  /** Optional content type (default: application/json) */
  contentType?: string;
}

/**
 * Schedule a one-time QStash message.
 *
 * Under the hood, POSTs to `https://qstash.upstash.io/v1/messages`
 * with the destination URL, delay, and body.
 *
 * @returns The QStash message ID (useful for debugging / logs), or null on failure.
 */
export async function scheduleQStashMessage(
  options: ScheduleOptions
): Promise<{ messageId: string } | null> {
  if (!QSTASH_TOKEN) {
    console.warn('[qstash] QSTASH_TOKEN not configured — skipping schedule');
    return null;
  }

  const url = options.url ?? `${getBaseUrl()}/api/qstash/process-notifications`;

  try {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${QSTASH_TOKEN}`,
      'Content-Type': options.contentType ?? 'application/json',
    };

    // A 0s (or negative) delay means "deliver immediately" — QStash publishes
    // without waiting when the Upstash-Delay header is omitted entirely.
    if (options.delay > 0) {
      headers['Upstash-Delay'] = `${options.delay}s`;
    }

    const res = await fetch(`${QSTASH_URL}/v1/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        body: JSON.stringify(options.body ?? {}),
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`[qstash] Failed to schedule message (${res.status}): ${errorText}`);
      return null;
    }

    const data = await res.json();
    // QStash returns { messageId: "..." }
    return { messageId: data.messageId as string };
  } catch (err) {
    console.error('[qstash] Error scheduling message:', err);
    return null;
  }
}

// ── Helper: determine base URL at runtime ─────────────────────────────────────

function getBaseUrl(): string {
  // Vercel sets VERCEL_URL automatically
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Fallback for local dev
  return process.env.NEXT_PUBLIC_BASE_URL ?? 'http://127.0.0.1:3005/';
}
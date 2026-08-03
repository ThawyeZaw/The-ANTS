// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — process-telegram-queue Edge Function
//
// Processes the notification_queue table in batches:
//   1. Recovers stale 'processing' rows (> 10 min) back to 'pending'
//   2. Fetches up to 25 due pending items whose scheduled_for <= now()
//   3. Atomically claims them (only rows still 'pending' are claimed, so two
//      concurrently running processors can never both send the same row)
//   4. Loads user timezones in a single batch query (no N+1)
//   5. Sends each message via the Telegram Bot API with rate limiting
//   6. Handles HTTP 429 (Retry-After) gracefully
//   7. Updates status to 'sent' or 'failed', increments retry_count
//
// Mirrors the shared processor used by the Next.js endpoints
// (src/lib/notification-processor.ts).
// Called every minute by a GitHub Actions cron workflow.
// Protected by x-cron-secret header.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

// ── Configuration ─────────────────────────────────────────────────────────────

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 50; // ~20 msgs/sec (Telegram limit: 30/s)
const MAX_RETRIES = 3;
const STALE_PROCESSING_MS = 10 * 60 * 1000; // 10 minutes
const EARLY_CLAIM_MS = 5_000; // claim rows due within the next 5s (on-time-or-early delivery)

interface QueueItem {
  id: string;
  telegram_chat_id: string;
  message_text: string;
  retry_count: number | null;
  user_id: string | null;
}

// ── Supabase client (admin — bypasses RLS) ───────────────────────────────────

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Telegram sender ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<{ ok: boolean; retryAfter?: number; errorText?: string }> {
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    if (res.status === 429) {
      const body = await res.json();
      const retryAfter = body?.parameters?.retry_after ?? 5;
      return { ok: false, retryAfter, errorText: "Rate limited (429)" };
    }

    if (!res.ok) {
      const errorText = await res.text();
      return { ok: false, errorText: `${res.status}: ${errorText}` };
    }

    return { ok: true };
  } catch (err) {
    return { ok: false, errorText: String(err) };
  }
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // ── Auth guard ──
  const secret = req.headers.get("x-cron-secret");
  if (!CRON_SECRET || secret !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      "[process-telegram-queue] Missing required environment variables.",
    );
    return new Response(
      JSON.stringify({ error: "Server misconfigured — check env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const supabase = getAdminClient();
  const now = new Date().toISOString();
  let recovered = 0;

  // ── 0. Stale-processing recovery ──
  // Rows left in 'processing' by a crashed/restarted processor are reset to
  // 'pending' so they get another delivery attempt.
  const staleCutoff = new Date(Date.now() - STALE_PROCESSING_MS).toISOString();
  const { data: recoveredRows, error: recoverError } = await supabase
    .from("notification_queue")
    .update({ status: "pending", updated_at: now })
    .eq("status", "processing")
    .lt("updated_at", staleCutoff)
    .select("id");

  if (recoverError) {
    console.error(
      "[process-telegram-queue] Stale-recovery error:",
      recoverError,
    );
  } else {
    recovered = recoveredRows?.length ?? 0;
    if (recovered > 0) {
      console.log(
        `[process-telegram-queue] Recovered ${recovered} stale processing row(s)`,
      );
    }
  }

  // ── 1. Fetch due pending items ──
  // Claim-ahead window: rows due within the next 5 seconds are claimable, so
  // triggers that fire a few seconds early still deliver on time.
  const claimCutoff = new Date(Date.now() + EARLY_CLAIM_MS).toISOString();
  const { data: candidates, error: fetchError } = await supabase
    .from("notification_queue")
    .select("id, telegram_chat_id, message_text, retry_count, user_id")
    .eq("status", "pending")
    .lte("scheduled_for", claimCutoff)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("[process-telegram-queue] Fetch error:", fetchError);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch queue items",
        detail: fetchError.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!candidates || candidates.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, recovered, message: "No pending items" }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 2. Atomic claim ──
  // Only rows still 'pending' are claimed. If another processor already
  // claimed a row, the predicate filters it out — duplicate sends are
  // impossible even when QStash, the cron and this function overlap.
  const candidateIds = (candidates as Array<{ id: string }>).map((i) => i.id);
  const { data: items, error: claimError } = await supabase
    .from("notification_queue")
    .update({ status: "processing", updated_at: now })
    .in("id", candidateIds)
    .eq("status", "pending")
    .select("id, telegram_chat_id, message_text, retry_count, user_id");

  if (claimError) {
    console.error("[process-telegram-queue] Claim error:", claimError);
    return new Response(
      JSON.stringify({
        error: "Failed to claim queue items",
        detail: claimError.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const rows = (items ?? []) as Array<QueueItem>;
  if (rows.length === 0) {
    return new Response(
      JSON.stringify({
        processed: 0,
        recovered,
        message: "No items claimable",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // ── 3. Batch-fetch user timezones (kills the per-item N+1) ──
  const userIds = Array.from(
    new Set(rows.map((i) => i.user_id).filter(Boolean)),
  );
  const timezoneById = new Map<string, string>();
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, timezone")
      .in("id", userIds);
    for (const p of profiles ?? []) {
      if (p?.timezone) timezoneById.set(p.id, p.timezone);
    }
  }

  // ── 4. Send messages with rate limiting ──
  let sent = 0;
  let failed = 0;

  for (const item of rows) {
    const userTimezone = item.user_id
      ? (timezoneById.get(item.user_id) ?? "Asia/Yangon")
      : "Asia/Yangon";
    const messageText =
      `${item.message_text}\n\n🕐 This reminder is in ${userTimezone} timezone`;
    const result = await sendTelegramMessage(
      item.telegram_chat_id,
      messageText,
    );

    if (result.ok) {
      // Mark as sent
      await supabase
        .from("notification_queue")
        .update({ status: "sent", updated_at: new Date().toISOString() })
        .eq("id", item.id);
      sent++;
    } else {
      const newRetryCount = (item.retry_count ?? 0) + 1;
      const isPermanent = newRetryCount >= MAX_RETRIES;

      await supabase
        .from("notification_queue")
        .update({
          status: isPermanent ? "failed" : "pending",
          retry_count: newRetryCount,
          error_log: result.errorText ?? "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      failed++;

      // Respect Telegram's retry_after on 429
      if (result.retryAfter) {
        const retryAfter = result.retryAfter;
        console.warn(
          `[process-telegram-queue] Rate limited — waiting ${retryAfter}s`,
        );
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
      }
    }

    // Rate limit: delay between messages
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(
    `[process-telegram-queue] Batch complete: ${sent} sent, ${failed} failed (of ${rows.length})`,
  );

  return new Response(
    JSON.stringify({
      processed: rows.length,
      sent,
      failed,
      recovered,
      timestamp: now,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});

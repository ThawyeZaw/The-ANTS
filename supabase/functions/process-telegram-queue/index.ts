// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — process-telegram-queue Edge Function
//
// Processes the notification_queue table in batches:
//   1. Fetches up to 25 pending items whose scheduled_for <= now()
//   2. Marks them as 'processing'
//   3. Sends each message via the Telegram Bot API
//   4. Rate limits at ~20 msgs/sec (safe under Telegram's 30/s limit)
//   5. Handles HTTP 429 (Retry-After) gracefully
//   6. Updates status to 'sent' or 'failed', increments retry_count
//
// Called every minute by a GitHub Actions cron workflow.
// Protected by x-cron-secret header.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Configuration ─────────────────────────────────────────────────────────────

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CRON_SECRET = Deno.env.get("CRON_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const BATCH_SIZE = 25;
const RATE_LIMIT_MS = 50; // ~20 msgs/sec
const MAX_RETRIES = 3;

// ── Supabase client (admin — bypasses RLS) ───────────────────────────────────

function getAdminClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ── Telegram sender ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  chatId: string,
  text: string
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
    console.error("[process-telegram-queue] Missing required environment variables.");
    return new Response(
      JSON.stringify({ error: "Server misconfigured — check env vars" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const supabase = getAdminClient();
  const now = new Date().toISOString();

  // ── 1. Fetch pending items ──
  const { data: items, error: fetchError } = await supabase
    .from("notification_queue")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(BATCH_SIZE);

  if (fetchError) {
    console.error("[process-telegram-queue] Fetch error:", fetchError);
    return new Response(
      JSON.stringify({ error: "Failed to fetch queue items", detail: fetchError.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!items || items.length === 0) {
    return new Response(
      JSON.stringify({ processed: 0, message: "No pending items" }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  // ── 2. Mark as processing ──
  const itemIds = items.map((i: any) => i.id);
  const { error: markError } = await supabase
    .from("notification_queue")
    .update({ status: "processing" })
    .in("id", itemIds);

  if (markError) {
    console.error("[process-telegram-queue] Mark-as-processing error:", markError);
  }

  // ── 3. Send messages with rate limiting ──
  let sent = 0;
  let failed = 0;

  for (const item of items as any[]) {
    const result = await sendTelegramMessage(item.telegram_chat_id, item.message_text);

    if (result.ok) {
      // Mark as sent
      await supabase
        .from("notification_queue")
        .update({ status: "sent" })
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
        })
        .eq("id", item.id);

      failed++;

      // Respect Telegram's retry_after on 429
      if (result.retryAfter) {
        console.warn(
          `[process-telegram-queue] Rate limited — waiting ${result.retryAfter}s`
        );
        await new Promise((r) => setTimeout(r, result.retryAfter * 1000));
      }
    }

    // Rate limit: delay between messages
    await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log(
    `[process-telegram-queue] Batch complete: ${sent} sent, ${failed} failed (of ${items.length})`
  );

  return new Response(
    JSON.stringify({
      processed: items.length,
      sent,
      failed,
      timestamp: now,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Telegram Test Notification
//
// POST /api/telegram/test  — Sends a test message to the user's linked Telegram
//                             chat. Used by the Settings "Test" button.
//
// Body: { chatId: string }  — the user's telegram_chat_id
// ──────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

export async function POST(req: NextRequest) {
  if (!BOT_TOKEN) {
    return NextResponse.json(
      { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
      { status: 500 }
    );
  }

  let body: { chatId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!body.chatId) {
    return NextResponse.json(
      { success: false, error: 'Missing chatId in request body' },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: body.chatId,
        text:
          '✅ <b>TEST NOTIFICATION</b>\n\n' +
          'Your Telegram alerts are working correctly.\n\n' +
          'You will receive timetable reminders, assignment due dates,\n' +
          'and exam countdowns based on your notification preferences.',
        parse_mode: 'HTML',
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: `Telegram API error (${res.status})`,
        detail: data,
      });
    }

    return NextResponse.json({ success: true, detail: data });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: `Fetch failed: ${String(err)}`,
    });
  }
}

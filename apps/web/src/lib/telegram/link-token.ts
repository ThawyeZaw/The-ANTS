import crypto from 'crypto';

const LINK_TTL_MS = 15 * 60 * 1000;

function linkSecret(): string {
  const secret = process.env.CRON_SECRET ?? process.env.BETTER_AUTH_SECRET;
  if (!secret) throw new Error('Telegram link secret not configured');
  return secret;
}

/** Telegram /start payload: link_<username>_<expBase36>_<sig16> (≤64 chars for typical usernames). */
export function mintTelegramLinkStartArg(username: string): string {
  const normalized = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(normalized)) {
    throw new Error('Username cannot be used for one-tap Telegram link');
  }
  const exp = Math.floor((Date.now() + LINK_TTL_MS) / 1000);
  const sig = crypto
    .createHmac('sha256', linkSecret())
    .update(`${normalized}:${exp}`)
    .digest('hex')
    .slice(0, 16);
  return `link_${normalized}_${exp.toString(36)}_${sig}`;
}

export function verifyTelegramLinkStartArg(
  arg: string
): { ok: true; username: string } | { ok: false; reason: string } {
  const parts = arg.split('_');
  if (parts.length < 4 || parts[0] !== 'link') {
    return { ok: false, reason: 'invalid_format' };
  }
  const sig = parts.pop()!;
  const expBase36 = parts.pop()!;
  const username = parts.slice(1).join('_');
  if (!username || !/^[a-z0-9_]{3,32}$/.test(username)) {
    return { ok: false, reason: 'invalid_username' };
  }
  const exp = parseInt(expBase36, 36);
  if (!Number.isFinite(exp) || exp * 1000 < Date.now()) {
    return { ok: false, reason: 'expired' };
  }
  const expected = crypto
    .createHmac('sha256', linkSecret())
    .update(`${username}:${exp}`)
    .digest('hex')
    .slice(0, 16);
  if (sig !== expected) {
    return { ok: false, reason: 'bad_signature' };
  }
  return { ok: true, username };
}

/** Legacy plain-username /start still accepted when no link_ prefix. */
export function isSignedLinkStartArg(arg: string): boolean {
  return arg.startsWith('link_');
}

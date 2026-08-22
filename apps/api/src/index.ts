import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getAuth } from './auth';
import { createDb } from '@the-ants/db';
import { processNotificationQueue } from './services/notification-processor';

// Route Handlers
import { createRoleUpgradeRoutes } from './routes/role-upgrade';
import { createTimetableRoutes } from './routes/timetable';
import { createFlashcardRoutes } from './routes/flashcards';
import { createClassroomRoutes } from './routes/classrooms';
import { createClubRoutes } from './routes/clubs';
import { createExamRoutes } from './routes/exams';
import { createNoteRoutes } from './routes/notes';
import { createCurriculumRoutes } from './routes/curriculum';
import { createEditorRoutes } from './routes/editor';
import { createStorageRoutes } from './routes/storage';
import { createCronRoutes } from './routes/cron';
import { createProfileRoutes } from './routes/profile';

type Bindings = {
  DATABASE_URL: string;
  NEON_DATABASE_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  TELEGRAM_BOT_TOKEN?: string;
  CRON_SECRET?: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS with strict whitelist
const ALLOWED_ORIGINS = [
  'https://the-ants.org',
  'https://www.the-ants.org',
  'https://the-ants.vercel.app',
  'http://localhost:3000',
  'http://localhost:3005',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3005',
];

app.use(
  '*',
  cors({
    origin: (origin) => {
      if (!origin) return 'https://the-ants.org';
      if (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.the-ants.org') || origin.endsWith('.the-ants.vercel.app')) {
        return origin;
      }
      return null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'x-cron-secret'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

let currentEnv: Bindings | null = null;

// Middleware to capture worker environment
app.use('*', async (c, next) => {
  currentEnv = c.env;
  await next();
});

// DB getter helper
const getDatabase = (c?: any) => {
  const env = c?.env || currentEnv;
  const dbUrl =
    env?.NEON_DATABASE_URL ||
    env?.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    '';
  return createDb(dbUrl);
};

// In-memory sliding window rate limiter
const ipRequestCounts = new Map<string, { count: number; resetAt: number }>();

const rateLimiter = (limit: number, windowMs: number) => {
  return async (c: any, next: any) => {
    const ip =
      c.req.header('cf-connecting-ip') ||
      c.req.header('x-real-ip') ||
      c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
      '127.0.0.1';
    const now = Date.now();

    // Clean up cache periodically
    if (ipRequestCounts.size > 2000) {
      for (const [key, val] of ipRequestCounts.entries()) {
        if (now > val.resetAt) ipRequestCounts.delete(key);
      }
    }

    const record = ipRequestCounts.get(ip);
    if (!record || now > record.resetAt) {
      ipRequestCounts.set(ip, { count: 1, resetAt: now + windowMs });
      await next();
      return;
    }

    if (record.count >= limit) {
      return c.json({ error: 'Too many requests. Please try again later.' }, 429);
    }

    record.count += 1;
    await next();
  };
};

// Health Check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Better Auth with rate limiting (60 requests/minute per IP)
app.use('/api/auth/*', rateLimiter(60, 60 * 1000));
app.use('/api/auth', rateLimiter(60, 60 * 1000));
app.all('/api/auth/*', async (c) => {
  try {
    const dbUrl = c.env?.NEON_DATABASE_URL || c.env?.DATABASE_URL || process.env.DATABASE_URL || '';
    const origin = new URL(c.req.url).origin;
    const auth = getAuth(dbUrl, origin, c.env?.CRON_SECRET);
    const res = await auth.handler(c.req.raw);
    return res;
  } catch (err: any) {
    console.error('[API Auth] Handler error:', err);
    return c.json({ error: err?.message || 'Auth internal error', stack: err?.stack }, 500);
  }
});
app.all('/api/auth', async (c) => {
  try {
    const dbUrl = c.env?.NEON_DATABASE_URL || c.env?.DATABASE_URL || process.env.DATABASE_URL || '';
    const origin = new URL(c.req.url).origin;
    const auth = getAuth(dbUrl, origin, c.env?.CRON_SECRET);
    const res = await auth.handler(c.req.raw);
    return res;
  } catch (err: any) {
    console.error('[API Auth] Handler error:', err);
    return c.json({ error: err?.message || 'Auth internal error', stack: err?.stack }, 500);
  }
});

// Domain Routes
app.route('/api/role-upgrade', createRoleUpgradeRoutes(() => getDatabase()));
app.route('/api/timetable', createTimetableRoutes(() => getDatabase()));
app.route('/api/flashcards', createFlashcardRoutes(() => getDatabase()));
app.route('/api/classrooms', createClassroomRoutes(() => getDatabase()));
app.route('/api/clubs', createClubRoutes(() => getDatabase()));
app.route('/api/exams', createExamRoutes(() => getDatabase()));
app.route('/api/notes', createNoteRoutes(() => getDatabase()));
app.route('/api/curriculum', createCurriculumRoutes(() => getDatabase()));
app.route('/api/editor', createEditorRoutes(() => getDatabase()));
app.route('/api/storage', createStorageRoutes());
app.route('/api/cron', createCronRoutes(() => getDatabase()));
app.route('/api/profile', createProfileRoutes(() => getDatabase()));

export default {
  fetch: app.fetch,
  // Cloudflare Cron Trigger Handler
  async scheduled(event: any, env: Bindings, ctx: any) {
    const dbUrl = env.NEON_DATABASE_URL || env.DATABASE_URL || '';
    const botToken = env.TELEGRAM_BOT_TOKEN || '';
    if (dbUrl && botToken) {
      const db = createDb(dbUrl);
      ctx.waitUntil(processNotificationQueue(db, botToken));
    }
  },
};

export type AppType = typeof app;

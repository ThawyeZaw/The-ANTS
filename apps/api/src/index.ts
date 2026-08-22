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

// Enable CORS
app.use(
  '*',
  cors({
    origin: (origin) => origin || '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-requested-with', 'x-cron-secret'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  })
);

// DB getter helper
const getDatabase = (c?: any) => {
  const dbUrl =
    c?.env?.NEON_DATABASE_URL ||
    c?.env?.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.DATABASE_URL ||
    '';
  return createDb(dbUrl);
};

// Health Check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Better Auth
app.on(['POST', 'GET'], '/api/auth/**', (c) => {
  const dbUrl = c.env.NEON_DATABASE_URL || c.env.DATABASE_URL || process.env.DATABASE_URL || '';
  const auth = getAuth(dbUrl);
  return auth.handler(c.req.raw);
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

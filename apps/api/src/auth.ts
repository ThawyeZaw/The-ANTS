import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from '@the-ants/db';
import * as schema from '@the-ants/db';

export function getAuth(databaseUrl: string, baseUrl?: string, secret?: string) {
  const db = createDb(databaseUrl);

  return betterAuth({
    baseURL: baseUrl || process.env.BETTER_AUTH_URL || 'https://the-ants-api.thawyezaw.workers.dev',
    secret: secret || process.env.BETTER_AUTH_SECRET || process.env.CRON_SECRET || 'the-ants-auth-secret-production-2026',
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3005',
      'https://the-ants.org',
      'https://www.the-ants.org',
      'https://the-ants.vercel.app',
      'https://the-ants-api.thawyezaw.workers.dev',
    ],
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.user,
        session: schema.session,
        account: schema.account,
        verification: schema.verification,
      },
    }),
    user: {
      additionalFields: {
        role: {
          type: 'string',
          defaultValue: 'student',
          input: false, // Prevents client from self-assigning role at registration
        },
      },
    },
    session: {
      additionalFields: {
        role: {
          type: 'string',
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        enabled: !!process.env.GOOGLE_CLIENT_ID,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || '',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
        enabled: !!process.env.GITHUB_CLIENT_ID,
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            // Auto-create initial profile if it does not exist
            try {
              const baseUsername = (createdUser.name || createdUser.email.split('@')[0])
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
              const randomSuffix = Math.random().toString(36).substring(2, 6);
              await db
                .insert(schema.profiles)
                .values({
                  id: createdUser.id as any,
                  email: createdUser.email,
                  name: createdUser.name || createdUser.email.split('@')[0],
                  username: `${baseUsername}_${randomSuffix}`,
                  avatar_url: createdUser.image,
                  role: 'student',
                })
                .onConflictDoNothing();
            } catch (err) {
              console.error('Error auto-creating profile for new user:', err);
            }
          },
        },
      },
    },
  });
}

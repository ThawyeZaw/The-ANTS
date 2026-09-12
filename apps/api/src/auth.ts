import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb, type Database } from '@the-ants/db';
import * as schema from '@the-ants/db';

/** Canonical production API host (custom domain on Worker `the-ants-api`). */
export const CANONICAL_API_URL = 'https://api.the-ants.org';

function isLocalDevOrigin(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === 'localhost' || hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

/**
 * Resolve Better Auth baseURL.
 * - Local wrangler/dev: use the request origin (http://127.0.0.1:8787).
 * - Deployed: always canonical `https://api.the-ants.org` (ignore workers.dev alias).
 */
export function resolveAuthBaseURL(requestOrigin?: string, envBaseUrl?: string): string {
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, '');
  if (requestOrigin && isLocalDevOrigin(requestOrigin)) return requestOrigin.replace(/\/+$/, '');
  return CANONICAL_API_URL;
}

export function getAuth(
  db: Database,
  requestOrigin?: string,
  secret?: string,
  envBaseUrl?: string
) {
  return betterAuth({
    baseURL: resolveAuthBaseURL(requestOrigin, envBaseUrl || process.env.BETTER_AUTH_URL),
    secret: secret || process.env.BETTER_AUTH_SECRET || process.env.CRON_SECRET || 'the-ants-auth-secret-production-2026',
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:3005',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3005',
      'https://the-ants.org',
      'https://www.the-ants.org',
      'https://the-ants.vercel.app',
      'https://the-ants-web.thawyezaw.workers.dev',
      CANONICAL_API_URL,
      'https://the-ants-api.thawyezaw.workers.dev',
    ],
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
      // Phase 6: apex + www + api share eTLD+1 `.the-ants.org`.
      crossSubDomainCookies: {
        enabled: true,
        domain: '.the-ants.org',
      },
      defaultCookieAttributes: {
        sameSite: 'lax',
        secure: true,
      },
    },
    database: drizzleAdapter(db, {
      provider: 'sqlite',
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
          input: false,
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
            try {
              const baseUsername = (createdUser.name || createdUser.email.split('@')[0])
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
              const randomSuffix = Math.random().toString(36).substring(2, 6);
              await db
                .insert(schema.profiles)
                .values({
                  id: createdUser.id,
                  email: createdUser.email,
                  name: createdUser.name || createdUser.email.split('@')[0],
                  username: `${baseUsername}_${randomSuffix}`,
                  avatar_url: createdUser.image,
                  role: 'student',
                  roles: ['student'],
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

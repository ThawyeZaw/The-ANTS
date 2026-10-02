import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { eq } from 'drizzle-orm';
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

export type OAuthProviderEnv = {
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
};

export function getAuth(
  db: Database,
  requestOrigin?: string,
  secret?: string,
  envBaseUrl?: string,
  oauth?: OAuthProviderEnv
) {
  const googleClientId = oauth?.googleClientId || process.env.GOOGLE_CLIENT_ID || '';
  const googleClientSecret = oauth?.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '';
  const githubClientId = oauth?.githubClientId || process.env.GITHUB_CLIENT_ID || '';
  const githubClientSecret = oauth?.githubClientSecret || process.env.GITHUB_CLIENT_SECRET || '';

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
      // Local HTTP cannot use Secure cookies or Domain=.the-ants.org.
      // Production: apex + www + api share eTLD+1 `.the-ants.org`.
      ...(requestOrigin && isLocalDevOrigin(requestOrigin)
        ? {
            defaultCookieAttributes: {
              sameSite: 'lax' as const,
              secure: false,
            },
          }
        : {
            crossSubDomainCookies: {
              enabled: true,
              domain: '.the-ants.org',
            },
            defaultCookieAttributes: {
              sameSite: 'lax' as const,
              secure: true,
            },
          }),
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
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['google'],
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
    },
    socialProviders: {
      google: {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        enabled: !!googleClientId,
      },
      github: {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
        enabled: !!githubClientId,
      },
    },
    databaseHooks: {
      user: {
        create: {
          after: async (createdUser) => {
            await ensureAuthProfile(db, {
              id: createdUser.id,
              email: createdUser.email,
              name: createdUser.name,
              image: createdUser.image,
            });
          },
        },
      },
      // Heal accounts created before the profile hook (or when create-after failed).
      session: {
        create: {
          after: async (createdSession) => {
            try {
              const authUser = await db.query.user.findFirst({
                where: eq(schema.user.id, createdSession.userId),
                columns: { id: true, email: true, name: true, image: true },
              });
              if (authUser) await ensureAuthProfile(db, authUser);
            } catch (err) {
              console.error('Error ensuring profile on session create:', err);
            }
          },
        },
      },
    },
  });
}

async function ensureAuthProfile(
  db: Database,
  authUser: { id: string; email: string; name: string | null; image?: string | null }
) {
  try {
    const existing = await db.query.profiles.findFirst({
      where: eq(schema.profiles.id, authUser.id),
      columns: { id: true },
    });
    if (existing) return;

    const baseUsername =
      (authUser.name || authUser.email.split('@')[0])
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 24) || 'user';
    const taken = await db.query.profiles.findFirst({
      where: eq(schema.profiles.username, baseUsername),
      columns: { id: true },
    });
    const username = taken
      ? `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`
      : baseUsername;

    await db
      .insert(schema.profiles)
      .values({
        id: authUser.id,
        email: authUser.email,
        name: authUser.name || authUser.email.split('@')[0],
        username,
        avatar_url: authUser.image,
        role: 'student',
        roles: ['student'],
      })
      .onConflictDoNothing();
  } catch (err) {
    console.error('Error auto-creating profile for user:', authUser.id, err);
  }
}

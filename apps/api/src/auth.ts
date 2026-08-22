import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { createDb } from '@the-ants/db';
import * as schema from '@the-ants/db';

export function getAuth(databaseUrl: string) {
  const db = createDb(databaseUrl);

  return betterAuth({
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
              await db
                .insert(schema.profiles)
                .values({
                  id: createdUser.id as any,
                  email: createdUser.email,
                  name: createdUser.name || createdUser.email.split('@')[0],
                  username:
                    createdUser.name?.toLowerCase().replace(/\s+/g, '_') ||
                    createdUser.email.split('@')[0],
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

/**
 * Runtime environment variable validation.
 *
 * Checks for Supabase credentials at startup and logs clear messages.
 * This prevents cryptic auth errors at runtime when env vars are missing.
 * No secret values are ever logged.
 */

const REQUIRED_PUBLIC_VARS = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  if (typeof window === 'undefined') {
    // Server-side: check all required vars
    for (const key of REQUIRED_PUBLIC_VARS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  } else {
    // Browser-side: only public vars are available
    for (const key of REQUIRED_PUBLIC_VARS) {
      if (!process.env[key]) {
        missing.push(key);
      }
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[env] Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Supabase auth and database features will be unavailable until these are set.'
    );
  }
}

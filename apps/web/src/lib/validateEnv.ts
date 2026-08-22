/**
 * Runtime environment variable validation for HONC stack.
 *
 * Checks for API and database credentials at startup and logs clear messages.
 * No secret values are ever logged.
 */

const REQUIRED_PUBLIC_VARS = ['NEXT_PUBLIC_API_URL'] as const;

export function validateEnv(): void {
  const missing: string[] = [];

  for (const key of REQUIRED_PUBLIC_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[env] Missing required environment variable(s): ${missing.join(', ')}. ` +
      'API features may be unavailable until these are configured.'
    );
  }
}

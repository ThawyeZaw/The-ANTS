/** Authenticated study hub — canonical home after login. */
export const APP_HOME_PATH = '/student';

/** Build signup URL with return path after auth. */
export function signupNextPath(path: string): string {
  return `/signup?next=${encodeURIComponent(path)}`;
}

/** Build login URL with return path after auth. */
export function loginNextPath(path: string): string {
  return `/login?next=${encodeURIComponent(path)}`;
}

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Health check utility
// ──────────────────────────────────────────────────────────────────────────────

export async function runHealthCheck(): Promise<{ status: string; ok: boolean }> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';
    const res = await fetch(`${apiUrl}/health`);
    if (res.ok) {
      return { status: 'healthy', ok: true };
    }
  } catch {
    // API not reachable
  }
  return { status: 'degraded', ok: false };
}

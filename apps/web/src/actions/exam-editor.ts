'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Exam Editor Server Actions (Deprecated — replaced by SQL seeds)
// ──────────────────────────────────────────────────────────────────────────────

export async function submitExamData(_payload: any, _contributorId: string) {
  return { success: false, error: 'Exam editor submissions are retired. Exam data is seeded via SQL.' };
}

export async function submitExamCalculatorPreset(_payload: any, _contributorId: string) {
  return { success: false, error: 'Calculator presets are retired. Exam data is seeded via SQL.' };
}

export async function submitExamCountdownProposal(_payload: any, _contributorId: string) {
  return { success: false, error: 'Countdown proposals are retired. Exam data is seeded via SQL.' };
}


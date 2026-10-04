'use server';

import { getDb, topicProgress, userXpLedger } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { getSessionUser } from '@/lib/auth-session';
import { getMySubjectsHub } from '@/actions/curriculum';
import { listExamCountdownsForUser } from '@/actions/exam-data';
import { awardXp, XP_AMOUNTS } from '@/lib/gamification/award';
import type { AwardXpResult } from '@/lib/gamification/types';

const SCHOLAR_CHECKLIST_TASK_IDS = [
  'enroll-subjects',
  'try-calculator',
  'try-pomodoro',
  'set-countdown',
  'track-topic',
] as const;

export type ScholarChecklistTaskId = (typeof SCHOLAR_CHECKLIST_TASK_IDS)[number];

export interface ScholarChecklistProgress {
  tasks: Record<ScholarChecklistTaskId, boolean>;
  completedCount: number;
  allComplete: boolean;
  xpSynced: boolean;
}

async function detectTasks(userId: string): Promise<Record<ScholarChecklistTaskId, boolean>> {
  const db = getDb();

  const [hub, countdowns, topicDone, ledgerRows] = await Promise.all([
    getMySubjectsHub(userId).catch(() => ({ subjects: [] as { id: string }[] })),
    listExamCountdownsForUser(userId).catch(() => []),
    db.query.topicProgress.findFirst({
      where: and(eq(topicProgress.user_id, userId), eq(topicProgress.status, 'completed')),
    }),
    db.query.userXpLedger.findMany({
      where: eq(userXpLedger.user_id, userId),
      columns: { source: true, source_id: true },
    }),
  ]);

  const hasEnrollment = (hub.subjects?.length ?? 0) > 0;
  const hasPomodoro =
    ledgerRows.some((r) => r.source === 'pomodoro') ||
    ledgerRows.some((r) => r.source === 'onboarding' && r.source_id === 'try-pomodoro');
  const hasCalculator =
    ledgerRows.some((r) => r.source === 'onboarding' && r.source_id === 'try-calculator') ||
    ledgerRows.some((r) => r.source_id === 'try-calculator');

  return {
    'enroll-subjects': hasEnrollment,
    'try-calculator': hasCalculator,
    'try-pomodoro': hasPomodoro,
    'set-countdown': countdowns.length > 0,
    'track-topic': Boolean(topicDone),
  };
}

/** Read progress + optionally award XP for newly completed steps (idempotent). */
export async function syncScholarChecklist(): Promise<{
  progress: ScholarChecklistProgress;
  lastAward?: AwardXpResult;
}> {
  const session = await getSessionUser();
  if (!session?.userId) {
    return {
      progress: {
        tasks: {
          'enroll-subjects': false,
          'try-calculator': false,
          'try-pomodoro': false,
          'set-countdown': false,
          'track-topic': false,
        },
        completedCount: 0,
        allComplete: false,
        xpSynced: false,
      },
    };
  }

  const userId = session.userId;
  const tasks = await detectTasks(userId);
  const completedCount = SCHOLAR_CHECKLIST_TASK_IDS.filter((id) => tasks[id]).length;
  const allComplete = completedCount === SCHOLAR_CHECKLIST_TASK_IDS.length;

  let lastAward: AwardXpResult | undefined;

  for (const taskId of SCHOLAR_CHECKLIST_TASK_IDS) {
    if (!tasks[taskId]) continue;
    const result = await awardXp(
      userId,
      XP_AMOUNTS.onboardingStep,
      'onboarding',
      taskId,
      `Scholar quick start: ${taskId}`
    );
    if (result.awarded) lastAward = result;
  }

  if (allComplete) {
    const bonus = await awardXp(
      userId,
      XP_AMOUNTS.onboardingComplete,
      'onboarding',
      'scholar-checklist-complete',
      'Scholar quick start complete'
    );
    if (bonus.awarded) lastAward = bonus;
  }

  return {
    progress: {
      tasks,
      completedCount,
      allComplete,
      xpSynced: true,
    },
    lastAward,
  };
}

export async function getScholarChecklistProgress(): Promise<ScholarChecklistProgress> {
  const { progress } = await syncScholarChecklist();
  return progress;
}

/** Call when a signed-in user opens the grade calculator (idempotent XP). */
export async function markScholarCalculatorTry(): Promise<void> {
  const session = await getSessionUser();
  if (!session?.userId) return;
  await awardXp(
    session.userId,
    XP_AMOUNTS.onboardingStep,
    'onboarding',
    'try-calculator',
    'Scholar quick start: try-calculator'
  );
}

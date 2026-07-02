'use server';

import {
  submitExamData as dbSubmitExamData,
  submitExamCalculatorPreset as dbSubmitExamCalculatorPreset,
  submitExamCountdownProposal as dbSubmitExamCountdownProposal,
} from '@/lib/mock/database';

export async function submitExamData(payload: any, contributorId: string) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return dbSubmitExamData(payload, contributorId);
}

export async function submitExamCalculatorPreset(payload: any, contributorId: string) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return dbSubmitExamCalculatorPreset(payload, contributorId);
}

export async function submitExamCountdownProposal(payload: any, contributorId: string) {
  await new Promise((resolve) => setTimeout(resolve, 700));

  return dbSubmitExamCountdownProposal(payload, contributorId);
}
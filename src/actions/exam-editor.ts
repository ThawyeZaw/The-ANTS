'use server';

import { submitExamData as dbSubmitExamData } from '@/lib/mock/database';

export async function submitExamData(payload: any, contributorId: string) {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800));

  return dbSubmitExamData(payload, contributorId);
}
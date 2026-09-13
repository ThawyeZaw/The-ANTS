import { redirect } from 'next/navigation';

export default async function LegacySubjectLessonRedirect({
  params,
}: {
  params: Promise<{ curriculumId: string; subjectId: string }>;
}) {
  const { curriculumId, subjectId } = await params;
  redirect(`/curriculum/${curriculumId}/${subjectId}`);
}

import { redirect } from 'next/navigation';

export default async function LegacyCurriculumRedirect({
  params,
}: {
  params: Promise<{ curriculumId: string }>;
}) {
  const { curriculumId } = await params;
  redirect(`/curriculum/${curriculumId}`);
}

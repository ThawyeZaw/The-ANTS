'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyNoteRedirect({ params }: { params: Promise<{ noteId: string }> }) {
  const { noteId } = use(params);
  const router = useRouter();

  useEffect(() => {
    router.replace(`/my-notes/${noteId}`);
  }, [noteId, router]);

  return null;
}

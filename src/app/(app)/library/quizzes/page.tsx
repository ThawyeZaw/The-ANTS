'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LibraryQuizzesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/quizzes');
  }, [router]);

  return null;
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FlashcardsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/library?tab=flashcards');
  }, [router]);

  return null;
}

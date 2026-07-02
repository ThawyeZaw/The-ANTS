'use client';

import React from 'react';
import BackButton from '@/components/ui/BackButton';
import { useAuth } from '@/hooks/useAuth';
import { CountdownManager } from '@/components/countdown/CountdownManager';

export default function CountdownPage() {
  const { user } = useAuth();

  // If not logged in, typically middleware would redirect, 
  // but we add a fallback just in case it renders before redirect.
  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] px-4 py-8 sm:px-6 lg:px-8 transition-colors space-y-6">
      <BackButton href="/dashboard" label="Back" />
      <CountdownManager userId={user.id} />
    </div>
  );
}

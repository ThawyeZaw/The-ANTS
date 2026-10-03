import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — The ANTs',
  description: 'Sign in to The ANTs to access your study hub, timetable, curriculum, and tools.',
};

// LoginForm uses useSearchParams() which requires a Suspense boundary in
// Next.js App Router to avoid hydration mismatches.
export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

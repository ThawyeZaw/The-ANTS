import { Suspense } from 'react';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Sign In — The ANTS',
  description: 'Sign in to your ANTS account to access your study tools, classrooms, and more.',
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

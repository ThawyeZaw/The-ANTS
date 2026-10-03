import { Suspense } from 'react';
import SignupForm from '@/components/auth/SignupForm';

export const metadata = {
  title: 'Sign Up — The ANTs',
  description: 'Create your free student account on The ANTs — curriculum hub, timetable, and study tools for Myanmar learners.',
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}


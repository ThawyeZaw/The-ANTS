import { Suspense } from 'react';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';

export const metadata = {
  title: 'Set Up Your Account — The ANTS',
  description: 'Personalise your ANTS experience in a few quick steps.',
};

export default function OnboardingPage() {
  return (
    <Suspense>
      <OnboardingWizard />
    </Suspense>
  );
}

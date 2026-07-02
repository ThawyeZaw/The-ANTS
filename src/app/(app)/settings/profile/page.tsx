import AdvancedProfileEditor from '@/components/settings/AdvancedProfileEditor';
import BackButton from '@/components/ui/BackButton';
import { Metadata } from 'next';
import { Settings } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Edit Profile | The ANTS',
  description: 'Manage your portfolio, activities, and public profile.',
};

export default function ProfileEditorPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <BackButton href="/settings" label="Back" />
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Edit Profile
            <Link
              href="/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-background-secondary border border-border text-xs font-medium text-foreground-muted hover:text-foreground hover:border-border-hover transition-colors"
            >
              <Settings className="h-3 w-3" />
              Back to Settings
            </Link>
          </h1>
          <p className="text-sm text-foreground-muted mt-1">
            Customize your public profile, manage your portfolio, and showcase your achievements.
          </p>
        </div>
      </div>

      <AdvancedProfileEditor />
    </div>
  );
}

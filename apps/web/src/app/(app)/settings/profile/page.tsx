import AdvancedProfileEditor from '@/components/settings/AdvancedProfileEditor';
import BackButton from '@/components/ui/BackButton';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Profile | The ANTs',
  description: 'Manage your portfolio, activities, and public profile.',
};

export default function ProfileEditorPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <BackButton href="/settings" label="Back to Settings" />
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
            Edit Profile
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

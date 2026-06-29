import AdvancedProfileEditor from '@/components/settings/AdvancedProfileEditor';
import { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Edit Profile | The ANTS',
  description: 'Manage your portfolio, activities, and public profile.',
};

export default function ProfileEditorPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Link
          href="/settings"
          className="p-2 rounded-xl border border-border bg-background-card hover:bg-background-secondary text-foreground-secondary hover:text-foreground transition-all duration-200 cursor-pointer"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Profile</h1>
          <p className="text-sm text-foreground-muted mt-1">
            Customize your public profile, manage your portfolio, and showcase your achievements.
          </p>
        </div>
      </div>

      <AdvancedProfileEditor />
    </div>
  );
}

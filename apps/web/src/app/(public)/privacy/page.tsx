import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for The ANTs academic productivity platform.',
};

export default function PrivacyPage() {
  return (
    <article className="max-w-3xl mx-auto py-10 px-4 prose prose-sm dark:prose-invert">
      <h1 className="text-2xl font-bold text-foreground not-prose">Privacy Policy</h1>
      <p className="text-sm text-foreground-muted not-prose mb-8">
        Placeholder — last updated {new Date().toISOString().slice(0, 10)}. Replace with counsel-reviewed policy before production reliance.
      </p>

      <h2>Data we collect</h2>
      <p>
        Account information (email, profile, study progress), usage of study features, and optional Telegram linkage for reminders.
      </p>

      <h2>How we use data</h2>
      <p>
        To operate your account, sync progress, send notifications you opt into, and improve the product. We do not sell personal data.
      </p>

      <h2>Storage & security</h2>
      <p>
        Data is stored on Cloudflare D1 and related Workers infrastructure. Access is restricted to authenticated services.
      </p>

      <h2>Your choices</h2>
      <p>
        You can disconnect Telegram via <code>/stop</code> or Settings, and request account deletion via support.
      </p>

      <h2>Contact</h2>
      <p>
        Privacy questions: <a href="mailto:hello@theants.edu">hello@theants.edu</a>
      </p>

      <p className="not-prose pt-6">
        <Link href="/" className="text-primary font-semibold hover:underline">
          Back to home
        </Link>
      </p>
    </article>
  );
}

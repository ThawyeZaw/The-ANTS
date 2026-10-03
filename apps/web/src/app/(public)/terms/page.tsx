import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for The ANTs academic productivity platform.',
};

export default function TermsPage() {
  return (
    <article className="max-w-3xl mx-auto py-10 px-4 prose prose-sm dark:prose-invert">
      <h1 className="text-2xl font-bold text-foreground not-prose">Terms of Service</h1>
      <p className="text-sm text-foreground-muted not-prose mb-8">
        Placeholder — last updated {new Date().toISOString().slice(0, 10)}. Replace with counsel-reviewed terms before production reliance.
      </p>

      <h2>Using The ANTs</h2>
      <p>
        The ANTs provides study planning tools, curriculum resources, and community features for students.
        You agree to use the service lawfully and respect other users.
      </p>

      <h2>Accounts</h2>
      <p>
        You are responsible for your account credentials. New signups are student accounts unless an admin assigns another role.
      </p>

      <h2>Content & accuracy</h2>
      <p>
        Exam dates, syllabus content, and third-party materials may change. We strive for accuracy but do not guarantee official board outcomes.
      </p>

      <h2>Contact</h2>
      <p>
        Questions: <a href="mailto:hello@theants.edu">hello@theants.edu</a>
      </p>

      <p className="not-prose pt-6">
        <Link href="/" className="text-primary font-semibold hover:underline">
          Back to home
        </Link>
      </p>
    </article>
  );
}

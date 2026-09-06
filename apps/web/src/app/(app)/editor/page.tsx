'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Contributor & Content Editor Workspace
// Route: /editor — Accessible to Contributors, Main Contributors & Admins.
// ──────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Pencil,
  BookOpen,
  ClipboardCheck,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';

interface EditorItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  features: string[];
}

const EDITOR_ITEMS: EditorItem[] = [
  {
    id: 'curriculum',
    label: 'Curriculum Editor',
    description: 'Structure academic boards, subjects, and topic hierarchies with prerequisites.',
    href: '/editor/curriculum',
    icon: BookOpen,
    features: ['Cambridge & Edexcel syllabi', 'Subject code mapping', 'Topic order indexing', 'Resource attachments'],
  },
  {
    id: 'exam',
    label: 'Exam Data Editor',
    description: 'Maintain official exam timetables, paper schedules, and grade boundaries.',
    href: '/editor/exam',
    icon: ClipboardCheck,
    features: ['Exam session dates', 'Component weightings', 'Grade boundary tables', 'Specimen paper links'],
  },
  {
    id: 'review-queue',
    label: 'Review Queue Proposals',
    description: 'Review pending curriculum and exam proposals before publishing.',
    href: '/editor/review-queue',
    icon: ShieldCheck,
    features: ['Proposal moderation', 'Feedback & revisions', 'Audit logs', 'Instant approval sync'],
  },
];

function EditorCard({ editor }: { editor: EditorItem }) {
  return (
    <div
      className={cn(
        'group relative flex flex-col p-6 rounded-3xl border border-border',
        'bg-background-card hover:bg-background-secondary hover:border-border-hover',
        'transition-colors duration-200'
      )}
    >
      <AppIcon icon={editor.icon} size="xl" tone="secondary" frame="soft" className="mb-4" />

      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
        {editor.label}
      </h3>
      <p className="text-xs text-foreground-muted mt-1.5 mb-5 leading-relaxed">
        {editor.description}
      </p>

      <div className="space-y-2 mb-6 flex-1">
        {editor.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-xs text-foreground-secondary">
            <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>

      <Link
        href={editor.href}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold mt-auto',
          'bg-primary text-white transition-colors duration-200',
          'hover:bg-primary-hover',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
        )}
      >
        Open {editor.label}
        <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}

export default function EditorPortalPage() {
  const { user } = useAuth();
  const { isContributor, isMainContributor, isAdmin } = useRole();
  const hasAccess = isContributor || isMainContributor || isAdmin;

  const editors = useMemo(() => EDITOR_ITEMS, []);

  if (!user || !hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-fade-in text-center p-6">
        <AppIcon icon={Pencil} size="xl" tone="muted" frame="soft" />
        <h2 className="text-xl font-bold text-foreground">Contributor Access Required</h2>
        <p className="text-xs text-foreground-muted max-w-sm">
          You need verified Contributor or Administrator privileges to access content creation tools.
        </p>
        <Link
          href="/dashboard"
          className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="rounded-3xl bg-background-card border border-border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
            <Pencil className="w-3.5 h-3.5" />
            Curriculum & Content Editor Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Academic Contributor Workspace
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-xl">
            Structure curriculum frameworks and update official exam schedules.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/editor/review-queue"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-background-secondary border border-border text-foreground text-xs font-bold hover:bg-background-secondary/80 transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <ShieldCheck className="w-4 h-4 text-primary" />
            Review Queue
          </Link>
          {isAdmin && (
            <Link
              href="/main-contributor/add-contributor"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-all shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Manage Users
            </Link>
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-primary/5 border border-primary/15 flex items-start gap-3.5">
        <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Curriculum Authoring Standard
          </h3>
          <p className="text-xs text-foreground-muted leading-relaxed">
            All submitted curriculum topics are mapped against official syllabus codes (Cambridge, Edexcel, and Matriculation) and go through the moderation queue before going live.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {editors.map((editor) => (
          <EditorCard key={editor.id} editor={editor} />
        ))}
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-background-card border border-border flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <AppIcon icon={Sparkles} size="lg" tone="primary" frame="soft" />
          <div>
            <h3 className="text-sm font-bold text-foreground">Open Educational Resources for Myanmar</h3>
            <p className="text-xs text-foreground-muted mt-0.5">
              Your curriculum frameworks and exam schedules are accessed by students and educators nationwide.
            </p>
          </div>
        </div>
        <Link
          href="/library"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-foreground bg-background-secondary border border-border hover:bg-background-secondary/80 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          View Public Library
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

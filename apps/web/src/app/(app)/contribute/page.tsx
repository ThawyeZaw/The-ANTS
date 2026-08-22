'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Contribute Page (Contributor Landing)
// A landing page for contributors to access all content creation tools
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
import { cn } from '@/lib/utils';

// ── Editor Item Definition ────────────────────────────────────────────────────

interface EditorItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  features: string[];
}

// ── Editors Registry ───────────────────────────────────────────────────────────

const EDITOR_ITEMS: EditorItem[] = [
  {
    id: 'notes',
    label: 'Notes Editor',
    description: 'Create and edit official study notes for the community library',
    href: '/editor/notes',
    icon: <Pencil className="h-6 w-6" />,
    accentColor: 'from-amber-500 to-orange-500',
    features: ['Rich text editing', 'Curriculum alignment', 'Tagging system', 'Version history'],
  },
  {
    id: 'curriculum',
    label: 'Curriculum Editor',
    description: 'Manage curricula, subjects, and topic structures',
    href: '/editor/curriculum',
    icon: <BookOpen className="h-6 w-6" />,
    accentColor: 'from-emerald-500 to-teal-500',
    features: ['Create curricula', 'Manage subjects', 'Define topics', 'Set prerequisites'],
  },
  {
    id: 'exam',
    label: 'Exam Data Editor',
    description: 'Edit exam schedules, grade boundaries, and qualification data',
    href: '/editor/exam',
    icon: <ClipboardCheck className="h-6 w-6" />,
    accentColor: 'from-violet-500 to-purple-500',
    features: ['Exam schedules', 'Grade boundaries', 'Qualification data', 'Component weights'],
  },
];

// ── Components ───────────────────────────────────────────────────────────────

function EditorCard({ editor }: { editor: EditorItem }) {
  return (
    <div
      className={cn(
        'group relative flex flex-col p-6 rounded-2xl border border-border',
        'bg-background-card hover:bg-background-secondary',
        'transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5'
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          'inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4',
          'bg-gradient-to-br text-white shadow-sm',
          editor.accentColor
        )}
      >
        {editor.icon}
      </div>

      {/* Content */}
      <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
        {editor.label}
      </h3>
      <p className="text-sm text-foreground-muted mt-1 mb-4">
        {editor.description}
      </p>

      {/* Features */}
      <div className="space-y-2 mb-6">
        {editor.features.map((feature) => (
          <div key={feature} className="flex items-center gap-2 text-sm text-foreground-muted">
            <div className={cn('w-1.5 h-1.5 rounded-full bg-gradient-to-r', editor.accentColor)} />
            {feature}
          </div>
        ))}
      </div>

      {/* Action */}
      <Link
        href={editor.href}
        className={cn(
          'flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium mt-auto',
          'bg-gradient-to-r text-white transition-all duration-200',
          'hover:opacity-90 hover:shadow-md',
          editor.accentColor
        )}
      >
        Open {editor.label}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

export default function ContributePage() {
  const editors = useMemo(() => EDITOR_ITEMS, []);

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground">Contribute</h1>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 text-xs font-medium">
              Contributor
            </span>
          </div>
          <p className="text-sm text-foreground-muted">
            Create and manage official content for the community
          </p>
        </div>

        {/* Admin Link */}
        <Link
          href="/main-contributor"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 transition-colors"
        >
          <ShieldCheck className="h-4 w-4" />
          Admin Panel
        </Link>
      </div>

      {/* Guidelines Banner */}
      <div className="mb-8 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-medium text-foreground mb-1">Contributor Guidelines</h3>
            <p className="text-sm text-foreground-muted">
              All content you create will be reviewed before being published to the library. 
              Please ensure your content is accurate, well-formatted, and follows our 
              curriculum standards.
            </p>
          </div>
        </div>
      </div>

      {/* Editors Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {editors.map((editor) => (
          <EditorCard key={editor.id} editor={editor} />
        ))}
      </div>

      {/* Tips */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
        <div className="flex items-start gap-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary/20 text-primary shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Thank you for contributing!</h3>
            <p className="text-sm text-foreground-muted">
              Your contributions help thousands of Myanmar students access quality educational 
              resources. Every note, curriculum, and exam data point you add makes a difference. 
              Keep up the great work!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

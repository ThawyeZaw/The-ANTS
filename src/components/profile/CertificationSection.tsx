'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CertificationSection Component (v2 — University Admissions Style)
// Full visual redesign: larger cards, prominent exam board branding, big grade
// display, verified shield, and rich color coding per qualification type.
// ──────────────────────────────────────────────────────────────────────────────

import { Award, BookOpen, Globe, PenTool, ShieldCheck, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Certification {
  id: string;
  type: string;
  subject?: string | null;
  exam_board?: string | null;
  grade?: string | null;
  year?: number | null;
  is_verified: boolean;
  is_hidden: boolean;
}

interface CertificationSectionProps {
  certifications: Certification[];
}

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  badgeColor: string;
  borderColor: string;
  glowColor: string;
}> = {
  igcse: {
    label: 'IGCSE',
    icon: <BookOpen className="h-4 w-4" />,
    gradient: 'from-blue-600 via-blue-500 to-cyan-400',
    badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    borderColor: 'border-blue-500/20 hover:border-blue-500/40',
    glowColor: 'rgba(59,130,246,0.15)',
  },
  as_level: {
    label: 'AS Level',
    icon: <Layers className="h-4 w-4" />,
    gradient: 'from-purple-600 via-violet-500 to-fuchsia-400',
    badgeColor: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
    borderColor: 'border-purple-500/20 hover:border-purple-500/40',
    glowColor: 'rgba(139,92,246,0.15)',
  },
  a_level: {
    label: 'A Level',
    icon: <Layers className="h-4 w-4" />,
    gradient: 'from-indigo-600 via-indigo-500 to-blue-400',
    badgeColor: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    borderColor: 'border-indigo-500/20 hover:border-indigo-500/40',
    glowColor: 'rgba(99,102,241,0.15)',
  },
  ielts: {
    label: 'IELTS',
    icon: <Globe className="h-4 w-4" />,
    gradient: 'from-emerald-600 via-green-500 to-teal-400',
    badgeColor: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    glowColor: 'rgba(16,185,129,0.15)',
  },
  toefl: {
    label: 'TOEFL',
    icon: <Globe className="h-4 w-4" />,
    gradient: 'from-teal-600 via-cyan-500 to-sky-400',
    badgeColor: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
    borderColor: 'border-teal-500/20 hover:border-teal-500/40',
    glowColor: 'rgba(20,184,166,0.15)',
  },
  sat: {
    label: 'SAT',
    icon: <PenTool className="h-4 w-4" />,
    gradient: 'from-amber-600 via-orange-500 to-yellow-400',
    badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    borderColor: 'border-amber-500/20 hover:border-amber-500/40',
    glowColor: 'rgba(245,158,11,0.15)',
  },
  other: {
    label: 'Certification',
    icon: <Award className="h-4 w-4" />,
    gradient: 'from-slate-600 via-slate-500 to-slate-400',
    badgeColor: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    borderColor: 'border-slate-500/20 hover:border-slate-500/40',
    glowColor: 'rgba(100,116,139,0.15)',
  },
};

// ── Grade display helper ──────────────────────────────────────────────────────

function gradeColor(grade: string): string {
  const g = grade.toUpperCase().trim();
  if (g === 'A*' || g === 'A+' || g === '9') return 'text-emerald-400';
  if (g === 'A' || g === '8' || g === '7') return 'text-teal-400';
  if (g === 'B' || g === '6') return 'text-sky-400';
  if (g === 'C' || g === '5') return 'text-amber-400';
  if (g.includes('8.') || g.includes('9.')) return 'text-emerald-400'; // IELTS 8+
  if (g.includes('7.') || g.includes('6.')) return 'text-teal-400';
  return 'text-foreground-secondary';
}

// ── Cert Card ─────────────────────────────────────────────────────────────────

function CertCard({ cert }: { cert: Certification }) {
  const meta = TYPE_META[cert.type] || TYPE_META.other;

  return (
    <div
      className={cn(
        'relative group rounded-2xl border bg-background overflow-hidden transition-all duration-300',
        'hover:shadow-lg hover:-translate-y-0.5',
        meta.borderColor,
      )}
      style={{ boxShadow: `0 4px 24px ${meta.glowColor}` }}
    >
      {/* Gradient accent bar */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${meta.gradient}`} />

      <div className="p-5">
        {/* Header: type badge + verified */}
        <div className="flex items-center justify-between mb-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
            meta.badgeColor
          )}>
            {meta.icon}
            {meta.label}
          </span>
          {cert.is_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>

        {/* Subject — prominent */}
        {cert.subject && (
          <h3 className="text-base font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
            {cert.subject}
          </h3>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted mt-1.5">
          {cert.exam_board && <span className="font-medium">{cert.exam_board}</span>}
          {cert.year && <span>{cert.year}</span>}
        </div>

        {/* Grade — large and colored */}
        {cert.grade && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider mb-1">Grade</p>
            <p className={cn('text-3xl font-black tabular-nums leading-none', gradeColor(cert.grade))}>
              {cert.grade}
            </p>
          </div>
        )}
      </div>

      {/* Subtle corner glow on hover */}
      <div
        className="absolute -bottom-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-20 transition-opacity duration-500 blur-xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${meta.glowColor.replace('0.15', '1')}, transparent)` }}
      />
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CertificationSection({ certifications }: CertificationSectionProps) {
  const visible = certifications.filter((c) => !c.is_hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Award className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">Academic Certifications</h2>
          <p className="text-xs text-foreground-muted mt-0.5">{visible.length} qualification{visible.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </div>
    </section>
  );
}

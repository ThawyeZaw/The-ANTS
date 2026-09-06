'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — CertificationSection Component
// Clean academic certification cards with Lucide outline icons.
// ──────────────────────────────────────────────────────────────────────────────

import { Award, BookOpen, Globe, PenTool, ShieldCheck, Layers } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
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

const TYPE_META: Record<string, { label: string; icon: LucideIcon }> = {
  igcse: { label: 'IGCSE', icon: BookOpen },
  as_level: { label: 'AS Level', icon: Layers },
  a_level: { label: 'A Level', icon: Layers },
  ielts: { label: 'IELTS', icon: Globe },
  toefl: { label: 'TOEFL', icon: Globe },
  sat: { label: 'SAT', icon: PenTool },
  other: { label: 'Certification', icon: Award },
};

function gradeTone(grade: string): string {
  const g = grade.toUpperCase().trim();
  if (g === 'A*' || g === 'A+' || g === '9') return 'text-success';
  if (g === 'A' || g === '8' || g === '7') return 'text-success';
  if (g === 'B' || g === '6') return 'text-primary';
  if (g === 'C' || g === '5') return 'text-warning';
  if (g.includes('8.') || g.includes('9.')) return 'text-success';
  if (g.includes('7.') || g.includes('6.')) return 'text-primary';
  return 'text-foreground-secondary';
}

function CertCard({ cert }: { cert: Certification }) {
  const meta = TYPE_META[cert.type] || TYPE_META.other;

  return (
    <div
      className={cn(
        'relative group rounded-2xl border border-border bg-background-card overflow-hidden',
        'hover:border-border-hover transition-colors duration-200'
      )}
    >
      <div className="p-5">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border border-border bg-background-secondary text-foreground-secondary">
            <AppIcon icon={meta.icon} size="sm" tone="secondary" />
            {meta.label}
          </span>
          {cert.is_verified && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 border border-success/20 text-xs font-semibold text-success">
              <ShieldCheck className="h-3.5 w-3.5" />
              Verified
            </span>
          )}
        </div>

        {cert.subject && (
          <h3 className="text-base font-bold text-foreground mb-1 leading-snug group-hover:text-primary transition-colors">
            {cert.subject}
          </h3>
        )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted mt-1.5">
          {cert.exam_board && <span className="font-medium">{cert.exam_board}</span>}
          {cert.year && <span>{cert.year}</span>}
        </div>

        {cert.grade && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[11px] font-medium text-foreground-muted uppercase tracking-wider mb-1">Grade</p>
            <p className={cn('text-3xl font-black tabular-nums leading-none', gradeTone(cert.grade))}>
              {cert.grade}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CertificationSection({ certifications }: CertificationSectionProps) {
  const visible = certifications.filter((c) => !c.is_hidden);
  if (visible.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-3 mb-5">
        <AppIcon icon={Award} size="md" tone="secondary" frame="soft" />
        <div>
          <h2 className="text-lg font-bold text-foreground">Academic Certifications</h2>
          <p className="text-xs text-foreground-muted mt-0.5">
            {visible.length} qualification{visible.length !== 1 ? 's' : ''}
          </p>
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

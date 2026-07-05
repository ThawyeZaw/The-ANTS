'use client';

import { Award, BookOpen, Globe, PenTool, ShieldCheck } from 'lucide-react';
import type { CertificationType } from '@/types';

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

const typeMeta: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  igcse: { label: 'IGCSE', icon: <BookOpen className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-400' },
  as_level: { label: 'AS Level', icon: <BookOpen className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-400' },
  a_level: { label: 'A Level', icon: <BookOpen className="h-4 w-4" />, color: 'bg-indigo-500/10 text-indigo-400' },
  ielts: { label: 'IELTS', icon: <Globe className="h-4 w-4" />, color: 'bg-emerald-500/10 text-emerald-400' },
  toefl: { label: 'TOEFL', icon: <Globe className="h-4 w-4" />, color: 'bg-teal-500/10 text-teal-400' },
  sat: { label: 'SAT', icon: <PenTool className="h-4 w-4" />, color: 'bg-amber-500/10 text-amber-400' },
  other: { label: 'Certification', icon: <Award className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-400' },
};

export default function CertificationSection({ certifications }: CertificationSectionProps) {
  const visible = certifications.filter((c) => !c.is_hidden);
  if (visible.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-background-card p-6">
      <div className="mb-4 flex items-center gap-2">
        <Award className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Academic Certifications</h2>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((cert) => {
          const meta = typeMeta[cert.type] || typeMeta.other;
          return (
            <div
              key={cert.id}
              className="flex items-start gap-3 rounded-lg border border-border bg-background p-4"
            >
              <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${meta.color}`}>
                {meta.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                    {meta.label}
                  </span>
                  {cert.is_verified && (
                    <span className="inline-flex items-center gap-0.5 rounded-md bg-green-500/10 px-1.5 py-0.5 text-xs font-medium text-green-400">
                      <ShieldCheck className="h-3 w-3" />
                      Verified
                    </span>
                  )}
                </div>
                {cert.subject && (
                  <p className="mt-1.5 text-sm font-medium text-foreground">{cert.subject}</p>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-foreground-muted">
                  {cert.exam_board && <span>{cert.exam_board}</span>}
                  {cert.grade && (
                    <span className="font-semibold text-foreground">{cert.grade}</span>
                  )}
                  {cert.year && <span>{cert.year}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

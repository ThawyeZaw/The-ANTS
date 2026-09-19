'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, GraduationCap, ArrowRight, Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getMySubjectsHub, type HubSubject } from '@/actions/curriculum';
import { groupEdexcelIalSubjects } from '@/lib/edexcel-ial';

export function DashboardSubjectsPanel() {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<HubSubject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMySubjectsHub(user.id).then((res) => {
      setSubjects(res.subjects);
      setLoading(false);
    });
  }, [user]);

  if (loading) {
    return (
      <div className="dash-panel p-6 animate-pulse">
        <div className="h-6 w-32 bg-border rounded mb-4" />
        <div className="space-y-3">
          <div className="h-16 bg-background-secondary rounded-xl" />
          <div className="h-16 bg-background-secondary rounded-xl" />
        </div>
      </div>
    );
  }

  if (subjects.length === 0) {
    return (
      <div className="dash-panel p-6 h-full flex flex-col items-center justify-center text-center">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-background-card border border-border mb-3">
          <GraduationCap className="h-5 w-5 text-foreground-muted" />
        </div>
        <p className="text-sm font-semibold text-foreground">No subjects selected yet</p>
        <p className="text-xs text-foreground-muted mt-1.5 max-w-xs leading-relaxed">
          Enroll in subjects to see your progress and quick links here.
        </p>
        <Link href="/curriculum" className="dash-cta mt-5">
          <Plus className="h-3.5 w-3.5" />
          Explore Curriculum
        </Link>
      </div>
    );
  }

  return (
    <div className="dash-panel p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <GraduationCap className="h-4 w-4 text-primary" />
          </span>
          My Subjects
        </h2>
        <Link
          href="/curriculum"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          Manage <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {groupEdexcelIalSubjects(subjects).map((group) => {
          if (!group.isVirtual) {
            const subject = group.units[0];
            return (
              <Link
                key={subject.id}
                href={`/curriculum/${subject.curriculum_id}/${subject.id}`}
                className="group rounded-xl border border-border bg-background-card p-4 hover:border-primary/40 hover:bg-background-secondary/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${subject.color_code ?? '#6366f1'}20`, color: subject.color_code ?? '#6366f1' }}
                      >
                        {subject.code}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground">{subject.name}</h3>
                  </div>
                  <div className="shrink-0 p-2 rounded-lg bg-background-secondary group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-3">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted group-hover:text-foreground transition-colors">
                      <BookOpen className="h-3.5 w-3.5" />
                      Past Papers & Progress
                  </span>
                </div>
              </Link>
            );
          }

          // It's a virtual group
          return (
            <div
              key={group.id}
              className="group rounded-xl border border-border bg-background-card p-4 hover:border-amber-500/40 transition-all"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500">
                      Edexcel IAL Group
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{group.title}</h3>
                </div>
                <div className="shrink-0 p-2 rounded-lg bg-background-secondary">
                  <GraduationCap className="h-4 w-4 text-amber-500" />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {group.units.map((unit) => (
                  <Link
                    key={unit.id}
                    href={`/curriculum/${unit.curriculum_id}/${unit.id}`}
                    className="inline-flex items-center rounded bg-background-secondary px-2 py-1 text-[10px] font-mono font-medium text-foreground hover:bg-primary hover:text-white transition-colors"
                    title={unit.title}
                  >
                    {unit.code}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap,
  FileText,
  Plus,
  Megaphone,
  Clock,
  Users,
  Star,
  CheckSquare,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import MyWorkspace from '@/components/workspace/MyWorkspace';
import { WorkspaceToastProvider } from '@/components/workspace/WorkspaceToast';
import CourseSyncPanel from '@/components/layout/CourseSyncPanel';
import QuickAccessToolbar from '@/components/layout/QuickAccessToolbar';
import { cn } from '@/lib/utils';
import { useDashboardSync } from '@/hooks/useDashboardSync';

// ── Icon & Color maps (replicated from DashboardLayout — PM-locked) ──────────

const iconMap: Record<string, React.ReactNode> = {
  'active-classrooms': <GraduationCap className="h-5 w-5" />,
  'total-students': <Users className="h-5 w-5" />,
  'pending-assignments': <FileText className="h-5 w-5" />,
  'completed-this-week': <CheckSquare className="h-5 w-5" />,
};

const colorMap: Record<string, string> = {
  orange: 'text-orange-500 bg-orange-500/10 dark:text-orange-400 dark:bg-orange-500/20',
  violet: 'text-violet-500 bg-violet-500/10 dark:text-violet-400 dark:bg-violet-500/20',
  red: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/20',
  emerald: 'text-emerald-500 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/20',
  mint: 'text-blue-500 bg-blue-500/10 dark:text-blue-300 dark:bg-blue-500/20',
  amber: 'text-amber-500 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/20',
  teal: 'text-teal-500 bg-teal-500/10 dark:text-teal-400 dark:bg-teal-500/20',
  pink: 'text-pink-500 bg-pink-500/10 dark:text-pink-400 dark:bg-pink-500/20',
  sky: 'text-sky-500 bg-sky-500/10 dark:text-sky-400 dark:bg-sky-500/20',
};

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { role, isTeacher } = useRole();
  const router = useRouter();

  const [teacherClassrooms, setTeacherClassrooms] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (role && !isTeacher) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isTeacher, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const supabase = createClient();
      if (!supabase) return;

      const [{ data: classes }, { data: assigns }, { data: anns }] = await Promise.all([
        supabase.from('classrooms').select('*').eq('created_by', user.id),
        supabase.from('assignments').select('*'),
        supabase.from('classroom_announcements').select('*').order('created_at', { ascending: false }).limit(5),
      ]);

      if (classes) setTeacherClassrooms(classes);
      if (assigns) setActiveAssignments(assigns);
      if (anns) setAnnouncements(anns);

      setStats([
        { key: 'active-classrooms', label: 'Active Classrooms', value: classes?.length ?? 0, color: 'emerald' },
        { key: 'total-students', label: 'Total Students', value: 0, color: 'violet' },
        { key: 'pending-assignments', label: 'Assignments', value: assigns?.length ?? 0, color: 'amber' },
        { key: 'completed-this-week', label: 'Completed Tasks', value: 0, color: 'sky' },
      ]);
    }

    fetchData();
  }, [user]);

  const { upcomingExams } = useDashboardSync();

  if (!user || !isTeacher) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Your classrooms are waiting. Here's your teaching overview for today.";

  const mainContent = (
    <div className="space-y-6">
      {/* Active Classrooms */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-emerald-500" />
            Active Classrooms
          </h2>
          <Link href="/classrooms" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Manage Classrooms
          </Link>
        </div>

        {teacherClassrooms.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center">
            <GraduationCap className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No classrooms assigned</p>
            <p className="text-xs text-foreground-muted mt-1">Create or join a classroom to get started teaching.</p>
            <Link href="/classrooms" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
              <Plus className="h-3.5 w-3.5" /> Go to Classrooms
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {teacherClassrooms.map((classroom) => {
              const memberCount = 0;
              const teacherNames: string[] = [];
              const curriculumNames: string[] = [];

              return (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  memberCount={memberCount}
                  teacherNames={teacherNames}
                  curriculumNames={curriculumNames}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Active Assignments */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            Active Assignments
          </h2>
        </div>

        {activeAssignments.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center text-foreground-muted">
            <p className="text-sm font-medium">No active assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAssignments.slice(0, 3).map((assignment) => {
              const classroomName = teacherClassrooms.find(c => c.id === assignment.classroom_id)?.name || 'Classroom';
              return (
                <div key={assignment.id} className="p-4 bg-background-card/50 border border-border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:border-primary/45 transition-colors">
                  <div>
                    <span className="text-xs text-foreground-muted block mb-0.5">{classroomName}</span>
                    <h4 className="font-semibold text-sm text-foreground">{assignment.title}</h4>
                    <p className="text-xs text-foreground-muted mt-1">Due: {new Date(assignment.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                      assignment.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                      assignment.priority === 'medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-slate-500/10 text-slate-500'
                    }`}>
                      {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)} Priority
                    </span>
                    <Link href={`/classrooms/${assignment.classroom_id}`} className="text-xs text-primary font-semibold hover:underline">
                      Grade Submission →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const sidebarContent = (
    <div className="space-y-3">
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-1.5 text-foreground text-sm">
            <Megaphone className="h-4 w-4 text-sky-500" />
            Club Announcements
          </h3>
        </div>
        <div className="space-y-2">
          {announcements.slice(0, 3).map(ann => (
            <div key={ann.id} className="p-2 bg-background-secondary/50 rounded-lg border border-border/50">
              <p className="font-semibold text-xs text-foreground">{ann.title}</p>
              <p className="text-[11px] text-foreground-muted mt-0.5">{ann.content}</p>
            </div>
          ))}
          {announcements.length === 0 && (
            <p className="text-xs text-foreground-muted">No announcements right now.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold flex items-center gap-1.5 text-foreground text-sm">
            <Clock className="h-4 w-4 text-rose-500" />
            Upcoming Exams
          </h3>
        </div>
        <div className="space-y-2">
          {upcomingExams.slice(0, 3).map(exam => (
            <div key={exam.id} className="p-2 bg-background-secondary/50 rounded-lg border border-border/50 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-xs text-foreground">{exam.custom_title || 'Exam'}</p>
                <p className="text-[11px] text-foreground-muted mt-0.5">{exam.qualification_group || ''}</p>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-[10px] font-semibold text-rose-500 bg-rose-500/10 self-start px-1.5 py-0.5 rounded-md">
                  {exam.target_date ? new Date(exam.target_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}
                </span>
                {!exam.timeLeft.isPast && (
                  <span className="text-[10px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md">
                    {exam.timeLeft.days}d left
                  </span>
                )}
              </div>
            </div>
          ))}
          {upcomingExams.length === 0 && (
            <p className="text-xs text-foreground-muted">No upcoming exams.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in" data-scroll-behavior="smooth">
      {/* Welcome Card */}
      <div className="relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-6 md:p-8 text-white">
        <div className="flex items-center gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white/70">Welcome back</p>
            <h1 className="mt-0.5 text-2xl md:text-3xl font-bold">{firstName} 👋</h1>
            <p className="mt-1 text-sm text-white/70 max-w-md">{welcomeSubtitle}</p>
          </div>
          <div className="hidden sm:flex items-center justify-center shrink-0">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/15 border border-white/20 flex items-center justify-center">
              <Image src="/logo.png" alt="The ANTs logo" width={40} height={40} className="md:w-[52px] md:h-[52px]" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Toolbar */}
      <QuickAccessToolbar />

      {/* Course Sync Panel — enrolled courses with synced resources */}
      <CourseSyncPanel />

      {/* Workspace — upper position */}
      <Suspense fallback={<div className="flex items-center justify-center py-16 text-[var(--foreground-muted)]">Loading workspace...</div>}>
        <WorkspaceToastProvider>
          <MyWorkspace />
        </WorkspaceToastProvider>
      </Suspense>

      {/* Stats Grid */}
      {stats && stats.length > 0 && (
        <div className="grid grid-cols-4 gap-2">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-3 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={cn('inline-flex p-1.5 rounded-lg mb-1.5', colorMap[stat.color] || 'text-foreground bg-foreground/10')}>
                {iconMap[stat.key] || <Star className="h-4 w-4" />}
              </div>
              <p className="text-lg font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-foreground-muted mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Original dashboard content — below workspace */}
      <div className="border-t border-[var(--border)] pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-6 lg:col-span-2">{mainContent}</div>
          <div className="space-y-6 lg:col-span-1">{sidebarContent}</div>
        </div>
      </div>
    </div>
  );
}

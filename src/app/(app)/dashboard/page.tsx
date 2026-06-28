'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Unified Dashboard
// Conditionally renders content based on user role (student, teacher, contributor, main_contributor)
// ──────────────────────────────────────────────────────────────────────────────

import Link from 'next/link';
import {
  CalendarDays,
  Timer,
  Layers,
  ClipboardCheck,
  BookOpen,
  GraduationCap,
  MessageSquare,
  Clock,
  Calculator,
  Flame,
  Zap,
  TrendingUp,
  Users,
  FileText,
  CheckSquare,
  Pencil,
  UserCircle,
  Star,
  Send,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserPlus,
  Library,
  Bookmark,
  BookMarked,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useSavedNotes, useContributorNotes } from '@/hooks/useNotes';

// --- STUDENT DATA ---
const STUDENT_QUICK_LINKS = [
  { title: 'Timetable', description: 'Manage your schedule', href: '/timetable', icon: <CalendarDays className="h-5 w-5" />, gradient: 'from-blue-500 to-cyan-400' },
  { title: 'Pomodoro', description: 'Focus sessions', href: '/pomodoro', icon: <Timer className="h-5 w-5" />, gradient: 'from-rose-500 to-pink-400' },
  { title: 'Flashcards', description: 'Spaced repetition', href: '/flashcards', icon: <Layers className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-400' },
  { title: 'Lessons', description: 'Track confidence', href: '/lessons', icon: <ClipboardCheck className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-400' },
  { title: 'Courses', description: 'Manage subjects', href: '/courses', icon: <BookOpen className="h-5 w-5" />, gradient: 'from-orange-500 to-amber-400' },
  { title: 'Classrooms', description: 'Join a class', href: '/classrooms', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'Notes Library', description: 'Browse study notes', href: '/library', icon: <Library className="h-5 w-5" />, gradient: 'from-violet-500 to-indigo-400' },
  { title: 'Clubs', description: 'Community spaces', href: '/clubs', icon: <MessageSquare className="h-5 w-5" />, gradient: 'from-indigo-500 to-violet-400' },
  { title: 'Countdown', description: 'Exam timers', href: '/countdown', icon: <Clock className="h-5 w-5" />, gradient: 'from-red-500 to-rose-400' },
  { title: 'Calculator', description: 'Grade prediction', href: '/calculator', icon: <Calculator className="h-5 w-5" />, gradient: 'from-teal-500 to-emerald-400' },
  { title: 'My Profile', description: 'View & edit profile', href: '/profile/me', icon: <UserCircle className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-400' },
];

const STUDENT_STATS = [
  { label: 'Study Streak', value: '7 days', icon: <Flame className="h-5 w-5" />, color: 'text-orange-500 bg-orange-500/10' },
  { label: 'Cards Due', value: '24', icon: <Zap className="h-5 w-5" />, color: 'text-violet-500 bg-violet-500/10' },
  { label: 'Next Exam', value: '18 days', icon: <Clock className="h-5 w-5" />, color: 'text-red-500 bg-red-500/10' },
  { label: 'Avg. Confidence', value: '72%', icon: <TrendingUp className="h-5 w-5" />, color: 'text-emerald-500 bg-emerald-500/10' },
];

// --- TEACHER DATA ---
const TEACHER_QUICK_LINKS = [
  { title: 'Classrooms', description: 'Manage your classes', href: '/classrooms', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-400' },
  { title: 'Timetable', description: 'Your schedule', href: '/timetable', icon: <CalendarDays className="h-5 w-5" />, gradient: 'from-blue-500 to-cyan-400' },
  { title: 'Pomodoro', description: 'Focus sessions', href: '/pomodoro', icon: <Timer className="h-5 w-5" />, gradient: 'from-rose-500 to-pink-400' },
  { title: 'Flashcards', description: 'Study decks', href: '/flashcards', icon: <Layers className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-400' },
  { title: 'Lessons', description: 'Track progress', href: '/lessons', icon: <ClipboardCheck className="h-5 w-5" />, gradient: 'from-orange-500 to-amber-400' },
  { title: 'Courses', description: 'Manage curricula', href: '/courses', icon: <BookOpen className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'Notes Library', description: 'Browse study notes', href: '/library', icon: <Library className="h-5 w-5" />, gradient: 'from-violet-500 to-indigo-400' },
  { title: 'Clubs', description: 'Join communities', href: '/clubs', icon: <MessageSquare className="h-5 w-5" />, gradient: 'from-indigo-500 to-violet-400' },
  { title: 'Countdown', description: 'Exam timers', href: '/countdown', icon: <Clock className="h-5 w-5" />, gradient: 'from-red-500 to-rose-400' },
  { title: 'Calculator', description: 'Grade prediction', href: '/calculator', icon: <Calculator className="h-5 w-5" />, gradient: 'from-teal-500 to-emerald-400' },
  { title: 'My Profile', description: 'View & edit profile', href: '/profile/me', icon: <UserCircle className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-400' },
];

const TEACHER_STATS = [
  { label: 'Active Classrooms', value: '3', icon: <GraduationCap className="h-5 w-5" />, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Total Students', value: '47', icon: <Users className="h-5 w-5" />, color: 'text-blue-500 bg-blue-500/10' },
  { label: 'Pending Assignments', value: '5', icon: <FileText className="h-5 w-5" />, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Completed This Week', value: '12', icon: <CheckSquare className="h-5 w-5" />, color: 'text-violet-500 bg-violet-500/10' },
];

// --- CONTRIBUTOR DATA ---
const CONTRIBUTOR_QUICK_LINKS = [
  { title: 'Notes Editor', description: 'Create study notes', href: '/editor/notes', icon: <Library className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-400' },
  { title: 'Curriculum Editor', description: 'Build resources', href: '/editor', icon: <Pencil className="h-5 w-5" />, gradient: 'from-indigo-500 to-violet-400' },
  { title: 'Exam Data Editor', description: 'Edit exam data', href: '/editor/exam', icon: <FileText className="h-5 w-5" />, gradient: 'from-blue-500 to-indigo-400' },
  { title: 'Notes Library', description: 'Browse all notes', href: '/library', icon: <BookOpen className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'My Profile', description: 'Public profile', href: '/profile/me', icon: <UserCircle className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-400' },
  { title: 'Clubs', description: 'Lead communities', href: '/clubs', icon: <MessageSquare className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'Classrooms', description: 'Join a class', href: '/classrooms', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-400' },
  { title: 'Timetable', description: 'Your schedule', href: '/timetable', icon: <CalendarDays className="h-5 w-5" />, gradient: 'from-blue-500 to-cyan-400' },
  { title: 'Flashcards', description: 'Study decks', href: '/flashcards', icon: <Layers className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-400' },
  { title: 'Lessons', description: 'Track confidence', href: '/lessons', icon: <ClipboardCheck className="h-5 w-5" />, gradient: 'from-teal-500 to-emerald-400' },
  { title: 'Countdown', description: 'Exam timers', href: '/countdown', icon: <Clock className="h-5 w-5" />, gradient: 'from-red-500 to-rose-400' },
];

const CONTRIBUTOR_STATS = [
  { label: 'Published', value: '14', icon: <Star className="h-5 w-5" />, color: 'text-violet-500 bg-violet-500/10' },
  { label: 'Pending Review', value: '3', icon: <Send className="h-5 w-5" />, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Clubs Led', value: '2', icon: <MessageSquare className="h-5 w-5" />, color: 'text-sky-500 bg-sky-500/10' },
  { label: 'Profile Views', value: '128', icon: <UserCircle className="h-5 w-5" />, color: 'text-pink-500 bg-pink-500/10' },
];

// --- MAIN CONTRIBUTOR DATA ---
const MAIN_CONTRIBUTOR_QUICK_LINKS = [
  { title: 'Notes Editor', description: 'Create study notes', href: '/editor/notes', icon: <Library className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-400' },
  { title: 'Review Queue', description: 'Approve submissions', href: '/review', icon: <ShieldCheck className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-400' },
  { title: 'Add New User', description: 'Create accounts', href: '/add-user', icon: <UserPlus className="h-5 w-5" />, gradient: 'from-fuchsia-500 to-pink-400' },
  { title: 'Curriculum Editor', description: 'Build resources', href: '/editor', icon: <Pencil className="h-5 w-5" />, gradient: 'from-indigo-500 to-violet-400' },
  { title: 'Exam Data Editor', description: 'Edit exam data', href: '/editor/exam', icon: <FileText className="h-5 w-5" />, gradient: 'from-blue-500 to-indigo-400' },
  { title: 'Notes Library', description: 'Browse all notes', href: '/library', icon: <BookOpen className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'My Profile', description: 'Public profile', href: '/profile/me', icon: <UserCircle className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-400' },
  { title: 'Clubs', description: 'Lead communities', href: '/clubs', icon: <MessageSquare className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'Classrooms', description: 'Join a class', href: '/classrooms', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-400' },
  { title: 'Timetable', description: 'Your schedule', href: '/timetable', icon: <CalendarDays className="h-5 w-5" />, gradient: 'from-blue-500 to-cyan-400' },
  { title: 'Flashcards', description: 'Study decks', href: '/flashcards', icon: <Layers className="h-5 w-5" />, gradient: 'from-rose-500 to-pink-400' },
  { title: 'Lessons', description: 'Track confidence', href: '/lessons', icon: <ClipboardCheck className="h-5 w-5" />, gradient: 'from-teal-500 to-emerald-400' },
];

const MAIN_CONTRIBUTOR_STATS = [
  { label: 'Pending Reviews', value: '8', icon: <AlertTriangle className="h-5 w-5" />, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Approved This Week', value: '15', icon: <CheckCircle className="h-5 w-5" />, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Rejected This Week', value: '2', icon: <XCircle className="h-5 w-5" />, color: 'text-red-500 bg-red-500/10' },
  { label: 'Total Reviewed', value: '234', icon: <ShieldCheck className="h-5 w-5" />, color: 'text-violet-500 bg-violet-500/10' },
];

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.profile.role;
  const firstName = user.profile.name.split(' ')[0];

  // Notes data
  const { savedNotes } = useSavedNotes(user.id);
  const { notes: contributorNotes } = useContributorNotes(
    (role === 'contributor' || role === 'main_contributor') ? user.id : undefined
  );

  let quickLinks = STUDENT_QUICK_LINKS;
  let stats = STUDENT_STATS;
  let welcomeSubtitle = "Here's your study snapshot for today. Keep up the great work!";

  if (role === 'teacher') {
    quickLinks = TEACHER_QUICK_LINKS;
    stats = TEACHER_STATS;
    welcomeSubtitle = "Your classrooms are waiting. Here's your teaching overview for today.";
  } else if (role === 'contributor') {
    quickLinks = CONTRIBUTOR_QUICK_LINKS;
    stats = CONTRIBUTOR_STATS;
    welcomeSubtitle = "Your contributions are making a difference. Here's your creator overview.";
  } else if (role === 'main_contributor') {
    quickLinks = MAIN_CONTRIBUTOR_QUICK_LINKS;
    stats = MAIN_CONTRIBUTOR_STATS;
    welcomeSubtitle = "You have pending reviews waiting. Here's your gatekeeper overview.";
  }

  return (
    <div className="space-y-8 animate-fade-in" data-scroll-behavior="smooth">
      {/* Welcome Card */}
      <div className="bg-linear-to-br from-primary to-accent rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">Welcome back</p>
          <h1 className="text-3xl font-bold mt-1">{firstName} 👋</h1>
          <p className="text-white/70 mt-2 max-w-md">
            {welcomeSubtitle}
          </p>
        </div>
      </div>

      {/* Main Contributor Pending Review Alert */}
      {role === 'main_contributor' && (
        <div className="flex items-center gap-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">8 submissions awaiting review</p>
            <p className="text-sm text-foreground-muted">Contributor submissions need your approval before going live.</p>
          </div>
          <Link href="/review">
            <button className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors cursor-pointer">
              Review Now
            </button>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-background-card border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className={cn('inline-flex p-2 rounded-lg mb-3', stat.color)}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-foreground-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── My Notes Widget (all roles) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-violet-500" />
            My Notes
          </h2>
          <Link href="/library" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Library className="h-4 w-4" />
            Browse Library
          </Link>
        </div>

        {/* Saved notes for students/teachers */}
        {(role === 'student' || role === 'teacher') && (
          savedNotes.length === 0 ? (
            <div className="bg-background-card border border-dashed border-border rounded-xl p-6 text-center">
              <Bookmark className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
              <p className="text-sm font-medium text-foreground">No saved notes yet</p>
              <p className="text-xs text-foreground-muted mt-1">Browse the library and save notes to see them here.</p>
              <Link href="/library" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
                <Library className="h-3.5 w-3.5" /> Explore Notes
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedNotes.slice(0, 3).map((note) => (
                <Link key={note.id} href={`/library/${note.id}`}
                  className="group flex flex-col gap-1.5 bg-background-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-1.5">
                    <BookMarked className="h-3.5 w-3.5 text-violet-500 shrink-0" />
                  </div>
                  <p className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">{note.title}</p>
                  <p className="text-xs text-foreground-muted line-clamp-1">{note.summary}</p>
                </Link>
              ))}
              {savedNotes.length > 3 && (
                <Link href="/library" className="flex items-center justify-center gap-2 bg-background-secondary border border-dashed border-border rounded-xl p-4 text-sm text-foreground-muted hover:text-foreground transition-colors">
                  +{savedNotes.length - 3} more notes
                </Link>
              )}
            </div>
          )
        )}

        {/* Contributor notes (my drafts / pending) */}
        {(role === 'contributor' || role === 'main_contributor') && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contributorNotes.slice(0, 3).map((note) => (
                <Link key={note.id}
                  href={note.status === 'draft' || note.status === 'rejected' ? `/editor/notes?id=${note.id}` : `/library/${note.id}`}
                  className="group flex flex-col gap-1.5 bg-background-card border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center gap-1.5">
                    <span className={cn(
                      'text-xs font-medium px-2 py-0.5 rounded-full',
                      note.status === 'approved' && 'bg-emerald-500/10 text-emerald-600',
                      note.status === 'pending_review' && 'bg-amber-500/10 text-amber-600',
                      note.status === 'draft' && 'bg-slate-500/10 text-slate-500',
                      note.status === 'rejected' && 'bg-red-500/10 text-red-600',
                    )}>
                      {note.status === 'pending_review' ? 'Pending' : note.status.charAt(0).toUpperCase() + note.status.slice(1)}
                    </span>
                  </div>
                  <p className="font-medium text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">{note.title}</p>
                  <p className="text-xs text-foreground-muted">{note.blocks.length} blocks</p>
                </Link>
              ))}
              <Link href="/editor/notes"
                className="flex flex-col items-center justify-center gap-2 bg-background-secondary border border-dashed border-border rounded-xl p-4 text-sm text-foreground-muted hover:text-primary hover:border-primary/30 transition-all">
                <Library className="h-5 w-5" />
                Create New Note
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 bg-background-card border border-border rounded-xl p-4 hover:border-border-hover hover:shadow-md transition-all duration-200"
            >
              <div className={cn('p-2.5 rounded-xl bg-linear-to-br text-white shrink-0', link.gradient)}>
                {link.icon}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {link.title}
                </p>
                <p className="text-sm text-foreground-muted">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
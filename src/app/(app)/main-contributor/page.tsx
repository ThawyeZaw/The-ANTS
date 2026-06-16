'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Main Contributor Landing Page
// Review queue summary, quick links, and placeholder stats.
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
  Pencil,
  FileText,
  UserCircle,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const QUICK_LINKS = [
  { title: 'Review Queue', description: 'Approve submissions', href: '/review', icon: <ShieldCheck className="h-5 w-5" />, gradient: 'from-amber-500 to-orange-400' },
  { title: 'Curriculum Editor', description: 'Build resources', href: '/editor', icon: <Pencil className="h-5 w-5" />, gradient: 'from-violet-500 to-purple-400' },
  { title: 'Exam Data Editor', description: 'Edit exam data', href: '/editor/exam', icon: <FileText className="h-5 w-5" />, gradient: 'from-indigo-500 to-violet-400' },
  { title: 'My Profile', description: 'Public profile', href: '/profile/me', icon: <UserCircle className="h-5 w-5" />, gradient: 'from-pink-500 to-rose-400' },
  { title: 'Clubs', description: 'Lead communities', href: '/clubs', icon: <MessageSquare className="h-5 w-5" />, gradient: 'from-sky-500 to-blue-400' },
  { title: 'Classrooms', description: 'Join a class', href: '/classrooms', icon: <GraduationCap className="h-5 w-5" />, gradient: 'from-emerald-500 to-teal-400' },
  { title: 'Timetable', description: 'Your schedule', href: '/timetable', icon: <CalendarDays className="h-5 w-5" />, gradient: 'from-blue-500 to-cyan-400' },
  { title: 'Flashcards', description: 'Study decks', href: '/flashcards', icon: <Layers className="h-5 w-5" />, gradient: 'from-rose-500 to-pink-400' },
  { title: 'Lessons', description: 'Track confidence', href: '/lessons', icon: <ClipboardCheck className="h-5 w-5" />, gradient: 'from-teal-500 to-emerald-400' },
];

const STATS = [
  { label: 'Pending Reviews', value: '8', icon: <AlertTriangle className="h-5 w-5" />, color: 'text-amber-500 bg-amber-500/10' },
  { label: 'Approved This Week', value: '15', icon: <CheckCircle className="h-5 w-5" />, color: 'text-emerald-500 bg-emerald-500/10' },
  { label: 'Rejected This Week', value: '2', icon: <XCircle className="h-5 w-5" />, color: 'text-red-500 bg-red-500/10' },
  { label: 'Total Reviewed', value: '234', icon: <ShieldCheck className="h-5 w-5" />, color: 'text-violet-500 bg-violet-500/10' },
];

export default function MainContributorLandingPage() {
  const { user } = useAuth();
  const firstName = user?.profile?.name?.split(' ')[0] ?? 'Contributor';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Card */}
      <div className="bg-gradient-to-br from-primary to-accent rounded-2xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">Welcome back</p>
          <h1 className="text-3xl font-bold mt-1">{firstName} 👋</h1>
          <p className="text-white/70 mt-2 max-w-md">
            You have pending reviews waiting. Here&apos;s your gatekeeper overview.
          </p>
        </div>
      </div>

      {/* Pending Review Alert */}
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

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat) => (
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

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Quick Access</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-4 bg-background-card border border-border rounded-xl p-4 hover:border-border-hover hover:shadow-md transition-all duration-200"
            >
              <div className={cn('p-2.5 rounded-xl bg-gradient-to-br text-white shrink-0', link.gradient)}>
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

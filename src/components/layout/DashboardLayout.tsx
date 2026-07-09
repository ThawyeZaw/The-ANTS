'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import {
  Flame,
  Zap,
  Clock,
  TrendingUp,
  GraduationCap,
  Users,
  FileText,
  CheckSquare,
  Star,
  Send,
  MessageSquare,
  UserCircle,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from 'lucide-react';

interface StatItem {
  label: string;
  value: string | number;
  color: string;
  key: string;
}

interface DashboardLayoutProps {
  firstName: string;
  welcomeSubtitle: string;
  stats: StatItem[];
  alertBanner?: React.ReactNode;
  mainContent: React.ReactNode;
  sidebarContent: React.ReactNode;
}

const iconMap: Record<string, React.ReactNode> = {
  'study-streak': <Flame className="h-5 w-5" />,
  'cards-due': <Zap className="h-5 w-5" />,
  'next-exam': <Clock className="h-5 w-5" />,
  'avg-confidence': <TrendingUp className="h-5 w-5" />,

  'active-classrooms': <GraduationCap className="h-5 w-5" />,
  'total-students': <Users className="h-5 w-5" />,
  'pending-assignments': <FileText className="h-5 w-5" />,
  'completed-this-week': <CheckSquare className="h-5 w-5" />,

  'published': <Star className="h-5 w-5" />,
  'pending-review': <Send className="h-5 w-5" />,
  'clubs-led': <MessageSquare className="h-5 w-5" />,
  'profile-views': <UserCircle className="h-5 w-5" />,

  'pending-reviews': <AlertTriangle className="h-5 w-5" />,
  'approved-this-week': <CheckCircle className="h-5 w-5" />,
  'rejected-this-week': <XCircle className="h-5 w-5" />,
  'total-reviewed': <ShieldCheck className="h-5 w-5" />,
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
};

export default function DashboardLayout({
  firstName,
  welcomeSubtitle,
  stats,
  alertBanner,
  mainContent,
  sidebarContent,
}: DashboardLayoutProps) {
  return (
    <div className="space-y-6 animate-fade-in" data-scroll-behavior="smooth">
      {/* Welcome Card — redesigned with unique diamond-grid pattern, glowing nodes & enhanced depth */}
      <div className="dash-welcome-pattern dash-welcome-shadow relative overflow-hidden rounded-2xl bg-linear-to-br from-primary to-accent p-8 text-white">
        {/* Ambient blurred orbs for depth */}
        <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/4 translate-y-1/4 rounded-full bg-white/8 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl" />

        {/* Animated glowing node highlights — focal point grid intersections */}
        <div className="dash-welcome-nodes" aria-hidden="true">
          <div className="dash-welcome-node" style={{ top: '15%', left: '12%', animationDelay: '0s' }} />
          <div className="dash-welcome-node" style={{ top: '15%', left: '48%', animationDelay: '0.6s' }} />
          <div className="dash-welcome-node" style={{ top: '15%', left: '84%', animationDelay: '1.2s' }} />
          <div className="dash-welcome-node" style={{ top: '50%', left: '12%', animationDelay: '0.8s' }} />
          <div className="dash-welcome-node" style={{ top: '50%', left: '84%', animationDelay: '1.6s' }} />
          <div className="dash-welcome-node" style={{ top: '80%', left: '12%', animationDelay: '0.3s' }} />
          <div className="dash-welcome-node" style={{ top: '80%', left: '48%', animationDelay: '1.0s' }} />
          <div className="dash-welcome-node" style={{ top: '80%', left: '84%', animationDelay: '0.5s' }} />
        </div>

        <div className="relative z-10">
          <p className="text-sm font-medium text-white/70">Welcome back</p>
          <h1 className="mt-1 text-3xl font-bold">{firstName} 👋</h1>
          <p className="mt-2 max-w-md text-white/70">
            {welcomeSubtitle}
          </p>
        </div>
      </div>

      {/* Alert Banner if present */}
      {alertBanner && (
        <div className="animate-slide-down">
          {alertBanner}
        </div>
      )}

      {/* Metrics Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className="glass rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 dash-stat-grid"
          >
            <div className={cn('inline-flex p-2 rounded-xl mb-3', colorMap[stat.color] || 'text-foreground bg-foreground/10')}>
              {iconMap[stat.key] || <Star className="h-5 w-5" />}
            </div>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-foreground-muted mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Split Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main Grid Area */}
        <div className="space-y-6 lg:col-span-2 dash-grid-section rounded-2xl p-0.5">
          {mainContent}
        </div>

        {/* Sidebar Grid Area */}
        <div className="space-y-6 lg:col-span-1 dash-grid-section rounded-2xl p-0.5">
          {sidebarContent}
        </div>
      </div>
    </div>
  );
}

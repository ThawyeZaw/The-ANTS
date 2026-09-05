'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — RelatedPagesSidebar
// Context-aware left sidebar strip that shows related study tools & shortcuts.
// Desktop only (collapses cleanly on tablet & mobile).
// ──────────────────────────────────────────────────────────────────────────────

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Timer,
  BookOpen,
  GraduationCap,
  Clock,
  Calculator,
  Compass,
  FlaskConical,
  UserCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  color?: string;
}

const CONTEXT_MAP: Record<string, SidebarLink[]> = {
  '/pomodoro': [
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-blue-500' },
    { label: 'Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-amber-500' },
    { label: 'Courses', href: '/library?tab=courses', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-500' },
  ],
  '/courses': [
    { label: 'Library', href: '/library', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-500' },
    { label: 'Exams', href: '/library?tab=exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-500' },
    { label: 'Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-amber-500' },
  ],
  '/timetable': [
    { label: 'Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-amber-500' },
    { label: 'Pomodoro', href: '/pomodoro', icon: <Timer className="h-4 w-4" />, color: 'text-rose-500' },
    { label: 'Courses', href: '/library?tab=courses', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-500' },
  ],
  '/countdown': [
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-blue-500' },
    { label: 'Calculator', href: '/calculator', icon: <Calculator className="h-4 w-4" />, color: 'text-emerald-500' },
    { label: 'Past Exams', href: '/library?tab=exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-500' },
  ],
  '/calculator': [
    { label: 'Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-amber-500' },
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-blue-500' },
    { label: 'Past Exams', href: '/library?tab=exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-500' },
  ],
  '/library': [
    { label: 'Courses', href: '/library?tab=courses', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-500' },
    { label: 'Exams', href: '/library?tab=exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-500' },
    { label: 'Tools', href: '/library?tab=tools', icon: <Timer className="h-4 w-4" />, color: 'text-sky-500' },
  ],
  '/profile': [
    { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" />, color: 'text-foreground-muted' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-primary' },
  ],
  '/settings': [
    { label: 'My Profile', href: '/profile/me', icon: <UserCircle className="h-4 w-4" />, color: 'text-violet-500' },
    { label: 'Explore Tutors', href: '/explore?tab=tutors', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-500' },
  ],
  '/dashboard': [
    { label: 'Library', href: '/library', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-500' },
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-blue-500' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-primary' },
  ],
};

function getContextLinks(pathname: string): SidebarLink[] {
  const keys = Object.keys(CONTEXT_MAP);
  const match = keys
    .filter((key) => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? CONTEXT_MAP[match] : [];
}

function SidebarIconBtn({ link, isActive }: { link: SidebarLink; isActive: boolean }) {
  return (
    <Link
      href={link.href}
      title={link.label}
      aria-label={link.label}
      className={cn(
        'relative group flex flex-col items-center gap-1 w-full py-2.5 rounded-xl transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
      )}
    >
      <span
        className={cn(
          'transition-transform duration-200 group-hover:scale-110',
          isActive ? 'text-primary' : link.color
        )}
      >
        {link.icon}
      </span>

      <span className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-background-card border border-border text-foreground shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {link.label}
      </span>

      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
    </Link>
  );
}

export default function RelatedPagesSidebar({ className }: { className?: string }) {
  const pathname = usePathname();
  const contextLinks = getContextLinks(pathname);

  if (contextLinks.length === 0) return null;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col items-center gap-1 w-12 shrink-0 py-4 px-1',
        'sticky top-6 self-start z-10',
        'rounded-2xl border border-border bg-background-card/70 backdrop-blur-md shadow-xs',
        className
      )}
    >
      <p className="text-[9px] font-bold uppercase tracking-widest text-foreground-muted/50 mb-1 select-none">
        Links
      </p>
      <div className="w-full h-px bg-border mb-1" />

      {contextLinks.map((link) => (
        <SidebarIconBtn
          key={link.href}
          link={link}
          isActive={pathname.startsWith(link.href) && link.href !== '/'}
        />
      ))}
    </aside>
  );
}

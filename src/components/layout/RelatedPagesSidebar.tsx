'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — RelatedPagesSidebar
// Context-aware left sidebar strip that shows related page shortcuts.
// Changes icon links based on the current route. Desktop: icon + tooltip.
// Hidden on mobile (collapsed). Only shown inside authenticated pages.
// ──────────────────────────────────────────────────────────────────────────────

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  Timer,
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  ClipboardCheck,
  Clock,
  Calculator,
  MessageSquare,
  Library,
  Compass,
  BookMarked,
  FlaskConical,
  NotebookPen,
  ScrollText,
  SquareStack,
  UserCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Context map: route prefix → related page links ───────────────────────────

interface SidebarLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  color?: string; // accent color class for the icon
}

const CONTEXT_MAP: Record<string, SidebarLink[]> = {
  '/flashcards': [
    { label: 'Library Decks', href: '/library/flashcards', icon: <SquareStack className="h-4 w-4" />, color: 'text-amber-400' },
    { label: 'Pomodoro', href: '/pomodoro', icon: <Timer className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'My Notes', href: '/my-notes', icon: <NotebookPen className="h-4 w-4" />, color: 'text-sky-400' },
  ],
  '/pomodoro': [
    { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
  ],
  '/courses': [
    { label: 'Lesson Tracker', href: '/lessons', icon: <ClipboardCheck className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400' },
  ],
  '/lessons': [
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Exam Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-sky-400' },
  ],
  '/my-notes': [
    { label: 'Library Notes', href: '/library', icon: <Library className="h-4 w-4" />, color: 'text-amber-400' },
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400' },
  ],
  '/timetable': [
    { label: 'Exam Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Courses', href: '/courses', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Pomodoro', href: '/pomodoro', icon: <Timer className="h-4 w-4" />, color: 'text-violet-400' },
  ],
  '/countdown': [
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Grade Calc', href: '/calculator', icon: <Calculator className="h-4 w-4" />, color: 'text-amber-400' },
    { label: 'Library Exams', href: '/library/exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-400' },
  ],
  '/calculator': [
    { label: 'Exam Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Library Exams', href: '/library/exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-400' },
  ],
  '/clubs': [
    { label: 'Classrooms', href: '/classrooms', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'My Profile', href: '/profile/me', icon: <UserCircle className="h-4 w-4" />, color: 'text-pink-400' },
  ],
  '/classrooms': [
    { label: 'Clubs', href: '/clubs', icon: <MessageSquare className="h-4 w-4" />, color: 'text-pink-400' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'My Profile', href: '/profile/me', icon: <UserCircle className="h-4 w-4" />, color: 'text-violet-400' },
  ],
  '/profile': [
    { label: 'Settings', href: '/settings', icon: <Settings className="h-4 w-4" />, color: 'text-foreground-muted' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Clubs', href: '/clubs', icon: <MessageSquare className="h-4 w-4" />, color: 'text-pink-400' },
  ],
  '/settings': [
    { label: 'My Profile', href: '/profile/me', icon: <UserCircle className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Clubs', href: '/clubs', icon: <MessageSquare className="h-4 w-4" />, color: 'text-pink-400' },
  ],
  '/library': [
    { label: 'Courses', href: '/library/courses', icon: <GraduationCap className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'My Notes', href: '/my-notes', icon: <NotebookPen className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, color: 'text-violet-400' },
    { label: 'Library Exams', href: '/library/exams', icon: <FlaskConical className="h-4 w-4" />, color: 'text-rose-400' },
    { label: 'Tools', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-amber-400' },
  ],
  '/dashboard': [
    { label: 'Study', href: '/library', icon: <BookOpen className="h-4 w-4" />, color: 'text-emerald-400' },
    { label: 'Tools', href: '/countdown', icon: <Clock className="h-4 w-4" />, color: 'text-sky-400' },
    { label: 'Community', href: '/community', icon: <Compass className="h-4 w-4" />, color: 'text-pink-400' },
    { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, color: 'text-violet-400' },
  ],
};

// ── Match the best context for a given pathname ───────────────────────────────

function getContextLinks(pathname: string): SidebarLink[] {
  // Find the best matching prefix (longest match wins)
  const keys = Object.keys(CONTEXT_MAP);
  const match = keys
    .filter(key => pathname.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ? CONTEXT_MAP[match] : [];
}

// ── Sidebar Icon Button ───────────────────────────────────────────────────────

function SidebarIconBtn({ link, isActive }: { link: SidebarLink; isActive: boolean }) {
  return (
    <Link
      href={link.href}
      title={link.label}
      aria-label={link.label}
      className={cn(
        'relative group flex flex-col items-center gap-1 w-full py-2.5 rounded-xl transition-all duration-200',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
      )}
    >
      {/* Icon */}
      <span className={cn(
        'transition-transform duration-200 group-hover:scale-110',
        isActive ? 'text-primary' : link.color
      )}>
        {link.icon}
      </span>

      {/* Tooltip on hover */}
      <span
        className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-background-card border border-border text-foreground shadow-lg whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        {link.label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
      )}
    </Link>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface RelatedPagesSidebarProps {
  className?: string;
}

export default function RelatedPagesSidebar({ className }: RelatedPagesSidebarProps) {
  const pathname = usePathname();
  const contextLinks = getContextLinks(pathname);

  // Don't render if no relevant context links
  if (contextLinks.length === 0) return null;

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col items-center gap-1 w-[48px] shrink-0 py-3 px-1',
        'sticky top-24 self-start z-10',
        'rounded-2xl border border-border bg-background-card/70 backdrop-blur-md shadow-sm',
        className
      )}
      aria-label="Related pages shortcuts"
    >
      {/* Section divider label */}
      <p
        className="text-[9px] font-bold uppercase tracking-[0.14em] text-foreground-muted/55 mb-1 select-none"
        title="Related"
      >
        REL
      </p>
      <div className="w-8 h-px bg-border/70 mb-1" />

      {/* Context links */}
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

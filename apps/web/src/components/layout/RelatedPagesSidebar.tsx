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
  UserCircle,
  Settings,
  Users,
  Trophy,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import { useStaffProfileEligible } from '@/hooks/useStaffProfileEligible';
import { cn } from '@/lib/utils';

interface SidebarLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const CONTEXT_MAP: Record<string, SidebarLink[]> = {
  '/curriculum': [
    { label: 'Past Papers', href: '/past-papers', icon: BookOpen },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Countdown', href: '/countdown', icon: Clock },
  ],
  '/pomodoro': [
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Countdown', href: '/countdown', icon: Clock },
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
  ],
  '/timetable': [
    { label: 'Countdown', href: '/countdown', icon: Clock },
    { label: 'Pomodoro', href: '/pomodoro', icon: Timer },
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
  ],
  '/past-papers': [
    { label: 'Calculator', href: '/calculator', icon: Calculator },
    { label: 'Countdown', href: '/countdown', icon: Clock },
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
  ],
  '/countdown': [
    { label: 'Past Papers', href: '/past-papers', icon: BookOpen },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Calculator', href: '/calculator', icon: Calculator },
  ],
  '/calculator': [
    { label: 'Past Papers', href: '/past-papers', icon: BookOpen },
    { label: 'Countdown', href: '/countdown', icon: Clock },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
  ],
  '/leaderboard': [
    { label: 'Past Papers', href: '/past-papers', icon: BookOpen },
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
    { label: 'Countdown', href: '/countdown', icon: Clock },
  ],
  '/library': [
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
    { label: 'Past Papers', href: '/past-papers', icon: BookOpen },
    { label: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ],
  '/profile': [
    { label: 'Settings', href: '/settings', icon: Settings },
    { label: 'Tutors & Contributors', href: '/team', icon: GraduationCap },
  ],
  '/settings': [
    { label: 'My Profile', href: '/profile/me', icon: UserCircle },
    { label: 'Tutors & Contributors', href: '/team', icon: GraduationCap },
  ],
  '/dashboard': [
    { label: 'Curriculum', href: '/curriculum', icon: GraduationCap },
    { label: 'Timetable', href: '/timetable', icon: CalendarDays },
    { label: 'Tutors & Contributors', href: '/team', icon: Users },
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
        'relative group flex flex-col items-center gap-1 w-full min-h-[44px] py-2.5 rounded-xl transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-muted hover:bg-background-secondary hover:text-foreground'
      )}
    >
      <AppIcon
        icon={link.icon}
        size="sm"
        tone={isActive ? 'primary' : 'muted'}
      />

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
  const staffEligible = useStaffProfileEligible();
  const contextLinks = getContextLinks(pathname).filter(
    (link) => staffEligible || !link.href.startsWith('/profile/')
  );

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
          isActive={pathname.startsWith(link.href.split('?')[0]) && link.href !== '/'}
        />
      ))}
    </aside>
  );
}

'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NavBar Component (v3 — Unified Learn)
// Groups: Learn (3-section dropdown) | Plan | Library | Community | Contribute | Admin
// Role-aware floating glassmorphism nav with grouped dropdowns.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  CalendarDays,
  Timer,
  BookOpen,
  Layers,
  GraduationCap,
  Users,
  ClipboardCheck,
  Pencil,
  ShieldCheck,
  UserCircle,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Clock,
  Calculator,
  MessageSquare,
  Settings,
  UserPlus,
  Library,
  Bookmark,
  Info,
  LayoutGrid,
  Compass,
  BookMarked,
  FlaskConical,
  NotebookPen,
  ScrollText,
  SquareStack,
  Briefcase,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/context/ThemeContext';
import { cn, getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

// ── Nav Group Definitions ────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  badge?: string; // e.g. "Soon" or "New"
}

interface NavSection {
  label: string;
  items: NavItem[];
  accentColor?: string;
}

interface NavGroupDef {
  label: string;
  icon: React.ReactNode;
  items?: NavItem[];           // flat list (backward-compatible)
  sections?: NavSection[];     // sectioned variant — renders with dividers
  allowedRoles: UserRole[];
  accentColor?: string; // CSS var or tailwind colour for the group indicator
}

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'contributor', 'main_contributor'];

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Learn',
    icon: <BookOpen className="h-4 w-4" />,
    allowedRoles: ALL_ROLES,
    accentColor: 'var(--color-emerald-500, #10b981)',
    sections: [
      {
        label: 'Courses & Progress',
        accentColor: 'var(--color-emerald-500, #10b981)',
        items: [
          {
            label: 'Course Manager',
            href: '/courses',
            icon: <BookOpen className="h-4 w-4" />,
            description: 'Manage enrolled qualifications & subjects',
          },
          {
            label: 'Lesson Tracker',
            href: '/lessons',
            icon: <ClipboardCheck className="h-4 w-4" />,
            description: 'Track topic confidence & progress',
          },
        ],
      },
      {
        label: 'Create',
        accentColor: 'var(--color-amber-500, #f59e0b)',
        items: [
          {
            label: 'My Workspace',
            href: '/workspace',
            icon: <Briefcase className="h-4 w-4" />,
            description: 'All your notes, decks, courses & exams',
          },
          {
            label: 'Notes',
            href: '/my-notes',
            icon: <NotebookPen className="h-4 w-4" />,
            description: 'Your created & saved study notes',
          },
        ],
      },
      {
        label: 'Practice & Focus',
        accentColor: 'var(--color-violet-500, #8b5cf6)',
        items: [
          {
            label: 'Flashcards',
            href: '/flashcards',
            icon: <Layers className="h-4 w-4" />,
            description: 'Spaced-repetition study sessions',
          },
          {
            label: 'Pomodoro Timer',
            href: '/pomodoro',
            icon: <Timer className="h-4 w-4" />,
            description: 'Focus sessions with ambient music',
          },
        ],
      },
    ],
  },
  {
    label: 'Plan',
    icon: <CalendarDays className="h-4 w-4" />,
    allowedRoles: ALL_ROLES,
    accentColor: 'var(--color-sky-500, #0ea5e9)',
    items: [
      {
        label: 'Timetable',
        href: '/timetable',
        icon: <CalendarDays className="h-4 w-4" />,
        description: 'Manage your weekly schedule',
      },
      {
        label: 'Exam Countdown',
        href: '/countdown',
        icon: <Clock className="h-4 w-4" />,
        description: 'Track time until your exams',
      },
      {
        label: 'Grade Calculator',
        href: '/calculator',
        icon: <Calculator className="h-4 w-4" />,
        description: 'Predict grades by qualification',
      },
    ],
  },
  {
    label: 'Library',
    icon: <BookMarked className="h-4 w-4" />,
    allowedRoles: ALL_ROLES,
    accentColor: 'var(--color-amber-500, #f59e0b)',
    items: [
      {
        label: 'Courses',
        href: '/library/courses',
        icon: <ScrollText className="h-4 w-4" />,
        description: 'Browse verified curriculum templates',
      },
      {
        label: 'Flashcards',
        href: '/library/flashcards',
        icon: <SquareStack className="h-4 w-4" />,
        description: 'Browse contributor-approved decks',
      },
      {
        label: 'Notes',
        href: '/library',
        icon: <Library className="h-4 w-4" />,
        description: 'Browse verified study notes',
      },
      {
        label: 'Exams',
        href: '/library/exams',
        icon: <FlaskConical className="h-4 w-4" />,
        description: 'Browse exam dates & papers by board',
      },
    ],
  },
  {
    label: 'Community',
    icon: <Users className="h-4 w-4" />,
    allowedRoles: ALL_ROLES,
    accentColor: 'var(--color-pink-500, #ec4899)',
    items: [
      {
        label: 'Classrooms',
        href: '/classrooms',
        icon: <GraduationCap className="h-4 w-4" />,
        description: 'Virtual classrooms & assignments',
      },
      {
        label: 'Clubs',
        href: '/clubs',
        icon: <MessageSquare className="h-4 w-4" />,
        description: 'Community spaces & discussions',
      },
      {
        label: 'Explore Profiles',
        href: '/explore/profiles',
        icon: <Compass className="h-4 w-4" />,
        description: 'Browse student & educator profiles',
      },
    ],
  },
  {
    label: 'Contribute',
    icon: <Pencil className="h-4 w-4" />,
    allowedRoles: ['contributor', 'main_contributor'],
    accentColor: 'var(--color-indigo-500, #6366f1)',
    items: [
      {
        label: 'Notes Editor',
        href: '/editor/notes',
        icon: <NotebookPen className="h-4 w-4" />,
        description: 'Create & edit study notes',
      },
      {
        label: 'Curriculum Editor',
        href: '/editor/curriculum',
        icon: <BookOpen className="h-4 w-4" />,
        description: 'Manage curricula & subjects',
      },
      {
        label: 'Exam Data Editor',
        href: '/editor/exam',
        icon: <ClipboardCheck className="h-4 w-4" />,
        description: 'Edit exam data & grade boundaries',
      },
      {
        label: 'Grade Calc Presets',
        href: '/contribute/grade-calculator',
        icon: <Calculator className="h-4 w-4" />,
        description: 'Propose grade calculator configurations',
      },
      {
        label: 'Countdown Editor',
        href: '/contribute/countdown',
        icon: <Clock className="h-4 w-4" />,
        description: 'Propose exam dates to the library',
      },
    ],
  },
  {
    label: 'Admin',
    icon: <ShieldCheck className="h-4 w-4" />,
    allowedRoles: ['main_contributor'],
    accentColor: 'var(--color-amber-500, #f59e0b)',
    items: [
      {
        label: 'Review Queue',
        href: '/main-contributor/review-queue',
        icon: <ShieldCheck className="h-4 w-4" />,
        description: 'Approve or reject submissions',
      },
      {
        label: 'Role Upgrades',
        href: '/main-contributor/role-upgrades',
        icon: <UserCircle className="h-4 w-4" />,
        description: 'Review role upgrade requests',
      },
      {
        label: 'Add User',
        href: '/main-contributor/add-contributor',
        icon: <UserPlus className="h-4 w-4" />,
        description: 'Invite a new contributor',
      },
      {
        label: 'Manage Org',
        href: '/org-activities/manage',
        icon: <LayoutGrid className="h-4 w-4" />,
        description: 'Manage org activities & timeline',
      },
    ],
  },
];

// ── Dropdown Component ───────────────────────────────────────────────────────

function NavDropdown({
  group,
  isOpen,
  onToggle,
  onClose,
}: {
  group: NavGroupDef;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  // Resolve all items — supports flat or sectioned groups
  const allItems: NavItem[] = group.sections
    ? group.sections.flatMap((s) => s.items ?? [])
    : (group.items ?? []);

  // Check if any item in this group is the current page
  const isActive = allItems.length > 0 && allItems.some(item => pathname && item.href && pathname.startsWith(item.href));

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        className={cn(
          'nav-icon-btn flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
          isOpen || isActive
            ? 'bg-primary/10 text-primary'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
        )}
      >
        <span className="nav-icon-draw">{group.icon}</span>
        <span className="hidden lg:inline">{group.label}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200 hidden lg:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-background-card border border-border rounded-xl p-2 animate-slide-down z-50 shadow-xl">
          {group.sections ? (
            /* ── Sectioned layout with horizontal dividers ── */
            group.sections.map((section, si) => (
              <div key={section.label}>
                {/* Section header */}
                <div className="px-3 pt-2 pb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                    {section.label}
                  </p>
                </div>
                {/* Section items */}
                {section.items.map((item) => {
                  const isItemActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group',
                        isItemActive
                          ? 'bg-primary/10 text-primary'
                          : 'hover:bg-background-secondary'
                      )}
                    >
                      <div className={cn(
                        'mt-0.5 transition-colors shrink-0',
                        isItemActive ? 'text-primary' : 'text-foreground-muted group-hover:text-primary'
                      )}>
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'text-sm font-medium',
                            isItemActive ? 'text-primary' : 'text-foreground'
                          )}>{item.label}</p>
                          {item.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted leading-tight mt-0.5">{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
                {/* Divider between sections */}
                {si < group.sections!.length - 1 && (
                  <div className="mx-3 my-1 h-px bg-border/50" />
                )}
              </div>
            ))
          ) : (
            /* ── Flat layout (backward-compatible) ── */
            <>
              <div className="px-3 py-1.5 mb-1 border-b border-border/50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-foreground-muted">
                  {group.label}
                </p>
              </div>
              {(group.items ?? []).map((item) => {
                const isItemActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 group',
                      isItemActive
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-background-secondary'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 transition-colors shrink-0',
                      isItemActive ? 'text-primary' : 'text-foreground-muted group-hover:text-primary'
                    )}>
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          'text-sm font-medium',
                          isItemActive ? 'text-primary' : 'text-foreground'
                        )}>{item.label}</p>
                        {item.badge && (
                          <span className="text-[9px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted leading-tight mt-0.5">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helper to flatten nav items ───────────────────────────────────────────────
export const getAllNavItems = () => {
  return NAV_GROUPS.flatMap(group => {
    if (group.sections) {
      return group.sections.flatMap(s => s.items ?? []);
    }
    return group.items ?? [];
  }).filter(Boolean);
};

// ── Main NavBar ──────────────────────────────────────────────────────────────

export default function NavBar() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Hide navbar on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    function handleScroll() {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > lastScrollY && currentScrollY > 80) {
            setIsNavHidden(true);
          } else {
            setIsNavHidden(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Track recently accessed pages
  useEffect(() => {
    if (!pathname || pathname === '/dashboard' || pathname === '/') return;
    const allItems = getAllNavItems();
    const isValidItem = allItems.length > 0 && allItems.some(item => item?.href && pathname.startsWith(item.href));
    if (!isValidItem && !pathname.startsWith('/profile')) return;
    try {
      const recentStr = localStorage.getItem('recentPages');
      let recent: { href: string; timestamp: number }[] = recentStr ? JSON.parse(recentStr) : [];
      recent = recent.filter(p => p.href !== pathname);
      recent.unshift({ href: pathname, timestamp: Date.now() });
      if (recent.length > 5) recent.pop();
      localStorage.setItem('recentPages', JSON.stringify(recent));
    } catch (e) {
      console.error('Failed to track recent page:', e);
    }
  }, [pathname]);

  // Filter nav groups by current role
  const visibleGroups = NAV_GROUPS.filter(
    (group) => role && group.allowedRoles.includes(role)
  );

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  return (
    <header className={cn('sticky top-0 z-50 w-full transition-transform duration-300', isNavHidden && '-translate-y-full')}>
      {/* Floating NavBar Container */}
      <div className="mx-auto max-w-7xl px-4 pt-3">
        <nav className="glass rounded-2xl px-4 py-2 grid grid-cols-[1fr_auto_1fr] items-center">
          {/* ─── Logo + Dashboard ─── */}
          <Link
            href={role ? '/dashboard' : '/'}
            className="flex items-center gap-2 shrink-0 group justify-self-start"
          >
            <span className="text-xl group-hover:scale-110 transition-transform duration-200">{'🐜'}</span>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-brand">
              The ANTs
            </span>
          </Link>

          {/* ─── Desktop Nav Groups (Centered) ─── */}
          <div className="hidden md:flex items-center gap-0.5 justify-self-center">
            {visibleGroups.map((group) => (
              <NavDropdown
                key={group.label}
                group={group}
                isOpen={openDropdown === group.label}
                onToggle={() =>
                  setOpenDropdown(
                    openDropdown === group.label ? null : group.label
                  )
                }
                onClose={() => setOpenDropdown(null)}
              />
            ))}
          </div>

          {/* ─── Right Section ─── */}
          <div className="flex items-center gap-2 justify-self-end">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all duration-200 cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>

            {/* User Avatar Menu */}
            {user && (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-all duration-200 cursor-pointer',
                    isUserMenuOpen
                      ? 'bg-primary/10 ring-2 ring-primary/30'
                      : 'hover:bg-background-secondary'
                  )}
                >
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs font-bold">
                    {getInitials(user.profile.name)}
                  </div>
                  <span className="text-sm font-medium text-foreground hidden lg:inline">
                    {user.profile.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-foreground-muted transition-transform duration-200 hidden lg:block',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-background-card border border-border rounded-xl p-3 animate-slide-down z-50 shadow-xl">
                    <div className="pb-3 mb-3 border-b border-border">
                      <p className="font-semibold text-sm text-foreground">{user.profile.name}</p>
                      <p className="text-xs text-foreground-muted mt-0.5">{user.email}</p>
                      {role && (
                        <div className="mt-2">
                          <RoleBadge role={role} />
                        </div>
                      )}
                    </div>
                    <Link
                      href={`/profile/${user.profile.username}`}
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                    >
                      <UserCircle className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
                    >
                      <Info className="h-4 w-4" />
                      About <span className="font-brand">The ANTs</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors cursor-pointer mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all cursor-pointer"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>

        {/* ─── Mobile Menu ─── */}
        {isMobileOpen && (
          <div className="md:hidden mt-2 bg-background-card border border-border rounded-2xl p-4 animate-slide-down max-h-[calc(100vh-6rem)] overflow-y-auto shadow-xl">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-5 last:mb-0">
                <div className="flex items-center gap-2 mb-2 px-2">
                  <span className="text-foreground-muted">{group.icon}</span>
                  <p className="text-xs font-bold text-foreground-muted uppercase tracking-widest">
                    {group.label}
                  </p>
                </div>
                {group.sections ? (
                  group.sections.map((section, si) => (
                    <div key={section.label}>
                      {/* Section sub-header */}
                      <p className="text-[10px] font-bold text-foreground-muted/60 uppercase tracking-widest px-3 pt-1 pb-0.5">
                        {section.label}
                      </p>
                      {section.items.map((item) => {
                        const isItemActive = pathname.startsWith(item.href);
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-0.5',
                              isItemActive
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-background-secondary'
                            )}
                          >
                            <span className={isItemActive ? 'text-primary' : 'text-foreground-muted'}>
                              {item.icon}
                            </span>
                            <div>
                              <p className={cn('text-sm font-medium', isItemActive ? 'text-primary' : 'text-foreground')}>
                                {item.label}
                              </p>
                              <p className="text-xs text-foreground-muted">{item.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                      {/* Divider between sections on mobile */}
                      {si < group.sections!.length - 1 && (
                        <div className="mx-2 my-1.5 h-px bg-border/40" />
                      )}
                    </div>
                  ))
                ) : (
                  (group.items ?? []).map((item) => {
                    const isItemActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors mb-0.5',
                          isItemActive
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-background-secondary'
                        )}
                      >
                        <span className={isItemActive ? 'text-primary' : 'text-foreground-muted'}>
                          {item.icon}
                        </span>
                        <div>
                          <p className={cn('text-sm font-medium', isItemActive ? 'text-primary' : 'text-foreground')}>
                            {item.label}
                          </p>
                          <p className="text-xs text-foreground-muted">{item.description}</p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            ))}
            {/* Mobile user actions */}
            {user && (
              <div className="mt-4 pt-4 border-t border-border space-y-1">
                <Link
                  href={`/profile/${user.profile.username}`}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-secondary transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground">My Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-secondary transition-colors"
                >
                  <Settings className="h-4 w-4 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-error hover:bg-error/10 transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
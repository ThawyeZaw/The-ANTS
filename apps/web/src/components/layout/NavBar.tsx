'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Top Navigation Bar (3 Pillars: Library, Tools, Explore & Tutors)
// Features responsive breakpoints, keyboard accessibility, and role-based portals.
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  UserCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CalendarDays,
  Timer,
  Layers,
  Clock,
  Calculator,
  NotebookPen,
  Settings,
  GraduationCap,
  Brain,
  UserPlus,
  ClipboardCheck,
  Building2,
  Wrench,
  Compass,
  Info,
  FlaskConical,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: any;
  description: string;
  badge?: string;
  accentColor?: string;
}

const LIBRARY_LINKS: NavItem[] = [
  {
    label: 'All Resources',
    href: '/library',
    icon: BookOpen,
    description: 'Explore all courses, notes, and study decks',
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    label: 'Courses & Curriculums',
    href: '/library?tab=courses',
    icon: GraduationCap,
    description: 'Cambridge, Edexcel & Matriculation syllabi',
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Notes Library',
    href: '/library?tab=notes',
    icon: NotebookPen,
    description: 'Verified syllabus summaries and study guides',
    accentColor: 'from-amber-500 to-orange-500',
  },
  {
    label: 'Flashcards (SRS)',
    href: '/library?tab=flashcards',
    icon: Layers,
    description: 'Spaced repetition decks for active recall',
    accentColor: 'from-purple-500 to-violet-500',
  },
  {
    label: 'Past Exams & Papers',
    href: '/library?tab=exams',
    icon: FlaskConical,
    description: 'Past exam papers and boundary tables',
    accentColor: 'from-rose-500 to-pink-500',
  },
  {
    label: 'Revision Quizzes',
    href: '/library?tab=quizzes',
    icon: Brain,
    description: 'Practice questions and diagnostic quizzes',
    accentColor: 'from-yellow-500 to-amber-500',
  },
];

const TOOLS_LINKS: NavItem[] = [
  {
    label: 'Smart Timetable',
    href: '/timetable',
    icon: CalendarDays,
    description: 'Weekly schedule with conflict detection',
    accentColor: 'from-blue-500 to-indigo-500',
  },
  {
    label: 'Pomodoro Focus Timer',
    href: '/pomodoro',
    icon: Timer,
    description: 'Customizable work/break study sessions',
    accentColor: 'from-red-500 to-rose-500',
  },
  {
    label: 'Exam Countdown',
    href: '/countdown',
    icon: Clock,
    description: 'Live countdowns for target exam dates',
    accentColor: 'from-amber-500 to-yellow-500',
  },
  {
    label: 'Grade Calculator',
    href: '/calculator',
    icon: Calculator,
    description: 'Calculate composite grades and thresholds',
    accentColor: 'from-teal-500 to-emerald-500',
  },
  {
    label: 'My Workspace',
    href: '/workspace',
    icon: Wrench,
    description: 'Personal saved notes and study materials',
    accentColor: 'from-violet-500 to-purple-500',
  },
];

const EXPLORE_LINKS: NavItem[] = [
  {
    label: 'Explore Directory',
    href: '/explore',
    icon: Compass,
    description: 'Discover verified tutors, contributors & peers',
    accentColor: 'from-primary to-indigo-500',
  },
  {
    label: 'Tutors & Schedules',
    href: '/explore?tab=tutors',
    icon: GraduationCap,
    description: 'Browse academic tutors offering class slots',
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Academic Contributors',
    href: '/explore?tab=contributors',
    icon: Pencil,
    description: 'Curriculum editors and resource creators',
    accentColor: 'from-violet-500 to-purple-500',
  },
  {
    label: 'About The ANTs',
    href: '/about',
    icon: Info,
    description: 'Platform mission, methodology & team',
    accentColor: 'from-pink-500 to-rose-500',
  },
];

export default function NavBar() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const [openDropdown, setOpenDropdown] = useState<'library' | 'tools' | 'explore' | 'role' | 'user' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!isUserMenuOpen && !isLibraryOpen && !isToolsOpen && !isCommunityOpen && !isAdminOpen) {
      return;
    }

    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen, isLibraryOpen, isToolsOpen, isCommunityOpen, isAdminOpen]);

  // Close on route change
  useEffect(() => {
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  }, [pathname]);

  const toggleDropdown = useCallback(
    (name: 'library' | 'tools' | 'explore' | 'role' | 'user') => {
      setOpenDropdown((curr) => (curr === name ? null : name));
    },
    []
  );

  const hasStaffRole = isTutor || isContributor || isAdmin;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full bg-background/90 backdrop-blur-md border-b border-border transition-all"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <Link href={isAuthenticated ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              🐜
            </div>
            <div className="flex flex-col">
              <span className="font-brand font-black text-lg tracking-tight text-foreground leading-none">
                The ANTS
              </span>
              <span className="text-[9px] font-semibold text-primary uppercase tracking-widest leading-tight">
                Academic
              </span>
            </div>
          </Link>

          {/* Desktop & Tablet 3-Pillar Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {/* 1. Library Pillar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('library')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  pathname.startsWith('/library')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary',
                  openDropdown === 'library' && 'bg-background-secondary text-foreground'
                )}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Library</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 opacity-60 transition-transform duration-200',
                    openDropdown === 'library' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'library' && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                  <div className="p-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Curriculum & Learning
                  </div>
                  <div className="space-y-1">
                    {LIBRARY_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-background-secondary text-foreground transition-colors group"
                        >
                          <div
                            className={cn(
                              'p-2 rounded-lg bg-gradient-to-br text-white shrink-0 mt-0.5 shadow-xs',
                              item.accentColor
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Tools Pillar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('tools')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  pathname.startsWith('/timetable') ||
                    pathname.startsWith('/pomodoro') ||
                    pathname.startsWith('/countdown') ||
                    pathname.startsWith('/calculator')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary',
                  openDropdown === 'tools' && 'bg-background-secondary text-foreground'
                )}
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" />
                <span>Tools</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 opacity-60 transition-transform duration-200',
                    openDropdown === 'tools' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'tools' && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                  <div className="p-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Productivity & Study Tools
                  </div>
                  <div className="space-y-1">
                    {TOOLS_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-background-secondary text-foreground transition-colors group"
                        >
                          <div
                            className={cn(
                              'p-2 rounded-lg bg-gradient-to-br text-white shrink-0 mt-0.5 shadow-xs',
                              item.accentColor
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Explore & Tutors Pillar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('explore')}
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer',
                  pathname.startsWith('/explore') || pathname.startsWith('/about')
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary',
                  openDropdown === 'explore' && 'bg-background-secondary text-foreground'
                )}
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden lg:inline">Explore & Tutors</span>
                <span className="lg:hidden">Explore</span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 opacity-60 transition-transform duration-200',
                    openDropdown === 'explore' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'explore' && (
                <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                  <div className="p-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                    Community & Guidance
                  </div>
                  <div className="space-y-1">
                    {EXPLORE_LINKS.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.label}
                          href={item.href}
                          className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-background-secondary text-foreground transition-colors group"
                        >
                          <div
                            className={cn(
                              'p-2 rounded-lg bg-gradient-to-br text-white shrink-0 mt-0.5 shadow-xs',
                              item.accentColor
                            )}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold group-hover:text-primary transition-colors">
                              {item.label}
                            </p>
                            <p className="text-[11px] text-foreground-muted leading-tight mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Role-Specific Portal Button (if user is Tutor, Contributor, or Admin) */}
            {hasStaffRole && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => toggleDropdown('role')}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
                    isAdmin
                      ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      : isContributor
                      ? 'bg-violet-500/10 text-violet-600 border border-violet-500/20'
                      : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
                    openDropdown === 'role' && 'shadow-xs ring-2 ring-primary/20'
                  )}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Workspace Tools</span>
                  <ChevronDown
                    className={cn(
                      'w-3 h-3 opacity-60 transition-transform duration-200',
                      openDropdown === 'role' && 'rotate-180'
                    )}
                  />
                </button>

                {openDropdown === 'role' && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                    <div className="p-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-foreground-muted">
                      Your Role Privileges
                    </div>
                    <div className="space-y-1">
                      {isTutor && (
                        <Link
                          href={`/profile/${user?.profile.username}`}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors"
                        >
                          <GraduationCap className="w-4 h-4 text-emerald-500" />
                          View My Tutor Schedule
                        </Link>
                      )}
                      {(isContributor || isAdmin) && (
                        <>
                          <Link
                            href="/editor"
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors"
                          >
                            <Pencil className="w-4 h-4 text-violet-500" />
                            Curriculum & Notes Editor
                          </Link>
                          <Link
                            href="/editor/review-queue"
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors"
                          >
                            <ClipboardCheck className="w-4 h-4 text-indigo-500" />
                            Review Queue Proposals
                          </Link>
                        </>
                      )}
                      {isAdmin && (
                        <>
                          <Link
                            href="/main-contributor/add-contributor"
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors"
                          >
                            <UserPlus className="w-4 h-4 text-amber-500" />
                            Manage & Promote Users
                          </Link>
                          <Link
                            href="/org-activities"
                            className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-background-secondary text-xs font-semibold text-foreground transition-colors"
                          >
                            <Building2 className="w-4 h-4 text-amber-500" />
                            Manage Organization Team
                          </Link>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </nav>
        </div>

        {/* Right Controls & User Account Menu */}
        <div className="flex items-center gap-2">
          {isAuthenticated && user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => toggleDropdown('user')}
                className="flex items-center gap-2 p-1.5 pr-2.5 rounded-2xl border border-border hover:border-primary/40 bg-background-secondary/50 transition-all cursor-pointer"
              >
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-primary to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                  {getInitials(user.profile.name)}
                </div>
                <span className="text-xs font-semibold text-foreground max-w-[100px] truncate hidden sm:inline">
                  {user.profile.name}
                </span>
                <ChevronDown
                  className={cn(
                    'w-3 h-3 opacity-60 transition-transform duration-200',
                    openDropdown === 'user' && 'rotate-180'
                  )}
                />
              </button>

              {openDropdown === 'user' && (
                <div className="absolute right-0 top-full mt-2 w-60 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 animate-scale-in">
                  <div className="px-3 py-2 border-b border-border/60 mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{user.profile.name}</p>
                    <p className="text-[11px] text-foreground-muted truncate font-mono">
                      @{user.profile.username}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {(user.profile.roles || [user.profile.role]).map((r) => (
                        <span
                          key={r}
                          className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      href={`/profile/${user.profile.username}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-secondary transition-colors"
                    >
                      <UserCircle className="w-3.5 h-3.5" />
                      View Public Profile
                    </Link>

                    <Link
                      href="/settings/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-secondary transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Profile & Schedule
                    </Link>

                    <Link
                      href="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-background-secondary transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      Settings & Telegram
                    </Link>

                    <button
                      type="button"
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover active:scale-98 transition-all"
              >
                Get Started
              </Link>
            </div>
          )}

          {/* Mobile Menu Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background-card p-4 space-y-4 max-h-[85vh] overflow-y-auto animate-fade-in">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
              Library
            </p>
            <div className="grid grid-cols-2 gap-2">
              {LIBRARY_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="p-2.5 rounded-xl bg-background-secondary text-xs font-medium text-foreground flex items-center gap-2 hover:bg-background-secondary/80 transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
              Tools
            </p>
            <div className="grid grid-cols-2 gap-2">
              {TOOLS_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="p-2.5 rounded-xl bg-background-secondary text-xs font-medium text-foreground flex items-center gap-2 hover:bg-background-secondary/80 transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
              Explore & Tutors
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXPLORE_LINKS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="p-2.5 rounded-xl bg-background-secondary text-xs font-medium text-foreground flex items-center gap-2 hover:bg-background-secondary/80 transition-colors"
                >
                  <item.icon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          {hasStaffRole && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted mb-2">
                Staff Portals
              </p>
              <div className="space-y-1.5">
                {isTutor && (
                  <Link
                    href={`/profile/${user?.profile.username}`}
                    className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-2"
                  >
                    <GraduationCap className="w-4 h-4" /> My Tutor Schedule
                  </Link>
                )}
                {(isContributor || isAdmin) && (
                  <Link
                    href="/editor"
                    className="p-2.5 rounded-xl bg-violet-500/10 text-violet-600 text-xs font-semibold flex items-center gap-2"
                  >
                    <Pencil className="w-4 h-4" /> Curriculum & Notes Editor
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    href="/main-contributor/add-contributor"
                    className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 text-xs font-semibold flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> Manage & Promote Users
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

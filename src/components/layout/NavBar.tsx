'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — NavBar Component (v6 — Study + Tools grouping)
// Structure: Study | Tools | Community | [Contribute] | [Admin]
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  BookOpen,
  Users,
  Pencil,
  ShieldCheck,
  UserCircle,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronDown,
  CalendarDays,
  Timer,
  ArrowRight,
  Layers,
  Clock,
  Calculator,
  NotebookPen,
  Target,
  GraduationCap,
  Brain,
  UserPlus,
  ClipboardCheck,
  Building2,
  Wrench,
  Compass,
  Info,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/context/ThemeContext';
import { cn, getInitials } from '@/lib/utils';
import { RoleBadge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

// ── Nav Group Definition ─────────────────────────────────────────────────────

interface NavGroup {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  allowedRoles: UserRole[];
  accentColor: string;
  badge?: string;
  children?: { label: string; href: string; icon: React.ReactNode; description: string }[];
}

interface ToolLink {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
  accentColor: string;
}

const ALL_ROLES: UserRole[] = ['student', 'teacher', 'contributor', 'main_contributor'];

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Study',
    href: '/library',
    icon: <BookOpen className="h-4 w-4" />,
    description: 'Notes, flashcards, courses & quizzes',
    allowedRoles: ALL_ROLES,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Tools',
    href: '#tools',
    icon: <Wrench className="h-4 w-4" />,
    description: 'Countdown, calculator, timetable & pomodoro',
    allowedRoles: ALL_ROLES,
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    label: 'Community',
    href: '#community',
    icon: <Users className="h-4 w-4" />,
    description: 'Classrooms, explore & about',
    allowedRoles: ALL_ROLES,
    accentColor: 'from-pink-500 to-rose-500',
  },
  {
    label: 'Contribute',
    href: '/contribute',
    icon: <Pencil className="h-4 w-4" />,
    description: 'Add official resources',
    allowedRoles: ['contributor', 'main_contributor'],
    accentColor: 'from-indigo-500 to-violet-500',
  },
  {
    label: 'Admin',
    href: '/main-contributor',
    icon: <ShieldCheck className="h-4 w-4" />,
    description: 'Manage users & review queue',
    allowedRoles: ['main_contributor'],
    accentColor: 'from-amber-500 to-orange-500',
    children: [
      { label: 'Add Contributor', href: '/main-contributor/add-contributor', icon: <UserPlus className="h-3.5 w-3.5" />, description: 'Invite new contributors' },
      { label: 'Review Queue', href: '/main-contributor/review-queue', icon: <ClipboardCheck className="h-3.5 w-3.5" />, description: 'Review submitted content' },
      { label: 'Manage Organization', href: '/org-activities/manage', icon: <Building2 className="h-3.5 w-3.5" />, description: 'Organization settings' },
    ],
  },
];

// ── Tools Dropdown Items ──────────────────────────────────────────────────────

const TOOLS_LINKS: ToolLink[] = [
  {
    label: 'Exam Countdown',
    href: '/countdown',
    icon: <Clock className="h-4 w-4" />,
    description: 'Track time until exams',
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    label: 'Grade Calculator',
    href: '/calculator',
    icon: <Calculator className="h-4 w-4" />,
    description: 'Predict your grades',
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Timetable',
    href: '/timetable',
    icon: <CalendarDays className="h-4 w-4" />,
    description: 'Weekly study schedule',
    accentColor: 'from-indigo-500 to-violet-500',
  },
  {
    label: 'Pomodoro Timer',
    href: '/pomodoro',
    icon: <Timer className="h-4 w-4" />,
    description: 'Focused study sessions',
    accentColor: 'from-rose-500 to-red-500',
  },
];

// ── Community Dropdown Items ──────────────────────────────────────────────

const COMMUNITY_LINKS: ToolLink[] = [
  {
    label: 'Classrooms',
    href: '/classrooms',
    icon: <GraduationCap className="h-4 w-4" />,
    description: 'Virtual classrooms & assignments',
    accentColor: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Explore',
    href: '/explore',
    icon: <Compass className="h-4 w-4" />,
    description: 'Clubs, profiles & discover more',
    accentColor: 'from-violet-500 to-purple-500',
  },
  {
    label: 'About The ANTs',
    href: '/about',
    icon: <Info className="h-4 w-4" />,
    description: 'Our mission, team & story',
    accentColor: 'from-amber-500 to-orange-500',
  },
];

// ── Quick Links for Mobile Menu ──────────────────────────────────────────────

const STUDY_QUICK_LINKS = [
  { label: 'Courses', href: '/library/courses', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'My Notes', href: '/my-notes', icon: <NotebookPen className="h-4 w-4" /> },
  { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" /> },
  { label: 'Quizzes', href: '#quizzes', icon: <Brain className="h-4 w-4" />, comingSoon: true },
];

const TOOLS_QUICK_LINKS = [
  { label: 'Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" /> },
  { label: 'Calculator', href: '/calculator', icon: <Calculator className="h-4 w-4" /> },
  { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" /> },
  { label: 'Pomodoro', href: '/pomodoro', icon: <Timer className="h-4 w-4" /> },
];

const COMMUNITY_QUICK_LINKS = [
  { label: 'Classrooms', href: '/classrooms', icon: <GraduationCap className="h-4 w-4" /> },
  { label: 'Explore', href: '/explore', icon: <Compass className="h-4 w-4" /> },
  { label: 'About', href: '/about', icon: <Info className="h-4 w-4" /> },
];

// ── Shared NavItem Type & getAllNavItems Export ───────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

export function getAllNavItems(): NavItem[] {
  const groupItems: NavItem[] = NAV_GROUPS
    .filter(g => g.href !== '#tools' && g.href !== '#community')
    .map(g => ({ label: g.label, href: g.href, icon: g.icon, description: g.description }));

  const toolItems: NavItem[] = TOOLS_LINKS.map(t => ({
    label: t.label,
    href: t.href,
    icon: t.icon,
    description: t.description,
  }));

  const communityItems: NavItem[] = COMMUNITY_LINKS.map(c => ({
    label: c.label,
    href: c.href,
    icon: c.icon,
    description: c.description,
  }));

  const studyQuickItems: NavItem[] = STUDY_QUICK_LINKS
    .filter(l => !l.comingSoon)
    .map(l => ({ label: l.label, href: l.href, icon: l.icon }));

  const toolsQuickItems: NavItem[] = TOOLS_QUICK_LINKS.map(l => ({
    label: l.label,
    href: l.href,
    icon: l.icon,
  }));

  const communityQuickItems: NavItem[] = COMMUNITY_QUICK_LINKS.map(l => ({
    label: l.label,
    href: l.href,
    icon: l.icon,
  }));

  return [...groupItems, ...toolItems, ...communityItems, ...studyQuickItems, ...toolsQuickItems, ...communityQuickItems];
}

// ── Main NavBar Component ────────────────────────────────────────────────────

export default function NavBar() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isCommunityOpen, setIsCommunityOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isNavHidden, setIsNavHidden] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const communityRef = useRef<HTMLDivElement>(null);
  const adminRef = useRef<HTMLDivElement>(null);

  // Filter nav groups by current role
  const visibleGroups = NAV_GROUPS.filter(
    (group) => role && group.allowedRoles.includes(role)
  );

  // Check if current page is active
  const isActive = (href: string) => {
    if (href === '#tools' || href === '#community' || href === '#quizzes') return false;
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isToolsActive = () => {
    return TOOLS_LINKS.some(t => pathname.startsWith(t.href));
  };

  const isCommunityActive = () => {
    return COMMUNITY_LINKS.some(c => pathname.startsWith(c.href));
  };

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

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (communityRef.current && !communityRef.current.contains(e.target as Node)) {
        setIsCommunityOpen(false);
      }
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setIsAdminOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    setIsUserMenuOpen(false);
    router.push('/');
  };

  const handleToolsClick = () => {
    setIsToolsOpen(!isToolsOpen);
    setIsCommunityOpen(false);
    setIsAdminOpen(false);
  };

  const handleCommunityClick = () => {
    setIsCommunityOpen(!isCommunityOpen);
    setIsToolsOpen(false);
    setIsAdminOpen(false);
  };

  const handleAdminClick = () => {
    setIsAdminOpen(!isAdminOpen);
    setIsToolsOpen(false);
    setIsCommunityOpen(false);
  };

  const isMainContributor = role === 'main_contributor';

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-transform duration-300',
        isNavHidden && '-translate-y-full'
      )}
    >
      {/* Background with blur */}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl border-b border-border" />

      {/* Nav Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-16 gap-4">
          {/* ─── Logo ─── */}
          <Link
            href={role ? '/dashboard' : '/'}
            className="flex items-center gap-2 shrink-0 group"
          >
            <Image
              src="/logo.png"
              alt="The ANTs logo"
              width={28}
              height={28}
              priority
              className="group-hover:scale-110 transition-transform duration-200"
            />
            <span className="hidden sm:block font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-brand">
              The ANTs
            </span>
          </Link>

          {/* ─── Desktop Nav Groups ─── */}
          <div className="hidden md:flex items-center gap-1">
            {visibleGroups.map((group) => {
              // Tools dropdown
              if (group.label === 'Tools') {
                return (
                  <div key="tools" ref={toolsRef} className="relative">
                    <button
                      onClick={handleToolsClick}
                      className={cn(
                        'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
                        isToolsActive()
                          ? 'text-primary'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                      )}
                    >
                      {group.icon}
                      <span className="hidden lg:inline">{group.label}</span>
                      <ChevronDown className={cn(
                        'h-3 w-3 transition-transform duration-200 hidden sm:block',
                        isToolsOpen && 'rotate-180'
                      )} />
                      {isToolsActive() && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>

                    {isToolsOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-background-card border border-border rounded-2xl p-2 animate-slide-down z-50 shadow-xl">
                        {TOOLS_LINKS.map((tool) => (
                          <Link
                            key={tool.href}
                            href={tool.href}
                            onClick={() => setIsToolsOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                              isActive(tool.href)
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-background-secondary text-foreground-secondary hover:text-foreground'
                            )}
                          >
                            <div className={cn(
                              'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br text-white',
                              tool.accentColor
                            )}>
                              {tool.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{tool.label}</p>
                              <p className="text-xs text-foreground-muted truncate">{tool.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Community dropdown
              if (group.label === 'Community') {
                return (
                  <div key="community" ref={communityRef} className="relative">
                    <button
                      onClick={handleCommunityClick}
                      className={cn(
                        'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
                        isCommunityActive()
                          ? 'text-primary'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                      )}
                    >
                      {group.icon}
                      <span className="hidden lg:inline">{group.label}</span>
                      <ChevronDown className={cn(
                        'h-3 w-3 transition-transform duration-200 hidden sm:block',
                        isCommunityOpen && 'rotate-180'
                      )} />
                      {isCommunityActive() && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>

                    {isCommunityOpen && (
                      <div className="absolute top-full left-0 mt-2 w-56 bg-background-card border border-border rounded-2xl p-2 animate-slide-down z-50 shadow-xl">
                        {COMMUNITY_LINKS.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsCommunityOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                              isActive(link.href)
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-background-secondary text-foreground-secondary hover:text-foreground'
                            )}
                          >
                            <div className={cn(
                              'inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br text-white',
                              link.accentColor
                            )}>
                              {link.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground">{link.label}</p>
                              <p className="text-xs text-foreground-muted truncate">{link.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Admin dropdown (main-contributor sub-navigation)
              if (group.label === 'Admin' && group.children) {
                return (
                  <div key="admin" ref={adminRef} className="relative">
                    <button
                      onClick={handleAdminClick}
                      className={cn(
                        'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 cursor-pointer',
                        isActive(group.href)
                          ? 'text-primary'
                          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                      )}
                    >
                      {group.icon}
                      <span className="hidden lg:inline">{group.label}</span>
                      <ChevronDown className={cn(
                        'h-3 w-3 transition-transform duration-200 hidden sm:block',
                        isAdminOpen && 'rotate-180'
                      )} />
                      {isActive(group.href) && (
                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>

                    {isAdminOpen && (
                      <div className="absolute top-full right-0 mt-2 w-60 bg-background-card border border-border rounded-2xl p-2 animate-slide-down z-50 shadow-xl">
                        <Link
                          href={group.href}
                          onClick={() => setIsAdminOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                        >
                          <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                            {group.icon}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">Dashboard</p>
                            <p className="text-xs text-foreground-muted">Overview</p>
                          </div>
                        </Link>
                        <div className="h-px bg-border my-1" />
                        {group.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={() => setIsAdminOpen(false)}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                              isActive(child.href)
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-background-secondary text-foreground-secondary hover:text-foreground'
                            )}
                          >
                            <span className="text-foreground-muted">{child.icon}</span>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{child.label}</p>
                              <p className="text-xs text-foreground-muted">{child.description}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular nav group
              const active = isActive(group.href);
              return (
                <Link
                  key={group.label}
                  href={group.href}
                  className={cn(
                    'relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    active
                      ? 'text-primary'
                      : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
                  )}
                >
                  <span className="flex items-center gap-1.5">
                    {group.icon}
                    <span className="hidden lg:inline">{group.label}</span>
                  </span>
                  {active && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                  )}
                  {group.badge && (
                    <span className="ml-1 text-[9px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0 rounded-full">
                      {group.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {/* ─── Right Section: Theme + User ─── */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all duration-200"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* User Menu */}
            {user && (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={cn(
                    'flex items-center gap-2 pl-1.5 pr-2 sm:pl-2 sm:pr-3 py-1.5 rounded-xl transition-all duration-200',
                    isUserMenuOpen
                      ? 'bg-primary/10 ring-2 ring-primary/30'
                      : 'hover:bg-background-secondary'
                  )}
                >
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-xs sm:text-sm font-bold">
                    {getInitials(user.profile.name)}
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-foreground max-w-[80px] lg:max-w-[120px] truncate">
                    {user.profile.name.split(' ')[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      'h-3 w-3 text-foreground-muted transition-transform duration-200 hidden sm:block',
                      isUserMenuOpen && 'rotate-180'
                    )}
                  />
                </button>

                {/* User Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-background-card border border-border rounded-2xl p-3 animate-slide-down z-50 shadow-xl">
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
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                    >
                      <UserCircle className="h-4 w-4" />
                      My Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors"
                    >
                      <ArrowRight className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-error hover:bg-error/10 transition-colors mt-1"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="md:hidden p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all"
              aria-label="Toggle menu"
            >
              {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </nav>
      </div>

      {/* ─── Mobile Menu ─── */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bottom-0 bg-background/95 backdrop-blur-xl border-t border-border animate-slide-down overflow-y-auto z-40">
          <div className="p-4 space-y-4">
            {/* Study Resources Grid */}
            <div>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Study Resources
              </p>
              <div className="grid grid-cols-2 gap-2">
                {STUDY_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.comingSoon ? '#' : link.href}
                    onClick={() => !link.comingSoon && setIsMobileOpen(false)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-xl bg-background-card border border-border transition-all',
                      link.comingSoon
                        ? 'opacity-50 cursor-default'
                        : 'hover:bg-background-secondary hover:border-primary/30'
                    )}
                  >
                    <span className="text-foreground-muted">{link.icon}</span>
                    <span className="text-xs font-medium text-foreground text-center">{link.label}</span>
                    {link.comingSoon && (
                      <span className="text-[9px] text-foreground-muted">Soon</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Tools Grid */}
            <div>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Study Tools
              </p>
              <div className="grid grid-cols-2 gap-2">
                {TOOLS_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background-card border border-border hover:bg-background-secondary hover:border-primary/30 transition-all"
                  >
                    <span className="text-foreground-muted">{link.icon}</span>
                    <span className="text-xs font-medium text-foreground text-center">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Community Grid */}
            <div>
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Community
              </p>
              <div className="grid grid-cols-2 gap-2">
                {COMMUNITY_QUICK_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex flex-col items-center gap-1 p-3 rounded-xl bg-background-card border border-border hover:bg-background-secondary hover:border-primary/30 transition-all"
                  >
                    <span className="text-foreground-muted">{link.icon}</span>
                    <span className="text-xs font-medium text-foreground text-center">{link.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Main Navigation Groups */}
            <div className="space-y-1">
              <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                Main Navigation
              </p>
              {visibleGroups.map((group) => (
                <Link
                  key={group.label}
                  href={group.href === '#tools' || group.href === '#community' ? '/library' : group.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                    isActive(group.href === '#tools' || group.href === '#community' ? '/library' : group.href)
                      ? 'bg-primary/10 text-primary'
                      : 'hover:bg-background-secondary'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br text-white',
                      group.accentColor
                    )}
                  >
                    {group.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'font-medium',
                          isActive(group.href === '#tools' || group.href === '#community' ? '/library' : group.href) ? 'text-primary' : 'text-foreground'
                        )}
                      >
                        {group.label}
                      </span>
                      {group.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wide bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
                          {group.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-foreground-muted">{group.description}</p>
                  </div>
                  <ArrowRight
                    className={cn(
                      'h-4 w-4',
                      isActive(group.href === '#tools' || group.href === '#community' ? '/library' : group.href) ? 'text-primary' : 'text-foreground-muted'
                    )}
                  />
                </Link>
              ))}
            </div>

            {/* Main Contributor Quick Links (mobile) */}
            {isMainContributor && (
              <div className="space-y-1 pt-4 border-t border-border">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Admin Actions
                </p>
                <Link
                  href="/main-contributor/add-contributor"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <UserPlus className="h-5 w-5 text-foreground-muted" />
                  <span className="font-medium text-foreground">Add Contributor</span>
                </Link>
                <Link
                  href="/main-contributor/review-queue"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <ClipboardCheck className="h-5 w-5 text-foreground-muted" />
                  <span className="font-medium text-foreground">Review Queue</span>
                </Link>
                <Link
                  href="/org-activities/manage"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <Building2 className="h-5 w-5 text-foreground-muted" />
                  <span className="font-medium text-foreground">Manage Organization</span>
                </Link>
              </div>
            )}

            {/* Mobile User Actions */}
            {user && (
              <div className="pt-4 border-t border-border space-y-1">
                <p className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Account
                </p>
                <Link
                  href={`/profile/${user.profile.username}`}
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <UserCircle className="h-5 w-5 text-foreground-muted" />
                  <span className="font-medium text-foreground">My Profile</span>
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setIsMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-background-secondary transition-colors"
                >
                  <Target className="h-5 w-5 text-foreground-muted" />
                  <span className="font-medium text-foreground">Settings</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-error hover:bg-error/10 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

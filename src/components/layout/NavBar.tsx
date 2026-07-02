'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — NavBar Component
// Creative floating glassmorphism nav with grouped dropdowns.
// Role-aware: links render only for the roles that can access them.
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
  FileText,
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
  Bug,
  Settings,
  UserPlus,
  Library,
  Bookmark,
  Info,
  LayoutGrid,
  Compass,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useTheme } from '@/context/ThemeContext';
import { cn, getInitials, getRoleDisplayName } from '@/lib/utils';
import { RoleBadge } from '@/components/ui/Badge';
import type { UserRole } from '@/types';

// ── Nav Group Definitions ────────────────────────────────────────────────────

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description: string;
}

interface NavGroupDef {
  label: string;
  icon: React.ReactNode;
  items: NavItem[];
  allowedRoles: UserRole[];
}

const NAV_GROUPS: NavGroupDef[] = [
  {
    label: 'Plan',
    icon: <CalendarDays className="h-4 w-4" />,
    allowedRoles: ['student', 'teacher', 'contributor', 'main_contributor'],
    items: [
      { label: 'Timetable', href: '/timetable', icon: <CalendarDays className="h-4 w-4" />, description: 'Manage your weekly schedule' },
      { label: 'Exam Countdown', href: '/countdown', icon: <Clock className="h-4 w-4" />, description: 'Track time until exams' },
      { label: 'Grade Calculator', href: '/calculator', icon: <Calculator className="h-4 w-4" />, description: 'Calculate predicted grades' },
    ],
  },
  {
    label: 'Study Tools',
    icon: <BookOpen className="h-4 w-4" />,
    allowedRoles: ['student', 'teacher', 'contributor', 'main_contributor'],
    items: [
      { label: 'Flashcards', href: '/flashcards', icon: <Layers className="h-4 w-4" />, description: 'Spaced-repetition decks' },
      { label: 'Pomodoro Timer', href: '/pomodoro', icon: <Timer className="h-4 w-4" />, description: 'Focus sessions with music' },
    ],
  },
  {
    label: 'Learn',
    icon: <GraduationCap className="h-4 w-4" />,
    allowedRoles: ['student', 'teacher', 'contributor', 'main_contributor'],
    items: [
      { label: 'Lesson Tracker', href: '/lessons', icon: <ClipboardCheck className="h-4 w-4" />, description: 'Track topic confidence' },
      { label: 'Course Manager', href: '/courses', icon: <BookOpen className="h-4 w-4" />, description: 'Manage your subjects' },
      { label: 'Notes Library', href: '/library', icon: <Library className="h-4 w-4" />, description: 'Browse study notes' },
      { label: 'My Notes', href: '/my-notes', icon: <Bookmark className="h-4 w-4" />, description: 'Your created and saved notes' },
    ],
  },
  {
    label: 'Community',
    icon: <Users className="h-4 w-4" />,
    allowedRoles: ['student', 'teacher', 'contributor', 'main_contributor'],
    items: [
      { label: 'Classrooms', href: '/classrooms', icon: <GraduationCap className="h-4 w-4" />, description: 'Virtual classrooms' },
      { label: 'Clubs', href: '/clubs', icon: <MessageSquare className="h-4 w-4" />, description: 'Community spaces' },
      { label: 'Explore Profiles', href: '/explore/profiles', icon: <Compass className="h-4 w-4" />, description: 'Browse student & educator profiles' },
      { label: 'About The ANTS', href: '/about', icon: <Info className="h-4 w-4" />, description: 'Our mission, team, and journey' },
    ],
  },
  {
    label: 'Editor',
    icon: <Pencil className="h-4 w-4" />,
    allowedRoles: ['contributor', 'main_contributor'],
    items: [
      { label: 'Curriculum & Notes', href: '/editor', icon: <FileText className="h-4 w-4" />, description: 'Build curriculum resources' },
      { label: 'Notes Editor', href: '/editor/notes', icon: <Library className="h-4 w-4" />, description: 'Create & edit study notes' },
      { label: 'Exam Data', href: '/editor/exam', icon: <ClipboardCheck className="h-4 w-4" />, description: 'Edit exam data & boundaries' },
    ],
  },
  {
    label: 'Review',
    icon: <ShieldCheck className="h-4 w-4" />,
    allowedRoles: ['main_contributor'],
    items: [
      { label: 'Review Queue', href: '/review', icon: <ShieldCheck className="h-4 w-4" />, description: 'Approve or reject submissions' },
      { label: 'Role Upgrades', href: '/main-contributor/role-upgrades', icon: <UserCircle className="h-4 w-4" />, description: 'Review role upgrade requests' },
      { label: 'Add User', href: '/main-contributor/add-contributor', icon: <UserPlus className="h-4 w-4" />, description: 'Invite new contributor' },
    ],
  },
  {
    label: 'Organisation',
    icon: <LayoutGrid className="h-4 w-4" />,
    allowedRoles: ['main_contributor'],
    items: [
      { label: 'Manage Activities & Timeline', href: '/org-activities/manage', icon: <LayoutGrid className="h-4 w-4" />, description: 'Manage org activities, photos & milestones' },
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
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer',
          isOpen
            ? 'bg-primary/10 text-primary'
            : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
        )}
      >
        {group.icon}
        <span className="hidden lg:inline">{group.label}</span>
        <ChevronDown
          className={cn(
            'h-3 w-3 transition-transform duration-200 hidden lg:block',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 glass rounded-xl p-2 animate-slide-down z-50">
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-background-secondary transition-colors duration-150 group"
            >
              <div className="mt-0.5 text-foreground-muted group-hover:text-primary transition-colors">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{item.label}</p>
                <p className="text-xs text-foreground-muted">{item.description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helper to flatten nav items ────────────────────────────────────────────────
export const getAllNavItems = () => {
  return NAV_GROUPS.flatMap(group => group.items);
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
    
    // Only track valid nav items
    const allItems = getAllNavItems();
    const isValidItem = allItems.some(item => pathname.startsWith(item.href));
    if (!isValidItem && !pathname.startsWith('/profile')) return;

    try {
      const recentStr = localStorage.getItem('recentPages');
      let recent: { href: string; timestamp: number }[] = recentStr ? JSON.parse(recentStr) : [];
      
      // Remove if already exists to move to top
      recent = recent.filter(p => p.href !== pathname);
      recent.unshift({ href: pathname, timestamp: Date.now() });
      
      // Keep only last 5
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
        <nav className="glass rounded-2xl px-4 py-2 flex items-center justify-between animate-glow">
          {/* ─── Logo ─── */}
          <Link
            href={role ? '/dashboard' : '/'}
            className="flex items-center gap-2 shrink-0"
          >
            <span className="text-xl">{'\u{1F41C}'}</span>
            <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              The ANTS
            </span>
          </Link>

          {/* ─── Desktop Nav Groups ─── */}
          <div className="hidden md:flex items-center gap-1">
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
          <div className="flex items-center gap-2">
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
                  <div className="absolute top-full right-0 mt-2 w-64 glass rounded-xl p-3 animate-slide-down z-50">
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
                      About The ANTS
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
          <div className="md:hidden mt-2 glass rounded-2xl p-4 animate-slide-down max-h-[calc(100vh-6rem)] overflow-y-auto">
            {visibleGroups.map((group) => (
              <div key={group.label} className="mb-4 last:mb-0">
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2 px-2">
                  {group.label}
                </p>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-background-secondary transition-colors"
                  >
                    <span className="text-foreground-muted">{item.icon}</span>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </Link>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
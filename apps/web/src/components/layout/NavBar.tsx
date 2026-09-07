'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — App Navigation Shell (renovated)
// Desktop: md icon rail · lg expanded sidebar · Mobile: bottom bar + slide-up sheets
// ──────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  BookOpen,
  UserCircle,
  LogOut,
  ChevronDown,
  CalendarDays,
  Timer,
  Clock,
  Calculator,
  Settings,
  GraduationCap,
  UserPlus,
  ClipboardCheck,
  Building2,
  Wrench,
  Compass,
  Info,
  Sparkles,
  Pencil,
  LayoutDashboard,
  Home,
  MoreHorizontal,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn, getInitials } from '@/lib/utils';
import ThemeToggle from '@/components/ui/ThemeToggle';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

type PanelKey = 'tools' | 'explore' | 'user' | null;
type SectionKey = 'tools' | 'explore' | 'role' | null;

const TOOLS_LINKS: NavItem[] = [
  { label: 'Smart Timetable', href: '/timetable', icon: CalendarDays },
  { label: 'Pomodoro Focus Timer', href: '/pomodoro', icon: Timer },
  { label: 'Exam Countdown', href: '/countdown', icon: Clock },
  { label: 'Grade Calculator', href: '/calculator', icon: Calculator },
  { label: 'My Workspace', href: '/workspace', icon: Wrench },
];

const EXPLORE_LINKS: NavItem[] = [
  { label: 'Explore Directory', href: '/explore', icon: Compass },
  { label: 'Tutors & Schedules', href: '/explore?tab=tutors', icon: GraduationCap },
  { label: 'Academic Contributors', href: '/explore?tab=contributors', icon: Pencil },
  { label: 'About The ANTs', href: '/about', icon: Info },
];

function isLibraryActive(pathname: string) {
  return pathname.startsWith('/library');
}

function isToolsActive(pathname: string) {
  return (
    pathname.startsWith('/timetable') ||
    pathname.startsWith('/pomodoro') ||
    pathname.startsWith('/countdown') ||
    pathname.startsWith('/calculator') ||
    pathname.startsWith('/workspace')
  );
}

function isExploreActive(pathname: string) {
  return pathname.startsWith('/explore') || pathname.startsWith('/about');
}

function isHomeActive(pathname: string) {
  return (
    pathname === '/' ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/student')
  );
}

function isHrefActive(href: string, pathname: string, tab: string | null): boolean {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  const hrefTab = params.get('tab');

  if (path === '/about') return pathname.startsWith('/about');

  if (path === '/explore') {
    if (!pathname.startsWith('/explore')) return false;
    if (hrefTab) return tab === hrefTab;
    return !tab;
  }

  return pathname === path || pathname.startsWith(`${path}/`);
}

function defaultSectionForPath(pathname: string): SectionKey {
  if (isToolsActive(pathname)) return 'tools';
  if (isExploreActive(pathname)) return 'explore';
  return null;
}

function NavItemLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'nav-item relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium',
        'transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary nav-active-bar" />
      )}
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SectionLabel({
  title,
  icon: Icon,
  open,
  active,
  onToggle,
  controlsId,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  open: boolean;
  active: boolean;
  onToggle: () => void;
  controlsId: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controlsId}
      className={cn(
        'w-full inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
        'transition-colors duration-200 cursor-pointer',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active || open
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
      )}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 text-left">{title}</span>
      <ChevronDown
        className={cn(
          'w-3.5 h-3.5 opacity-60 transition-transform duration-200',
          open && 'rotate-180'
        )}
      />
    </button>
  );
}

function RailIconLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center justify-center p-2.5 rounded-xl transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        active
          ? 'bg-primary/10 text-primary'
          : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
      )}
    >
      <Icon className="w-4 h-4" />
    </Link>
  );
}

export default function NavBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const { user, isAuthenticated, logout } = useAuth();
  const { isTutor, isContributor, isAdmin } = useRole();

  const [mounted, setMounted] = useState(false);
  const [openPanel, setOpenPanel] = useState<PanelKey>(null);
  const [openSection, setOpenSection] = useState<SectionKey>(() => defaultSectionForPath(pathname));

  const navRef = useRef<HTMLElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpenPanel(null);
    setOpenSection(defaultSectionForPath(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!openPanel) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpenPanel(null);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openPanel]);

  useEffect(() => {
    if (openPanel !== 'user') return;
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (userMenuRef.current?.contains(target)) return;
      if (sheetRef.current?.contains(target)) return;
      setOpenPanel(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPanel]);

  useEffect(() => {
    if (!openPanel || !sheetRef.current) return;
    const focusable = sheetRef.current.querySelector<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [openPanel]);

  const togglePanel = useCallback((name: Exclude<PanelKey, null>) => {
    setOpenPanel((curr) => (curr === name ? null : name));
  }, []);

  const toggleSection = useCallback((key: Exclude<SectionKey, null>) => {
    setOpenSection(key);
  }, []);

  const hasStaffRole = isTutor || isContributor || isAdmin;
  const homeHref = mounted && isAuthenticated ? '/dashboard' : '/';
  const closePanel = useCallback(() => setOpenPanel(null), []);

  const userMenuLinks = (
    <>
      {mounted && isAuthenticated && user ? (
        <>
          <div className="px-3 py-2.5 border-b border-border/60 mb-1">
            <p className="text-sm font-bold text-foreground truncate">{user.profile.name}</p>
            <p className="text-xs text-foreground-muted truncate font-mono">@{user.profile.username}</p>
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
              onClick={closePanel}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <UserCircle className="w-4 h-4" />
              View Public Profile
            </Link>
            <Link
              href="/settings/profile"
              onClick={closePanel}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Pencil className="w-4 h-4" />
              Edit Profile & Schedule
            </Link>
            <Link
              href="/settings"
              onClick={closePanel}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Settings className="w-4 h-4" />
              Settings & Telegram
            </Link>
            <button
              type="button"
              onClick={() => {
                closePanel();
                logout();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 transition-colors cursor-pointer text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-2 p-2">
          <Link
            href="/login"
            onClick={closePanel}
            className="block w-full text-center px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-background-secondary transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            onClick={closePanel}
            className="block w-full text-center px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-md hover:bg-primary-hover transition-all"
          >
            Get Started
          </Link>
        </div>
      )}
    </>
  );

  const roleLinkClass =
    'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-foreground hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';

  const roleLinks = (
    <div className="space-y-0.5">
      {isTutor && (
        <Link href={`/profile/${user?.profile.username}`} onClick={closePanel} className={roleLinkClass}>
          <GraduationCap className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">My Tutor Schedule</span>
        </Link>
      )}
      {(isContributor || isAdmin) && (
        <>
          <Link href="/editor" onClick={closePanel} className={roleLinkClass}>
            <Pencil className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Curriculum Editor</span>
          </Link>
          <Link href="/editor/review-queue" onClick={closePanel} className={roleLinkClass}>
            <ClipboardCheck className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Review Queue</span>
          </Link>
        </>
      )}
      {isAdmin && (
        <>
          <Link href="/main-contributor/add-contributor" onClick={closePanel} className={roleLinkClass}>
            <UserPlus className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Manage Users</span>
          </Link>
          <Link href="/org-activities" onClick={closePanel} className={roleLinkClass}>
            <Building2 className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Organization Team</span>
          </Link>
        </>
      )}
    </div>
  );

  const renderSectionLinks = (items: NavItem[]) =>
    items.map((item) => (
      <NavItemLink
        key={item.href}
        item={item}
        active={isHrefActive(item.href, pathname, tab)}
        onNavigate={closePanel}
      />
    ));

  return (
    <nav ref={navRef} aria-label="Primary" className="contents">
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside
        className={cn(
          'hidden md:flex fixed inset-y-0 left-0 z-40 flex-col',
          'w-[var(--sidebar-width-collapsed)] lg:w-[var(--sidebar-width)]',
          'bg-background/95 backdrop-blur-md border-r border-border',
          'transition-[width] duration-200 ease-out motion-reduce:transition-none'
        )}
      >
        <div className="flex items-center justify-center lg:justify-start gap-2.5 px-2 lg:px-4 h-16 shrink-0 border-b border-border/60">
          <Link
            href={homeHref}
            className="flex items-center gap-2.5 group min-w-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            title="The ANTS"
          >
            <Image
              src="/logo.png"
              alt="The ANTS"
              width={32}
              height={32}
              className="w-8 h-8 rounded-xl object-contain shrink-0 group-hover:scale-105 transition-transform duration-200"
              priority
            />
            <span className="hidden lg:block font-brand font-black text-lg tracking-tight text-foreground leading-none truncate">
              The ANTS
            </span>
          </Link>
        </div>

        {/* md: icon rail */}
        <div className="lg:hidden flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <RailIconLink
            href={homeHref}
            label={mounted && isAuthenticated ? 'Dashboard' : 'Home'}
            icon={mounted && isAuthenticated ? LayoutDashboard : Home}
            active={isHomeActive(pathname)}
          />
          <RailIconLink href="/library" label="Library" icon={BookOpen} active={isLibraryActive(pathname)} />
          <RailIconLink href="/timetable" label="Tools" icon={Wrench} active={isToolsActive(pathname)} />
          <RailIconLink href="/explore" label="Explore" icon={Compass} active={isExploreActive(pathname)} />
          {mounted && hasStaffRole && (
            <RailIconLink href="/editor" label="Workspace Tools" icon={Sparkles} active={pathname.startsWith('/editor') || pathname.startsWith('/main-contributor') || pathname.startsWith('/org-activities')} />
          )}
        </div>

        {/* lg: expanded exclusive accordion */}
        <div className="hidden lg:flex flex-1 flex-col overflow-y-auto px-3 py-3 space-y-0.5">
          <Link
            href={homeHref}
            aria-current={isHomeActive(pathname) ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium mb-1',
              'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isHomeActive(pathname)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
            )}
          >
            {isHomeActive(pathname) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary nav-active-bar" />
            )}
            {mounted && isAuthenticated ? (
              <LayoutDashboard className="w-4 h-4 shrink-0" />
            ) : (
              <Home className="w-4 h-4 shrink-0" />
            )}
            <span className="truncate">{mounted && isAuthenticated ? 'Dashboard' : 'Home'}</span>
          </Link>

          <Link
            href="/library"
            aria-current={isLibraryActive(pathname) ? 'page' : undefined}
            className={cn(
              'relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold',
              'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              isLibraryActive(pathname)
                ? 'bg-primary/10 text-primary'
                : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'
            )}
          >
            {isLibraryActive(pathname) && (
              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-primary nav-active-bar" />
            )}
            <BookOpen className="w-4 h-4 shrink-0" />
            <span className="truncate">Library</span>
          </Link>

          <div>
            <SectionLabel
              title="Tools"
              icon={Wrench}
              open={openSection === 'tools'}
              active={isToolsActive(pathname)}
              onToggle={() => toggleSection('tools')}
              controlsId="nav-section-tools"
            />
            {openSection === 'tools' && (
              <div id="nav-section-tools" className="mt-0.5 space-y-0.5 pl-1 nav-section-enter">
                {renderSectionLinks(TOOLS_LINKS)}
              </div>
            )}
          </div>

          <div>
            <SectionLabel
              title="Explore & Tutors"
              icon={Compass}
              open={openSection === 'explore'}
              active={isExploreActive(pathname)}
              onToggle={() => toggleSection('explore')}
              controlsId="nav-section-explore"
            />
            {openSection === 'explore' && (
              <div id="nav-section-explore" className="mt-0.5 space-y-0.5 pl-1 nav-section-enter">
                {renderSectionLinks(EXPLORE_LINKS)}
              </div>
            )}
          </div>

          {mounted && hasStaffRole && (
            <div className="pt-2 mt-2 border-t border-border/60">
              <SectionLabel
                title="Workspace Tools"
                icon={Sparkles}
                open={openSection === 'role'}
                active={openSection === 'role'}
                onToggle={() => toggleSection('role')}
                controlsId="nav-section-role"
              />
              {openSection === 'role' && (
                <div id="nav-section-role" className="mt-0.5 pl-1 nav-section-enter">
                  {roleLinks}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Account footer */}
        <div className="shrink-0 border-t border-border/60 p-2 lg:p-3 relative" ref={userMenuRef}>
          {mounted && isAuthenticated && user ? (
            <>
              <div className="flex justify-center lg:justify-start mb-2 px-0.5">
                <ThemeToggle />
              </div>
              <button
                type="button"
                onClick={() => togglePanel('user')}
                aria-expanded={openPanel === 'user'}
                aria-controls="nav-user-menu"
                title={user.profile.name}
                className={cn(
                  'w-full flex items-center gap-2 p-1.5 lg:pr-2.5 rounded-2xl border border-border',
                  'hover:border-primary/40 bg-background-secondary/50 transition-all cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  'justify-center lg:justify-start'
                )}
              >
                {user.profile.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.profile.avatar}
                    alt={user.profile.name}
                    className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
                    {getInitials(user.profile.name)}
                  </div>
                )}
                <div className="hidden lg:block min-w-0 flex-1 text-left">
                  <p className="text-sm font-semibold text-foreground truncate">{user.profile.name}</p>
                  <p className="text-xs text-foreground-muted truncate">@{user.profile.username}</p>
                </div>
                <ChevronDown
                  className={cn(
                    'hidden lg:block w-3.5 h-3.5 opacity-60 transition-transform duration-200 shrink-0',
                    openPanel === 'user' && 'rotate-180'
                  )}
                />
              </button>
              {openPanel === 'user' && (
                <div
                  id="nav-user-menu"
                  role="menu"
                  className="absolute left-2 right-2 lg:left-3 lg:right-3 bottom-full mb-2 bg-background-card border border-border rounded-2xl shadow-2xl p-2 z-50 nav-popover-enter"
                >
                  {userMenuLinks}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex justify-center lg:justify-start px-0.5">
                <ThemeToggle />
              </div>
              <Link
                href="/login"
                title="Sign In"
                className="px-2 lg:px-3.5 py-2 rounded-xl text-sm font-semibold text-center text-foreground hover:bg-background-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <UserCircle className="w-5 h-5 mx-auto lg:hidden" />
                <span className="hidden lg:inline">Sign In</span>
              </Link>
              <Link
                href="/signup"
                className="hidden lg:block px-4 py-2 rounded-xl bg-primary text-white text-sm font-bold text-center shadow-md hover:bg-primary-hover transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom bar + slide-up sheet ───────────────────────────── */}
      <div className="md:hidden fixed inset-x-0 bottom-0 z-40">
        {openPanel && (
          <div
            className="fixed inset-0 bg-foreground/25 backdrop-blur-[2px] z-40 nav-backdrop-enter"
            aria-hidden
            onClick={closePanel}
          />
        )}

        {openPanel && (
          <div
            ref={sheetRef}
            id="nav-sheet"
            role="dialog"
            aria-modal="true"
            aria-label={
              openPanel === 'tools'
                  ? 'Tools'
                  : openPanel === 'explore'
                    ? 'Explore'
                    : 'Account'
            }
            className="relative z-50 rounded-t-2xl border border-border border-b-0 bg-background-card shadow-2xl max-h-[70vh] overflow-y-auto nav-sheet-enter"
          >
            <div className="flex justify-center pt-2.5 pb-1 sticky top-0 bg-background-card z-10">
              <span className="w-10 h-1 rounded-full bg-border" aria-hidden />
            </div>

            {openPanel === 'tools' && (
              <div className="px-2 pb-3">
                <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Tools
                </p>
                <div className="space-y-0.5">{renderSectionLinks(TOOLS_LINKS)}</div>
              </div>
            )}
            {openPanel === 'explore' && (
              <div className="px-2 pb-3">
                <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                  Explore & Tutors
                </p>
                <div className="space-y-0.5">{renderSectionLinks(EXPLORE_LINKS)}</div>
              </div>
            )}
            {openPanel === 'user' && (
              <div className="px-2 pb-3">
                {mounted && hasStaffRole && (
                  <div className="mb-2 pb-2 border-b border-border/60">
                    <p className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-foreground-muted">
                      Workspace Tools
                    </p>
                    {roleLinks}
                  </div>
                )}
                {userMenuLinks}
                <div className="mt-2 pt-1 border-t border-border/60 px-3 py-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground-muted">
                    Theme
                  </span>
                  <ThemeToggle />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative z-50 border-t border-border bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
          <div className="h-[var(--bottom-nav-height)] flex items-stretch justify-around px-0.5">
            <MobileTab
              label="Home"
              icon={mounted && isAuthenticated ? LayoutDashboard : Home}
              active={isHomeActive(pathname) && !openPanel}
              href={homeHref}
            />
            <MobileTab
              label="Library"
              icon={BookOpen}
              active={isLibraryActive(pathname) && !openPanel}
              href="/library"
            />
            <MobileTab
              label="Tools"
              icon={Wrench}
              active={isToolsActive(pathname) || openPanel === 'tools'}
              onClick={() => togglePanel('tools')}
              expanded={openPanel === 'tools'}
              controlsId="nav-sheet"
            />
            <MobileTab
              label="Explore"
              icon={Compass}
              active={isExploreActive(pathname) || openPanel === 'explore'}
              onClick={() => togglePanel('explore')}
              expanded={openPanel === 'explore'}
              controlsId="nav-sheet"
            />
            <MobileTab
              label={mounted && isAuthenticated ? 'Account' : 'More'}
              icon={mounted && isAuthenticated ? UserCircle : MoreHorizontal}
              active={openPanel === 'user'}
              onClick={() => togglePanel('user')}
              expanded={openPanel === 'user'}
              controlsId="nav-sheet"
              avatar={
                mounted && isAuthenticated && user ? (
                  user.profile.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.profile.avatar}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white">
                      {getInitials(user.profile.name)}
                    </span>
                  )
                ) : undefined
              }
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

function MobileTab({
  label,
  icon: Icon,
  active,
  onClick,
  href,
  avatar,
  expanded,
  controlsId,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  onClick?: () => void;
  href?: string;
  avatar?: React.ReactNode;
  expanded?: boolean;
  controlsId?: string;
}) {
  const className = cn(
    'relative flex-1 min-w-0 min-h-[44px] flex flex-col items-center justify-center gap-0.5 px-1',
    'transition-colors duration-200 cursor-pointer',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
    active ? 'text-primary' : 'text-foreground-muted hover:text-foreground'
  );

  const content = (
    <>
      {active && (
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-b-full bg-primary nav-tab-indicator" />
      )}
      {avatar ?? (
        <Icon className={cn('w-5 h-5 transition-transform duration-200', active && 'scale-105')} />
      )}
      <span className="text-xs font-semibold truncate max-w-full">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className} aria-current={active ? 'page' : undefined}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-current={active ? 'page' : undefined}
      aria-expanded={expanded}
      aria-controls={expanded ? controlsId : undefined}
    >
      {content}
    </button>
  );
}

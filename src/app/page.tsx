'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Home / Landing Page
// Showcases features, supported qualifications, roles, and CTAs.
// Now includes Explore Clubs & Explore Profiles sections.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  Timer,
  Layers,
  ClipboardCheck,
  GraduationCap,
  Users,
  MessageSquare,
  Clock,
  Calculator,
  BookOpen,
  Pencil,
  Shield,
  ArrowRight,
  Sun,
  Moon,
  Sparkles,
  ChevronDown,
  Compass,
  UserCheck,
  Home,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { cn, getRoleLandingPath } from '@/lib/utils';

// ── Feature Data ─────────────────────────────────────────────────────────────

const FEATURES = [
  {
    title: 'Smart Timetable',
    description: 'Drag-and-drop weekly planner with colour-coded events, repeating schedules, and multiple views.',
    icon: <CalendarDays className="h-6 w-6" />,
    gradient: 'from-blue-500 to-cyan-400',
  },
  {
    title: 'Pomodoro Timer',
    description: 'Focus sessions with customisable intervals and background music to keep you in the zone.',
    icon: <Timer className="h-6 w-6" />,
    gradient: 'from-rose-500 to-pink-400',
  },
  {
    title: 'Flashcard Decks',
    description: 'Create or browse decks with spaced-repetition. Never forget what you\'ve learnt.',
    icon: <Layers className="h-6 w-6" />,
    gradient: 'from-violet-500 to-purple-400',
  },
  {
    title: 'Lesson Tracker',
    description: 'Track your confidence across every topic in your syllabus with intuitive progress indicators.',
    icon: <ClipboardCheck className="h-6 w-6" />,
    gradient: 'from-emerald-500 to-teal-400',
  },
  {
    title: 'Virtual Classrooms',
    description: 'Teachers create classrooms, issue assignments, and monitor student progress in real time.',
    icon: <GraduationCap className="h-6 w-6" />,
    gradient: 'from-amber-500 to-orange-400',
  },
  {
    title: 'Clubs',
    description: 'Community spaces for subjects, CCAs, and projects — with chat, announcements, and resources.',
    icon: <MessageSquare className="h-6 w-6" />,
    gradient: 'from-sky-500 to-blue-400',
  },
  {
    title: 'Exam Countdown',
    description: 'Visual urgency indicators showing exactly how long until each exam. Never miss a date.',
    icon: <Clock className="h-6 w-6" />,
    gradient: 'from-red-500 to-rose-400',
  },
  {
    title: 'Grade Calculator',
    description: 'Enter raw marks and get predicted grades using official boundary tables for IGCSE, A Level, and more.',
    icon: <Calculator className="h-6 w-6" />,
    gradient: 'from-indigo-500 to-violet-400',
  },
];

const QUALIFICATIONS = [
  { name: 'Cambridge CAIE', sub: 'IGCSE & A Levels', emoji: '\u{1F393}' },
  { name: 'Pearson Edexcel', sub: 'IGCSE & IAL', emoji: '\u{1F4D8}' },
  { name: 'OSSD', sub: 'Ontario Diploma', emoji: '\u{1F341}' },
  { name: 'IELTS', sub: 'Academic & General', emoji: '\u{1F30D}' },
  { name: 'SAT', sub: 'Math + Reading/Writing', emoji: '\u{1F4DD}' },
  { name: 'Duolingo', sub: 'English Test (DET)', emoji: '\u{1F4AC}' },
];

const ROLES = [
  {
    title: 'Student',
    description: 'Access all study tools — timetables, flashcards, grade calculators, and more. Join classrooms and clubs.',
    icon: <GraduationCap className="h-7 w-7" />,
    gradient: 'from-blue-500 to-cyan-400',
    color: 'text-blue-500',
  },
  {
    title: 'Teacher',
    description: 'Everything students get, plus create classrooms, issue assignments, and track student progress.',
    icon: <BookOpen className="h-7 w-7" />,
    gradient: 'from-emerald-500 to-teal-400',
    color: 'text-emerald-500',
  },
  {
    title: 'Contributor',
    description: 'Build curriculum resources, create notes, lead clubs, and get a public profile.',
    icon: <Pencil className="h-7 w-7" />,
    gradient: 'from-violet-500 to-purple-400',
    color: 'text-violet-500',
  },
  {
    title: 'Main Contributor',
    description: 'Senior gatekeeper — review and approve submissions before they go live to all users.',
    icon: <Shield className="h-7 w-7" />,
    gradient: 'from-amber-500 to-orange-400',
    color: 'text-amber-500',
  },
];

// ── Explore Cards ────────────────────────────────────────────────────────────

const EXPLORE_CARDS = [
  {
    title: 'Explore Clubs',
    description: 'Discover community spaces for subjects, CCAs, and projects. Browse clubs and see what members are building.',
    icon: <MessageSquare className="h-8 w-8" />,
    href: '/explore/clubs',
    gradient: 'from-sky-500 to-blue-400',
    color: 'text-sky-500',
  },
  {
    title: 'Explore Profiles',
    description: 'Browse student portfolios, projects, CCA activities, and verified educators & contributors. View achievements and credentials.',
    icon: <Users className="h-8 w-8" />,
    href: '/explore/profiles',
    gradient: 'from-violet-500 to-purple-400',
    color: 'text-violet-500',
  },
];

// ── Intersection Observer Hook ───────────────────────────────────────────────

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        observer.unobserve(el);
      }
    }, { threshold: 0.1, ...options });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, isInView };
}

// ── Section Wrapper with Animation ───────────────────────────────────────────

function AnimatedSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={cn(className)}
      style={{
        opacity: isInView ? 1 : 0,
        transform: isInView ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.4s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function HomePage() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* ─── Sticky Top Bar ─── */}
      <header className="sticky top-0 z-50 w-full">
        <div className="mx-auto max-w-7xl px-4 pt-3">
          <nav className="glass rounded-2xl px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                The ANTS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-all cursor-pointer"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              {isAuthenticated && user ? (
                <Link href={getRoleLandingPath(user.profile.role)}>
                  <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Log In</Button>
                  </Link>
                  <Link href="/signup">
                    <Button size="sm" iconRight={<ArrowRight className="h-4 w-4" />}>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative pt-20 pb-24 px-4 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-accent/8 rounded-full blur-3xl animate-float delay-700" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Built for Myanmar students
            </div>
          </AnimatedSection>

          <AnimatedSection delay={100}>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight tracking-tight">
              The Academic{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Productivity
              </span>{' '}
              Ecosystem
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={200}>
            <p className="mt-6 text-lg sm:text-xl text-foreground-secondary max-w-2xl mx-auto leading-relaxed">
              Timetables, flashcards, classrooms, clubs, grade calculators, and exam countdowns —
              all wired into your exam board criteria. <strong className="text-foreground">Ace with us! {'\u{1F41C}'}</strong>
            </p>
          </AnimatedSection>

          <AnimatedSection delay={300}>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" iconRight={<ArrowRight className="h-5 w-5" />}>
                  Get Started &mdash; It{"'"}s Free
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary" size="lg">
                  Sign In
                </Button>
              </Link>
            </div>
          </AnimatedSection>

          <AnimatedSection delay={500}>
            <div className="mt-16 flex justify-center">
              <ChevronDown className="h-6 w-6 text-foreground-muted animate-float" />
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Explore Section ─── */}
      <section className="py-20 px-4 bg-background-secondary" id="explore">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-14">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Discover</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Explore{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Clubs & Profiles
                </span>
              </h2>
              <p className="mt-4 text-foreground-secondary max-w-xl mx-auto">
                Browse community clubs, view student portfolios, and discover verified educators &mdash; no login required.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {EXPLORE_CARDS.map((card, i) => (
              <AnimatedSection key={card.title} delay={i * 100}>
                <Link href={card.href} className="block group">
                  <div className="relative bg-background-card border border-border rounded-2xl p-8 hover:border-border-hover hover:shadow-lg transition-all duration-300 h-full">
                    <div
                      className={cn(
                        'inline-flex p-3 rounded-xl bg-gradient-to-br text-white mb-5',
                        card.gradient
                      )}
                    >
                      {card.icon}
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-foreground-secondary leading-relaxed text-sm">
                      {card.description}
                    </p>
                    <div className="mt-4 flex items-center gap-1 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                      View <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features Section ─── */}
      <section className="py-24 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Features</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Everything you need to{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">ace your exams</span>
              </h2>
              <p className="mt-4 text-foreground-secondary max-w-xl mx-auto">
                A complete toolkit designed specifically for students pursuing international qualifications.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((feature, i) => (
              <AnimatedSection key={feature.title} delay={i * 80}>
                <div className="group relative bg-background-card border border-border rounded-2xl p-6 hover:border-border-hover hover:shadow-lg transition-all duration-300 h-full">
                  <div
                    className={cn(
                      'inline-flex p-3 rounded-xl bg-gradient-to-br text-white mb-4',
                      feature.gradient
                    )}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-foreground-secondary leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Qualifications Section ─── */}
      <section className="py-20 px-4 bg-background-secondary">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-12">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Qualifications</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Wired into your{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">exam board</span>
              </h2>
              <p className="mt-4 text-foreground-secondary max-w-xl mx-auto">
                Our tools understand the difference between CAIE IGCSE and Edexcel IAL — so your grades are always accurate.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {QUALIFICATIONS.map((qual, i) => (
              <AnimatedSection key={qual.name} delay={i * 60}>
                <div className="flex flex-col items-center text-center p-5 bg-background-card border border-border rounded-2xl hover:border-border-hover hover:shadow-md transition-all duration-300">
                  <span className="text-3xl mb-3">{qual.emoji}</span>
                  <p className="text-sm font-semibold text-foreground">{qual.name}</p>
                  <p className="text-xs text-foreground-muted mt-1">{qual.sub}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Roles Section ─── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">For Everyone</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                Choose your{' '}
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">role</span>
              </h2>
              <p className="mt-4 text-foreground-secondary max-w-xl mx-auto">
                The ANTS adapts to who you are — student, teacher, content creator, or quality gatekeeper.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {ROLES.map((role, i) => (
              <AnimatedSection key={role.title} delay={i * 100}>
                <div className="group relative bg-background-card border border-border rounded-2xl p-8 hover:border-border-hover hover:shadow-lg transition-all duration-300">
                  <div
                    className={cn(
                      'inline-flex p-3 rounded-xl bg-gradient-to-br text-white mb-5',
                      role.gradient
                    )}
                  >
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{role.title}</h3>
                  <p className="text-foreground-secondary leading-relaxed">{role.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="py-24 px-4">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="relative bg-gradient-to-br from-primary to-accent rounded-3xl p-12 text-center text-white overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to ace your exams?</h2>
                <p className="text-white/80 text-lg mb-8 max-w-lg mx-auto">
                  Join thousands of Myanmar students already using The ANTS to study smarter.
                </p>
                <Link href="/signup">
                  <Button
                    variant="secondary"
                    size="lg"
                    iconRight={<ArrowRight className="h-5 w-5" />}
                    className="bg-white text-primary hover:bg-white/90 border-none"
                  >
                    Get Started &mdash; It{"'"}s Free
                  </Button>
                </Link>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-border bg-background-secondary py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                The ANTS
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-foreground-muted">
              <a href="#explore" className="hover:text-foreground transition-colors">Explore</a>
              <a href="#features" className="hover:text-foreground transition-colors">Features</a>
              <Link href="/explore/clubs" className="hover:text-foreground transition-colors">Clubs</Link>
              <Link href="/explore/profiles" className="hover:text-foreground transition-colors">Profiles</Link>
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            </div>
            <p className="text-xs text-foreground-muted">
              Built with {'\u2764\uFE0F'} for Myanmar students
            </p>
          </div>
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-foreground-muted">
              &copy; {new Date().getFullYear()} The ANTS. Ace with us! {'\u{1F41C}'}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
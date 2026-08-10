'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Resources Hub
// Route: /library — accessible to all authenticated users.
// Tabbed layout combining Courses, Notes, Flashcards, Exams & Tools.
// URL-driven tab state: /library?tab=all|courses|notes|flashcards|exams|tools
// ──────────────────────────────────────────────────────────────────────────────

import { Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Clock,
  Calculator,
  NotebookPen,
  ScrollText,
  CalendarDays,
  Timer,
  GraduationCap,
  ArrowRight,
  Sparkles,
  FlaskConical,
  Brain,
  Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import CoursesLibraryBrowser from '@/components/library/CoursesLibraryBrowser';
import FlashcardsLibraryBrowser from '@/components/library/FlashcardsLibraryBrowser';
import ExamsLibraryBrowser from '@/components/library/ExamsLibraryBrowser';
import NotesLibrary from '@/components/notes/NotesLibrary';
import QuizLibraryBrowser from '@/components/quizzes/QuizLibraryBrowser';

// ── Tab Definition ───────────────────────────────────────────────────────────

type TabId = 'all' | 'courses' | 'notes' | 'flashcards' | 'exams' | 'tools' | 'quizzes';

interface Tab {
  id: TabId;
  label: string;
  icon?: React.ReactNode;
  accentColor: string;
  illustration: React.ReactNode;
}

// ── Inline SVG Illustrations ─────────────────────────────────────────────────

/** All / Explore — Sparkle constellation */
const IllusAll = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="36" cy="36" r="28" fill="url(#allGrad)" opacity="0.18" />
    <path d="M36 16l2.5 7.5H46l-6.25 4.5 2.5 7.5L36 31l-6.25 4.5 2.5-7.5L26 23.5h7.5L36 16z" fill="url(#starGrad)" />
    <circle cx="36" cy="52" r="2.5" fill="#5B9EFF" opacity="0.7" />
    <circle cx="18" cy="36" r="2" fill="#28FFBF" opacity="0.6" />
    <circle cx="54" cy="36" r="2" fill="#B98FFF" opacity="0.6" />
    <line x1="36" y1="8" x2="36" y2="13" stroke="#5B9EFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="36" y1="59" x2="36" y2="64" stroke="#5B9EFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="8" y1="36" x2="13" y2="36" stroke="#28FFBF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <line x1="59" y1="36" x2="64" y2="36" stroke="#28FFBF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    <circle cx="52" cy="20" r="1.5" fill="#FFB347" />
    <circle cx="20" cy="52" r="1.5" fill="#F87171" />
    <circle cx="52" cy="52" r="1.5" fill="#28FFBF" />
    <circle cx="20" cy="20" r="1.5" fill="#B98FFF" />
    <defs>
      <radialGradient id="allGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#5B9EFF" />
        <stop offset="100%" stopColor="#B98FFF" />
      </radialGradient>
      <linearGradient id="starGrad" x1="26" y1="16" x2="46" y2="35" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="100%" stopColor="#FFB347" />
      </linearGradient>
    </defs>
  </svg>
);

/** Courses — Graduation cap on a stack of books */
const IllusCourses = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="14" y="50" width="44" height="9" rx="3" fill="#4ADE80" />
    <rect x="16" y="42" width="38" height="9" rx="3" fill="#34D399" />
    <rect x="18" y="34" width="32" height="9" rx="3" fill="#6EE7B7" />
    <rect x="14" y="50" width="5" height="9" rx="2" fill="#16A34A" opacity="0.5" />
    <rect x="16" y="42" width="5" height="9" rx="2" fill="#059669" opacity="0.5" />
    <rect x="18" y="34" width="5" height="9" rx="2" fill="#10B981" opacity="0.5" />
    <ellipse cx="36" cy="30" rx="20" ry="5.5" fill="#1E293B" />
    <ellipse cx="36" cy="30" rx="20" ry="5.5" fill="url(#capSheen)" opacity="0.15" />
    <rect x="28" y="18" width="16" height="12" rx="3" fill="#334155" />
    <rect x="28" y="18" width="16" height="12" rx="3" fill="url(#capTopSheen)" opacity="0.2" />
    <line x1="52" y1="30" x2="56" y2="38" stroke="#FFD700" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="56" cy="40" r="3" fill="#FFD700" />
    <circle cx="36" cy="18" r="2" fill="#FFD700" />
    <defs>
      <linearGradient id="capSheen" x1="16" y1="30" x2="56" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" stopOpacity="0" />
        <stop offset="50%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="capTopSheen" x1="28" y1="18" x2="44" y2="30" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="white" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

/** Notes — Glowing spiral notebook */
const IllusNotes = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="36" cy="40" rx="22" ry="20" fill="url(#noteGlow)" opacity="0.25" />
    <rect x="20" y="18" width="34" height="42" rx="5" fill="url(#noteBody)" />
    <line x1="27" y1="30" x2="47" y2="30" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="27" y1="37" x2="47" y2="37" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <line x1="27" y1="44" x2="40" y2="44" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    <ellipse cx="36" cy="18" rx="3" ry="3" stroke="#FCD34D" strokeWidth="2" fill="none" />
    <ellipse cx="26" cy="18" rx="3" ry="3" stroke="#FCD34D" strokeWidth="2" fill="none" />
    <ellipse cx="46" cy="18" rx="3" ry="3" stroke="#FCD34D" strokeWidth="2" fill="none" />
    <line x1="29" y1="18" x2="33" y2="18" stroke="#FCD34D" strokeWidth="2" />
    <line x1="39" y1="18" x2="43" y2="18" stroke="#FCD34D" strokeWidth="2" />
    <path d="M52 14l1.2 3.6H57l-2.9 2.1 1.1 3.6L52 21.2 49.8 23.3l1.1-3.6L48 17.6h3.8L52 14z" fill="#FCD34D" opacity="0.9" />
    <rect x="48" y="34" width="6" height="22" rx="2" fill="#6EE7B7" transform="rotate(-25 48 34)" />
    <polygon points="51,55 48,62 54,59" fill="#059669" transform="rotate(-25 48 34)" />
    <defs>
      <linearGradient id="noteBody" x1="20" y1="18" x2="54" y2="60" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <radialGradient id="noteGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

/** Flashcards — Floating study cards with magic spark */
const IllusFlashcards = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="10" y="24" width="38" height="28" rx="6" fill="#C4B5FD" transform="rotate(-8 10 24)" />
    <rect x="14" y="22" width="38" height="28" rx="6" fill="#A78BFA" transform="rotate(-3 14 22)" />
    <rect x="18" y="20" width="38" height="28" rx="6" fill="url(#cardGrad)" />
    <text x="37" y="40" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" opacity="0.9">✦</text>
    <line x1="24" y1="24" x2="28" y2="42" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.25" />
    <circle cx="56" cy="16" r="4.5" fill="#FDE68A" opacity="0.9" />
    <line x1="56" y1="8" x2="56" y2="11" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    <line x1="56" y1="21" x2="56" y2="24" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    <line x1="48" y1="16" x2="51" y2="16" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    <line x1="61" y1="16" x2="64" y2="16" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="10" x2="52.5" y2="12.5" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="59.5" y1="19.5" x2="62" y2="22" stroke="#FDE68A" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="46" y="42" width="18" height="12" rx="3" fill="#7C3AED" opacity="0.7" transform="rotate(10 46 42)" />
    <defs>
      <linearGradient id="cardGrad" x1="18" y1="20" x2="56" y2="48" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#8B5CF6" />
        <stop offset="100%" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
  </svg>
);

/** Exams — Official exam paper with glowing star badge */
const IllusExams = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="17" y="15" width="36" height="46" rx="5" fill="#1E293B" opacity="0.12" transform="translate(3,3)" />
    <rect x="14" y="12" width="36" height="46" rx="5" fill="url(#examPaper)" />
    <line x1="21" y1="26" x2="43" y2="26" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="21" y1="33" x2="43" y2="33" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="21" y1="40" x2="36" y2="40" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="21" y1="47" x2="38" y2="47" stroke="#E2E8F0" strokeWidth="1.5" strokeLinecap="round" />
    <rect x="14" y="12" width="36" height="10" rx="5" fill="#F87171" opacity="0.85" />
    <line x1="20" y1="17" x2="40" y2="17" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
    <circle cx="52" cy="18" r="13" fill="url(#badgeGrad)" />
    <path d="M52 8l2 6h6l-5 3.5 2 6-5-3.5-5 3.5 2-6-5-3.5h6l2-6z" fill="#FDE68A" />
    <circle cx="52" cy="18" r="13" stroke="#FCD34D" strokeWidth="1.5" fill="none" opacity="0.5" />
    <path d="M21 54l3 3 6-6" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <defs>
      <linearGradient id="examPaper" x1="14" y1="12" x2="50" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      <radialGradient id="badgeGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#DC2626" />
      </radialGradient>
    </defs>
  </svg>
);

/** Quizzes — Electric lightbulb brain */
const IllusQuizzes = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="36" cy="33" r="20" fill="url(#bulbGlow)" opacity="0.3" />
    <path d="M36 14c-9 0-16 7-16 16 0 5.5 2.8 10.4 7 13.2V47h18v-3.8c4.2-2.8 7-7.7 7-13.2 0-9-7-16-16-16z" fill="url(#bulbGlass)" />
    <path d="M30 32c1-3 3-4 5-2s4-1 5-4" stroke="#FDE68A" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M28 36c1.5-2 3.5-2.5 5-0.5s3.5-1.5 5-3.5" stroke="#FCD34D" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7" />
    <rect x="27" y="47" width="18" height="4" rx="2" fill="#6EE7B7" />
    <rect x="28" y="52" width="16" height="4" rx="2" fill="#34D399" />
    <rect x="30" y="56" width="12" height="3" rx="1.5" fill="#10B981" />
    <path d="M19 20l3-5-2 4h4l-4 6 2-5z" fill="#FDE68A" />
    <path d="M52 18l2-4-1.5 3.5h3l-3.5 5 1.5-4.5z" fill="#FDE68A" opacity="0.8" />
    <text x="36" y="37" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1E293B" opacity="0.6">?</text>
    <defs>
      <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bulbGlass" x1="20" y1="14" x2="52" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FEF9C3" />
        <stop offset="60%" stopColor="#FDE68A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>
  </svg>
);

/** Tools — Stopwatch + calculator combination */
const IllusTools = () => (
  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="10" y="28" width="30" height="36" rx="6" fill="url(#calcGrad)" />
    <rect x="14" y="32" width="22" height="10" rx="3" fill="#0F172A" opacity="0.85" />
    <text x="25" y="40" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#4ADE80">42.0</text>
    <rect x="14" y="46" width="6" height="5" rx="1.5" fill="#38BDF8" opacity="0.8" />
    <rect x="22" y="46" width="6" height="5" rx="1.5" fill="#38BDF8" opacity="0.8" />
    <rect x="30" y="46" width="6" height="5" rx="1.5" fill="#F87171" opacity="0.8" />
    <rect x="14" y="54" width="6" height="5" rx="1.5" fill="white" opacity="0.4" />
    <rect x="22" y="54" width="6" height="5" rx="1.5" fill="white" opacity="0.4" />
    <rect x="30" y="54" width="6" height="5" rx="1.5" fill="white" opacity="0.4" />
    <circle cx="50" cy="36" r="18" fill="url(#watchGrad)" />
    <circle cx="50" cy="36" r="14" fill="url(#watchFace)" />
    <rect x="47" y="15" width="6" height="5" rx="2" fill="#64748B" />
    <rect x="55" y="17" width="5" height="3" rx="1.5" fill="#94A3B8" transform="rotate(30 55 17)" />
    <line x1="50" y1="36" x2="50" y2="26" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="50" y1="36" x2="57" y2="40" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
    <line x1="50" y1="23" x2="50" y2="25" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="50" y1="47" x2="50" y2="49" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="37" y1="36" x2="39" y2="36" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="61" y1="36" x2="63" y2="36" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="36" r="2.5" fill="#F97316" />
    <defs>
      <linearGradient id="calcGrad" x1="10" y1="28" x2="40" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#0284C7" />
      </linearGradient>
      <radialGradient id="watchGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#475569" />
      </radialGradient>
      <radialGradient id="watchFace" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </radialGradient>
    </defs>
  </svg>
);

const TABS: Tab[] = [
  {
    id: 'all',
    label: 'All',
    icon: <Sparkles className="h-3.5 w-3.5" />,
    accentColor: 'from-primary to-accent',
    illustration: <IllusAll />,
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    accentColor: 'from-emerald-500 to-teal-500',
    illustration: <IllusCourses />,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: <NotebookPen className="h-3.5 w-3.5" />,
    accentColor: 'from-amber-500 to-orange-500',
    illustration: <IllusNotes />,
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    icon: <Layers className="h-3.5 w-3.5" />,
    accentColor: 'from-violet-500 to-purple-500',
    illustration: <IllusFlashcards />,
  },
  {
    id: 'exams',
    label: 'Exams',
    icon: <FlaskConical className="h-3.5 w-3.5" />,
    accentColor: 'from-rose-500 to-pink-500',
    illustration: <IllusExams />,
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    icon: <Brain className="h-3.5 w-3.5" />,
    accentColor: 'from-amber-500 to-yellow-500',
    illustration: <IllusQuizzes />,
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: <Clock className="h-3.5 w-3.5" />,
    accentColor: 'from-sky-500 to-blue-500',
    illustration: <IllusTools />,
  },
];

// ── Overview Cards (for "All" tab) ───────────────────────────────────────────

interface OverviewCard {
  id: string;
  label: string;
  description: string;
  tabTarget: TabId;
  icon: React.ReactNode;
  accentColor: string;
  badge?: string;
}

const OVERVIEW_CARDS: OverviewCard[] = [
  {
    id: 'courses',
    label: 'Courses',
    description: 'Browse exam boards & enrol in subjects to unlock related resources',
    tabTarget: 'courses',
    icon: <GraduationCap className="h-5 w-5" />,
    accentColor: 'from-emerald-500 to-teal-500',
    badge: 'Start here',
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Curriculum-aligned study notes from verified contributors',
    tabTarget: 'notes',
    icon: <ScrollText className="h-5 w-5" />,
    accentColor: 'from-amber-500 to-orange-500',
  },
  {
    id: 'flashcards',
    label: 'Flashcards',
    description: 'Spaced-repetition decks tagged by exam board & syllabus',
    tabTarget: 'flashcards',
    icon: <Layers className="h-5 w-5" />,
    accentColor: 'from-violet-500 to-purple-500',
  },
  {
    id: 'exams',
    label: 'Exams',
    description: 'Official exam dates & papers — add to your countdown',
    tabTarget: 'exams',
    icon: <FlaskConical className="h-5 w-5" />,
    accentColor: 'from-rose-500 to-pink-500',
  },
  {
    id: 'quizzes',
    label: 'Quizzes',
    description: 'Official interactive quizzes from contributors — test your knowledge',
    tabTarget: 'quizzes',
    icon: <Brain className="h-5 w-5" />,
    accentColor: 'from-amber-500 to-yellow-500',
    badge: 'New',
  },
];

// ── Tool Items ───────────────────────────────────────────────────────────────

interface ToolItem {
  id: string;
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accentColor: string;
  isNew?: boolean;
}

const TOOLS: ToolItem[] = [
  {
    id: 'countdown',
    label: 'Exam Countdown',
    description: 'Track time until your important exams',
    href: '/countdown',
    icon: <Clock className="h-5 w-5" />,
    accentColor: 'from-sky-500 to-blue-500',
  },
  {
    id: 'calculator',
    label: 'Grade Calculator',
    description: 'Predict grades by qualification & components',
    href: '/calculator',
    icon: <Calculator className="h-5 w-5" />,
    accentColor: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'timetable',
    label: 'Timetable',
    description: 'Organize your weekly study schedule',
    href: '/timetable',
    icon: <CalendarDays className="h-5 w-5" />,
    accentColor: 'from-indigo-500 to-violet-500',
  },
  {
    id: 'pomodoro',
    label: 'Pomodoro Timer',
    description: 'Stay focused with timed study sessions',
    href: '/pomodoro',
    icon: <Timer className="h-5 w-5" />,
    accentColor: 'from-rose-500 to-red-500',
  },
];

// ── Overview Card Component ──────────────────────────────────────────────────

function OverviewCardComponent({ card, onClick }: { card: OverviewCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border border-border',
        'bg-background-card hover:bg-background-secondary',
        'transition-all duration-200 text-left cursor-pointer w-full'
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5',
          'bg-gradient-to-br text-white shadow-sm',
          card.accentColor
        )}
      >
        {card.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{card.label}</h3>
          {card.badge && (
            <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
              {card.badge}
            </span>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug line-clamp-1">
          {card.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
    </button>
  );
}

// ── Tool Card Component ──────────────────────────────────────────────────────

function ToolCard({ tool }: { tool: ToolItem }) {
  return (
    <Link
      href={tool.href}
      className={cn(
        'group relative flex items-start gap-3 p-3 rounded-xl border border-border',
        'bg-background-card hover:bg-background-secondary',
        'transition-all duration-200'
      )}
    >
      <div
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0 mt-0.5',
          'bg-gradient-to-br text-white shadow-sm',
          tool.accentColor
        )}
      >
        {tool.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-foreground truncate">{tool.label}</h3>
          {tool.isNew && (
            <span className="text-[9px] font-bold uppercase tracking-wide bg-accent/15 text-accent px-1.5 py-0.5 rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug line-clamp-1">
          {tool.description}
        </p>
      </div>
      <ArrowRight className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-2" />
    </Link>
  );
}

// ── All Tab Content ──────────────────────────────────────────────────────────

function AllTabContent({ onTabChange }: { onTabChange: (tab: TabId) => void }) {
  return (
    <div className="space-y-4">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/10 via-accent/5 to-primary/5 px-5 py-4">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Resources
            </h1>
            <p className="text-xs text-foreground-secondary max-w-md">
              Courses, notes, flashcards, exams, quizzes &amp; study tools — all in one place.
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-primary/15 blur-3xl pointer-events-none" />
      </div>

      {/* Resource overview */}
      <section>
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
          Browse by category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {OVERVIEW_CARDS.map((card) => (
            <OverviewCardComponent
              key={card.id}
              card={card}
              onClick={() => onTabChange(card.tabTarget)}
            />
          ))}
        </div>
      </section>

      {/* Tools */}
      <section>
        <h2 className="text-xs font-semibold text-foreground-muted uppercase tracking-wider mb-2">
          Study tools
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      {/* Quick links */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 rounded-xl bg-background-card border border-border">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
        <span className="text-xs text-foreground-muted">Quick links:</span>
        <button
          onClick={() => onTabChange('courses')}
          className="text-xs font-medium text-primary hover:underline underline-offset-2 cursor-pointer"
        >
          Browse all courses
        </button>
        <span className="text-foreground-muted/40">&middot;</span>
        <Link
          href="/my-notes"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground hover:underline underline-offset-2"
        >
          My Notes
        </Link>
        <span className="text-foreground-muted/40">&middot;</span>
        <Link
          href="/flashcards"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground hover:underline underline-offset-2"
        >
          My Decks
        </Link>
      </div>
    </div>
  );
}

// ── Ambient Background Layer ─────────────────────────────────────────────────
// Purely decorative — pointer-events-none, z-0, never overlaps interactive UI.

function AmbientBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* ── Floating blobs ──────────────────────────────────────────────────── */}

      {/* Emerald — top left */}
      <div
        className="animate-blob absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-[0.12]"
        style={{ background: 'radial-gradient(circle, #4ADE80, #059669)', filter: 'blur(80px)' }}
      />
      {/* Sky — top right */}
      <div
        className="animate-blob-alt absolute -top-16 -right-20 w-72 h-72 rounded-full opacity-[0.11]"
        style={{ background: 'radial-gradient(circle, #38BDF8, #0284C7)', filter: 'blur(90px)', animationDelay: '4s' }}
      />
      {/* Violet — mid left */}
      <div
        className="animate-blob-slow absolute top-1/3 -left-32 w-96 h-64 rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #A78BFA, #7C3AED)', filter: 'blur(100px)', animationDelay: '8s' }}
      />
      {/* Amber — mid right */}
      <div
        className="animate-blob absolute top-1/4 -right-28 w-80 h-80 rounded-full opacity-[0.09]"
        style={{ background: 'radial-gradient(circle, #FDE68A, #F59E0B)', filter: 'blur(90px)', animationDelay: '2s' }}
      />
      {/* Rose — bottom centre */}
      <div
        className="animate-blob-alt absolute bottom-0 left-1/4 w-72 h-64 rounded-full opacity-[0.08]"
        style={{ background: 'radial-gradient(circle, #FCA5A5, #E11D48)', filter: 'blur(80px)', animationDelay: '6s' }}
      />
      {/* Teal — bottom right */}
      <div
        className="animate-blob-slow absolute -bottom-20 -right-16 w-64 h-64 rounded-full opacity-[0.10]"
        style={{ background: 'radial-gradient(circle, #2DD4BF, #0D9488)', filter: 'blur(70px)', animationDelay: '10s' }}
      />

      {/* ── Organic SVG wave divider ─────────────────────────────────────────── */}
      <svg
        className="absolute top-52 left-0 w-full opacity-[0.045]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 C240,110 480,10 720,60 C960,110 1200,10 1440,60 L1440,120 L0,120 Z"
          fill="currentColor"
          className="text-primary"
        />
      </svg>

      {/* Second wave — offset */}
      <svg
        className="absolute top-[420px] left-0 w-full opacity-[0.03]"
        viewBox="0 0 1440 90"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,45 C360,0 720,90 1080,45 C1260,22 1380,60 1440,45 L1440,90 L0,90 Z"
          fill="currentColor"
          className="text-accent"
        />
      </svg>

      {/* ── Micro decorative dot grid ────────────────────────────────────────── */}
      <svg
        className="absolute top-6 right-8 opacity-[0.18] w-28 h-28"
        viewBox="0 0 112 112"
        xmlns="http://www.w3.org/2000/svg"
      >
        {[0, 16, 32, 48, 64, 80, 96].map((x) =>
          [0, 16, 32, 48, 64, 80, 96].map((y) => (
            <circle
              key={`${x}-${y}`}
              cx={x + 8}
              cy={y + 8}
              r="1.5"
              fill="currentColor"
              className="text-foreground-muted"
            />
          ))
        )}
      </svg>

      {/* Confetti sparks — bottom left */}
      <svg
        className="absolute bottom-10 left-6 opacity-[0.20] w-24 h-24"
        viewBox="0 0 96 96"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="3" fill="#4ADE80" />
        <circle cx="40" cy="8"  r="2" fill="#38BDF8" />
        <circle cx="68" cy="20" r="3" fill="#A78BFA" />
        <circle cx="20" cy="44" r="2" fill="#FDE68A" />
        <circle cx="56" cy="36" r="3" fill="#FCA5A5" />
        <circle cx="80" cy="56" r="2" fill="#4ADE80" />
        <circle cx="8"  cy="72" r="3" fill="#38BDF8" />
        <circle cx="44" cy="80" r="2" fill="#A78BFA" />
        <circle cx="76" cy="84" r="3" fill="#FDE68A" />
        <path d="M28 56l4-4M32 56l-4-4" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M60 68l4-4M64 68l-4-4" stroke="#38BDF8" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M84 32l4-4M88 32l-4-4" stroke="#4ADE80" strokeWidth="1.5" strokeLinecap="round" />
      </svg>

      {/* Curved stroke accent — top left */}
      <svg
        className="absolute top-0 left-0 w-64 h-64 opacity-[0.06]"
        viewBox="0 0 256 256"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M-20 80 Q60 -20 180 60 Q280 120 220 220"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M-10 110 Q70 10 190 90 Q290 150 230 250"
          stroke="currentColor"
          className="text-accent"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          opacity="0.5"
        />
      </svg>
    </div>
  );
}

// ── Illustrated Tab Bar ──────────────────────────────────────────────────────

function IllustratedTabBar({
  activeTab,
  onTabChange,
}: {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}) {
  return (
    <div
      className={cn(
        // Mobile: horizontal scroll strip with snap
        'flex gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory',
        // Desktop: centred wrap
        'sm:flex-wrap sm:overflow-visible sm:justify-center sm:gap-4',
        // Breathing room
        'px-1 pb-2 pt-1',
      )}
      role="tablist"
      aria-label="Resource categories"
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'illus-tab-card snap-center focus-ring',
              isActive && 'illus-tab-card--active',
            )}
          >
            <span className="illus-tab-card__illus">
              {tab.illustration}
            </span>
            <span className="illus-tab-card__label">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────

function LibraryPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get('tab') as TabId | null;
  const activeTab: TabId = tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'all';

  const setActiveTab = (tab: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'all') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    router.replace(qs ? `?${qs}` : window.location.pathname, { scroll: false });
  };

  const isAllTab = activeTab === 'all';

  return (
    /* ── Ambient background wrapper ──────────────────────────────────────── */
    <div className="relative animate-fade-in">
      <AmbientBackground />

      {/* ── Foreground content — sits above blobs/waves ───────────────────── */}
      <div className="relative z-10 space-y-5">

        {/* ═══ Illustrated Tab Navigation ══════════════════════════════════ */}
        <IllustratedTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* ═══ Tab Content ═════════════════════════════════════════════════ */}
        {isAllTab && <AllTabContent onTabChange={setActiveTab} />}

        {activeTab === 'courses' && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
            <CoursesLibraryBrowser />
          </Suspense>
        )}

        {activeTab === 'notes' && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
            <NotesLibrary />
          </Suspense>
        )}

        {activeTab === 'flashcards' && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
            <FlashcardsLibraryBrowser />
          </Suspense>
        )}

        {activeTab === 'exams' && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
            <ExamsLibraryBrowser />
          </Suspense>
        )}

        {activeTab === 'quizzes' && (
          <Suspense fallback={<div className="h-64 rounded-2xl bg-background-secondary animate-pulse" />}>
            <QuizLibraryBrowser />
          </Suspense>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-indigo-500/10 px-5 py-4">
              <div className="relative z-10 space-y-0.5">
                <h2 className="text-base font-semibold text-foreground tracking-tight">
                  Study Tools
                </h2>
                <p className="text-xs text-foreground-secondary max-w-md">
                  Productivity tools to boost your study efficiency
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {TOOLS.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Exported Page (wrapped in Suspense for useSearchParams) ───────────────────

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="h-96 rounded-2xl bg-background-secondary animate-pulse" />}>
      <LibraryPageInner />
    </Suspense>
  );
}

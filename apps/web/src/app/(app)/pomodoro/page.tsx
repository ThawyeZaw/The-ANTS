'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Maximize2,
  Flame,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { usePomodoro } from '@/hooks/usePomodoro';
import { useAuth } from '@/hooks/useAuth';
import DigitalClock from '@/components/pomodoro/DigitalClock';
import TimerControls from '@/components/pomodoro/TimerControls';
import SettingsDrawer from '@/components/pomodoro/SettingsDrawer';
import VibePicker from '@/components/pomodoro/VibePicker';
import FocusMode from '@/components/pomodoro/FocusMode';
import ModeTabs from '@/components/pomodoro/ModeTabs';
import VibeStage from '@/components/pomodoro/VibeStage';
import SessionProgress from '@/components/pomodoro/SessionProgress';
import PastPaperPicker from '@/components/pomodoro/PastPaperPicker';
import { getVibe } from '@/constants/pomodoro-vibes';
import { cn } from '@/lib/utils';
import type { TimerPhase } from '@/constants/pomodoro';

const DEFAULT_TITLE = 'The ANTs — Study & Exam Timer';

const PHASE_ACCENT: Record<TimerPhase, string> = {
  focus: '#f59e0b',
  short_break: '#10b981',
  long_break: '#818cf8',
  past_paper: '#06b6d4',
};

function formatTimerTitle(remainingMs: number, phase: TimerPhase, paperLabel?: string): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const timeStr = hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  if (phase === 'past_paper') {
    return `(${timeStr}) ${paperLabel || 'Mock Exam'} | The ANTs`;
  }
  const label = phase === 'focus' ? 'Focus' : 'Break';
  return `(${timeStr}) ${label} | The ANTs`;
}

export default function PomodoroPage() {
  const { user, isAuthenticated } = useAuth();
  const {
    phase,
    remainingMs,
    totalMs,
    isPaused,
    isRunning,
    cyclesCompletedToday,
    sessionLabel,
    settings,
    stats,
    pastPaperConfig,
    activeExamAlert,
    start,
    pause,
    resume,
    reset,
    switchPhase,
    configurePastPaper,
    updateSettings,
    setSessionLabel,
  } = usePomodoro(user?.id);

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPaperPickerOpen, setIsPaperPickerOpen] = useState(false);
  const [showStrictConfirm, setShowStrictConfirm] = useState(false);

  const vibe = getVibe(settings.vibeId);
  const hasCustomWallpaper = Boolean(settings.customWallpaperUrl);
  const onStage = Boolean(vibe) || hasCustomWallpaper;
  const surface = onStage ? 'stage' : 'theme';

  const isExam = phase === 'past_paper';
  const accent = isExam ? '#06b6d4' : (vibe?.accent ?? PHASE_ACCENT[phase]);
  const hasStarted = isRunning || remainingMs < totalMs;

  // Sync browser document title
  useEffect(() => {
    const paperName = `${pastPaperConfig.subjectCode} ${pastPaperConfig.paperNumber}`;
    document.title = isRunning
      ? formatTimerTitle(remainingMs, phase, paperName)
      : DEFAULT_TITLE;
    return () => {
      document.title = DEFAULT_TITLE;
    };
  }, [isRunning, remainingMs, phase, pastPaperConfig]);

  // Handle Strict Exam Mode pause confirmation
  const handlePauseAttempt = useCallback(() => {
    if (isExam && pastPaperConfig?.strictMode && isRunning && !isPaused) {
      setShowStrictConfirm(true);
    } else {
      pause();
    }
  }, [isExam, pastPaperConfig?.strictMode, isRunning, isPaused, pause]);

  // Global Keyboard Shortcuts (Space: Play/Pause, R: Reset, F: Fullscreen focus)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isRunning && !isPaused) {
          handlePauseAttempt();
        } else if (isPaused && hasStarted) {
          resume();
        } else {
          start();
        }
      } else if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        reset();
      } else if (e.code === 'KeyF' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setIsFocusMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, isPaused, hasStarted, start, resume, handlePauseAttempt, reset]);

  const muted = onStage ? 'pomo-read text-white/75' : 'text-foreground-muted';
  const fg = onStage ? 'pomo-read text-white' : 'text-foreground';
  const pausedLabel = onStage ? 'pomo-read text-white/75' : 'text-foreground-muted';

  return (
    <>
      <div
        className={cn(
          'pomo-fit-viewport relative min-h-[calc(100vh-4rem)] flex flex-col justify-between overflow-x-hidden',
          isAuthenticated ? 'pomo-fit-auth' : 'pomo-fit-guest',
        )}
      >
        {/* Dynamic Vibe Stage Backdrop (Photos + Web Audio Particles) */}
        <VibeStage
          vibe={vibe}
          phase={phase}
          isRunning={isRunning && !isPaused}
          customWallpaperUrl={settings.customWallpaperUrl}
        />

        {/* Top Header Navigation */}
        <header className="relative z-10 flex shrink-0 items-center justify-between gap-3 px-4 pt-3 sm:px-6 sm:pt-4 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn('text-[10px] font-bold uppercase tracking-[0.2em]', muted)}>
                The ANTs
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 font-semibold border border-cyan-500/20">
                Study Hub
              </span>
            </div>
            <h1 className={cn('truncate text-base font-extrabold tracking-tight sm:text-xl', fg)}>
              {isExam ? 'Exam Hall Simulator' : 'Study Timer'}
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {stats.currentStreak > 0 && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition-all',
                  onStage
                    ? 'pomo-read bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                    : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30',
                )}
                title={`${stats.currentStreak} day study streak!`}
              >
                <Flame className={cn('h-3.5 w-3.5 shrink-0 fill-current', onStage && 'pomo-icon-read')} />
                {stats.currentStreak}d
              </span>
            )}

            {/* Past Paper Quick Picker Trigger */}
            <button
              type="button"
              onClick={() => setIsPaperPickerOpen(true)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition focus-ring',
                onStage
                  ? 'bg-white/10 text-white hover:bg-white/20'
                  : 'bg-foreground/5 text-foreground hover:bg-foreground/10',
              )}
              title="Select Past Paper"
            >
              <GraduationCap className="h-4 w-4 text-cyan-400" />
              <span className="hidden sm:inline">Paper Catalog</span>
            </button>

            {/* Settings Drawer */}
            <SettingsDrawer
              settings={settings}
              onUpdate={updateSettings}
              stats={stats}
              surface={surface}
            />

            {/* Immersive Focus Mode Button */}
            <button
              type="button"
              onClick={() => setIsFocusMode(true)}
              className={cn(
                'flex h-10 w-10 items-center justify-center rounded-full transition focus-ring',
                onStage
                  ? 'text-white/90 hover:bg-white/10'
                  : 'text-foreground-secondary hover:bg-background-secondary',
              )}
              aria-label="Enter Focus Mode"
              title="Immersive Focus Mode (Press F)"
            >
              <Maximize2 className={cn('h-4 w-4', onStage && 'pomo-icon-read')} />
            </button>
          </div>
        </header>

        {/* Main Timer Body */}
        <main className="pomo-fit-main relative z-10 mx-auto w-full max-w-lg px-4 my-auto py-2">
          {/* Top Meta: Mode Selector & Active Syllabus Pill */}
          <div className="pomo-fit-meta w-full flex flex-col items-center gap-2.5">
            <ModeTabs
              phase={phase}
              settings={settings}
              pastPaperConfig={pastPaperConfig}
              onSwitch={switchPhase}
              onOpenPaperPicker={() => setIsPaperPickerOpen(true)}
              surface={surface}
              className="w-full shrink-0"
            />

            {/* Past Paper Syllabus Tag Pill */}
            {isExam ? (
              <div
                onClick={() => setIsPaperPickerOpen(true)}
                className={cn(
                  'group flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold cursor-pointer transition-all border',
                  onStage
                    ? 'bg-black/40 border-cyan-400/40 text-cyan-200 hover:border-cyan-300'
                    : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-500/15',
                )}
                title="Click to change paper"
              >
                <span className="font-bold uppercase tracking-wider text-[10px]">
                  {pastPaperConfig.board}
                </span>
                <span>•</span>
                <span className="font-mono font-bold">{pastPaperConfig.subjectCode}</span>
                <span>{pastPaperConfig.paperName}</span>
                <SlidersHorizontal className="h-3 w-3 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            ) : (
              <SessionProgress
                completed={cyclesCompletedToday}
                total={settings.cyclesBeforeLongBreak}
                accent={accent}
                surface={surface}
                className="shrink-0 justify-center"
              />
            )}

            {/* Quick Session Goal or Paper Topic */}
            <label className="block w-full max-w-sm shrink-0">
              <span className="sr-only">Session objective</span>
              <input
                type="text"
                value={sessionLabel ?? ''}
                onChange={(e) => setSessionLabel(e.target.value || null)}
                placeholder={isExam ? 'e.g. May/June 2024 Variant 2 Mock' : 'What are you focusing on this block?'}
                maxLength={90}
                className={cn(
                  'w-full border-0 border-b bg-transparent px-2 py-1.5 text-center text-xs sm:text-sm font-medium transition focus:outline-none focus-ring',
                  onStage
                    ? 'pomo-read border-white/30 text-white placeholder:text-white/45 focus:border-white/70'
                    : 'border-border text-foreground placeholder:text-foreground-muted focus:border-primary/50',
                )}
              />
            </label>
          </div>

          {/* Centerpiece Digital Clock */}
          <div className="pomo-fit-clock w-full my-2">
            <DigitalClock
              remainingMs={remainingMs}
              totalMs={totalMs}
              phase={phase}
              isPaused={isPaused}
              isRunning={isRunning}
              accentColor={accent}
              surface={surface}
              showPausedLabel={false}
              activeExamAlert={activeExamAlert}
            />
          </div>

          {/* Bottom Actions: Controls & Vibe Picker */}
          <div className="pomo-fit-bottom w-full flex flex-col items-center">
            <p
              className={cn(
                'min-h-[1.125rem] shrink-0 text-center text-[11px] font-semibold uppercase tracking-[0.18em]',
                pausedLabel,
                !isPaused && 'invisible',
              )}
              aria-hidden={!isPaused}
            >
              {isExam && pastPaperConfig.strictMode ? 'Exam Paused (Strict Mode)' : 'Paused'}
            </p>

            <TimerControls
              isRunning={isRunning}
              isPaused={isPaused}
              hasStarted={hasStarted}
              onStart={start}
              onPause={handlePauseAttempt}
              onResume={resume}
              onReset={reset}
              accentColor={accent}
              surface={surface}
            />

            {/* Vibe Scene Picker with Procedural Web Audio Soundscapes */}
            <div className="mt-3 w-full max-w-sm">
              <VibePicker settings={settings} onUpdate={updateSettings} surface={surface} />
            </div>
          </div>
        </main>

        {/* Footer shortcuts hint */}
        <footer className="relative z-10 shrink-0 pb-3 text-center text-[11px] text-foreground-muted opacity-60 hidden md:block">
          <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-foreground/5 font-mono text-[10px]">Space</kbd> Play/Pause &nbsp;•&nbsp;{' '}
          <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-foreground/5 font-mono text-[10px]">R</kbd> Reset &nbsp;•&nbsp;{' '}
          <kbd className="px-1.5 py-0.5 rounded border border-border/60 bg-foreground/5 font-mono text-[10px]">F</kbd> Focus Mode
        </footer>
      </div>

      {/* Fullscreen Immersive Focus Mode */}
      <FocusMode
        isActive={isFocusMode}
        onToggle={() => setIsFocusMode((v) => !v)}
        settings={settings}
        onUpdateSettings={updateSettings}
        taskLabel={
          isExam
            ? `${pastPaperConfig.board} ${pastPaperConfig.subjectCode} ${pastPaperConfig.paperName}`
            : sessionLabel
        }
        phase={phase}
        isRunning={isRunning && !isPaused}
        isPaused={isPaused}
        controls={
          <TimerControls
            isRunning={isRunning}
            isPaused={isPaused}
            hasStarted={hasStarted}
            onStart={start}
            onPause={handlePauseAttempt}
            onResume={resume}
            onReset={reset}
            accentColor={accent}
            surface="stage"
          />
        }
      >
        <DigitalClock
          remainingMs={remainingMs}
          totalMs={totalMs}
          phase={phase}
          isPaused={isPaused}
          isRunning={isRunning}
          accentColor={accent}
          surface="stage"
          showPausedLabel={false}
          activeExamAlert={activeExamAlert}
        />
      </FocusMode>

      {/* Past Paper Syllabus Selection Modal */}
      <PastPaperPicker
        isOpen={isPaperPickerOpen}
        currentConfig={pastPaperConfig}
        onClose={() => setIsPaperPickerOpen(false)}
        onSelect={(newConfig) => {
          configurePastPaper(newConfig);
          switchPhase('past_paper');
        }}
        surface={surface}
      />

      {/* Strict Exam Mode Confirmation Dialog */}
      {showStrictConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="alertdialog">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowStrictConfirm(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-rose-500/30 bg-card p-6 shadow-2xl text-card-foreground">
            <h3 className="text-base font-extrabold tracking-tight text-rose-500 mb-2">
              Strict Exam Mode in Progress
            </h3>
            <p className="text-xs text-foreground-muted mb-5 leading-relaxed">
              Official Cambridge and Pearson Edexcel exams do not permit pausing the clock. Pausing now will break authentic exam timing simulation.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowStrictConfirm(false)}
                className="rounded-xl px-4 py-2 text-xs font-semibold hover:bg-foreground/10 transition"
              >
                Keep Exam Running
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowStrictConfirm(false);
                  pause();
                }}
                className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs px-4 py-2 transition"
              >
                Pause Anyway
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

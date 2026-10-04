'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Syllabus / Specification Viewer Tab
// Allows viewing the embedded official PDF or downloading it for offline study.
// ──────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ShieldCheck,
  BookOpen,
  Sparkles,
  Maximize2,
  Minimize2,
  AlertCircle,
} from 'lucide-react';

interface SyllabusSpecTabProps {
  subjectName: string;
  subjectCode: string;
  curriculumLabel: string;
  syllabusUrl?: string | null;
  colorCode?: string | null;
  onSwitchToTracker?: () => void;
}

export function SyllabusSpecTab({
  subjectName,
  subjectCode,
  curriculumLabel,
  syllabusUrl,
  colorCode = '#6366f1',
  onSwitchToTracker,
}: SyllabusSpecTabProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const color = colorCode || '#6366f1';

  // Extract a clean filename for download attribute
  const filename = syllabusUrl
    ? syllabusUrl.split('/').pop()?.split('?')[0] || `${subjectCode}-syllabus.pdf`
    : `${subjectCode}-syllabus.pdf`;

  if (!syllabusUrl) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-background-card p-12 text-center space-y-4">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center opacity-80"
          style={{ backgroundColor: `${color}15`, color }}
        >
          <FileText className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">Syllabus PDF Coming Soon</h2>
          <p className="text-sm text-foreground-muted max-w-md mx-auto">
            The official specification document for {subjectName} ({subjectCode}) is currently being prepared for direct in-app reading.
          </p>
        </div>
        {onSwitchToTracker && (
          <button
            onClick={onSwitchToTracker}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-primary border border-primary/30 hover:bg-primary/10 transition-colors"
          >
            <BookOpen className="h-3.5 w-3.5" /> Return to Topic Tracker
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview & Action Toolbar Card */}
      <div className="rounded-2xl border border-border bg-background-card p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full inline-block border"
                style={{
                  backgroundColor: `${color}15`,
                  color,
                  borderColor: `${color}30`,
                }}
              >
                {subjectCode}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" /> Official Specification
              </span>
              <span className="text-[11px] text-foreground-muted">
                {curriculumLabel}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground">
              {subjectName} — Syllabus & Specification
            </h2>
            <p className="text-xs text-foreground-muted max-w-2xl">
              Authentic curriculum syllabus document published by the examination board. Use this reference to verify learning outcomes, assessment weightings, and formula sheets.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            <a
              href={syllabusUrl}
              download={filename}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-2xs transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PDF</span>
            </a>
            <a
              href={syllabusUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-background-secondary/50 hover:border-primary/40 text-foreground transition-colors shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-foreground-muted" />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-border bg-background-secondary/50 hover:border-primary/40 text-foreground transition-colors shadow-2xs"
              title={isFullscreen ? 'Exit Fullscreen' : 'Expand View'}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3.5 w-3.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3.5 w-3.5" />
                  <span>Expand</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="flex items-center justify-between gap-3 text-xs bg-background-secondary/40 border border-border/60 rounded-xl px-3.5 py-2.5 flex-wrap">
          <div className="flex items-center gap-2 text-foreground-muted">
            <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <span>
              All topics in the <strong>Topic Tracker</strong> are synchronized directly with this document.
            </span>
          </div>
          {onSwitchToTracker && (
            <button
              onClick={onSwitchToTracker}
              className="font-medium text-primary hover:underline transition-all text-xs"
            >
              Go to Topic Tracker &rarr;
            </button>
          )}
        </div>
      </div>

      {/* Embedded PDF Viewer */}
      <div
        className={`rounded-2xl border border-border bg-background-card overflow-hidden shadow-xs transition-all ${
          isFullscreen
            ? 'fixed inset-4 z-50 flex flex-col bg-background shadow-2xl p-2'
            : 'relative'
        }`}
      >
        {isFullscreen && (
          <div className="flex items-center justify-between pb-2 px-2 border-b border-border">
            <span className="text-sm font-bold text-foreground">
              {subjectName} ({subjectCode}) — Fullscreen Syllabus Viewer
            </span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1 rounded-lg text-xs font-semibold border border-border hover:bg-background-secondary text-foreground"
            >
              Close Fullscreen
            </button>
          </div>
        )}

        {/* Embedded Iframe */}
        <div className="relative w-full bg-background-secondary/20">
          <iframe
            src={`${syllabusUrl}#view=FitH`}
            className={`w-full border-0 ${
              isFullscreen ? 'h-[calc(100vh-5rem)]' : 'h-[650px] sm:h-[800px]'
            }`}
            title={`${subjectName} Official Specification`}
          />
        </div>

        {/* Fallback / Mobile notice footer */}
        <div className="p-3 bg-background-secondary/30 border-t border-border flex items-center justify-between text-[11px] text-foreground-muted flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-foreground-muted shrink-0" />
            <span>
              If PDF preview doesn't render in your mobile browser, tap <strong>Open in New Tab</strong> or <strong>Download PDF</strong>.
            </span>
          </div>
          <span className="font-mono text-[10px] text-foreground-muted opacity-80">
            {filename}
          </span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Plus,
  Save,
  Trash2,
  Shield,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { cn } from '@/lib/utils';
import {
  adminDeletePaperBoundary,
  adminDeletePastPaper,
  adminDeleteSubjectBoundary,
  adminListCurriculums,
  adminListPapersForSeries,
  adminListRecentAudit,
  adminListSeriesOptions,
  adminListSubjectBoundaries,
  adminListSubjects,
  adminUpsertPaperBoundary,
  adminUpsertPastPaper,
  adminUpsertSubjectBoundary,
} from '@/actions/admin-exam-data';

type Curriculum = { id: string; name: string; code: string };
type Subject = { id: string; name: string; code: string; curriculum_id: string };
type SeriesOpt = { year: number; series: string };
type Boundary = {
  id: string;
  grade: string;
  min_mark: number;
  max_mark: number | null;
  ums_min?: number | null;
  ums_max?: number | null;
};
type PaperRow = {
  id: string;
  exam_board: string;
  qualification: string;
  subject: string;
  syllabus_code: string;
  subject_id: string | null;
  curriculum_id: string | null;
  year: number;
  series: string;
  paper_number: string;
  variant: string | null;
  title: string | null;
  total_marks: number | null;
  duration_minutes: number | null;
  gradeBoundaries?: Boundary[];
};
type SubjectBoundary = {
  id: string;
  subject_id: string;
  year: number;
  series: string;
  variant: string | null;
  tier: string | null;
  grade: string;
  min_mark: number;
  max_mark: number | null;
};
type AuditRow = {
  id: string;
  actor_name: string;
  action: string;
  entity_type: string;
  entity_id: string;
  summary: string | null;
  created_at: Date | number | null;
};

const SERIES_OPTIONS = ['May/June', 'Oct/Nov', 'Jan', 'Feb/March'];

export default function AdminExamDataPage() {
  const { user } = useAuth();
  const { isAdmin, isContributor } = useRole();
  const hasAccess = isAdmin || isContributor;

  const [curriculums, setCurriculums] = useState<Curriculum[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [seriesOpts, setSeriesOpts] = useState<SeriesOpt[]>([]);
  const [papers, setPapers] = useState<PaperRow[]>([]);
  const [subjectBounds, setSubjectBounds] = useState<SubjectBoundary[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [curriculumId, setCurriculumId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [series, setSeries] = useState('May/June');
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);

  const selectedCurriculum = curriculums.find((c) => c.id === curriculumId);
  const selectedSubject = subjects.find((s) => s.id === subjectId);
  const selectedPaper = papers.find((p) => p.id === selectedPaperId) ?? null;

  const [paperForm, setPaperForm] = useState({
    paper_number: '',
    variant: '',
    title: '',
    total_marks: '',
    duration_minutes: '',
  });
  const [boundForm, setBoundForm] = useState({
    grade: 'A',
    min_mark: '',
    max_mark: '',
    ums_min: '',
    ums_max: '',
  });
  const [subjBoundForm, setSubjBoundForm] = useState({
    grade: 'A*',
    min_mark: '',
    max_mark: '',
    tier: '',
    variant: '',
  });

  const examBoard = useMemo(() => {
    const code = selectedCurriculum?.code ?? '';
    if (code.includes('EDEXCEL')) return 'Edexcel';
    return 'CAIE';
  }, [selectedCurriculum]);

  const qualification = useMemo(() => {
    const code = selectedCurriculum?.code ?? '';
    if (code.includes('IAL')) return 'IAL';
    if (code.includes('ALEVEL') || code.includes('AL')) return 'A Level';
    return 'IGCSE';
  }, [selectedCurriculum]);

  const refreshAudit = useCallback(async () => {
    const res = await adminListRecentAudit(20);
    if (res.success) setAudit(res.data as AuditRow[]);
  }, []);

  const loadPapers = useCallback(async () => {
    if (!subjectId || !year || !series) return;
    const [paperRes, boundRes] = await Promise.all([
      adminListPapersForSeries(subjectId, year, series),
      adminListSubjectBoundaries(subjectId, year, series),
    ]);
    if (paperRes.success) setPapers(paperRes.data as PaperRow[]);
    if (boundRes.success) setSubjectBounds(boundRes.data as SubjectBoundary[]);
  }, [subjectId, year, series]);

  useEffect(() => {
    if (!hasAccess) return;
    adminListCurriculums().then((res) => {
      if (res.success) setCurriculums(res.data as Curriculum[]);
    });
    refreshAudit();
  }, [hasAccess, refreshAudit]);

  useEffect(() => {
    if (!curriculumId) {
      setSubjects([]);
      setSubjectId('');
      return;
    }
    adminListSubjects(curriculumId).then((res) => {
      if (res.success) setSubjects(res.data as Subject[]);
    });
  }, [curriculumId]);

  useEffect(() => {
    if (!subjectId) {
      setSeriesOpts([]);
      return;
    }
    adminListSeriesOptions(subjectId).then((res) => {
      if (res.success) setSeriesOpts(res.data);
    });
  }, [subjectId]);

  useEffect(() => {
    loadPapers();
    setSelectedPaperId(null);
  }, [loadPapers]);

  useEffect(() => {
    if (!selectedPaper) {
      setPaperForm({
        paper_number: '',
        variant: '',
        title: '',
        total_marks: '',
        duration_minutes: '',
      });
      return;
    }
    setPaperForm({
      paper_number: selectedPaper.paper_number,
      variant: selectedPaper.variant ?? '',
      title: selectedPaper.title ?? '',
      total_marks: selectedPaper.total_marks != null ? String(selectedPaper.total_marks) : '',
      duration_minutes:
        selectedPaper.duration_minutes != null ? String(selectedPaper.duration_minutes) : '',
    });
  }, [selectedPaper]);

  if (!user) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-xs text-foreground-muted font-mono">
        Loading…
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-center p-6">
        <Shield className="h-10 w-10 text-primary/50" />
        <h1 className="text-lg font-bold">Admin / Contributor only</h1>
        <p className="text-xs text-foreground-muted max-w-sm">
          Past paper and grade-boundary editing is limited to administrators and contributors.
        </p>
        <Link href="/dashboard" className="text-xs font-bold text-primary hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 3500);
  };

  const savePaper = async () => {
    if (!selectedSubject || !selectedCurriculum) return;
    setSaving(true);
    try {
      const res = await adminUpsertPastPaper({
        id: selectedPaperId ?? undefined,
        exam_board: examBoard,
        qualification,
        subject: selectedSubject.name,
        syllabus_code: selectedSubject.code,
        subject_id: selectedSubject.id,
        curriculum_id: selectedCurriculum.id,
        year,
        series,
        paper_number: paperForm.paper_number.trim(),
        variant: paperForm.variant.trim() || null,
        title: paperForm.title.trim() || null,
        total_marks: paperForm.total_marks ? Number(paperForm.total_marks) : null,
        duration_minutes: paperForm.duration_minutes
          ? Number(paperForm.duration_minutes)
          : null,
      });
      if (!res.success) {
        flash(res.error || 'Save failed');
        return;
      }
      flash(selectedPaperId ? 'Paper updated' : 'Paper created');
      setSelectedPaperId(res.id);
      await loadPapers();
      await refreshAudit();
    } finally {
      setSaving(false);
    }
  };

  const deletePaper = async () => {
    if (!selectedPaperId) return;
    if (!confirm('Delete this past paper and its paper-level boundaries?')) return;
    setSaving(true);
    try {
      const res = await adminDeletePastPaper(selectedPaperId);
      if (!res.success) {
        flash(res.error || 'Delete failed');
        return;
      }
      flash('Paper deleted');
      setSelectedPaperId(null);
      await loadPapers();
      await refreshAudit();
    } finally {
      setSaving(false);
    }
  };

  const saveBoundary = async () => {
    if (!selectedPaperId) return;
    setSaving(true);
    try {
      const res = await adminUpsertPaperBoundary({
        past_paper_id: selectedPaperId,
        grade: boundForm.grade.trim(),
        min_mark: Number(boundForm.min_mark),
        max_mark: boundForm.max_mark ? Number(boundForm.max_mark) : null,
        ums_min: boundForm.ums_min ? Number(boundForm.ums_min) : null,
        ums_max: boundForm.ums_max ? Number(boundForm.ums_max) : null,
      });
      if (!res.success) {
        flash(res.error || 'Boundary save failed');
        return;
      }
      flash('Paper boundary saved');
      setBoundForm({ grade: 'A', min_mark: '', max_mark: '', ums_min: '', ums_max: '' });
      await loadPapers();
      await refreshAudit();
    } finally {
      setSaving(false);
    }
  };

  const saveSubjectBoundary = async () => {
    if (!subjectId) return;
    setSaving(true);
    try {
      const res = await adminUpsertSubjectBoundary({
        subject_id: subjectId,
        year,
        series,
        grade: subjBoundForm.grade.trim(),
        min_mark: Number(subjBoundForm.min_mark),
        max_mark: subjBoundForm.max_mark ? Number(subjBoundForm.max_mark) : null,
        tier: subjBoundForm.tier.trim() || null,
        variant: subjBoundForm.variant.trim() || null,
      });
      if (!res.success) {
        flash(res.error || 'Subject boundary save failed');
        return;
      }
      flash('Subject boundary saved');
      setSubjBoundForm({ grade: 'A*', min_mark: '', max_mark: '', tier: '', variant: '' });
      await loadPapers();
      await refreshAudit();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-16 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/contributor"
            className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Contributor
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Exam Data Admin
          </h1>
          <p className="text-xs text-foreground-muted">
            Edit past papers and grade boundaries on live D1 (tracker + calculator).
          </p>
        </div>
        {status && (
          <span className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            {status}
          </span>
        )}
      </div>

      {/* Scope selectors */}
      <div className="rounded-2xl border border-border bg-background-card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-foreground-muted uppercase tracking-wide text-[10px]">
            Curriculum
          </span>
          <select
            value={curriculumId}
            onChange={(e) => {
              setCurriculumId(e.target.value);
              setSubjectId('');
            }}
            className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm"
          >
            <option value="">Select…</option>
            {curriculums.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-foreground-muted uppercase tracking-wide text-[10px]">
            Subject
          </span>
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            disabled={!curriculumId}
            className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm disabled:opacity-50"
          >
            <option value="">Select…</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-foreground-muted uppercase tracking-wide text-[10px]">
            Year
          </span>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm font-mono"
          />
        </label>
        <label className="space-y-1 text-xs">
          <span className="font-semibold text-foreground-muted uppercase tracking-wide text-[10px]">
            Series
          </span>
          <select
            value={series}
            onChange={(e) => setSeries(e.target.value)}
            className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm"
          >
            {SERIES_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {seriesOpts.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {seriesOpts.slice(0, 8).map((o) => (
                <button
                  key={`${o.year}-${o.series}`}
                  type="button"
                  onClick={() => {
                    setYear(o.year);
                    setSeries(o.series);
                  }}
                  className="rounded-md border border-border px-1.5 py-0.5 text-[10px] font-mono hover:bg-background-secondary cursor-pointer"
                >
                  {o.series.slice(0, 3)} {o.year}
                </button>
              ))}
            </div>
          )}
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        {/* Paper list */}
        <div className="rounded-2xl border border-border bg-background-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">Papers in series</h2>
            <button
              type="button"
              onClick={() => {
                setSelectedPaperId(null);
                setPaperForm({
                  paper_number: '',
                  variant: '',
                  title: '',
                  total_marks: '',
                  duration_minutes: '',
                });
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[11px] font-semibold hover:bg-background-secondary cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              New
            </button>
          </div>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {papers.length === 0 ? (
              <p className="text-xs text-foreground-muted py-6 text-center">
                No papers for this subject / series yet.
              </p>
            ) : (
              papers.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPaperId(p.id)}
                  className={cn(
                    'w-full text-left rounded-xl border px-3 py-2 transition-colors cursor-pointer',
                    selectedPaperId === p.id
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border hover:bg-background-secondary'
                  )}
                >
                  <div className="font-mono text-xs font-bold">
                    P{p.paper_number}
                    {p.variant ? `/${p.variant}` : ''}
                    {p.total_marks != null && (
                      <span className="ml-2 font-normal text-foreground-muted">
                        {p.total_marks} marks
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-foreground-muted truncate">
                    {p.title || p.id}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Paper form */}
        <div className="rounded-2xl border border-border bg-background-card p-4 space-y-4">
          <h2 className="text-sm font-bold">
            {selectedPaperId ? 'Edit paper' : 'Create paper'}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                ['paper_number', 'Paper number', '2'],
                ['variant', 'Variant', '2'],
                ['title', 'Title', 'Paper 2 (Extended)'],
                ['total_marks', 'Total marks', '100'],
                ['duration_minutes', 'Duration (min)', '90'],
              ] as const
            ).map(([key, label, ph]) => (
              <label key={key} className="space-y-1 text-xs sm:col-span-1">
                <span className="font-semibold text-foreground-muted">{label}</span>
                <input
                  value={paperForm[key]}
                  onChange={(e) => setPaperForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full rounded-xl border border-border bg-background-secondary px-3 py-2 text-sm"
                />
              </label>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={saving || !subjectId || !paperForm.paper_number}
              onClick={savePaper}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-3.5 w-3.5" />
              Save paper
            </button>
            {selectedPaperId && (
              <button
                type="button"
                disabled={saving}
                onClick={deletePaper}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            )}
          </div>

          {selectedPaper && (
            <div className="border-t border-border pt-4 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wide text-foreground-muted">
                Paper grade boundaries
              </h3>
              <div className="space-y-1">
                {(selectedPaper.gradeBoundaries ?? []).map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-xs"
                  >
                    <span className="font-mono">
                      {b.grade}: ≥{b.min_mark}
                      {b.max_mark != null ? `–${b.max_mark}` : ''}
                      {b.ums_min != null ? ` · UMS ${b.ums_min}` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        await adminDeletePaperBoundary(b.id);
                        await loadPapers();
                        await refreshAudit();
                      }}
                      className="text-red-500 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    ['grade', 'Grade'],
                    ['min_mark', 'Min'],
                    ['max_mark', 'Max'],
                    ['ums_min', 'UMS min'],
                    ['ums_max', 'UMS max'],
                  ] as const
                ).map(([key, label]) => (
                  <label key={key} className="space-y-1 text-[10px]">
                    <span className="text-foreground-muted">{label}</span>
                    <input
                      value={boundForm[key]}
                      onChange={(e) => setBoundForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 font-mono text-xs"
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                disabled={saving || !boundForm.min_mark}
                onClick={saveBoundary}
                className="rounded-xl border border-border px-3 py-1.5 text-[11px] font-semibold hover:bg-background-secondary disabled:opacity-50 cursor-pointer"
              >
                Add boundary
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subject-level composites */}
      <div className="rounded-2xl border border-border bg-background-card p-4 space-y-3">
        <h2 className="text-sm font-bold">Subject / overall grade boundaries</h2>
        <p className="text-[11px] text-foreground-muted">
          Used by the grade calculator for composite / option tables (same subject + year + series).
        </p>
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {subjectBounds.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between rounded-lg border border-border px-2.5 py-1.5 text-xs"
            >
              <span className="font-mono">
                {b.grade}: ≥{b.min_mark}
                {b.tier ? ` · ${b.tier}` : ''}
                {b.variant ? ` · v${b.variant}` : ''}
              </span>
              <button
                type="button"
                onClick={async () => {
                  await adminDeleteSubjectBoundary(b.id);
                  await loadPapers();
                  await refreshAudit();
                }}
                className="text-red-500 hover:underline cursor-pointer"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(
            [
              ['grade', 'Grade'],
              ['min_mark', 'Min'],
              ['max_mark', 'Max'],
              ['tier', 'Tier'],
              ['variant', 'Variant'],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="space-y-1 text-[10px]">
              <span className="text-foreground-muted">{label}</span>
              <input
                value={subjBoundForm[key]}
                onChange={(e) => setSubjBoundForm((f) => ({ ...f, [key]: e.target.value }))}
                className="w-full rounded-lg border border-border bg-background-secondary px-2 py-1.5 font-mono text-xs"
              />
            </label>
          ))}
        </div>
        <button
          type="button"
          disabled={saving || !subjectId || !subjBoundForm.min_mark}
          onClick={saveSubjectBoundary}
          className="rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50 cursor-pointer"
        >
          Add subject boundary
        </button>
      </div>

      {/* Audit */}
      <div className="rounded-2xl border border-border bg-background-card p-4 space-y-2">
        <h2 className="text-sm font-bold">Recent edits</h2>
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {audit.length === 0 ? (
            <p className="text-xs text-foreground-muted">No audit entries yet.</p>
          ) : (
            audit.map((a) => {
              const when =
                a.created_at instanceof Date
                  ? a.created_at
                  : a.created_at
                    ? new Date(a.created_at)
                    : null;
              return (
                <div
                  key={a.id}
                  className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-border/60 px-2.5 py-1.5 text-[11px]"
                >
                  <span>
                    <strong>{a.actor_name}</strong> {a.action}{' '}
                    <span className="font-mono text-foreground-muted">{a.entity_type}</span>
                    {a.summary ? ` — ${a.summary}` : ''}
                  </span>
                  <span className="font-mono text-foreground-muted">
                    {when ? when.toLocaleString() : '—'}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

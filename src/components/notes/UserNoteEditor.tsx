'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — UserNoteEditor
// Split-screen personal note editor: left = block editor, right = live preview.
// Same editing experience as the official NotesEditor (blocks, LaTeX, AI prompts)
// but saves to the private user_notes table. Available to every role.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Save, Sparkles, Eye, Edit3, ArrowLeft, BookOpen,
  CheckCircle, AlertCircle, Tag, X, Trash2, ChevronDown, ChevronUp, AlertTriangle, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { NoteBlock, UserNote } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { createClient } from '@/lib/supabase/client';
import { useLessonContext } from '@/context/LessonContext';
import BlockEditor from './BlockEditor';
import BlockPreview from './BlockPreview';
import AIPromptGenerator from './AIPromptGenerator';

type ViewMode = 'editor' | 'preview' | 'split';

function genId(): string {
  return `blk-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function UserNoteEditor() {
  const { user } = useAuth();
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const existingId = searchParams.get('id');
  const { enrolledCurriculums } = useLessonContext();

  const [noteId, setNoteId] = useState<string | null>(existingId);
  const [title, setTitle] = useState('');
  const [curriculumId, setCurriculumId] = useState<string | null>(null);
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [topicId, setTopicId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [blocks, setBlocks] = useState<NoteBlock[]>([]);
  const [isLoading, setIsLoading] = useState(!!existingId);

  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [showAI, setShowAI] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [tagInput, setTagInput] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Load existing note ──
  useEffect(() => {
    if (!existingId || !user?.id || !supabase) {
      setIsLoading(false);
      return;
    }
    (async () => {
      const { data } = await (supabase as any)
        .from('user_notes')
        .select('*')
        .eq('id', existingId)
        .eq('user_id', user.id)
        .single();
      if (data) {
        const n = data as UserNote;
        setNoteId(n.id);
        setTitle(n.title);
        setCurriculumId(n.curriculum_id);
        setSubjectId(n.subject_id);
        setTopicId(n.topic_id);
        setTags(n.tags ?? []);
        setBlocks((n.blocks ?? []) as NoteBlock[]);
      }
      setIsLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingId, user?.id]);

  // ── Cascading selectors from enrolled curriculums (real Supabase data) ──
  const activeCurriculum = enrolledCurriculums.find((c) => c.id === curriculumId) ?? null;
  const filteredSubjects = activeCurriculum?.subjects ?? [];
  const filteredTopics = filteredSubjects.find((s) => s.id === subjectId)?.topics ?? [];

  // ── Block operations (same behaviour as official editor) ──
  const addBlock = useCallback((type: NoteBlock['type']) => {
    const id = genId();
    let block: NoteBlock;
    switch (type) {
      case 'heading':    block = { type, id, level: 2, text: '' }; break;
      case 'paragraph':  block = { type, id, text: '' }; break;
      case 'latex':      block = { type, id, expression: '', display: true }; break;
      case 'svg':        block = { type, id, markup: '', caption: '' }; break;
      case 'animation':  block = { type, id, template: 'pendulum', caption: '' }; break;
      case 'image':      block = { type, id, url: '', alt: '', caption: '' }; break;
      case 'link':       block = { type, id, url: '', label: '', description: '' }; break;
      case 'code':       block = { type, id, language: 'python', code: '', caption: '' }; break;
      case 'table':      block = { type, id, rows: [['Header 1', 'Header 2'], ['', '']] }; break;
      case 'divider':    block = { type, id }; break;
    }
    setBlocks((prev) => [...prev, block]);
  }, []);

  const updateBlock = useCallback((blockId: string, updates: Partial<NoteBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } as NoteBlock : b)));
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  }, []);

  const duplicateBlock = useCallback((blockId: string) => {
    setBlocks((prev) => {
      const idx = prev.findIndex((b) => b.id === blockId);
      if (idx < 0) return prev;
      const copy = { ...prev[idx], id: genId() } as NoteBlock;
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }, []);

  const handleImportBlocks = useCallback((parsed: NoteBlock[]) => {
    setBlocks((prev) => [...prev, ...parsed]);
  }, []);

  // ── Save ──
  const handleSave = useCallback(async () => {
    if (!user?.id || !supabase) return;
    setSaveStatus('saving');

    const payload = {
      title: title.trim() || 'Untitled Note',
      curriculum_id: curriculumId,
      subject_id: subjectId,
      topic_id: topicId,
      tags,
      blocks,
    };

    if (noteId) {
      const { error } = await (supabase as any)
        .from('user_notes')
        .update(payload)
        .eq('id', noteId)
        .eq('user_id', user.id);
      setSaveStatus(error ? 'error' : 'saved');
    } else {
      const { data, error } = await (supabase as any)
        .from('user_notes')
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();
      if (!error && data) {
        setNoteId(data.id);
        // reflect the id in the URL so refresh keeps editing the same note
        router.replace(`/my-notes/editor?id=${data.id}`);
      }
      setSaveStatus(error ? 'error' : 'saved');
    }
    setTimeout(() => setSaveStatus('idle'), 2500);
  }, [user?.id, supabase, noteId, title, curriculumId, subjectId, topicId, tags, blocks, router]);

  // ── Delete ──
  const handleDelete = useCallback(async () => {
    if (!user?.id || !supabase || !noteId) return;
    await (supabase as any)
      .from('user_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id);
    router.push('/my-notes');
  }, [user?.id, supabase, noteId, router]);

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags((prev) => [...prev, t]);
    setTagInput('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] overflow-hidden">
      {/* ── Top toolbar ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background-card shrink-0">
        <Link href="/my-notes"
          className="flex items-center gap-1.5 text-sm text-foreground-muted hover:text-foreground transition-colors shrink-0">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">My Notes</span>
        </Link>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Note title…"
          className="flex-1 min-w-0 px-3 py-1.5 rounded-xl bg-background-secondary border border-border text-base font-semibold text-foreground placeholder-foreground-muted focus:outline-none focus:border-primary/60 transition-all"
        />

        {/* Personal badge */}
        <span className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--background-secondary)] text-[var(--foreground-muted)] shrink-0" title="Only you can see this note">
          <Lock className="h-3 w-3" /> Personal
        </span>

        {/* View mode toggle */}
        <div className="hidden md:flex items-center border border-border rounded-xl overflow-hidden shrink-0">
          {([
            { mode: 'editor' as ViewMode, icon: <Edit3 className="h-3.5 w-3.5" />, label: 'Edit' },
            { mode: 'split' as ViewMode,  icon: <BookOpen className="h-3.5 w-3.5" />, label: 'Split' },
            { mode: 'preview' as ViewMode, icon: <Eye className="h-3.5 w-3.5" />, label: 'Preview' },
          ] as const).map(({ mode, icon, label }) => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer',
                viewMode === mode ? 'bg-primary text-white' : 'text-foreground-muted hover:text-foreground'
              )}>
              {icon} <span className="hidden lg:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* AI generator */}
        <button
          id="user-note-editor-ai"
          onClick={() => setShowAI(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-medium hover:opacity-90 transition-opacity shrink-0 cursor-pointer"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">AI Generate</span>
        </button>

        {/* Delete */}
        {noteId && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border bg-red-500/10 border-red-500/30 text-red-600 hover:bg-red-500/20"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        )}

        {/* Save */}
        <button
          id="user-note-editor-save"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 cursor-pointer border',
            saveStatus === 'saved'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
              : saveStatus === 'error'
              ? 'bg-red-500/10 border-red-500/30 text-red-600'
              : 'bg-primary border-primary text-white hover:bg-primary-hover'
          )}
        >
          {saveStatus === 'saved' ? <><CheckCircle className="h-3.5 w-3.5" /> Saved</> :
           saveStatus === 'error' ? <><AlertCircle className="h-3.5 w-3.5" /> Error</> :
           saveStatus === 'saving' ? <>Saving…</> :
           <><Save className="h-3.5 w-3.5" /> Save</>}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Left panel: Metadata + Block Editor ── */}
        {(viewMode === 'editor' || viewMode === 'split') && (
          <div className={cn(
            'flex flex-col overflow-hidden border-r border-border',
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}>
            {/* Metadata section */}
            <div className="border-b border-border bg-background-secondary shrink-0">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-background-secondary/80 transition-colors"
                onClick={() => setShowMetadata(!showMetadata)}
              >
                <p className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Note Metadata</p>
                <button className="text-foreground-muted hover:text-foreground">
                  {showMetadata ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
              </div>

              {showMetadata && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Curriculum & Subject (from your enrolled courses) */}
                  <div className="grid grid-cols-2 gap-2">
                    <select value={curriculumId ?? ''}
                      onChange={(e) => { setCurriculumId(e.target.value || null); setSubjectId(null); setTopicId(null); }}
                      className="px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer">
                      <option value="">No Curriculum</option>
                      {enrolledCurriculums.map((c) => (
                        <option key={c.id} value={c.id}>{c.qualification ?? c.title} — {c.exam_board ?? ''}</option>
                      ))}
                    </select>
                    <select value={subjectId ?? ''}
                      onChange={(e) => { setSubjectId(e.target.value || null); setTopicId(null); }}
                      disabled={!curriculumId}
                      className="px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer disabled:opacity-60">
                      <option value="">No Subject</option>
                      {filteredSubjects.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                  </div>

                  {/* Topic */}
                  <select value={topicId ?? ''}
                    onChange={(e) => setTopicId(e.target.value || null)}
                    disabled={!subjectId}
                    className="w-full px-3 py-2 rounded-xl bg-background-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/60 cursor-pointer disabled:opacity-60">
                    <option value="">No Topic / Lesson</option>
                    {filteredTopics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                  </select>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <Tag className="h-3.5 w-3.5 text-foreground-muted shrink-0" />
                    {tags.map((tag) => (
                      <span key={tag} className="flex items-center gap-1 text-xs bg-background-card border border-border text-foreground-muted px-2 py-0.5 rounded-full">
                        #{tag}
                        <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="cursor-pointer hover:text-error transition-colors">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input type="text" value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); handleAddTag(); } }}
                      placeholder="Add tag…"
                      className="text-xs px-2 py-0.5 rounded-full bg-background-card border border-dashed border-border text-foreground focus:outline-none focus:border-primary/60 w-24 transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Block editor */}
            <div className="flex-1 overflow-hidden p-4">
              <BlockEditor
                blocks={blocks}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onMoveBlock={moveBlock}
                onDuplicateBlock={duplicateBlock}
                onAddBlock={addBlock}
              />
            </div>
          </div>
        )}

        {/* ── Right panel: Live preview ── */}
        {(viewMode === 'preview' || viewMode === 'split') && (
          <div className={cn(
            'flex flex-col overflow-hidden',
            viewMode === 'split' ? 'w-1/2' : 'w-full'
          )}>
            <div className="px-4 py-2 border-b border-border bg-background-secondary flex items-center gap-2 shrink-0">
              <Eye className="h-4 w-4 text-foreground-muted" />
              <span className="text-xs font-medium text-foreground-muted uppercase tracking-wider">Preview</span>
              {viewMode === 'split' && (
                <span className="text-xs text-foreground-muted ml-auto opacity-60">Live</span>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {title && (
                <h1 className="text-2xl font-bold text-foreground mb-4">{title}</h1>
              )}
              {blocks.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-16 text-center">
                  <div className="text-5xl">📖</div>
                  <p className="text-foreground-muted text-sm">Your note will appear here as you add blocks.</p>
                </div>
              ) : (
                blocks.map((block) => (
                  <BlockPreview key={block.id} block={block} />
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── AI Prompt Generator modal ── */}
      {showAI && (
        <AIPromptGenerator
          onImportBlocks={handleImportBlocks}
          onClose={() => setShowAI(false)}
        />
      )}

      {/* ── Delete confirmation modal ── */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-background-card border border-border rounded-2xl p-6 shadow-xl animate-fade-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete this note?</h3>
            </div>
            <p className="text-sm text-foreground-muted mb-5">
              &ldquo;{title || 'Untitled Note'}&rdquo; will be permanently deleted. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl border border-border bg-background-secondary text-sm font-medium text-foreground hover:border-border-hover transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-all cursor-pointer"
              >
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

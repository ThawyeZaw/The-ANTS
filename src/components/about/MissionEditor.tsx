'use client';

import { useState, useEffect } from 'react';
import { Save, Edit3, Loader2, Eye, EyeOff } from 'lucide-react';
import { getOrgMissionAction, updateOrgMissionAction } from '@/actions/org';
import type { OrgMission } from '@/types';
import { cn } from '@/lib/utils';
import { renderMarkdown } from '@/lib/markdown';

export default function MissionEditor() {
  const [mission, setMission] = useState<OrgMission | null>(null);
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showMobilePreview, setShowMobilePreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    let active = true;
    getOrgMissionAction().then((res) => {
      if (active && res) {
        setMission(res);
        setContent(res.content);
      }
    });
    return () => { active = false; };
  }, []);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSave = async () => {
    if (!content.trim()) {
      showFeedback('error', 'Mission content cannot be empty.');
      return;
    }
    setIsSaving(true);
    try {
      const r = await updateOrgMissionAction(content);
      if (r.success && r.mission) {
        setMission(r.mission);
        showFeedback('success', 'Mission updated successfully.');
        setIsEditing(false);
        setShowMobilePreview(false);
      } else {
        showFeedback('error', r.error || 'Failed to update mission.');
      }
    } catch {
      showFeedback('error', 'An error occurred while saving mission.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setContent(mission?.content || '');
    setIsEditing(false);
    setShowMobilePreview(false);
    setFeedback(null);
  };

  const renderedHtml = renderMarkdown(content);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Our Mission</h2>
          <p className="text-sm text-foreground-muted mt-1">
            Edit the mission statement displayed on the public About page. Supports Markdown.
          </p>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer"
          >
            <Edit3 className="h-4 w-4" /> Edit Mission
          </button>
        ) : (
          <div className="flex items-center gap-2">
            {/* Mobile preview toggle */}
            <button
              onClick={() => setShowMobilePreview(!showMobilePreview)}
              className={cn(
                'md:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer border',
                showMobilePreview
                  ? 'bg-primary/15 text-primary border-primary/25'
                  : 'bg-background-secondary text-foreground-secondary border-border hover:text-foreground'
              )}
            >
              {showMobilePreview ? (
                <><EyeOff className="h-4 w-4" /> Editor</>
              ) : (
                <><Eye className="h-4 w-4" /> Preview</>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-foreground-secondary hover:text-foreground hover:bg-background-secondary transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {feedback && (
        <div
          className={cn(
            'px-4 py-3 rounded-xl text-sm font-medium animate-fade-in',
            feedback.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              : 'bg-red-500/15 text-red-400 border border-red-500/25'
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Editor / Preview */}
      {isEditing ? (
        <>
          {/* Desktop: side-by-side */}
          <div className="hidden md:grid md:grid-cols-[3fr_2fr] gap-4 min-h-[400px]">
            {/* Left: Editor */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-4 rounded-2xl bg-background-card border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors resize-y font-mono leading-relaxed"
              placeholder="Write your mission statement in Markdown..."
            />
            {/* Right: Live Preview */}
            <div className="rounded-2xl bg-background-card border border-border overflow-hidden">
              <div className="px-4 py-2.5 border-b border-border bg-background-secondary">
                <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Preview</span>
              </div>
              <div
                className="p-5 prose-p:text-foreground-secondary prose-strong:text-foreground prose-headings:text-foreground prose-a:text-primary prose-li:text-foreground-secondary max-h-[calc(100%-40px)] overflow-y-auto text-sm"
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
              />
            </div>
          </div>

          {/* Mobile: stacked with toggle */}
          <div className="md:hidden space-y-4">
            {showMobilePreview ? (
              <div className="rounded-2xl bg-background-card border border-border overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border bg-background-secondary">
                  <span className="text-xs font-semibold text-foreground-muted uppercase tracking-wider">Preview</span>
                </div>
                <div
                  className="p-5 min-h-[300px] prose-p:text-foreground-secondary prose-strong:text-foreground prose-headings:text-foreground prose-a:text-primary prose-li:text-foreground-secondary text-sm"
                  dangerouslySetInnerHTML={{ __html: renderedHtml }}
                />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={16}
                className="w-full px-4 py-4 rounded-2xl bg-background-card border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-primary/50 transition-colors resize-y font-mono leading-relaxed"
                placeholder="Write your mission statement in Markdown..."
              />
            )}
          </div>
        </>
      ) : (
        <div
          className="p-6 bg-background-card border border-border rounded-2xl"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(mission?.content || '') }}
        />
      )}

      {/* Last updated */}
      {mission && (
        <p className="text-xs text-foreground-muted">
          Last updated:{' '}
          {new Date(mission.updatedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}

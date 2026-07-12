'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — ReviewQueue
// Main-contributor interface for reviewing all pending submissions.
// Tabbed view by submission type with approve/reject/edit functionality.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import {
  Shield, CheckCircle, XCircle, Pencil, Eye,
  Clock, BookOpen, FileText, Layers, Database, GraduationCap, Calculator,
  ChevronDown, ChevronRight, Tag, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  getReviewQueue,
  approveReviewItem,
  rejectReviewItem,
  editReviewItemData,
} from '@/lib/mock/database';
import type { ReviewQueueItem, ReviewSubmissionType, ReviewFeedbackCategory, ReviewFeedback } from '@/types';

// ── Tab Config ───────────────────────────────────────────────────────────────

const SUBMISSION_TABS: { key: ReviewSubmissionType | 'all'; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All', icon: <Database className="h-4 w-4" /> },
  { key: 'curriculum', label: 'Curricula', icon: <GraduationCap className="h-4 w-4" /> },
  { key: 'subject', label: 'Subjects', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'topic', label: 'Topics', icon: <Layers className="h-4 w-4" /> },
  { key: 'note', label: 'Notes', icon: <FileText className="h-4 w-4" /> },
  { key: 'resource', label: 'Resources', icon: <Database className="h-4 w-4" /> },
  { key: 'flashcard_deck', label: 'Flashcards', icon: <Layers className="h-4 w-4" /> },
  { key: 'exam', label: 'Exams', icon: <Clock className="h-4 w-4" /> },
  { key: 'calculator', label: 'Grade Calc', icon: <Calculator className="h-4 w-4" /> },
  { key: 'countdown', label: 'Countdowns', icon: <Clock className="h-4 w-4" /> },
];

const FEEDBACK_CATEGORIES: { key: ReviewFeedbackCategory; label: string }[] = [
  { key: 'inaccurate_content', label: 'Inaccurate Content' },
  { key: 'formatting_issues', label: 'Formatting Issues' },
  { key: 'missing_information', label: 'Missing Information' },
  { key: 'grammar_spelling', label: 'Grammar / Spelling' },
  { key: 'duplicate_entry', label: 'Duplicate Entry' },
  { key: 'outdated_syllabus', label: 'Outdated Syllabus' },
  { key: 'other', label: 'Other' },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function ReviewQueue() {
  const { user } = useAuth();
  const { isMainContributor } = useRole();

  const [activeTab, setActiveTab] = useState<ReviewSubmissionType | 'all'>('all');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<string | null>(null);
  const [editJsonText, setEditJsonText] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [feedbackCategories, setFeedbackCategories] = useState<Set<ReviewFeedbackCategory>>(new Set());
  const [feedbackNote, setFeedbackNote] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const [queueItems, setQueueItems] = useState<ReviewQueueItem[]>(() =>
    getReviewQueue({ status: 'pending' })
  );

  const refreshQueue = useCallback(() => {
    setQueueItems(getReviewQueue({ status: 'pending' }));
  }, []);

  const filteredItems = useMemo(() => {
    if (activeTab === 'all') return queueItems;
    return queueItems.filter(item => item.submission_type === activeTab);
  }, [queueItems, activeTab]);

  // ── Approve ───────────────────────────────────────────────────────────────

  const handleApprove = useCallback((itemId: string) => {
    if (!user) return;
    const result = approveReviewItem(itemId, user.id);
    if (result.success) {
      setStatusMessage('Item approved and published.');
      setStatusType('success');
      refreshQueue();
    } else {
      setStatusMessage(result.error ?? 'Failed to approve.');
      setStatusType('error');
    }
    setTimeout(() => setStatusMessage(''), 3000);
  }, [user, refreshQueue]);

  // ── Reject ────────────────────────────────────────────────────────────────

  const openReject = (itemId: string) => {
    setRejectingId(itemId);
    setFeedbackCategories(new Set());
    setFeedbackNote('');
  };

  const handleReject = useCallback(() => {
    if (!user || !rejectingId) return;

    const feedback: ReviewFeedback = {
      categories: [...feedbackCategories],
      note: feedbackNote,
    };

    const result = rejectReviewItem(rejectingId, user.id, feedback);
    if (result.success) {
      setStatusMessage('Item rejected with feedback.');
      setStatusType('success');
      refreshQueue();
    } else {
      setStatusMessage(result.error ?? 'Failed to reject.');
      setStatusType('error');
    }
    setRejectingId(null);
    setFeedbackCategories(new Set());
    setFeedbackNote('');
    setTimeout(() => setStatusMessage(''), 3000);
  }, [user, rejectingId, feedbackCategories, feedbackNote, refreshQueue]);

  // ── Edit data ─────────────────────────────────────────────────────────────

  const openEdit = (item: ReviewQueueItem) => {
    setEditingData(item.id);
    setEditJsonText(JSON.stringify(item.submitted_data, null, 2));
  };

  const handleSaveEdit = useCallback(() => {
    if (!editingData) return;
    try {
      const parsed = JSON.parse(editJsonText);
      const result = editReviewItemData(editingData, parsed);
      if (result.success) {
        setStatusMessage('Data updated.');
        setStatusType('success');
        refreshQueue();
      } else {
        setStatusMessage(result.error ?? 'Failed to update.');
        setStatusType('error');
      }
    } catch {
      setStatusMessage('Invalid JSON.');
      setStatusType('error');
    }
    setEditingData(null);
    setTimeout(() => setStatusMessage(''), 3000);
  }, [editingData, editJsonText, refreshQueue]);

  // ── Get count by type for tabs ────────────────────────────────────────────

  const getCount = (key: ReviewSubmissionType | 'all') => {
    if (key === 'all') return queueItems.length;
    return queueItems.filter(i => i.submission_type === key).length;
  };

  // ── Submission type label ─────────────────────────────────────────────────

  const getTypeLabel = (type: ReviewSubmissionType) => {
    const tab = SUBMISSION_TABS.find(t => t.key === type);
    return tab?.label ?? type;
  };

  // ── Auth guard ────────────────────────────────────────────────────────────

  if (!isMainContributor) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <Shield className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          The Review Queue is available to Main Contributors only.
        </p>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Shield className="h-6 w-6 text-amber-500" />
          Review Queue
        </h2>
        <p className="text-sm text-foreground-muted mt-1">
          Review, edit, approve, or reject submissions from contributors.
        </p>
      </div>

      {/* Status message */}
      {statusMessage && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          statusType === 'success' && 'bg-emerald-500/10 text-emerald-600',
          statusType === 'error' && 'bg-red-500/10 text-red-500',
        )}>
          {statusMessage}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {SUBMISSION_TABS.map(tab => {
          const count = getCount(tab.key);
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border bg-background-card text-foreground-secondary hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
              {count > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-xs font-bold',
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-border text-foreground-muted'
                )}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background-secondary/50 py-16 text-center">
          <CheckCircle className="h-12 w-12 text-emerald-500 mb-3" />
          <h3 className="text-lg font-medium text-foreground">All Clear</h3>
          <p className="text-sm text-foreground-muted mt-1">
            No pending submissions in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => {
            const isExpanded = expandedItem === item.id;
            const isEditing = editingData === item.id;
            const isRejecting = rejectingId === item.id;

            const toggleFeedback = (cat: ReviewFeedbackCategory) => {
              const next = new Set(feedbackCategories);
              if (next.has(cat)) next.delete(cat);
              else next.add(cat);
              setFeedbackCategories(next);
            };

            return (
              <div key={item.id} className="rounded-2xl border border-border bg-background-card overflow-hidden">
                {/* Summary row */}
                <div className="flex items-center justify-between p-5">
                  <button
                    onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <span className={cn(
                      'shrink-0 rounded-lg px-2 py-1 text-xs font-semibold',
                      item.submission_type === 'curriculum' && 'bg-violet-500/10 text-violet-500',
                      item.submission_type === 'subject' && 'bg-blue-500/10 text-blue-500',
                      item.submission_type === 'topic' && 'bg-cyan-500/10 text-cyan-500',
                      item.submission_type === 'note' && 'bg-amber-500/10 text-amber-500',
                      item.submission_type === 'resource' && 'bg-emerald-500/10 text-emerald-500',
                      item.submission_type === 'flashcard_deck' && 'bg-pink-500/10 text-pink-500',
                      item.submission_type === 'exam' && 'bg-red-500/10 text-red-500',
                      item.submission_type === 'calculator' && 'bg-indigo-500/10 text-indigo-500',
                      item.submission_type === 'countdown' && 'bg-orange-500/10 text-orange-500',
                    )}>
                      {getTypeLabel(item.submission_type)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {(item.submitted_data as any)?.title ?? 'Untitled'}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-foreground-muted">
                          {new Date(item.submitted_at).toLocaleDateString()}
                        </span>
                        {item.is_update && (
                          <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-xs font-medium text-amber-600">
                            Update
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  {/* Quick actions */}
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => openReject(item.id)}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-500/20 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => isExpanded ? openEdit(item) : setExpandedItem(item.id)}
                      className="rounded-lg p-1.5 text-foreground-muted hover:text-foreground hover:bg-background-secondary transition-colors"
                      title="View details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {(isExpanded || isEditing || isRejecting) && (
                  <div className="border-t border-border px-5 py-4 space-y-4 bg-background-secondary/30">
                    {/* Submitted data */}
                    <div>
                      <p className="text-xs font-semibold text-foreground-secondary mb-2">Submitted Data</p>

                      {isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editJsonText}
                            onChange={e => setEditJsonText(e.target.value)}
                            rows={10}
                            className="w-full rounded-lg border border-border bg-background-secondary p-3 text-sm text-foreground font-mono focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => setEditingData(null)}
                              className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-background-secondary transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-border bg-background-secondary p-3">
                          <pre className="text-xs text-foreground font-mono whitespace-pre-wrap overflow-x-auto">
                            {JSON.stringify(item.submitted_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Edit button */}
                    {!isEditing && (
                      <button
                        onClick={() => openEdit(item)}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit Data Before Approving
                      </button>
                    )}

                    {/* Reject form */}
                    {isRejecting && (
                      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
                        <p className="text-sm font-semibold text-red-500">Provide Rejection Feedback</p>

                        {/* Category tags */}
                        <div className="flex flex-wrap gap-2">
                          {FEEDBACK_CATEGORIES.map(cat => (
                            <button
                              key={cat.key}
                              onClick={() => toggleFeedback(cat.key)}
                              className={cn(
                                'rounded-full px-2.5 py-1 text-xs font-medium transition-all',
                                feedbackCategories.has(cat.key)
                                  ? 'bg-red-500/20 text-red-600 border border-red-500/30'
                                  : 'border border-border text-foreground-muted hover:border-red-500/30 hover:text-red-500'
                              )}
                            >
                              <Tag className="h-3 w-3 inline mr-1" />
                              {cat.label}
                            </button>
                          ))}
                        </div>

                        {/* Note */}
                        <textarea
                          value={feedbackNote}
                          onChange={e => setFeedbackNote(e.target.value)}
                          rows={3}
                          placeholder="Add detailed feedback for the contributor..."
                          className="w-full rounded-lg border border-border bg-background-secondary p-2.5 text-sm text-foreground focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none"
                        />

                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setRejectingId(null)}
                            className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-background-secondary transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleReject}
                            className="rounded-lg bg-red-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition-colors"
                          >
                            Reject with Feedback
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-4 text-xs text-foreground-muted">
                      <span>ID: {item.entity_id}</span>
                      <span>Contributor: {item.contributor_id}</span>
                      <span>Submitted: {new Date(item.submitted_at).toLocaleString()}</span>
                      {item.published_entity_id && (
                        <span>Published Entity: {item.published_entity_id}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

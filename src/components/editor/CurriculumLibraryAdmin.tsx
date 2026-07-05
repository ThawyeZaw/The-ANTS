'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — CurriculumLibraryAdmin
// Contributor/Main-Contributor interface for managing the curriculum library.
// ──────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, useMemo } from 'react';
import {
  BookOpen, Plus, Pencil, Trash2, Save, Send,
  GraduationCap, ChevronRight, ChevronDown, Shield, AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import {
  getAllCurriculums,
  getPublicSubjects,
  getTopicsBySubject,
  mockSubjects,
  addTopic as dbAddTopic,
  updateTopic as dbUpdateTopic,
  deleteTopic as dbDeleteTopic,
  submitToReviewQueue,
} from '@/lib/mock/database';
import type { ReviewSubmissionType } from '@/types';

// ── Local Types ───────────────────────────────────────────────────────────────

interface EditableCurriculum {
  id: string;
  title: string;
  description: string;
  qualification: string;
  exam_board: string;
  isNew?: boolean;
}

interface EditableSubject {
  id: string;
  curriculum_id: string;
  title: string;
  description: string;
  order_no: number;
  isNew?: boolean;
}

interface EditableTopic {
  id: string;
  subject_id: string;
  curriculum_id: string;
  title: string;
  description: string;
  syllabus_code: string;
  learning_objectives: string;
  order_no: number;
  isNew?: boolean;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function CurriculumLibraryAdmin() {
  const { user } = useAuth();
  const { isMainContributor, isContributor } = useRole();
  const canDirectPublish = isMainContributor;

  const [curriculums, setCurriculums] = useState(() => getAllCurriculums().map(c => ({ ...c, description: c.description || '', qualification: c.qualification || '', exam_board: c.exam_board || '', isNew: false as boolean })));
  const [expandedCurriculum, setExpandedCurriculum] = useState<string | null>(null);
  const [editingCurriculum, setEditingCurriculum] = useState<EditableCurriculum | null>(null);
  const [editingSubject, setEditingSubject] = useState<EditableSubject | null>(null);
  const [editingTopic, setEditingTopic] = useState<EditableTopic | null>(null);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // ── Add new curriculum ────────────────────────────────────────────────────

  const handleAddCurriculum = () => {
    setEditingCurriculum({
      id: `curr-new-${Date.now()}`,
      title: '',
      description: '',
      qualification: '',
      exam_board: '',
      isNew: true,
    });
  };

  // ── Edit existing curriculum ──────────────────────────────────────────────

  const handleEditCurriculum = (id: string) => {
    const curr = curriculums.find(c => c.id === id);
    if (!curr) return;
    setEditingCurriculum({
      id: curr.id,
      title: curr.title,
      description: curr.description || '',
      qualification: curr.qualification || '',
      exam_board: curr.exam_board || '',
    });
  };

  // ── Save curriculum (submit to review or publish directly) ────────────────

  const handleSaveCurriculum = useCallback(async () => {
    if (!editingCurriculum || !user) return;
    setSubmitStatus('submitting');

    if (canDirectPublish) {
      // Main-contributor: publish directly
      const existing = curriculums.find(c => c.id === editingCurriculum.id);
      if (!existing && editingCurriculum.isNew) {
        // Add new directly
        const newCurr = {
          id: editingCurriculum.id,
          title: editingCurriculum.title,
          description: editingCurriculum.description,
          qualification: editingCurriculum.qualification,
          exam_board: editingCurriculum.exam_board,
          created_by: user.id,
          status: 'published' as string,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          isNew: false as boolean,
        };
        setCurriculums(prev => [...prev, newCurr]);
      }
      setStatusMessage('Published directly.');
    } else {
      // Contributor: submit to review queue
      submitToReviewQueue({
        contributor_id: user.id,
        submission_type: editingCurriculum.isNew ? 'curriculum' : 'curriculum',
        entity_id: editingCurriculum.id,
        submitted_data: {
          title: editingCurriculum.title,
          description: editingCurriculum.description,
          qualification: editingCurriculum.qualification,
          exam_board: editingCurriculum.exam_board,
        },
        is_update: !editingCurriculum.isNew,
        published_entity_id: editingCurriculum.isNew ? null : editingCurriculum.id,
      });
      setStatusMessage('Submitted for review.');
    }

    setSubmitStatus('done');
    setEditingCurriculum(null);
    setTimeout(() => setSubmitStatus('idle'), 3000);
  }, [editingCurriculum, user, canDirectPublish, curriculums]);

  // ── Add new subject ──────────────────────────────────────────────────────

  const handleAddSubject = (curriculumId: string) => {
    setEditingSubject({
      id: `subj-new-${Date.now()}`,
      curriculum_id: curriculumId,
      title: '',
      description: '',
      order_no: 1,
      isNew: true,
    });
  };

  // ── Save subject ──────────────────────────────────────────────────────────

  const handleSaveSubject = useCallback(async () => {
    if (!editingSubject || !user) return;
    setSubmitStatus('submitting');

    if (canDirectPublish) {
      // Publish directly
      if (editingSubject.isNew) {
        mockSubjects.push({
          id: editingSubject.id,
          curriculum_id: editingSubject.curriculum_id,
          title: editingSubject.title,
          description: editingSubject.description,
          order_no: editingSubject.order_no,
        });
      } else {
        const existing = mockSubjects.find(s => s.id === editingSubject.id);
        if (existing) {
          existing.title = editingSubject.title;
          existing.description = editingSubject.description;
          existing.order_no = editingSubject.order_no;
        }
      }
      setStatusMessage('Published directly.');
    } else {
      submitToReviewQueue({
        contributor_id: user.id,
        submission_type: 'subject',
        entity_id: editingSubject.id,
        submitted_data: {
          curriculum_id: editingSubject.curriculum_id,
          title: editingSubject.title,
          description: editingSubject.description,
          order_no: editingSubject.order_no,
        },
        is_update: !editingSubject.isNew,
        published_entity_id: editingSubject.isNew ? null : editingSubject.id,
      });
      setStatusMessage('Submitted for review.');
    }

    setSubmitStatus('done');
    setEditingSubject(null);
    setTimeout(() => setSubmitStatus('idle'), 3000);
  }, [editingSubject, user, canDirectPublish]);

  // ── Add new topic ────────────────────────────────────────────────────────

  const handleAddTopic = (subjectId: string, curriculumId: string) => {
    setEditingTopic({
      id: `top-new-${Date.now()}`,
      subject_id: subjectId,
      curriculum_id: curriculumId,
      title: '',
      description: '',
      syllabus_code: '',
      learning_objectives: '',
      order_no: 1,
      isNew: true,
    });
  };

  // ── Edit existing topic ──────────────────────────────────────────────────

  const handleEditTopic = (topicId: string, subjectId: string, curriculumId: string) => {
    const topics = getTopicsBySubject(subjectId);
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return;
    setEditingTopic({
      id: topic.id,
      subject_id: topic.subject_id,
      curriculum_id: curriculumId,
      title: topic.title,
      description: topic.description || '',
      syllabus_code: topic.syllabus_code || '',
      learning_objectives: topic.learning_objectives || '',
      order_no: topic.order_no,
    });
  };

  // ── Save topic ───────────────────────────────────────────────────────────

  const handleSaveTopic = useCallback(async () => {
    if (!editingTopic || !user) return;
    setSubmitStatus('submitting');

    if (canDirectPublish) {
      if (editingTopic.isNew) {
        dbAddTopic({
          subject_id: editingTopic.subject_id,
          title: editingTopic.title,
          description: editingTopic.description,
          syllabus_code: editingTopic.syllabus_code || null,
          learning_objectives: editingTopic.learning_objectives || null,
          order_no: editingTopic.order_no,
        });
      } else {
        dbUpdateTopic(editingTopic.id, {
          title: editingTopic.title,
          description: editingTopic.description,
          syllabus_code: editingTopic.syllabus_code || null,
          learning_objectives: editingTopic.learning_objectives || null,
          order_no: editingTopic.order_no,
        });
      }
      setStatusMessage('Published directly.');
    } else {
      submitToReviewQueue({
        contributor_id: user.id,
        submission_type: 'topic',
        entity_id: editingTopic.id,
        submitted_data: {
          subject_id: editingTopic.subject_id,
          title: editingTopic.title,
          description: editingTopic.description,
          syllabus_code: editingTopic.syllabus_code || null,
          learning_objectives: editingTopic.learning_objectives || null,
          order_no: editingTopic.order_no,
        },
        is_update: !editingTopic.isNew,
        published_entity_id: editingTopic.isNew ? null : editingTopic.id,
      });
      setStatusMessage('Submitted for review.');
    }

    setSubmitStatus('done');
    setEditingTopic(null);
    setTimeout(() => setSubmitStatus('idle'), 3000);
  }, [editingTopic, user, canDirectPublish]);

  // ── Delete topic ─────────────────────────────────────────────────────────

  const handleDeleteTopic = useCallback((topicId: string) => {
    if (!user) return;
    if (canDirectPublish) {
      dbDeleteTopic(topicId);
      setStatusMessage('Topic deleted.');
      setSubmitStatus('done');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } else {
      submitToReviewQueue({
        contributor_id: user.id,
        submission_type: 'topic',
        entity_id: topicId,
        submitted_data: { _action: 'delete' },
        is_update: true,
        published_entity_id: topicId,
      });
      setStatusMessage('Deletion submitted for review.');
      setSubmitStatus('done');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    }
  }, [user, canDirectPublish]);

  // ── Render ────────────────────────────────────────────────────────────────

  if (!isContributor && !isMainContributor) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center px-4 text-center">
        <Shield className="h-12 w-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
        <p className="mt-2 text-sm text-foreground-muted">
          Only contributors and main contributors can manage the curriculum library.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Curriculum Library</h2>
          <p className="text-sm text-foreground-muted mt-1">
            {canDirectPublish
              ? 'You can publish changes directly.'
              : 'Changes will be submitted for review.'}
          </p>
        </div>
        <button
          onClick={handleAddCurriculum}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Curriculum
        </button>
      </div>

      {/* Status message */}
      {submitStatus !== 'idle' && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          submitStatus === 'submitting' && 'bg-primary/10 text-primary',
          submitStatus === 'done' && 'bg-emerald-500/10 text-emerald-600',
          submitStatus === 'error' && 'bg-red-500/10 text-red-500',
        )}>
          {submitStatus === 'submitting' && 'Submitting...'}
          {submitStatus === 'done' && (
            <span className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" /> {statusMessage}
            </span>
          )}
          {submitStatus === 'error' && (
            <span className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" /> {statusMessage}
            </span>
          )}
        </div>
      )}

      {/* Edit curriculum modal */}
      {editingCurriculum && (
        <div className="rounded-2xl border border-primary/30 bg-background-card p-6 space-y-4">
          <h3 className="text-lg font-bold text-foreground">
            {editingCurriculum.isNew ? 'Add New Curriculum' : 'Edit Curriculum'}
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Title</label>
              <input
                type="text"
                value={editingCurriculum.title}
                onChange={e => setEditingCurriculum(prev => prev ? { ...prev, title: e.target.value } : null)}
                className="w-full rounded-lg border border-border bg-background-secondary p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. IGCSE Cambridge (CIE)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Qualification</label>
              <input
                type="text"
                value={editingCurriculum.qualification}
                onChange={e => setEditingCurriculum(prev => prev ? { ...prev, qualification: e.target.value } : null)}
                className="w-full rounded-lg border border-border bg-background-secondary p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. IGCSE, A Level, IELTS"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground-secondary mb-1">Exam Board</label>
              <input
                type="text"
                value={editingCurriculum.exam_board}
                onChange={e => setEditingCurriculum(prev => prev ? { ...prev, exam_board: e.target.value } : null)}
                className="w-full rounded-lg border border-border bg-background-secondary p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="e.g. CAIE, Edexcel, British Council"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-secondary mb-1">Description</label>
            <textarea
              value={editingCurriculum.description}
              onChange={e => setEditingCurriculum(prev => prev ? { ...prev, description: e.target.value } : null)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background-secondary p-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Brief description of this qualification program"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setEditingCurriculum(null)}
              className="rounded-lg px-4 py-2 text-sm font-medium text-foreground-muted hover:bg-background-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveCurriculum}
              disabled={!editingCurriculum.title || submitStatus === 'submitting'}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors',
                canDirectPublish ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary-hover',
                (!editingCurriculum.title || submitStatus === 'submitting') && 'opacity-50 cursor-not-allowed'
              )}
            >
              {canDirectPublish ? (
                <><Save className="h-4 w-4" /> Publish</>
              ) : (
                <><Send className="h-4 w-4" /> Submit for Review</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Curriculum list */}
      <div className="space-y-3">
        {curriculums.map(curriculum => {
          const subjects = getPublicSubjects(curriculum.id);
          const isExpanded = expandedCurriculum === curriculum.id;

          return (
            <div key={curriculum.id} className="rounded-2xl border border-border bg-background-card overflow-hidden">
              <div className="flex items-center justify-between p-5">
                <button
                  onClick={() => setExpandedCurriculum(isExpanded ? null : curriculum.id)}
                  className="flex-1 flex items-center gap-3 text-left"
                >
                  <GraduationCap className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{curriculum.title}</h3>
                    <div className="flex gap-2 mt-0.5">
                      {curriculum.qualification && (
                        <span className="text-xs text-primary">{curriculum.qualification}</span>
                      )}
                      {curriculum.exam_board && (
                        <span className="text-xs text-foreground-muted">{curriculum.exam_board}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className={cn('h-4 w-4 text-foreground-muted ml-auto transition-transform', isExpanded && 'rotate-90')} />
                </button>
                <button
                  onClick={() => handleEditCurriculum(curriculum.id)}
                  className="ml-3 rounded-lg p-2 text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                  title="Edit curriculum"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>

              {/* Expanded: show subjects & topics */}
              {isExpanded && (
                <div className="border-t border-border px-5 py-4 space-y-3 bg-background-secondary/30">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-foreground">Subjects ({subjects.length})</p>
                    <button
                      onClick={() => handleAddSubject(curriculum.id)}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Subject
                    </button>
                  </div>

                  {/* Edit subject form */}
                  {editingSubject && editingSubject.curriculum_id === curriculum.id && (
                    <div className="rounded-xl border border-primary/30 bg-background-card p-4 space-y-3">
                      <h4 className="text-sm font-semibold text-foreground">
                        {editingSubject.isNew ? 'Add New Subject' : 'Edit Subject'}
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-foreground-secondary mb-1">Title</label>
                          <input
                            type="text"
                            value={editingSubject.title}
                            onChange={e => setEditingSubject(prev => prev ? { ...prev, title: e.target.value } : null)}
                            className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                            placeholder="e.g. Physics"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-foreground-secondary mb-1">Order</label>
                          <input
                            type="number"
                            value={editingSubject.order_no}
                            onChange={e => setEditingSubject(prev => prev ? { ...prev, order_no: parseInt(e.target.value) || 1 } : null)}
                            className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-foreground-secondary mb-1">Description</label>
                        <textarea
                          value={editingSubject.description}
                          onChange={e => setEditingSubject(prev => prev ? { ...prev, description: e.target.value } : null)}
                          rows={2}
                          className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                          placeholder="Subject description"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingSubject(null)}
                          className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-background-secondary transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveSubject}
                          disabled={!editingSubject.title || submitStatus === 'submitting'}
                          className={cn(
                            'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors',
                            canDirectPublish ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary-hover',
                            (!editingSubject.title || submitStatus === 'submitting') && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {canDirectPublish ? (
                            <><Save className="h-3.5 w-3.5" /> Publish</>
                          ) : (
                            <><Send className="h-3.5 w-3.5" /> Submit</>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Subject list */}
                  {subjects.map(subject => {
                    const topics = getTopicsBySubject(subject.id);
                    return (
                      <div key={subject.id} className="space-y-2">
                        {/* Subject card */}
                        <div className="rounded-lg border border-border/50 bg-background-card px-3 py-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-foreground">{subject.title}</p>
                              <p className="text-xs text-foreground-muted mt-0.5">
                                {topics.length} topic{topics.length !== 1 ? 's' : ''}
                                {subject.description ? ` — ${subject.description.slice(0, 60)}${subject.description.length > 60 ? '...' : ''}` : ''}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleAddTopic(subject.id, curriculum.id)}
                                className="rounded-lg p-1.5 text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Add topic"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingSubject({
                                  id: subject.id,
                                  curriculum_id: subject.curriculum_id,
                                  title: subject.title,
                                  description: subject.description || '',
                                  order_no: subject.order_no || 1,
                                })}
                                className="rounded-lg p-1.5 text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                title="Edit subject"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Topics list under subject */}
                        {topics.length > 0 && (
                          <div className="ml-4 space-y-1.5">
                            {topics.map(topic => (
                              <div key={topic.id} className="flex items-start justify-between rounded-lg border border-border/30 bg-background-secondary/50 px-3 py-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-medium text-foreground">{topic.title}</p>
                                    {topic.syllabus_code && (
                                      <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-mono">{topic.syllabus_code}</span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-foreground-muted mt-0.5 leading-relaxed">{topic.description}</p>
                                  {topic.learning_objectives && (
                                    <p className="text-[11px] text-foreground-muted/70 mt-1 italic">
                                      Objectives: {topic.learning_objectives}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-0.5 ml-2 shrink-0">
                                  <button
                                    onClick={() => handleEditTopic(topic.id, subject.id, curriculum.id)}
                                    className="rounded p-1 text-foreground-muted hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Edit topic"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTopic(topic.id)}
                                    className="rounded p-1 text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete topic"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Edit topic form */}
                        {editingTopic && editingTopic.subject_id === subject.id && (
                          <div className="ml-4 rounded-xl border border-primary/30 bg-background-card p-4 space-y-3">
                            <h4 className="text-sm font-semibold text-foreground">
                              {editingTopic.isNew ? 'Add New Topic' : 'Edit Topic'}
                            </h4>
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Title</label>
                                <input
                                  type="text"
                                  value={editingTopic.title}
                                  onChange={e => setEditingTopic(prev => prev ? { ...prev, title: e.target.value } : null)}
                                  className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="e.g. Motion, Forces and Energy"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Syllabus Code</label>
                                <input
                                  type="text"
                                  value={editingTopic.syllabus_code}
                                  onChange={e => setEditingTopic(prev => prev ? { ...prev, syllabus_code: e.target.value } : null)}
                                  className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                  placeholder="e.g. 1.1–1.7"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-foreground-secondary mb-1">Order</label>
                                <input
                                  type="number"
                                  value={editingTopic.order_no}
                                  onChange={e => setEditingTopic(prev => prev ? { ...prev, order_no: parseInt(e.target.value) || 1 } : null)}
                                  className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground-secondary mb-1">Description</label>
                              <textarea
                                value={editingTopic.description}
                                onChange={e => setEditingTopic(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={2}
                                className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                placeholder="Topic description"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground-secondary mb-1">Learning Objectives</label>
                              <textarea
                                value={editingTopic.learning_objectives}
                                onChange={e => setEditingTopic(prev => prev ? { ...prev, learning_objectives: e.target.value } : null)}
                                rows={2}
                                className="w-full rounded-lg border border-border bg-background-secondary p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                                placeholder="What students should be able to do after studying this topic"
                              />
                            </div>
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => setEditingTopic(null)}
                                className="rounded-lg px-3 py-1.5 text-xs font-medium text-foreground-muted hover:bg-background-secondary transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveTopic}
                                disabled={!editingTopic.title || submitStatus === 'submitting'}
                                className={cn(
                                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-colors',
                                  canDirectPublish ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-primary hover:bg-primary-hover',
                                  (!editingTopic.title || submitStatus === 'submitting') && 'opacity-50 cursor-not-allowed'
                                )}
                              >
                                {canDirectPublish ? (
                                  <><Save className="h-3.5 w-3.5" /> Publish</>
                                ) : (
                                  <><Send className="h-3.5 w-3.5" /> Submit</>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {subjects.length === 0 && (
                    <p className="text-sm text-foreground-muted py-3 text-center">
                      No subjects yet. Click &quot;Add Subject&quot; to create one.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  AlertCircle,
  Plus,
  Send,
  Eye,
  X,
  Edit3,
  Award,
  Pencil,
  Trash2,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { cn, formatDate } from '@/lib/utils';
import type { Assignment, AssignmentSubmission, ClassroomMember } from '@/types';

const PRIORITY_CONFIG: Record<string, { label: string; variant: 'error' | 'warning' | 'default' }> = {
  high: { label: 'High', variant: 'error' },
  medium: { label: 'Medium', variant: 'warning' },
  low: { label: 'Low', variant: 'default' },
};

function StatusLabel({ status }: { status: string }) {
  switch (status) {
    case 'draft':
      return <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5">Draft</span>;
    case 'published':
      return <span className="text-xs font-medium text-[var(--success)] bg-[var(--success-light)] rounded-full px-2.5 py-0.5">Published</span>;
    case 'closed':
      return <span className="text-xs font-medium text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-full px-2.5 py-0.5">Closed</span>;
    default:
      return null;
  }
}

interface AssignmentsPanelProps {
  classroomId: string;
  assignments: Assignment[];
  members: ClassroomMember[];
  currentUserId: string;
  isTeacher: boolean;
  getProfile: (userId: string) => { id: string; name: string; role: string } | undefined;
  getSubmission: (assignmentId: string, studentId: string) => Promise<AssignmentSubmission | null>;
  onCreate: (data: { title: string; description: string; due_date: string; priority: string; total_points: number | null }) => void;
  onPublish: (assignmentId: string) => void;
  onSubmitToAssignment: (assignmentId: string, content: string) => void;
  onGradeSubmission: (submissionId: string, grade: number, feedback: string) => void;
  onEdit?: (assignmentId: string, data: { title: string; description: string; due_date: string; priority: string; total_points: number | null }) => void;
  onDelete?: (assignmentId: string) => void;
}

export default function AssignmentsPanel({
  classroomId,
  assignments,
  members,
  currentUserId,
  isTeacher,
  getProfile,
  getSubmission,
  onCreate,
  onPublish,
  onSubmitToAssignment,
  onGradeSubmission,
  onEdit,
  onDelete,
}: AssignmentsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [points, setPoints] = useState('');
  const [submissionContent, setSubmissionContent] = useState('');
  const [gradeValue, setGradeValue] = useState('');
  const [gradeFeedback, setGradeFeedback] = useState('');
  const [submissionsMap, setSubmissionsMap] = useState<Record<string, AssignmentSubmission | null>>({});

  useEffect(() => {
    (async () => {
      const map: Record<string, AssignmentSubmission | null> = {};
      await Promise.all(
        assignments.map(async (a) => {
          map[a.id] = await getSubmission(a.id, currentUserId);
        })
      );
      setSubmissionsMap(map);
    })();
  }, [assignments, currentUserId, getSubmission]);

  const classroomAssignments = assignments.filter((a) => a.classroom_id === classroomId);
  const publishedAssignments = classroomAssignments.filter((a) => a.status === 'published');
  const draftAssignments = classroomAssignments.filter((a) => a.status === 'draft');
  const selectedAssignment = selectedId ? assignments.find((a) => a.id === selectedId) : null;
  const selectedSubmission = selectedAssignment ? submissionsMap[selectedAssignment.id] ?? null : null;
  const editingAssignment = editingId ? assignments.find((a) => a.id === editingId) : null;

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dueDate) return;
    const data = { title, description, due_date: new Date(dueDate).toISOString(), priority, total_points: points ? Number(points) : null };
    if (editingId && onEdit) {
      onEdit(editingId, data);
    } else {
      onCreate(data);
    }
    resetForm();
    setShowForm(false);
  };

  const handleEdit = (a: Assignment) => {
    setTitle(a.title);
    setDescription(a.description || '');
    // Format due date for datetime-local input
    const d = new Date(a.due_date);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setDueDate(local);
    setPriority(a.priority);
    setPoints(a.total_points ? String(a.total_points) : '');
    setEditingId(a.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setTitle(''); setDescription(''); setDueDate(''); setPriority('medium'); setPoints(''); setEditingId(null);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Sub-panel: Submission / Grading view */}
      {selectedAssignment && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/50 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-semibold text-[var(--foreground)]">{selectedAssignment.title}</h4>
            <button onClick={() => setSelectedId(null)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]">
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedAssignment.description && (
            <p className="mb-4 text-sm text-[var(--foreground-secondary)] leading-relaxed">{selectedAssignment.description}</p>
          )}

          {isTeacher && selectedSubmission ? (
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--border)] bg-[var(--background-card)] p-3">
                <p className="text-sm text-[var(--foreground-secondary)]">{selectedSubmission.content || 'No content submitted.'}</p>
              </div>
              {selectedSubmission.grade != null && (
                <p className="text-sm text-[var(--success)]">Previously graded: {selectedSubmission.grade}/{selectedAssignment.total_points}</p>
              )}
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Grade</label>
                  <input
                    type="number"
                    value={gradeValue}
                    onChange={(e) => setGradeValue(e.target.value)}
                    placeholder={`/ ${selectedAssignment.total_points || '--'}`}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
              <textarea
                value={gradeFeedback}
                onChange={(e) => setGradeFeedback(e.target.value)}
                placeholder="Feedback (optional)"
                rows={2}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
              <Button
                onClick={() => { onGradeSubmission(selectedSubmission.id, Number(gradeValue) || 0, gradeFeedback); setSelectedId(null); }}
                disabled={!gradeValue}
              >
                Save Grade
              </Button>
            </div>
          ) : !isTeacher ? (
            <div className="space-y-3">
              <textarea
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                placeholder="Write your submission..."
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
              />
              <Button onClick={() => { onSubmitToAssignment(selectedAssignment.id, submissionContent); setSelectedId(null); }}>
                <Send className="mr-1 h-3.5 w-3.5" />
                {selectedSubmission ? 'Resubmit' : 'Submit'}
              </Button>
            </div>
          ) : null}
        </div>
      )}

      {/* Teacher actions */}
      {isTeacher && (
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-[var(--foreground-muted)]">
            {classroomAssignments.length} assignment{classroomAssignments.length !== 1 ? 's' : ''}
          </p>
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => { resetForm(); setShowForm(!showForm); }}>New</Button>
        </div>
      )}

      {/* Create/Edit form */}
      {showForm && (
        <form onSubmit={handleCreateSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/50 p-5 space-y-3">
          <h4 className="text-sm font-semibold text-[var(--foreground)]">{editingId ? 'Edit Assignment' : 'New Assignment'}</h4>
          <input
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Assignment title"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Due Date</label>
              <input
                type="datetime-local"
                value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              />
            </div>
            <div className="w-28">
              <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Priority</label>
              <select
                value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="w-24">
              <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Points</label>
              <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
            <Button type="submit">{editingId ? 'Save Changes' : 'Create Draft'}</Button>
          </div>
        </form>
      )}

      {/* Drafts (teacher only) */}
      {isTeacher && draftAssignments.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">Drafts</p>
          <div className="space-y-2">
            {draftAssignments.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/30 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-[var(--foreground)]">{a.title}</h4>
                    <StatusLabel status={a.status} />
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--foreground-muted)]">
                      <Clock className="h-3 w-3" /> {formatDate(a.due_date)}
                    </span>
                  </div>
                  {a.description && <p className="mt-1 text-sm text-[var(--foreground-secondary)] line-clamp-1">{a.description}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {a.created_by === currentUserId && onEdit && (
                    <button onClick={() => handleEdit(a)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]" title="Edit draft">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {a.created_by === currentUserId && onDelete && (
                    <button onClick={() => onDelete(a.id)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete draft">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <Button variant="secondary" icon={<Send className="h-3.5 w-3.5" />} onClick={() => onPublish(a.id)}>Publish</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published */}
      <div className="space-y-2">
        {publishedAssignments.length === 0 && draftAssignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-12 w-12 text-[var(--foreground-muted)] mb-3" />
            <p className="text-sm text-[var(--foreground-secondary)]">No assignments yet.</p>
            {isTeacher && (
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--background-secondary)]/80 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                <Plus className="h-4 w-4" /> Create Assignment
              </button>
            )}
          </div>
        ) : (
          publishedAssignments.map((a) => {
            const sub = submissionsMap[a.id] ?? null;
            const isDue = new Date(a.due_date) < new Date();
            const isSubmitted = sub?.submitted_at != null;
            const isGraded = sub?.grade != null;
            return (
              <div key={a.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4 transition-colors hover:border-[var(--primary)]/30">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-[var(--foreground)]">{a.title}</h4>
                      <StatusLabel status={a.status} />
                      {a.priority !== 'medium' && (
                        <Badge variant={PRIORITY_CONFIG[a.priority]?.variant || 'default'}>{PRIORITY_CONFIG[a.priority]?.label}</Badge>
                      )}
                    </div>
                    {a.description && <p className="mt-1 text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">{a.description}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" />Due {formatDate(a.due_date)}</span>
                      {isDue && !isSubmitted && <span className="inline-flex items-center gap-1 text-[var(--error)]"><AlertCircle className="h-3 w-3" />Overdue</span>}
                      {a.total_points && <span className="inline-flex items-center gap-1"><Award className="h-3 w-3" />{a.total_points} pts</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {a.created_by === currentUserId && onEdit && (
                      <button onClick={() => handleEdit(a)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]" title="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {a.created_by === currentUserId && onDelete && (
                      <button onClick={() => onDelete(a.id)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {isTeacher ? (
                      <Button variant="secondary" icon={<Eye className="h-4 w-4" />} onClick={() => setSelectedId(a.id)}>View</Button>
                    ) : isSubmitted ? (
                      isGraded ? (
                        <Badge variant="success">{sub?.grade}/{a.total_points}</Badge>
                      ) : (
                        <Badge variant="warning">Submitted</Badge>
                      )
                    ) : (
                      <Button icon={<Edit3 className="h-3.5 w-3.5" />} onClick={() => setSelectedId(a.id)}>Submit</Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

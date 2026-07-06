'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  Settings,
  Users,
  FileText,
  Brain,
  MessageSquare,
  FolderOpen,
  Link as LinkIcon,
  Copy,
  RefreshCw,
  LogOut,
  Plus,
  Search,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useClassroom } from '@/hooks/useClassroom';
import { isClassroomFeatureEnabled } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import type {
  Classroom,
  ClassroomMember,
  ClassroomFeatureKey,
  ResourceType,
} from '@/types';
import AssignmentsPanel from './AssignmentsPanel';
import QuizzesPanel from './QuizzesPanel';
import DiscussionsPanel from './DiscussionsPanel';
import ResourcesPanel from './ResourcesPanel';
import MembersPanel from './MembersPanel';
import LinksPanel from './LinksPanel';

type TabKey = 'assignments' | 'quizzes' | 'resources' | 'discussions' | 'links' | 'members' | 'settings';

const TAB_META: Record<TabKey, { label: string; icon: React.ReactNode; featureKey?: ClassroomFeatureKey }> = {
  assignments: { label: 'Assignments', icon: <FileText className="h-4 w-4" />, featureKey: 'assignments' },
  quizzes: { label: 'Quizzes', icon: <Brain className="h-4 w-4" />, featureKey: 'quizzes' },
  resources: { label: 'Resources', icon: <FolderOpen className="h-4 w-4" />, featureKey: 'resources' },
  discussions: { label: 'Discussions', icon: <MessageSquare className="h-4 w-4" />, featureKey: 'discussions' },
  links: { label: 'Links', icon: <LinkIcon className="h-4 w-4" />, featureKey: 'links' },
  members: { label: 'Members', icon: <Users className="h-4 w-4" /> },
  settings: { label: 'Settings', icon: <Settings className="h-4 w-4" /> },
};

// ── Invite Code Section ─────────────────────────────────────────────────────
function InviteCodeSection({
  code,
  onRegenerate,
  isTeacher,
}: {
  code: string;
  onRegenerate: () => void;
  isTeacher: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-1.5">
        <span className="text-sm font-mono text-[var(--foreground)]">{code}</span>
        <button onClick={handleCopy} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]" title="Copy invite code">
          {copied ? <span className="text-xs text-[var(--success)]">Copied!</span> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
      {isTeacher && (
        <button
          onClick={onRegenerate}
          className="rounded-lg p-1.5 text-[var(--foreground-muted)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)] transition-colors"
          title="Regenerate invite code"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

// ── Settings Panel ──────────────────────────────────────────────────────────
function SettingsPanel({
  classroom,
  isTeacher,
  onToggleFeature,
}: {
  classroom: Classroom;
  isTeacher: boolean;
  onToggleFeature: (key: ClassroomFeatureKey) => void;
}) {
  if (!isTeacher) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <BookOpen className="h-12 w-12 text-[var(--foreground-muted)] mb-3" />
        <p className="text-sm text-[var(--foreground-secondary)]">Only teachers can change classroom settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--foreground-secondary)]">Feature Toggles</h3>
      {classroom.enabled_features?.map((f) => (
        <label
          key={f.key}
          className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 cursor-pointer transition-colors hover:border-[var(--primary)]/30"
        >
          <span className="text-sm font-medium text-[var(--foreground)] capitalize">{f.key}</span>
          <button
            onClick={() => onToggleFeature(f.key)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              f.enabled ? 'bg-[var(--primary)]' : 'bg-[var(--background-secondary)]'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow',
                f.enabled ? 'translate-x-4' : 'translate-x-0.5'
              )}
            />
          </button>
        </label>
      ))}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
interface ClassroomDetailProps {
  classroomId: string;
  currentUserId: string;
  userRole: string;
}

export default function ClassroomDetail({ classroomId, currentUserId, userRole }: ClassroomDetailProps) {
  const router = useRouter();
  const c = useClassroom();
  const [activeTab, setActiveTab] = useState<TabKey>('assignments');
  const [feedback, setFeedback] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Async data states
  const [members, setMembers] = useState<ClassroomMember[]>([]);
  const [member, setMember] = useState<ClassroomMember | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [mem, singleMember, asgn, qz, tp, res] = await Promise.all([
        c.getMembers(classroomId),
        c.getMember(classroomId, currentUserId),
        c.getAssignments(classroomId),
        c.getQuizzes(classroomId),
        c.getTopics(classroomId),
        c.getResources(classroomId),
      ]);
      setMembers(mem);
      setMember(singleMember);
      setAssignments(asgn);
      setQuizzes(qz);
      setTopics(tp);
      setResources(res);
    })();
  }, [classroomId, currentUserId, c]);

  const classroom = c.getClassroom(classroomId);
  const isTeacher = member?.role === 'teacher';
  const isMember = !!member;

  // Derived link data
  const classroomLinks = resources
    .filter((r) => r.type === 'link')
    .map((r) => ({
      id: r.id,
      title: r.title,
      url: r.url,
      shared_by: r.uploaded_by,
      created_at: r.created_at,
    }));

  // ── Search filtering (across all content) ─────────────────────────────────
  const q = searchQuery.toLowerCase().trim();
  const filteredAssignments = q
    ? assignments.filter((a) => a.title.toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q))
    : assignments;
  const filteredQuizzes = q
    ? quizzes.filter((qu) => qu.title.toLowerCase().includes(q) || (qu.description || '').toLowerCase().includes(q))
    : quizzes;
  const filteredTopics = q
    ? topics.filter((t) => t.title.toLowerCase().includes(q) || t.content.toLowerCase().includes(q))
    : topics;
  const filteredResources = q
    ? resources.filter((r) => r.title.toLowerCase().includes(q) || (r.description || '').toLowerCase().includes(q))
    : resources;
  const filteredLinks = q
    ? classroomLinks.filter((l) => l.title.toLowerCase().includes(q))
    : classroomLinks;

  const teacherMembers = members.filter((m) => m.role === 'teacher');
  const teacherNames = teacherMembers.map((m) => c.getProfile(m.user_id)?.name || 'Unknown');

  // Filter tabs based on enabled features
  const visibleTabs = Object.entries(TAB_META).filter(([key, meta]) => {
    if (key === 'settings' && !isTeacher) return false;
    if (!meta.featureKey) return true;
    if (!classroom) return false;
    return isClassroomFeatureEnabled(classroom, meta.featureKey);
  });

  if (!classroom) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <BookOpen className="mx-auto h-12 w-12 text-[var(--foreground-muted)]" />
          <h2 className="mt-4 text-lg font-semibold text-[var(--foreground)]">Classroom Not Found</h2>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">This classroom may have been removed.</p>
          <Button className="mt-6" variant="secondary" onClick={() => router.push('/classrooms')}>
            Back to Classrooms
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Back Link */}
      <Link href="/classrooms" className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" />
        All Classrooms
      </Link>

      {/* Header Card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[var(--primary-light)] p-2.5 text-[var(--primary)] flex-shrink-0">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[var(--foreground)]">{classroom.name}</h1>
                {classroom.description && (
                  <p className="mt-1 text-sm text-[var(--foreground-secondary)] leading-relaxed">{classroom.description}</p>
                )}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {members.length} member{members.length !== 1 ? 's' : ''}
              </span>
              {teacherNames.length > 0 && (
                <span>{teacherNames.join(', ')}</span>
              )}
              <span>Created {formatDate(classroom.created_at)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isMember && (
              <Button
                variant="ghost"
                icon={<LogOut className="h-4 w-4" />}
                className="text-[var(--error)] hover:text-[var(--error)]"
                onClick={async () => {
                  const result = await c.leave(currentUserId, classroomId);
                  if (result.success) {
                    router.push('/classrooms');
                  } else {
                    setFeedback(result.error || 'Failed to leave');
                  }
                }}
              >
                Leave
              </Button>
            )}
          </div>
        </div>

        {/* Invite Code */}
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <InviteCodeSection
            code={classroom.invite_code || ''}
            isTeacher={isTeacher}
            onRegenerate={() => {
              const newCode = classroom.name
                .replace(/[^a-zA-Z0-9]/g, '')
                .toUpperCase()
                .slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
              c.updateClassroomData(classroomId, { invite_code: newCode });
            }}
          />
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div className={cn(
          'rounded-xl px-4 py-3 text-sm font-medium',
          feedback.includes('error') || feedback.includes('Failed')
            ? 'bg-[var(--error-light)] text-[var(--error)] border border-[var(--error)]/20'
            : 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20'
        )}>
          {feedback}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--foreground-muted)] pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search assignments, quizzes, resources, discussions, links..."
          className="w-full rounded-xl border border-[var(--border)] bg-[var(--background-card)] py-2.5 pl-10 pr-10 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-0.5 text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-1.5">
        {visibleTabs.map(([key, meta]) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as TabKey)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all',
              activeTab === key
                ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                : 'text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--background-secondary)]'
            )}
          >
            {meta.icon}
            {meta.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6">
        {activeTab === 'assignments' && (
          <AssignmentsPanel
            classroomId={classroomId}
            assignments={filteredAssignments}
            members={members}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            getProfile={c.getProfile}
            getSubmission={c.getSubmission}
            onCreate={(data) => {
              c.createNewAssignment({
                classroom_id: classroomId,
                title: data.title,
                description: data.description,
                due_date: data.due_date,
                priority: data.priority as any,
                total_points: data.total_points || undefined,
                created_by: currentUserId,
              });
            }}
            onPublish={(id) => c.publishAssignment(id, 'published')}
            onSubmitToAssignment={(assignmentId, content) => {
              c.submitToAssignment(assignmentId, currentUserId, content);
            }}
            onGradeSubmission={(submissionId, grade, feedbackText) => {
              c.gradeSub(submissionId, grade, feedbackText);
            }}
            onEdit={(assignmentId, data) => {
              c.updateAssignmentData(assignmentId, { ...data, priority: data.priority as any });
            }}
            onDelete={c.removeAssignment}
          />
        )}

        {activeTab === 'quizzes' && (
          <QuizzesPanel
            classroomId={classroomId}
            quizzes={filteredQuizzes}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            curriculumIds={classroom.curriculum_ids}
            getQuizAttempt={c.getQuizAttempt}
            onPublish={(quizId) => c.publishQuiz(quizId, 'published')}
            onSubmit={(quizId, answers) => {
              c.submitQuiz(quizId, currentUserId, answers);
            }}
            onCreate={(data) => {
              c.createNewQuiz({
                classroom_id: data.classroom_id,
                title: data.title,
                description: data.description || undefined,
                time_limit_minutes: data.time_limit_minutes || undefined,
                due_date: data.due_date || undefined,
                questions: data.questions,
                created_by: currentUserId,
              });
            }}
            onEdit={(quizId, data) => {
              c.updateQuizData(quizId, data);
            }}
            onDelete={c.removeQuiz}
          />
        )}

        {activeTab === 'resources' && (
          <ResourcesPanel
            classroomId={classroomId}
            resources={filteredResources}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            onAdd={(title, type, url, description) => {
              c.addNewResource({
                classroom_id: classroomId,
                title,
                description,
                type,
                url,
                uploaded_by: currentUserId,
              });
            }}
            onDelete={c.removeResource}
            onEdit={(resourceId, data) => {
              c.editResource(resourceId, data);
            }}
          />
        )}

        {activeTab === 'discussions' && (
          <DiscussionsPanel
            classroomId={classroomId}
            topics={filteredTopics}
            currentUserId={currentUserId}
            getProfile={c.getProfile}
            getReplies={c.getReplies}
            onCreateTopic={(title, content) => {
              c.createTopic({
                classroom_id: classroomId,
                title,
                content,
                created_by: currentUserId,
              });
            }}
            onReply={(topicId, content) => {
              c.replyToTopic(topicId, content, currentUserId);
            }}
            onEditTopic={(topicId, data) => {
              c.editTopic(topicId, data);
            }}
            onDeleteTopic={c.removeTopic}
          />
        )}

        {activeTab === 'links' && (
          <LinksPanel
            classroomId={classroomId}
            links={filteredLinks}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            onAdd={(title, url) => {
              c.addNewResource({
                classroom_id: classroomId,
                title,
                type: 'link',
                url,
                uploaded_by: currentUserId,
              });
            }}
            onDelete={c.removeResource}
            onEdit={(linkId, data) => {
              c.editResource(linkId, data);
            }}
          />
        )}

        {activeTab === 'members' && (
          <MembersPanel
            classroomId={classroomId}
            members={members}
            currentUserId={currentUserId}
            isTeacher={isTeacher}
            getProfile={c.getProfile}
            onRemove={(userId) => {
              c.leave(userId, classroomId);
            }}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsPanel
            classroom={classroom}
            isTeacher={isTeacher}
            onToggleFeature={(key) => {
              const updated = (classroom.enabled_features || []).map((f) =>
                f.key === key ? { ...f, enabled: !f.enabled } : f
              );
              c.updateClassroomData(classroomId, { enabled_features: updated });
            }}
          />
        )}
      </div>
    </div>
  );
}

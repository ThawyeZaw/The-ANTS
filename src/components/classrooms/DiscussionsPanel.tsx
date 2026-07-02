'use client';

import { useState } from 'react';
import { MessageSquare, Plus, Pin, Lock, Send, ArrowLeft, Pencil, Trash2, Check, X } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn, formatRelativeTime, getInitials } from '@/lib/utils';
import type { DiscussionTopic, DiscussionReply } from '@/types';

// ── Topic Card ──────────────────────────────────────────────────────────────
function TopicCard({
  topic, replyCount, authorName, isOwner, onView, onEdit, onDelete,
}: { topic: DiscussionTopic; replyCount: number; authorName: string; isOwner: boolean; onView: (id: string) => void; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4 transition-all hover:border-[var(--primary)]/30 hover:-translate-y-0.5">
      <div className="flex items-start gap-2">
        {topic.is_pinned && <Pin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--warning)]" />}
        {topic.is_locked && <Lock className="mt-0.5 h-4 w-4 flex-shrink-0 text-[var(--foreground-muted)]" />}
        <button onClick={() => onView(topic.id)} className="min-w-0 flex-1 text-left">
          <h4 className="font-medium text-[var(--foreground)]">{topic.title}</h4>
          {topic.content && <p className="mt-1 text-sm text-[var(--foreground-secondary)] line-clamp-2 leading-relaxed">{topic.content}</p>}
          <div className="mt-2 flex items-center gap-2 text-xs text-[var(--foreground-muted)]">
            <span>{authorName}</span>
            <span>·</span>
            <span>{formatRelativeTime(topic.created_at)}</span>
            <span>·</span>
            <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" />{replyCount} repl{replyCount !== 1 ? 'ies' : 'y'}</span>
          </div>
        </button>
        {isOwner && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <button onClick={onEdit} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]" title="Edit topic">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button onClick={onDelete} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete topic">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Topic Detail View ───────────────────────────────────────────────────────
function TopicDetailView({
  topic, replies, getProfile, onReply, onBack, currentUserId, onEdit, onDelete,
}: {
  topic: DiscussionTopic;
  replies: DiscussionReply[];
  getProfile: (userId: string) => { id: string; name: string } | undefined;
  onReply: (content: string) => void;
  onBack: () => void;
  currentUserId: string;
  onEdit?: (topicId: string, data: { title: string; content: string }) => void;
  onDelete?: (topicId: string) => void;
}) {
  const [replyText, setReplyText] = useState('');
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(topic.title);
  const [editContent, setEditContent] = useState(topic.content);
  const handleReply = (e: React.FormEvent) => { e.preventDefault(); if (!replyText.trim()) return; onReply(replyText.trim()); setReplyText(''); };
  const author = getProfile(topic.created_by);
  const isOwner = topic.created_by === currentUserId;

  const handleSaveEdit = () => {
    if (!editTitle.trim()) return;
    onEdit?.(topic.id, { title: editTitle.trim(), content: editContent.trim() });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to topics
      </button>

      {editing ? (
        <div className="rounded-xl border border-[var(--primary)]/30 bg-[var(--primary-light)]/10 p-5 space-y-3">
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-lg font-semibold text-[var(--foreground)] focus:border-[var(--primary)] focus:outline-none"
          />
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-card)] px-3 py-2 text-sm text-[var(--foreground-secondary)] focus:border-[var(--primary)] focus:outline-none"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5 mr-1" />Cancel</Button>
            <Button size="sm" onClick={handleSaveEdit}><Check className="h-3.5 w-3.5 mr-1" />Save</Button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-5">
          <div className="flex items-start gap-2">
            {topic.is_pinned && <Pin className="mt-0.5 h-4 w-4 text-[var(--warning)] flex-shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-lg font-semibold text-[var(--foreground)]">{topic.title}</h3>
                {isOwner && (
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditing(true)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--accent)]" title="Edit topic">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    {onDelete && (
                      <button onClick={() => onDelete(topic.id)} className="rounded-lg p-1.5 text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-secondary)] hover:text-[var(--error)]" title="Delete topic">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--foreground-secondary)] leading-relaxed">{topic.content}</p>
              <p className="mt-3 text-xs text-[var(--foreground-muted)]">Posted by {author?.name || 'Unknown'} · {formatRelativeTime(topic.created_at)}</p>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium text-[var(--foreground-muted)]">{replies.length} repl{replies.length !== 1 ? 'ies' : 'y'}</p>
        <div className="divide-y divide-[var(--border)]">
          {replies.map((r) => {
            const authorName = getProfile(r.created_by)?.name || 'Unknown';
            return (
              <div key={r.id} className="flex gap-3 py-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--primary-light)] text-xs font-medium text-[var(--primary)]">
                  {getInitials(authorName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--foreground)]">{authorName}</span>
                    <span className="text-xs text-[var(--foreground-muted)]">{formatRelativeTime(r.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--foreground-secondary)] leading-relaxed">{r.content}</p>
                </div>
              </div>
            );
          })}
          {replies.length === 0 && <p className="py-6 text-center text-sm text-[var(--foreground-muted)]">No replies yet.</p>}
        </div>
      </div>
      {!topic.is_locked && (
        <form onSubmit={handleReply} className="flex gap-2">
          <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Write a reply..."
            className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none" />
          <Button type="submit" disabled={!replyText.trim()}><Send className="h-4 w-4" /></Button>
        </form>
      )}
    </div>
  );
}

// ── Main Panel ──────────────────────────────────────────────────────────────
interface DiscussionsPanelProps {
  classroomId: string;
  topics: DiscussionTopic[];
  currentUserId: string;
  getProfile: (userId: string) => { id: string; name: string } | undefined;
  getReplies: (topicId: string) => DiscussionReply[];
  onCreateTopic: (title: string, content: string) => void;
  onReply: (topicId: string, content: string) => void;
  onEditTopic?: (topicId: string, data: { title: string; content: string }) => void;
  onDeleteTopic?: (topicId: string) => void;
}

export default function DiscussionsPanel({
  classroomId, topics, currentUserId, getProfile, getReplies, onCreateTopic, onReply, onEditTopic, onDeleteTopic,
}: DiscussionsPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const classroomTopics = topics.filter((t) => t.classroom_id === classroomId);
  const selectedTopic = selectedTopicId ? topics.find((t) => t.id === selectedTopicId) : null;
  const sortedTopics = [...classroomTopics].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const editingTopic = editingTopicId ? topics.find((t) => t.id === editingTopicId) : null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;
    onCreateTopic(newTitle.trim(), newContent.trim());
    setNewTitle(''); setNewContent(''); setShowForm(false);
  };

  const handleEdit = (topic: DiscussionTopic) => {
    setNewTitle(topic.title);
    setNewContent(topic.content);
    setEditingTopicId(topic.id);
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    if (editingTopicId && onEditTopic) {
      e.preventDefault();
      if (!newTitle.trim() || !newContent.trim()) return;
      onEditTopic(editingTopicId, { title: newTitle.trim(), content: newContent.trim() });
      setNewTitle(''); setNewContent(''); setShowForm(false); setEditingTopicId(null);
    } else {
      handleCreate(e);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setNewTitle(''); setNewContent('');
    setEditingTopicId(null);
  };

  if (selectedTopic) {
    return (
      <TopicDetailView
        topic={selectedTopic}
        replies={getReplies(selectedTopic.id)}
        getProfile={getProfile}
        onReply={(c) => onReply(selectedTopic.id, c)}
        onBack={() => setSelectedTopicId(null)}
        currentUserId={currentUserId}
        onEdit={onEditTopic}
        onDelete={onDeleteTopic}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--foreground-muted)]">{classroomTopics.length} topic{classroomTopics.length !== 1 ? 's' : ''}</p>
        <Button icon={<Plus className="h-3.5 w-3.5" />} variant="secondary" onClick={() => { handleFormCancel(); setShowForm(!showForm); }}>New</Button>
      </div>

      {showForm && (
        <form onSubmit={handleFormSubmit} className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)]/30 p-4 space-y-3">
          <input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Topic title"
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none" />
          <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="What would you like to discuss?" rows={3}
            className="w-full rounded-lg border border-[var(--border)] bg-[var(--background-secondary)] px-3 py-2 text-sm text-[var(--foreground)] placeholder:text-[var(--foreground-muted)] focus:border-[var(--primary)] focus:outline-none" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={handleFormCancel}>Cancel</Button>
            <Button type="submit">{editingTopicId ? 'Save' : 'Create Topic'}</Button>
          </div>
        </form>
      )}

      {sortedTopics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-12 w-12 text-[var(--foreground-muted)] mb-3" />
          <p className="text-sm text-[var(--foreground-secondary)]">No discussion topics yet.</p>
          <button onClick={() => setShowForm(true)}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--background-secondary)]/80 px-4 py-2 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors">
            <Plus className="h-4 w-4" /> Start a Discussion
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sortedTopics.map((t) => (
            <TopicCard
              key={t.id}
              topic={t}
              replyCount={getReplies(t.id).length}
              authorName={getProfile(t.created_by)?.name || 'Unknown'}
              isOwner={t.created_by === currentUserId}
              onView={setSelectedTopicId}
              onEdit={() => handleEdit(t)}
              onDelete={onDeleteTopic ? () => onDeleteTopic(t.id) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

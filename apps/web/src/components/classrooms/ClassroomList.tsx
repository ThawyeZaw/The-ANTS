'use client';

import { useState } from 'react';
import { BookOpen, Plus, LogIn } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import ClassroomCard from '@/components/classrooms/ClassroomCard';
import { type Classroom, DEFAULT_CLASSROOM_FEATURES } from '@/types';

interface ClassroomListProps {
  classrooms: Classroom[];
  getMemberCount: (classroomId: string) => number;
  getTeacherNames: (classroomId: string) => string[];
  getCurriculumNames: (classroomId: string) => string[];
  isTeacher: boolean;
  onJoin: (inviteCode: string) => void;
  onCreate: (name: string, description: string) => void;
  feedback: string;
  onClearFeedback: () => void;
}

export default function ClassroomList({
  classrooms,
  getMemberCount,
  getTeacherNames,
  getCurriculumNames,
  isTeacher,
  onJoin,
  onCreate,
  feedback,
  onClearFeedback,
}: ClassroomListProps) {
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    onJoin(inviteCode.trim());
    setInviteCode('');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreate(newName.trim(), newDescription.trim());
    setNewName('');
    setNewDescription('');
    setShowCreate(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--foreground)] flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-[var(--primary)]" />
            Classrooms
          </h1>
          <p className="text-[var(--foreground-secondary)] mt-2">Your virtual classrooms for assignments, quizzes, and discussions.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            icon={<LogIn className="h-4 w-4" />}
            onClick={() => setShowJoin(!showJoin)}
          >
            Join
          </Button>
          {isTeacher && (
            <Button
              icon={<Plus className="h-4 w-4" />}
              onClick={() => setShowCreate(!showCreate)}
            >
              New Classroom
            </Button>
          )}
        </div>
      </div>

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-sm font-medium ${
            feedback.includes('Invalid') || feedback.includes('Failed') || feedback.includes('error')
              ? 'bg-[var(--error-light)] text-[var(--error)] border border-[var(--error)]/20'
              : 'bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20'
          }`}
        >
          {feedback}
          <button onClick={onClearFeedback} className="ml-2 text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
            ×
          </button>
        </div>
      )}

      {/* Join Form */}
      {showJoin && (
        <form onSubmit={handleJoin} className="flex gap-2">
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Enter invite code..."
            className="flex-1"
          />
          <Button type="submit">Join</Button>
        </form>
      )}

      {/* Create Form */}
      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Classroom name"
          />
          <Input
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Description (optional)"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      )}

      {/* Classrooms Grid */}
      {classrooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] bg-[var(--background-secondary)]/70 py-20 text-center backdrop-blur-md">
          <BookOpen className="h-16 w-16 text-[var(--foreground-secondary)] mb-4" />
          <h3 className="text-xl font-medium text-[var(--foreground)] mb-2">No Classrooms Yet</h3>
          <p className="text-[var(--foreground-secondary)] max-w-sm mb-6">
            {isTeacher ? 'Create a classroom or join one with an invite code.' : 'Join a classroom using an invite code from your teacher.'}
          </p>
          {isTeacher ? (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--background-secondary)]/80 px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <Plus className="h-4 w-4" />
              Create Classroom
            </button>
          ) : (
            <button
              onClick={() => setShowJoin(true)}
              className="flex items-center gap-2 rounded-lg bg-[var(--background-secondary)]/80 px-6 py-3 text-sm font-medium text-[var(--foreground)] transition-all hover:bg-[var(--background-secondary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <LogIn className="h-4 w-4" />
              Join Classroom
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              memberCount={getMemberCount(classroom.id)}
              teacherNames={getTeacherNames(classroom.id)}
              curriculumNames={getCurriculumNames(classroom.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

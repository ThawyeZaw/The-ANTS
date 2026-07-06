'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, Circle, Clock, Target, MoreHorizontal } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  target_date?: string | null;
  completed_at?: string | null;
  order_no?: number | null;
}

interface MilestoneTrackerProps {
  milestones: Milestone[];
  isLeader: boolean;
  onAdd: (title: string, description?: string | null, targetDate?: string | null) => Promise<{ success: boolean; error?: string }>;
  onUpdateStatus: (id: string, status: string) => Promise<{ success: boolean; error?: string }>;
  onDelete: (id: string) => Promise<{ success: boolean; error?: string }>;
}

const statusConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  planned: { icon: <Circle className="h-4 w-4" />, label: 'Planned', color: 'text-foreground-muted' },
  in_progress: { icon: <Clock className="h-4 w-4" />, label: 'In Progress', color: 'text-amber-400' },
  completed: { icon: <CheckCircle2 className="h-4 w-4" />, label: 'Completed', color: 'text-green-400' },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function MilestoneTracker({ milestones, isLeader, onAdd, onUpdateStatus, onDelete }: MilestoneTrackerProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [showForm, setShowForm] = useState(false);

  const completed = milestones.filter((m) => m.status === 'completed').length;
  const total = milestones.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  const handleAdd = async () => {
    if (!title.trim()) return;
    const result = await onAdd(title, description || null, targetDate || null);
    if (result.success) {
      setTitle('');
      setDescription('');
      setTargetDate('');
      setShowForm(false);
    }
  };

  const cycleStatus = async (milestone: Milestone) => {
    const order = ['planned', 'in_progress', 'completed'];
    const currentIdx = order.indexOf(milestone.status);
    const nextStatus = order[(currentIdx + 1) % order.length];
    await onUpdateStatus(milestone.id, nextStatus);
  };

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      {total > 0 && (
        <div className="rounded-xl border border-border bg-background-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Club Progress</span>
            <span className="text-foreground-muted">{completed}/{total} completed ({progress}%)</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-background">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestone list */}
      <div className="space-y-2">
        {milestones.map((milestone) => {
          const status = statusConfig[milestone.status] || statusConfig.planned;
          return (
            <div
              key={milestone.id}
              className={`flex items-start gap-3 rounded-lg border p-4 transition-all ${
                milestone.status === 'completed'
                  ? 'border-green-500/20 bg-green-500/5'
                  : 'border-border bg-background-card'
              }`}
            >
              <button
                onClick={() => isLeader && cycleStatus(milestone)}
                className={`mt-0.5 flex-shrink-0 ${isLeader ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}`}
                title={isLeader ? 'Click to cycle status' : status.label}
              >
                <span className={status.color}>{status.icon}</span>
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className={`text-sm font-medium ${milestone.status === 'completed' ? 'text-foreground-muted line-through' : 'text-foreground'}`}>
                    {milestone.title}
                  </h4>
                  {isLeader && (
                    <button
                      onClick={() => { void onDelete(milestone.id); }}
                      className="flex-shrink-0 rounded p-0.5 text-foreground-muted hover:text-error"
                      title="Delete milestone"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {milestone.description && (
                  <p className="mt-1 text-xs text-foreground-muted">{milestone.description}</p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-foreground-muted">
                  <span className={status.color}>{status.label}</span>
                  {milestone.target_date && (
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {formatDate(milestone.target_date)}
                    </span>
                  )}
                  {milestone.completed_at && (
                    <span className="text-green-400">
                      Completed {formatDate(milestone.completed_at)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add milestone form (leaders only) */}
      {isLeader && (
        <>
          {showForm ? (
            <div className="rounded-xl border border-border bg-background-card p-4">
              <div className="grid gap-3">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Milestone title"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Brief description (optional)"
                  className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <Input
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  placeholder="Target date (YYYY-MM-DD, optional)"
                  type="date"
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button onClick={handleAdd} icon={<Plus className="h-4 w-4" />}>Add</Button>
                <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </div>
          ) : (
            <Button
              onClick={() => setShowForm(true)}
              variant="secondary"
              icon={<Plus className="h-4 w-4" />}
              className="w-full"
            >
              Add Milestone
            </Button>
          )}
        </>
      )}

      {milestones.length === 0 && !isLeader && (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <Target className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No milestones yet</p>
          <p className="text-sm text-foreground-muted">Club leaders haven't added any milestones yet.</p>
        </div>
      )}
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  Settings,
  Shield,
  UserCheck,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ClubFeature, ClubJoinMode } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { cn, formatDate, getInitials } from '@/lib/utils';

export default function ManageClubPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const clubStore = useClub();
  const club = clubStore.getClub(params.id);

  // Guard
  if (!club) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Club not found</h1>
        <p className="mt-2 text-foreground-muted">This club may have moved or does not exist.</p>
        <Link href="/clubs" className="mt-6 inline-flex">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>Back to Clubs</Button>
        </Link>
      </div>
    );
  }

  const membership = user ? clubStore.getUserClubMembership(club.id, user.id) : undefined;
  const isMember = membership?.membership_status === 'active';
  const isAdmin = membership?.role === 'admin' && isMember;
  const isModerator = membership?.role === 'moderator' && isMember;
  const isLeader = isAdmin || isModerator;

  if (!user || !isLeader) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <Shield className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Access Denied</h1>
        <p className="mt-2 text-foreground-muted">Only club leaders can manage this club.</p>
        <Link href={`/clubs/${club.id}`} className="mt-6 inline-flex">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>Back to Club</Button>
        </Link>
      </div>
    );
  }

  return (
    <ManageClubForm
      club={club}
      userId={user.id}
      isAdmin={isAdmin}
      onGoBack={() => router.push(`/clubs/${club.id}`)}
    />
  );
}

function ManageClubForm({
  club,
  userId,
  isAdmin,
  onGoBack,
}: {
  club: NonNullable<ReturnType<ReturnType<typeof useClub>['getClub']>>;
  userId: string;
  isAdmin: boolean;
  onGoBack: () => void;
}) {
  const clubStore = useClub();
  const defaultFeatures = (club.enabled_features || []).map(f => ({ ...f }));
  const members = clubStore.getClubMembers(club.id).filter(m => m.membership_status === 'active');

  const [tab, setTab] = useState<'features' | 'details' | 'leaders'>('features');
  const [features, setFeatures] = useState<ClubFeature[]>(defaultFeatures);
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description || '');
  const [joinMode, setJoinMode] = useState<ClubJoinMode>(club.join_mode);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleSaveFeatures = () => {
    const result = clubStore.updateFeatures(club.id, userId, features);
    if (result.success) {
      showFeedback('success', 'Feature settings saved.');
    } else {
      showFeedback('error', result.error || 'Failed to save features.');
    }
  };

  const handleSaveDetails = () => {
    if (!name.trim()) {
      showFeedback('error', 'Club name cannot be empty.');
      return;
    }
    const result = clubStore.updateClubDetails(club.id, userId, {
      name: name.trim(),
      description: description.trim() || null,
      join_mode: joinMode,
    });
    if (result.success) {
      showFeedback('success', 'Club details saved.');
    } else {
      showFeedback('error', result.error || 'Failed to save details.');
    }
  };

  const toggleFeature = (key: string, field: 'enabled' | 'public_visible') => {
    setFeatures(prev => prev.map(f => f.key === key ? { ...f, [field]: !f[field] } : f));
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={onGoBack}
            className="group inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-foreground-secondary hover:text-primary hover:bg-background-secondary transition-all mb-4 w-fit cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Club
          </button>
          <h1 className="text-2xl font-bold text-foreground">Manage Club</h1>
          <p className="mt-1 text-sm text-foreground-muted">{club.name}</p>
        </div>
        <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 border-b border-border pb-1">
        <button
          onClick={() => setTab('features')}
          className={cn(
            'cursor-pointer rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            tab === 'features' ? 'border-primary text-primary' : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
          )}
        >
          Features
        </button>
        <button
          onClick={() => setTab('details')}
          className={cn(
            'cursor-pointer rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            tab === 'details' ? 'border-primary text-primary' : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
          )}
        >
          Club Details
        </button>
        <button
          onClick={() => setTab('leaders')}
          className={cn(
            'cursor-pointer rounded-t-lg px-4 py-2.5 text-sm font-medium transition-colors border-b-2',
            tab === 'leaders' ? 'border-primary text-primary' : 'border-transparent text-foreground-secondary hover:text-foreground hover:border-border'
          )}
        >
          Leaders
        </button>
      </div>

      {/* Toast feedback */}
      {feedback && (
        <div className={cn(
          'rounded-lg px-4 py-3 text-sm',
          feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
        )}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
            {feedback.message}
          </div>
        </div>
      )}

      {/* ── Features Tab ── */}
      {tab === 'features' && (
        <section className="space-y-3">
          <p className="text-sm text-foreground-muted">
            {isAdmin
              ? 'Toggle features on/off and control public visibility for non-members.'
              : 'Toggle public visibility of features for non-members.'}
          </p>
          <div className="rounded-xl border border-border bg-background-card divide-y divide-border overflow-hidden">
            {features.map((feature) => (
              <div key={feature.key} className="flex items-center justify-between px-5 py-4">
                <span className="font-medium text-foreground capitalize">{feature.key.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-5">
                  {isAdmin && (
                    <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground-muted select-none">
                      <input
                        type="checkbox"
                        checked={feature.enabled}
                        onChange={() => toggleFeature(feature.key, 'enabled')}
                        className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                      />
                      Enabled
                    </label>
                  )}
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground-muted select-none">
                    <input
                      type="checkbox"
                      checked={feature.public_visible}
                      onChange={() => toggleFeature(feature.key, 'public_visible')}
                      className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                    />
                    Public
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={handleSaveFeatures}>Save Features</Button>
          </div>
        </section>
      )}

      {/* ── Club Details Tab ── */}
      {tab === 'details' && (
        <section className="space-y-5">
          <div className="rounded-xl border border-border bg-background-card p-5 space-y-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Club Name</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Club name" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Describe your club..."
                className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Join Mode</label>
              <select
                value={joinMode}
                onChange={(e) => setJoinMode(e.target.value as ClubJoinMode)}
                className="w-full rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="open">Open — anyone can join</option>
                <option value="approval_based">Approval — requires admin approval</option>
                <option value="invite_link">Invite — invite code required</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSaveDetails}>Save Details</Button>
          </div>
        </section>
      )}

      {/* ── Leaders Tab (admin only) ── */}
      {tab === 'leaders' && (
        <section className="space-y-3">
          {!isAdmin ? (
            <div className="rounded-xl border border-border bg-background-card p-8 text-center">
              <Shield className="mx-auto h-8 w-8 text-foreground-muted" />
              <p className="mt-3 font-semibold text-foreground">Admin only</p>
              <p className="text-sm text-foreground-muted">Only club admins can manage leaders.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-foreground-muted">
                Promote active members to leaders or demote leaders back to members.
              </p>
              <div className="rounded-xl border border-border bg-background-card divide-y divide-border overflow-hidden">
                {members.map((member) => {
                  const profile = clubStore.getProfile(member.user_id);
                  const isSelf = member.user_id === userId;
                  const isLeaderRole = member.role === 'admin' || member.role === 'moderator';

                  const handlePromote = (role: 'admin' | 'moderator') => {
                    const result = clubStore.promoteMember(club.id, userId, member.user_id, role);
                    if (result.success) {
                      showFeedback('success', `${profile?.name || 'User'} promoted to ${role}.`);
                    } else {
                      showFeedback('error', result.error || 'Failed to promote.');
                    }
                  };

                  const handleDemote = () => {
                    const result = clubStore.demoteLeader(club.id, userId, member.user_id);
                    if (result.success) {
                      showFeedback('success', `${profile?.name || 'User'} demoted to member.`);
                    } else {
                      showFeedback('error', result.error || 'Failed to demote.');
                    }
                  };

                  return (
                    <div key={member.id} className="flex items-center justify-between px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {getInitials(profile?.name || 'User')}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {profile?.name || 'Unknown user'}
                            {isSelf && <span className="text-foreground-muted"> (you)</span>}
                          </p>
                          <p className="text-xs text-foreground-muted capitalize">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {isLeaderRole && !isSelf && (
                          <Button size="sm" variant="outline" onClick={handleDemote}>
                            Demote
                          </Button>
                        )}
                        {member.role === 'member' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handlePromote('moderator')}>
                              Make Moderator
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handlePromote('admin')}>
                              Make Admin
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}

      {/* Feedback area for actions */}
      {feedback && (
        <div className="flex justify-center pt-4">
          <Badge variant={feedback.type === 'success' ? 'success' : 'default'}>
            {feedback.message}
          </Badge>
        </div>
      )}
    </div>
  );
}

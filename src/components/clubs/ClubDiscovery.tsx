'use client';

import BackButton from '@/components/ui/BackButton';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Check,
  KeyRound,
  Lock,
  MessageSquare,
  Plus,
  Search,
  Users,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { useRole } from '@/hooks/useRole';
import type { Club } from '@/types';
import { ClubJoinMode } from '@/types';
import EmptyState from '@/components/ui/EmptyState';
import { cn, formatDate } from '@/lib/utils';

const joinModeLabels: Record<ClubJoinMode, string> = {
  open: 'Open',
  invite_link: 'Invite',
  approval_based: 'Approval',
};

export default function ClubDiscovery() {
  const { user } = useAuth();
  const { isContributor, isMainContributor } = useRole();
  const clubStore = useClub();
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | ClubJoinMode>('all');
  const [inviteCodes, setInviteCodes] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [clubMembersMap, setClubMembersMap] = useState<Record<string, any[]>>({});
  const [clubCurriculumLinksMap, setClubCurriculumLinksMap] = useState<Record<string, any[]>>({});
  const [clubSubjectLinksMap, setClubSubjectLinksMap] = useState<Record<string, any[]>>({});
  const [userMembershipMap, setUserMembershipMap] = useState<Record<string, any>>({});
  const [userJoinRequestMap, setUserJoinRequestMap] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const clubs = clubStore.clubs;
      if (clubs.length === 0) return;

      const membersResults = await Promise.all(clubs.map((c: any) => clubStore.getClubMembers(c.id)));
      const membersMap: Record<string, any[]> = {};
      clubs.forEach((c: any, i: number) => { membersMap[c.id] = membersResults[i]; });
      setClubMembersMap(membersMap);

      const currLinksResults = await Promise.all(clubs.map((c: any) => clubStore.getClubCurriculumLinks(c.id)));
      const currLinksMap: Record<string, any[]> = {};
      clubs.forEach((c: any, i: number) => { currLinksMap[c.id] = currLinksResults[i]; });
      setClubCurriculumLinksMap(currLinksMap);

      const subLinksResults = await Promise.all(clubs.map((c: any) => clubStore.getClubSubjectLinks(c.id)));
      const subLinksMap: Record<string, any[]> = {};
      clubs.forEach((c: any, i: number) => { subLinksMap[c.id] = subLinksResults[i]; });
      setClubSubjectLinksMap(subLinksMap);

      if (user) {
        const memberships = await Promise.all(clubs.map((c: any) => clubStore.getUserClubMembership(c.id, user.id)));
        const memMap: Record<string, any> = {};
        clubs.forEach((c: any, i: number) => { memMap[c.id] = memberships[i]; });
        setUserMembershipMap(memMap);

        const joinReqs = await Promise.all(clubs.map((c: any) => clubStore.getUserClubJoinRequest(c.id, user.id)));
        const reqMap: Record<string, any> = {};
        clubs.forEach((c: any, i: number) => { reqMap[c.id] = joinReqs[i]; });
        setUserJoinRequestMap(reqMap);
      }
    })();
  }, [clubStore.clubs, user?.id, clubStore]);

  const visibleClubs = useMemo(() => {
    const lowered = query.toLowerCase().trim();
    return clubStore.clubs.filter((club) => {
      const matchesMode = modeFilter === 'all' || club.join_mode === modeFilter;
      const matchesQuery = !lowered
        || club.name.toLowerCase().includes(lowered)
        || club.description?.toLowerCase().includes(lowered);
      return matchesMode && matchesQuery;
    });
  }, [clubStore.clubs, modeFilter, query]);

  const handleJoin = async (clubId: string) => {
    if (!user) return;
    const result = await clubStore.joinClub(clubId, user.id, inviteCodes[clubId]);
    setFeedback((current) => ({
      ...current,
      [clubId]: result.success ? 'Updated your club membership.' : result.error || 'Could not join club.',
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/dashboard" label="Back" />
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Community</p>
          <h1 className="text-3xl font-bold text-foreground mt-1">Clubs</h1>
          <p className="text-foreground-muted mt-2 max-w-2xl">
            Discover community spaces for CCA projects, subjects, and focused study groups.
          </p>
        </div>
        {(isContributor || isMainContributor) && (
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setIsCreateOpen(true)}>
            Create Club
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search clubs"
          icon={<Search className="h-4 w-4" />}
        />
        <div className="grid grid-cols-2 gap-2 md:flex">
          {(['all', 'open', 'invite_link', 'approval_based'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setModeFilter(mode)}
              className={cn(
                'rounded-xl border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer',
                modeFilter === mode
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-background-card text-foreground-secondary hover:border-border-hover hover:text-foreground'
              )}
            >
              {mode === 'all' ? 'All' : joinModeLabels[mode]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {visibleClubs.map((club) => {
          const member = userMembershipMap[club.id];
          const request = userJoinRequestMap[club.id];
          const members = (clubMembersMap[club.id] || []).filter((item: any) => item.membership_status === 'active');
          const leader = clubStore.profiles.find((p: any) => p.id === club.created_by);
          const curriculumNames = (clubCurriculumLinksMap[club.id] || [])
            .map((link: any) => (clubStore.curriculums.find((c: any) => c.id === link.curriculum_id) as any)?.title)
            .filter(Boolean);
          const subjectNames = (clubSubjectLinksMap[club.id] || [])
            .map((link: any) => clubStore.subjects.find((subject: any) => subject.id === link.subject_id)?.title)
            .filter(Boolean);
          const isMember = member?.membership_status === 'active';

          return (
            <article
              key={club.id}
              className="flex min-h-80 flex-col rounded-xl border border-border bg-background-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-border-hover hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <Badge variant={club.join_mode === 'approval_based' ? 'warning' : 'default'}>
                  {joinModeLabels[club.join_mode as ClubJoinMode]}
                </Badge>
              </div>

              <div className="mt-4 flex-1">
                <h2 className="text-lg font-bold text-foreground">{club.name}</h2>
                <p className="mt-2 line-clamp-3 text-sm text-foreground-muted">
                  {club.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {curriculumNames.map((name: string) => (
                    <Badge key={name}>{name}</Badge>
                  ))}
                  {subjectNames.map((name: string) => (
                    <Badge key={name}>{name}</Badge>
                  ))}
                </div>
              </div>

              <div className="mt-5 space-y-3 border-t border-border pt-4">
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {members.length} members
                  </span>
                  <span>Led by {leader?.name || 'Contributor'}</span>
                  <span>{formatDate(club.created_at)}</span>
                </div>

                {club.join_mode === 'invite_link' && !isMember && !request && (
                  <Input
                    value={inviteCodes[club.id] || ''}
                    onChange={(event) => setInviteCodes((current) => ({ ...current, [club.id]: event.target.value }))}
                    placeholder="Invite code"
                    icon={<KeyRound className="h-4 w-4" />}
                  />
                )}

                {feedback[club.id] && (
                  <p className="text-xs text-foreground-muted">{feedback[club.id]}</p>
                )}

                <div className="flex gap-2">
                  <Link href={`/clubs/${club.id}`} className="flex-1">
                    <Button variant="secondary" fullWidth>
                      View
                    </Button>
                  </Link>
                  {isMember ? (
                    <Button icon={<Check className="h-4 w-4" />} disabled>
                      Joined
                    </Button>
                  ) : request ? (
                    <Button icon={<Lock className="h-4 w-4" />} disabled>
                      Pending
                    </Button>
                  ) : (
                    <Button onClick={() => handleJoin(club.id)}>
                      {club.join_mode === 'approval_based' ? 'Request' : 'Join'}
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleClubs.length === 0 && (
        <EmptyState
          icon={BookOpen}
          heading="No clubs found"
          description="Try a different search or join model."
        />
      )}

      {isCreateOpen && user && (
        <CreateClubModal
          userId={user.id}
          onClose={() => setIsCreateOpen(false)}
          onCreate={clubStore.createNewClub}
          curriculums={clubStore.curriculums}
          subjects={clubStore.subjects}
        />
      )}
    </div>
  );
}

function CreateClubModal({
  userId,
  onClose,
  onCreate,
  curriculums,
  subjects,
}: {
  userId: string;
  onClose: () => void;
  onCreate: (data: {
    name: string;
    description?: string;
    created_by: string;
    join_mode: ClubJoinMode;
    invite_code?: string;
    curriculum_ids?: string[];
    subject_ids?: string[];
  }) => unknown;
  curriculums: Array<{ id: string; title: string }>;
  subjects: Array<{ id: string; title: string }>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [joinMode, setJoinMode] = useState<ClubJoinMode>('open');
  const [inviteCode, setInviteCode] = useState('');
  const [curriculumId, setCurriculumId] = useState(curriculums[0]?.id || '');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Club name is required.');
      return;
    }

    onCreate({
      name: name.trim(),
      description: description.trim(),
      created_by: userId,
      join_mode: joinMode,
      invite_code: inviteCode.trim(),
      curriculum_ids: curriculumId ? [curriculumId] : [],
      subject_ids: subjectId ? [subjectId] : [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl rounded-2xl border border-border bg-background-card p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Club</h2>
            <p className="mt-1 text-sm text-foreground-muted">Start a new community space.</p>
          </div>
          <button type="button" onClick={onClose} className="text-sm font-medium text-foreground-muted hover:text-foreground">
            Close
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <Input label="Name" value={name} onChange={(event) => setName(event.target.value)} />
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
            Join model
            <select
              value={joinMode}
              onChange={(event) => setJoinMode(event.target.value as ClubJoinMode)}
              className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground"
            >
              <option value="open">Open</option>
              <option value="invite_link">Invite link</option>
              <option value="approval_based">Approval based</option>
            </select>
          </label>
          {joinMode === 'invite_link' && (
            <Input label="Invite code" value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Optional" />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Curriculum
              <select value={curriculumId} onChange={(event) => setCurriculumId(event.target.value)} className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground">
                {curriculums.map((curriculum) => (
                  <option key={curriculum.id} value={curriculum.id}>{curriculum.title}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-foreground">
              Subject
              <select value={subjectId} onChange={(event) => setSubjectId(event.target.value)} className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground">
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.title}</option>
                ))}
              </select>
            </label>
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Create</Button>
        </div>
      </form>
    </div>
  );
}

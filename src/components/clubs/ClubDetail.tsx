'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CalendarDays,
  Check,
  ExternalLink,
  FolderGit2,
  Link as LinkIcon,
  Megaphone,
  MessageSquare,
  Plus,
  Send,
  Settings,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ClubFeatureKey, DEFAULT_CLUB_FEATURES } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils';

type TabKey = 'chat' | 'announcements' | 'links' | 'members' | 'requests' | 'projects' | 'activity_timeline';

/** Map tab keys to their required club feature */
const TAB_FEATURE_MAP: Record<TabKey, ClubFeatureKey> = {
  chat: 'chat',
  announcements: 'announcements',
  links: 'links',
  members: 'members',
  requests: 'members', // requests is under members feature
  projects: 'projects',
  activity_timeline: 'activity_timeline',
};

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4 w-4" /> },
  { key: 'links', label: 'Links', icon: <LinkIcon className="h-4 w-4" /> },
  { key: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { key: 'requests', label: 'Requests', icon: <UserCheck className="h-4 w-4" /> },
  { key: 'projects', label: 'Projects', icon: <FolderGit2 className="h-4 w-4" /> },
  { key: 'activity_timeline', label: 'Activity', icon: <CalendarDays className="h-4 w-4" /> },
];

const FEATURE_NAMES: Record<string, string> = {
  chat: 'Chat',
  announcements: 'Announcements',
  links: 'Links',
  members: 'Members',
  projects: 'Projects',
  activity_timeline: 'Activity Timeline',
  leaderboard: 'Leaderboard',
};

export default function ClubDetail({ clubId }: { clubId: string }) {
  const { user } = useAuth();
  const clubStore = useClub();
  const [activeTab, setActiveTab] = useState<TabKey>('chat');
  const [feedback, setFeedback] = useState('');
  const club = clubStore.getClub(clubId);

  const members = clubStore.getClubMembers(clubId);
  const activeMembers = members.filter((member) => member.membership_status === 'active');
  const currentMembership = user ? clubStore.getUserClubMembership(clubId, user.id) : undefined;
  const isMember = currentMembership?.membership_status === 'active';
  const isAdmin = currentMembership?.role === 'admin' && isMember;
  const isModerator = currentMembership?.role === 'moderator' && isMember;
  const isLeader = isAdmin || isModerator;
  const pendingRequest = user ? clubStore.getUserClubJoinRequest(clubId, user.id) : undefined;
  const joinRequests = clubStore.getClubJoinRequests(clubId).filter((request) => request.status === 'pending');

  // Filter tabs based on enabled features
  const enabledFeatures = club?.enabled_features || DEFAULT_CLUB_FEATURES;
  const visibleTabs = tabs.filter((tab) => {
    // Requests is only visible to admins
    if (tab.key === 'requests') return isAdmin;
    // Check if the feature is enabled
    const requiredFeature = TAB_FEATURE_MAP[tab.key] as ClubFeatureKey;
    const feature = enabledFeatures.find(f => f.key === requiredFeature);
    return feature?.enabled ?? false;
  });

  const topicTags = useMemo(() => {
    if (!club) return [];
    const curriculumTags = clubStore.getClubCurriculumLinks(club.id)
      .map((link) => clubStore.getCurriculum(link.curriculum_id)?.title)
      .filter(Boolean);
    const subjectTags = clubStore.getClubSubjectLinks(club.id)
      .map((link) => clubStore.subjects.find((subject) => subject.id === link.subject_id)?.title)
      .filter(Boolean);
    return [...curriculumTags, ...subjectTags] as string[];
  }, [club, clubStore]);

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Club not found</h1>
        <p className="mt-2 text-foreground-muted">This club may have moved or does not exist in the mock data.</p>
        <Link href="/clubs" className="mt-6 inline-flex">
          <Button icon={<ArrowLeft className="h-4 w-4" />}>Back to Clubs</Button>
        </Link>
      </div>
    );
  }

  const leader = clubStore.getProfile(club.created_by);

  const handleJoin = (inviteCode?: string) => {
    if (!user) return;
    const result = clubStore.joinClub(club.id, user.id, inviteCode);
    setFeedback(result.success ? 'Updated your club membership.' : result.error || 'Could not update membership.');
  };

  const handleLeave = () => {
    if (!user) return;
    const result = clubStore.leave(club.id, user.id);
    setFeedback(result.success ? 'You left this club.' : result.error || 'Could not leave club.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/clubs" className="inline-flex">
        <Button variant="secondary" icon={<ArrowLeft className="h-4 w-4" />}>
          Clubs
        </Button>
      </Link>

      <section className="rounded-2xl border border-border bg-background-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{club.join_mode === 'approval_based' ? 'Approval' : club.join_mode === 'invite_link' ? 'Invite' : 'Open'}</Badge>
              {isMember && <Badge variant="success">Member</Badge>}
              {pendingRequest && <Badge variant="warning">Request pending</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground">{club.name}</h1>
            <p className="mt-2 max-w-3xl text-foreground-muted">{club.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {topicTags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-foreground-muted">
              <span>Led by {leader?.name || 'Contributor'}</span>
              <span>{activeMembers.length} active members</span>
              <span>Created {formatDate(club.created_at)}</span>
            </div>
          </div>

          <div className="w-full lg:w-72 space-y-3">
            {isLeader && (
              <Link href={`/clubs/${club.id}/manage`} className="block w-full">
                <Button variant="secondary" fullWidth icon={<Settings className="h-4 w-4" />}>
                  Manage Club
                </Button>
              </Link>
            )}
            {isMember ? (
              <Button variant="outline" fullWidth onClick={handleLeave}>
                Leave Club
              </Button>
            ) : pendingRequest ? (
              <Button fullWidth disabled icon={<UserCheck className="h-4 w-4" />}>
                Pending Approval
              </Button>
            ) : (
              <JoinPanel clubMode={club.join_mode} onJoin={handleJoin} />
            )}
            {feedback && <p className="mt-3 text-sm text-foreground-muted">{feedback}</p>}
          </div>
        </div>
      </section>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {visibleTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer',
              activeTab === tab.key
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-background-card text-foreground-secondary hover:border-border-hover hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
            {tab.key === 'requests' && joinRequests.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{joinRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <ChatTab
          clubId={club.id}
          isMember={isMember}
          messages={clubStore.getClubMessages(club.id)}
          getProfile={clubStore.getProfile}
          onSend={(message) => user ? clubStore.sendMessage(club.id, user.id, message) : { success: false, error: 'Sign in required.' }}
        />
      )}
      {activeTab === 'announcements' && (
        <AnnouncementsTab
          isLeader={isLeader}
          announcements={clubStore.getClubAnnouncements(club.id)}
          getProfile={clubStore.getProfile}
          onPost={(title, content) => user ? clubStore.postAnnouncement(club.id, user.id, title, content) : { success: false, error: 'Sign in required.' }}
        />
      )}
      {activeTab === 'links' && (
        <LinksTab
          isLeader={isLeader}
          links={clubStore.getClubLinks(club.id)}
          getProfile={clubStore.getProfile}
          onShare={(title, url) => user ? clubStore.shareLink(club.id, user.id, title, url) : { success: false, error: 'Sign in required.' }}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab members={activeMembers} getProfile={clubStore.getProfile} />
      )}
      {activeTab === 'requests' && isLeader && (
        <RequestsTab
          requests={joinRequests}
          getProfile={clubStore.getProfile}
          onReview={(requestId, status) => clubStore.reviewRequest(requestId, status)}
        />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab
          isMember={isMember}
          projects={clubStore.getClubProjects?.(club.id) ?? []}
          getProfile={clubStore.getProfile}
          onAddProject={(title, description) =>
            user ? clubStore.addClubProject?.(club.id, user.id, title, description) ?? { success: false, error: 'Not implemented' } : { success: false, error: 'Sign in required.' }
          }
        />
      )}
      {activeTab === 'activity_timeline' && (
        <ActivityTimelineTab
          isLeader={isLeader}
          events={clubStore.getClubEvents?.(club.id) ?? []}
          getProfile={clubStore.getProfile}
          onAddEvent={(title, description, date) =>
            user ? clubStore.addClubEvent?.(club.id, user.id, title, description, date) ?? { success: false, error: 'Not implemented' } : { success: false, error: 'Sign in required.' }
          }
        />
      )}
    </div>
  );
}

function JoinPanel({
  clubMode,
  onJoin,
}: {
  clubMode: 'open' | 'invite_link' | 'approval_based';
  onJoin: (inviteCode?: string) => void;
}) {
  const [inviteCode, setInviteCode] = useState('');

  if (clubMode === 'invite_link') {
    return (
      <div className="space-y-3">
        <Input value={inviteCode} onChange={(event) => setInviteCode(event.target.value)} placeholder="Invite code" />
        <Button fullWidth onClick={() => onJoin(inviteCode)}>Join with Code</Button>
      </div>
    );
  }

  return (
    <Button fullWidth onClick={() => onJoin()}>
      {clubMode === 'approval_based' ? 'Request to Join' : 'Join Club'}
    </Button>
  );
}

function ChatTab({
  clubId,
  isMember,
  messages,
  getProfile,
  onSend,
}: {
  clubId: string;
  isMember: boolean;
  messages: ReturnType<ReturnType<typeof useClub>['getClubMessages']>;
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onSend: (message: string) => { success: boolean; error?: string };
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const result = onSend(message);
    if (!result.success) {
      setError(result.error || 'Could not send message.');
      return;
    }
    setMessage('');
    setError('');
  };

  return (
    <section className="rounded-xl border border-border bg-background-card p-5">
      <div className="space-y-4">
        {messages.map((item) => {
          const profile = getProfile(item.sender_id);
          return (
            <div key={`${clubId}-${item.id}`} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {getInitials(profile?.name || 'User')}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-background-secondary px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{profile?.name || 'Unknown user'}</p>
                  <p className="text-xs text-foreground-muted">{formatRelativeTime(item.created_at)}</p>
                </div>
                <p className="mt-1 text-sm text-foreground-secondary">{item.message}</p>
              </div>
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <Input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={isMember ? 'Write a message' : 'Join this club to chat'}
          disabled={!isMember}
        />
        <Button type="submit" disabled={!isMember} icon={<Send className="h-4 w-4" />}>
          Send
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </section>
  );
}

function AnnouncementsTab({
  isLeader,
  announcements,
  getProfile,
  onPost,
}: {
  isLeader: boolean;
  announcements: ReturnType<ReturnType<typeof useClub>['getClubAnnouncements']>;
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onPost: (title: string, content: string) => { success: boolean; error?: string };
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handlePost = (event: FormEvent) => {
    event.preventDefault();
    const result = onPost(title, content);
    if (!result.success) {
      setError(result.error || 'Could not post announcement.');
      return;
    }
    setTitle('');
    setContent('');
    setError('');
  };

  return (
    <section className="space-y-4">
      {isLeader && (
        <form onSubmit={handlePost} className="rounded-xl border border-border bg-background-card p-5">
          <div className="grid gap-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Announcement title" />
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={3}
              placeholder="Announcement content"
              className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-error">{error}</p> : <span />}
            <Button type="submit" icon={<Megaphone className="h-4 w-4" />}>Post</Button>
          </div>
        </form>
      )}
      {announcements.map((item) => {
        const profile = getProfile(item.created_by);
        return (
          <article key={item.id} className="rounded-xl border border-border bg-background-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Pinned</Badge>
              <span className="text-xs text-foreground-muted">{formatDate(item.created_at)}</span>
            </div>
            <h2 className="mt-3 text-lg font-bold text-foreground">{item.title}</h2>
            <p className="mt-2 text-sm text-foreground-secondary">{item.content}</p>
            <p className="mt-4 text-xs text-foreground-muted">Posted by {profile?.name || 'Club leader'}</p>
          </article>
        );
      })}
    </section>
  );
}

function LinksTab({
  isLeader,
  links,
  getProfile,
  onShare,
}: {
  isLeader: boolean;
  links: ReturnType<ReturnType<typeof useClub>['getClubLinks']>;
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onShare: (title: string, url: string) => { success: boolean; error?: string };
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleShare = (event: FormEvent) => {
    event.preventDefault();
    const result = onShare(title, url);
    if (!result.success) {
      setError(result.error || 'Could not share link.');
      return;
    }
    setTitle('');
    setUrl('');
    setError('');
  };

  return (
    <section className="space-y-4">
      {isLeader && (
        <form onSubmit={handleShare} className="rounded-xl border border-border bg-background-card p-5">
          <div className="grid gap-3 md:grid-cols-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Link title" />
            <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-error">{error}</p> : <span />}
            <Button type="submit" icon={<LinkIcon className="h-4 w-4" />}>Share</Button>
          </div>
        </form>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((item) => {
          const profile = getProfile(item.shared_by);
          return (
            <a
              key={item.id}
              href={item.url || '#'}
              target="_blank"
              rel="noreferrer"
              className="rounded-xl border border-border bg-background-card p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-foreground">{item.title}</h2>
                  <p className="mt-1 break-all text-sm text-primary">{item.url}</p>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-foreground-muted" />
              </div>
              <p className="mt-4 text-xs text-foreground-muted">Shared by {profile?.name || 'Member'} on {formatDate(item.created_at)}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function MembersTab({
  members,
  getProfile,
}: {
  members: ReturnType<ReturnType<typeof useClub>['getClubMembers']>;
  getProfile: ReturnType<typeof useClub>['getProfile'];
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const profile = getProfile(member.user_id);
        return (
          <article key={member.id} className="flex items-center gap-3 rounded-xl border border-border bg-background-card p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
              {getInitials(profile?.name || 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{profile?.name || 'Unknown user'}</p>
              <p className="text-xs text-foreground-muted">{profile?.title || profile?.role}</p>
            </div>
            <Badge variant={member.role === 'admin' || member.role === 'moderator' ? 'warning' : 'default'}>{member.role}</Badge>
          </article>
        );
      })}
    </section>
  );
}

function RequestsTab({
  requests,
  getProfile,
  onReview,
}: {
  requests: ReturnType<ReturnType<typeof useClub>['getClubJoinRequests']>;
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onReview: (requestId: string, status: 'approved' | 'rejected') => { success: boolean; error?: string };
}) {
  if (requests.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-background-card p-8 text-center">
        <UserCheck className="mx-auto h-8 w-8 text-foreground-muted" />
        <p className="mt-3 font-semibold text-foreground">No pending requests</p>
        <p className="text-sm text-foreground-muted">New approval-based join requests will appear here.</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {requests.map((request) => {
        const profile = getProfile(request.user_id);
        return (
          <article key={request.id} className="flex flex-col gap-4 rounded-xl border border-border bg-background-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                {getInitials(profile?.name || 'User')}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile?.name || 'Unknown user'}</p>
                <p className="text-xs text-foreground-muted">Requested {formatRelativeTime(request.requested_at)}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" icon={<Check className="h-4 w-4" />} onClick={() => onReview(request.id, 'approved')}>
                Approve
              </Button>
              <Button size="sm" variant="secondary" icon={<X className="h-4 w-4" />} onClick={() => onReview(request.id, 'rejected')}>
                Reject
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
}

// ── Projects Tab ────────────────────────────────────────────────────────────

interface ClubProject {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
}

function ProjectsTab({
  isMember,
  projects,
  getProfile,
  onAddProject,
}: {
  isMember: boolean;
  projects: ClubProject[];
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onAddProject: (title: string, description: string) => { success: boolean; error?: string };
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const result = onAddProject(title, description);
    if (!result.success) {
      setError(result.error || 'Could not add project.');
      return;
    }
    setTitle('');
    setDescription('');
    setError('');
  };

  return (
    <section className="space-y-4">
      {isMember && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background-card p-5">
          <div className="grid gap-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Project title" />
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="Brief description of the project"
              className="rounded-xl border border-border bg-background-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-error">{error}</p> : <span />}
            <Button type="submit" icon={<Plus className="h-4 w-4" />}>Add Project</Button>
          </div>
        </form>
      )}
      {projects.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <FolderGit2 className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No projects yet</p>
          <p className="text-sm text-foreground-muted">
            {isMember ? 'Share a project with the club.' : 'Club members can share their projects here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => {
            const profile = getProfile(project.created_by);
            return (
              <article key={project.id} className="rounded-xl border border-border bg-background-card p-5 transition-all hover:-translate-y-0.5 hover:border-border-hover hover:shadow-md">
                <h2 className="font-semibold text-foreground">{project.title}</h2>
                {project.description && (
                  <p className="mt-2 text-sm text-foreground-secondary">{project.description}</p>
                )}
                <p className="mt-4 text-xs text-foreground-muted">
                  Shared by {profile?.name || 'Member'} on {formatDate(project.created_at)}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ── Activity Timeline Tab ───────────────────────────────────────────────────

interface ClubEvent {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  created_at: string;
}

function ActivityTimelineTab({
  isLeader,
  events,
  getProfile,
  onAddEvent,
}: {
  isLeader: boolean;
  events: ClubEvent[];
  getProfile: ReturnType<typeof useClub>['getProfile'];
  onAddEvent: (title: string, description: string, date: string) => { success: boolean; error?: string };
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const result = onAddEvent(title, description, eventDate);
    if (!result.success) {
      setError(result.error || 'Could not add event.');
      return;
    }
    setTitle('');
    setDescription('');
    setEventDate('');
    setError('');
  };

  // Sort events by date (upcoming first)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()
  );

  return (
    <section className="space-y-4">
      {isLeader && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-background-card p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Event title" />
            <Input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Description (optional)" />
            <Input value={eventDate} onChange={(event) => setEventDate(event.target.value)} type="date" placeholder="Date" />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            {error ? <p className="text-sm text-error">{error}</p> : <span />}
            <Button type="submit" icon={<CalendarDays className="h-4 w-4" />}>Add Event</Button>
          </div>
        </form>
      )}
      {sortedEvents.length === 0 ? (
        <div className="rounded-xl border border-border bg-background-card p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-foreground-muted" />
          <p className="mt-3 font-semibold text-foreground">No upcoming events</p>
          <p className="text-sm text-foreground-muted">
            {isLeader ? 'Add an event to the club calendar.' : 'No events have been scheduled yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event) => {
            const profile = getProfile(event.created_by);
            const isUpcoming = new Date(event.event_date) >= new Date();
            return (
              <div key={event.id} className="flex items-start gap-4 rounded-xl border border-border bg-background-card p-4">
                <div className="flex flex-col items-center shrink-0">
                  <span className={cn(
                    'text-xs font-bold uppercase px-2 py-1 rounded-lg',
                    isUpcoming ? 'bg-primary/10 text-primary' : 'bg-foreground-muted/10 text-foreground-muted'
                  )}>
                    {new Date(event.event_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-sm">{event.title}</h3>
                  {event.description && (
                    <p className="mt-1 text-xs text-foreground-secondary">{event.description}</p>
                  )}
                  <p className="mt-2 text-xs text-foreground-muted">
                    Added by {profile?.name || 'Leader'} &middot; {isUpcoming ? 'Upcoming' : 'Past event'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

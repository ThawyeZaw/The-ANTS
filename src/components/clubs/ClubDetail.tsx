'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Link as LinkIcon,
  Megaphone,
  MessageSquare,
  Send,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuth } from '@/hooks/useAuth';
import { useClub } from '@/hooks/useClub';
import { cn, formatDate, formatRelativeTime, getInitials } from '@/lib/utils';

type TabKey = 'chat' | 'announcements' | 'links' | 'members' | 'requests';

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4 w-4" /> },
  { key: 'links', label: 'Links', icon: <LinkIcon className="h-4 w-4" /> },
  { key: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { key: 'requests', label: 'Requests', icon: <UserCheck className="h-4 w-4" /> },
];

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
  const isLeader = currentMembership?.role === 'leader' && isMember;
  const pendingRequest = user ? clubStore.getUserClubJoinRequest(clubId, user.id) : undefined;
  const joinRequests = clubStore.getClubJoinRequests(clubId).filter((request) => request.status === 'pending');

  const visibleTabs = tabs.filter((tab) => tab.key !== 'requests' || isLeader);

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
              <span>Led by {leader?.full_name || 'Contributor'}</span>
              <span>{activeMembers.length} active members</span>
              <span>Created {formatDate(club.created_at)}</span>
            </div>
          </div>

          <div className="w-full lg:w-72">
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
          isMember={isMember}
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
                {getInitials(profile?.full_name || 'User')}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-background-secondary px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{profile?.full_name || 'Unknown user'}</p>
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
            <p className="mt-4 text-xs text-foreground-muted">Posted by {profile?.full_name || 'Club leader'}</p>
          </article>
        );
      })}
    </section>
  );
}

function LinksTab({
  isMember,
  links,
  getProfile,
  onShare,
}: {
  isMember: boolean;
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
      <form onSubmit={handleShare} className="rounded-xl border border-border bg-background-card p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isMember ? 'Link title' : 'Join to share links'} disabled={!isMember} />
          <Input value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" disabled={!isMember} />
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          {error ? <p className="text-sm text-error">{error}</p> : <span />}
          <Button type="submit" disabled={!isMember} icon={<LinkIcon className="h-4 w-4" />}>Share</Button>
        </div>
      </form>
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
              <p className="mt-4 text-xs text-foreground-muted">Shared by {profile?.full_name || 'Member'} on {formatDate(item.created_at)}</p>
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
              {getInitials(profile?.full_name || 'User')}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{profile?.full_name || 'Unknown user'}</p>
              <p className="text-xs text-foreground-muted">{profile?.role}</p>
            </div>
            <Badge variant={member.role === 'leader' ? 'warning' : 'default'}>{member.role}</Badge>
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
                {getInitials(profile?.full_name || 'User')}
              </div>
              <div>
                <p className="font-semibold text-foreground">{profile?.full_name || 'Unknown user'}</p>
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

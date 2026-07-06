'use client';

import { FormEvent, useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import {
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
  Target,
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
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useRealtimePresence } from '@/hooks/useRealtimePresence';
import type { ClubMessage, MessageSender } from '@/hooks/useRealtimeChat';
import MilestoneTracker from './MilestoneTracker';
import MemberProgressPanel from './MemberProgressPanel';

type TabKey = 'chat' | 'announcements' | 'links' | 'members' | 'requests' | 'projects' | 'activity_timeline' | 'milestones';

/** Map tab keys to their required club feature */
const TAB_FEATURE_MAP: Record<TabKey, ClubFeatureKey> = {
  chat: 'chat',
  announcements: 'announcements',
  links: 'links',
  members: 'members',
  requests: 'members', // requests is under members feature
  projects: 'projects',
  activity_timeline: 'activity_timeline',
  milestones: 'projects',
};

const tabs: Array<{ key: TabKey; label: string; icon: React.ReactNode }> = [
  { key: 'chat', label: 'Chat', icon: <MessageSquare className="h-4 w-4" /> },
  { key: 'announcements', label: 'Announcements', icon: <Megaphone className="h-4 w-4" /> },
  { key: 'links', label: 'Links', icon: <LinkIcon className="h-4 w-4" /> },
  { key: 'members', label: 'Members', icon: <Users className="h-4 w-4" /> },
  { key: 'requests', label: 'Requests', icon: <UserCheck className="h-4 w-4" /> },
  { key: 'projects', label: 'Projects', icon: <FolderGit2 className="h-4 w-4" /> },
  { key: 'activity_timeline', label: 'Activity', icon: <CalendarDays className="h-4 w-4" /> },
  { key: 'milestones', label: 'Milestones', icon: <Target className="h-4 w-4" /> },
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

  // Async data states
  const [club, setClub] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [joinRequest, setJoinRequest] = useState<any>(null);
  const [allJoinRequests, setAllJoinRequests] = useState<any[]>([]);
  const [leaderProfile, setLeaderProfile] = useState<any>(null);
  const [curriculumLinkData, setCurriculumLinkData] = useState<any[]>([]);
  const [subjectLinkData, setSubjectLinkData] = useState<any[]>([]);
  const [fallbackMessages, setFallbackMessages] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [curriculumMap, setCurriculumMap] = useState<Record<string, any>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, any>>({});

  useEffect(() => {
    (async () => {
      const clubData = await clubStore.getClub(clubId);
      setClub(clubData);
      if (!clubData) return;

      const [
        membersData, membershipData, joinReqData, joinReqsData,
        msgsData, annData, linksData, projData, evtData, mileData,
        currLinksData, subLinksData,
      ] = await Promise.all([
        clubStore.getClubMembers(clubId),
        user ? clubStore.getUserClubMembership(clubId, user.id) : Promise.resolve(null),
        user ? clubStore.getUserClubJoinRequest(clubId, user.id) : Promise.resolve(null),
        clubStore.getClubJoinRequests(clubId),
        clubStore.getClubMessages(clubId),
        clubStore.getClubAnnouncements(clubId),
        clubStore.getClubLinks(clubId),
        clubStore.getClubProjects?.(clubId) ?? Promise.resolve([]),
        clubStore.getClubEvents?.(clubId) ?? Promise.resolve([]),
        clubStore.getClubMilestones?.(clubId) ?? Promise.resolve([]),
        clubStore.getClubCurriculumLinks?.(clubId) ?? Promise.resolve([]),
        clubStore.getClubSubjectLinks?.(clubId) ?? Promise.resolve([]),
      ]);

      setMembers(membersData);
      setMembership(membershipData);
      setJoinRequest(joinReqData);
      setAllJoinRequests(joinReqsData);
      setFallbackMessages(msgsData);
      setAnnouncements(annData);
      setLinks(linksData);
      setProjects(projData);
      setEvents(evtData);
      setMilestones(mileData);
      setCurriculumLinkData(currLinksData);
      setSubjectLinkData(subLinksData);

      const lp = await clubStore.getProfile(clubData.created_by);
      setLeaderProfile(lp);

      // Fetch curriculum data for topic tags
      const curriculumIds = currLinksData.map((l: any) => l.curriculum_id);
      const cMap: Record<string, any> = {};
      await Promise.all(
        curriculumIds.map(async (cid: string) => {
          cMap[cid] = await clubStore.getCurriculum(cid);
        })
      );
      setCurriculumMap(cMap);

      // Collect all unique user IDs and fetch profiles
      const allData = [
        ...membersData,
        ...msgsData,
        ...annData,
        ...linksData,
        ...joinReqsData,
        ...projData,
        ...evtData,
        ...mileData,
      ];
      const userIds = [...new Set([
        clubData.created_by,
        ...allData.map((d: any) => d.user_id || d.created_by).filter(Boolean),
      ])] as string[];

      const pMap: Record<string, any> = {};
      await Promise.all(
        userIds.map(async (uid) => {
          pMap[uid] = await clubStore.getProfile(uid);
        })
      );
      setProfilesMap(pMap);
    })();
  }, [clubId, user?.id, clubStore]);

  // ── Realtime chat ─────────────────────────────────────────────────────
  const {
    messages: realtimeMessages,
    senders: realtimeSenders,
    sendMessage: realtimeSend,
    isConnected: chatConnected,
    error: chatError,
  } = useRealtimeChat(user ? clubId : undefined, user?.id);

  // ── Realtime presence ─────────────────────────────────────────────────
  const { onlineUsers } = useRealtimePresence(
    user && clubId ? `club:${clubId}:presence` : undefined,
    user ? { user_id: user.id, name: user.profile.name, avatar_url: user.profile.avatar } : null
  );

  const activeMembers = members.filter((member: any) => member.membership_status === 'active');
  const currentMembership = user ? membership : undefined;
  const isMember = currentMembership?.membership_status === 'active';
  const isAdmin = currentMembership?.role === 'admin' && isMember;
  const isModerator = currentMembership?.role === 'moderator' && isMember;
  const isLeader = isAdmin || isModerator;
  const pendingRequest = user ? joinRequest : undefined;
  const currentJoinRequests = allJoinRequests.filter((request: any) => request.status === 'pending');

  // Filter tabs based on enabled features
  const enabledFeatures: any[] = club?.enabled_features || DEFAULT_CLUB_FEATURES;
  const visibleTabs = tabs.filter((tab) => {
    // Requests is only visible to admins
    if (tab.key === 'requests') return isAdmin;
    // Check if the feature is enabled
    const requiredFeature = TAB_FEATURE_MAP[tab.key] as ClubFeatureKey;
    const feature = enabledFeatures.find((f: any) => f.key === requiredFeature);
    return feature?.enabled ?? false;
  });

  const topicTags = useMemo(() => {
    if (!club) return [];
    const curriculumTags = curriculumLinkData
      .map((link: any) => curriculumMap[link.curriculum_id]?.title)
      .filter(Boolean);
    const subjectTags = subjectLinkData
      .map((link: any) => clubStore.subjects.find((subject: any) => subject.id === link.subject_id)?.title)
      .filter(Boolean);
    return [...curriculumTags, ...subjectTags] as string[];
  }, [club, curriculumLinkData, subjectLinkData, curriculumMap, clubStore.subjects]);

  if (!club) {
    return (
      <div className="mx-auto max-w-2xl rounded-xl border border-border bg-background-card p-8 text-center">
        <MessageSquare className="mx-auto h-10 w-10 text-foreground-muted" />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Club not found</h1>
        <p className="mt-2 text-foreground-muted">This club may have moved or does not exist in the mock data.</p>
        <BackButton href="/clubs" label="Back to Clubs" />
      </div>
    );
  }

  const leader = leaderProfile;

  const handleJoin = async (inviteCode?: string) => {
    if (!user) return;
    const result = await clubStore.joinClub(club.id, user.id, inviteCode);
    setFeedback(result.success ? 'Updated your club membership.' : result.error || 'Could not update membership.');
  };

  const handleLeave = async () => {
    if (!user) return;
    const result = await clubStore.leave(club.id, user.id);
    setFeedback(result.success ? 'You left this club.' : result.error || 'Could not leave club.');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <BackButton href="/clubs" label="Clubs" />

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
            {tab.key === 'requests' && currentJoinRequests.length > 0 && (
              <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">{currentJoinRequests.length}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'chat' && (
        <ChatTab
          clubId={club.id}
          isMember={isMember}
          messages={realtimeMessages.length > 0
            ? realtimeMessages
            : fallbackMessages}
          senders={realtimeMessages.length > 0 ? realtimeSenders : undefined}
          profiles={profilesMap}
          onSend={async (message) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            // Try realtime send first, fall back to mock
            const result = await realtimeSend(message);
            if (!result.success) {
              return clubStore.sendMessage(club.id, user.id, message);
            }
            return result;
          }}
          isRealtimeConnected={chatConnected}
          onlineCount={onlineUsers.length}
        />
      )}
      {activeTab === 'announcements' && (
        <AnnouncementsTab
          isLeader={isLeader}
          announcements={announcements}
          profiles={profilesMap}
          onPost={(title, content) => user ? clubStore.postAnnouncement(club.id, user.id, title, content) : Promise.resolve({ success: false, error: 'Sign in required.' })}
        />
      )}
      {activeTab === 'links' && (
        <LinksTab
          isLeader={isLeader}
          links={links}
          profiles={profilesMap}
          onShare={(title, url) => user ? clubStore.shareLink(club.id, user.id, title, url) : Promise.resolve({ success: false, error: 'Sign in required.' })}
        />
      )}
      {activeTab === 'members' && (
        <MembersTab members={activeMembers} profiles={profilesMap} />
      )}
      {activeTab === 'requests' && isLeader && (
        <RequestsTab
          requests={currentJoinRequests}
          profiles={profilesMap}
          onReview={(requestId, status) => clubStore.reviewRequest(requestId, status)}
        />
      )}
      {activeTab === 'projects' && (
        <ProjectsTab
          isMember={isMember}
          projects={projects}
          profiles={profilesMap}
          onAddProject={async (title, description) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            const result = await clubStore.addClubProject?.(club.id, { created_by: user.id, title, description });
            return result ?? { success: false, error: 'Not implemented' };
          }}
        />
      )}
      {activeTab === 'activity_timeline' && (
        <ActivityTimelineTab
          isLeader={isLeader}
          events={events}
          profiles={profilesMap}
          onAddEvent={async (title, description, date) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            const result = await clubStore.addClubEvent?.(club.id, { created_by: user.id, title, description, event_date: date });
            return result ?? { success: false, error: 'Not implemented' };
          }}
        />
      )}
      {activeTab === 'milestones' && (
        <MilestoneTracker
          milestones={milestones}
          isLeader={isLeader}
          onAdd={async (title, description, targetDate) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            const result = await clubStore.addClubMilestone?.(club.id, user.id, title, description, targetDate);
            return result ?? { success: false, error: 'Not implemented' };
          }}
          onUpdateStatus={async (id, status) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            const result = await clubStore.updateClubMilestone?.(id, user.id, { status });
            return result ?? { success: false, error: 'Not implemented' };
          }}
          onDelete={async (id) => {
            if (!user) return { success: false, error: 'Sign in required.' };
            const result = await clubStore.deleteClubMilestone?.(id, user.id);
            return result ?? { success: false, error: 'Not implemented' };
          }}
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
  senders,
  profiles,
  onSend,
  isRealtimeConnected,
  onlineCount,
}: {
  clubId: string;
  isMember: boolean;
  messages: Awaited<ReturnType<ReturnType<typeof useClub>['getClubMessages']>> | ClubMessage[];
  senders?: Map<string, MessageSender>;
  profiles: Record<string, any>;
  onSend: (message: string) => Promise<{ success: boolean; error?: string }>;
  isRealtimeConnected?: boolean;
  onlineCount?: number;
}) {
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const handle = async () => {
      const result = await onSend(message);
      if (!result.success) {
        setError(result.error || 'Could not send message.');
        return;
      }
      setMessage('');
      setError('');
    };
    handle();
  };

  return (
    <section className="rounded-xl border border-border bg-background-card p-5">
      {isRealtimeConnected !== undefined && (
        <div className="mb-3 flex items-center gap-2 text-xs">
          <span className={`inline-block h-2 w-2 rounded-full ${isRealtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-foreground-muted">
            {isRealtimeConnected ? 'Live' : 'Reconnecting...'}
          </span>
          {onlineCount !== undefined && onlineCount > 0 && (
            <span className="text-foreground-muted ml-2">
              {onlineCount} online
            </span>
          )}
        </div>
      )}
      <div className="space-y-4">
        {messages.map((item) => {
          // Try realtime sender first, fall back to profile lookup
          const realtimeSender = senders?.get((item as ClubMessage).sender_id);
          const mockSender = profiles[(item as any).sender_id || (item as any).user_id];
          const displayName = realtimeSender?.name || mockSender?.name || 'User';
          const avatarLetter = getInitials(displayName);
          const createdAt = (item as any).created_at || '';
          const content = (item as any).message || (item as any).content || '';

          return (
            <div key={`${clubId}-${(item as any).id}`} className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                {avatarLetter}
              </div>
              <div className="min-w-0 flex-1 rounded-xl bg-background-secondary px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{displayName}</p>
                  <p className="text-xs text-foreground-muted">{formatRelativeTime(createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-foreground-secondary">{content}</p>
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
  profiles,
  onPost,
}: {
  isLeader: boolean;
  announcements: Awaited<ReturnType<ReturnType<typeof useClub>['getClubAnnouncements']>>;
  profiles: Record<string, any>;
  onPost: (title: string, content: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handlePost = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onPost(title, content);
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
        const profile = profiles[item.created_by];
        return (
          <article key={item.id} className="rounded-xl border border-border bg-background-card p-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="warning">Pinned</Badge>
              <span className="text-xs text-foreground-muted">{formatDate(item.created_at ?? '')}</span>
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
  profiles,
  onShare,
}: {
  isLeader: boolean;
  links: Awaited<ReturnType<ReturnType<typeof useClub>['getClubLinks']>>;
  profiles: Record<string, any>;
  onShare: (title: string, url: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleShare = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onShare(title, url);
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
          const profile = profiles[item.shared_by];
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
              <p className="mt-4 text-xs text-foreground-muted">Shared by {profile?.name || 'Member'} on {formatDate(item.created_at ?? '')}</p>
            </a>
          );
        })}
      </div>
    </section>
  );
}

function MembersTab({
  members,
  profiles,
}: {
  members: Awaited<ReturnType<ReturnType<typeof useClub>['getClubMembers']>>;
  profiles: Record<string, any>;
}) {
  return (
    <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
      {members.map((member) => {
        const profile = profiles[member.user_id];
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
  profiles,
  onReview,
}: {
  requests: Awaited<ReturnType<ReturnType<typeof useClub>['getClubJoinRequests']>>;
  profiles: Record<string, any>;
  onReview: (requestId: string, status: 'approved' | 'rejected') => Promise<{ success: boolean; error?: string }>;
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
        const profile = profiles[request.user_id];
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
  profiles,
  onAddProject,
}: {
  isMember: boolean;
  projects: ClubProject[];
  profiles: Record<string, any>;
  onAddProject: (title: string, description: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const result = await onAddProject(title, description);
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
            const profile = profiles[project.created_by];
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
  profiles,
  onAddEvent,
}: {
  isLeader: boolean;
  events: ClubEvent[];
  profiles: Record<string, any>;
  onAddEvent: (title: string, description: string, date: string) => Promise<{ success: boolean; error?: string }>;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    const result = await onAddEvent(title, description, eventDate);
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
            const profile = profiles[event.created_by];
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

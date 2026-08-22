'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import {
  Users,
  Target,
  Clock,
  Loader2,
} from 'lucide-react';
import {
  getOrgMissionAction,
  getOrgTeamMembersAction,
  getOrgTimelineItemsAction,
} from '@/actions/org';
import BridgesSection from '@/components/about/BridgesSection';
import TeamMemberCard from '@/components/about/TeamMemberCard';
import OrgTimeline from '@/components/about/OrgTimeline';
import type { OrgTeamMember, OrgTimelineItem } from '@/types';
import { renderMarkdown } from '@/lib/markdown';

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'mission', label: 'Our Mission', icon: <Target className="h-4 w-4" /> },
  { key: 'team', label: 'Our Team', icon: <Users className="h-4 w-4" /> },
  { key: 'history', label: 'Our Journey', icon: <Clock className="h-4 w-4" /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Mission Section ──────────────────────────────────────────────────────────

function MissionSection() {
  const [missionContent, setMissionContent] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrgMissionAction().then((m) => {
      if (active) {
        setMissionContent(m?.content || '');
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="animate-fade-in space-y-12">
      {/* Headline */}
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-4">
          More Than Tutors.
          <br />
          <span className="text-primary">Your Bridge to Global Education.</span>
        </h1>
      </div>

      {/* Dynamic Mission Content */}
      <div className="bg-background-card border border-border rounded-2xl p-8 md:p-10 min-h-[160px] flex flex-col justify-center">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : (
          <div
            className="[&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-foreground [&_h2]:mb-6 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-3"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(missionContent) }}
          />
        )}
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary-hover rounded-xl text-sm font-semibold transition-all"
        >
          Join <span className="font-brand">The ANTs</span> Today
        </Link>
      </div>
    </div>
  );
}

// ── Team Section ─────────────────────────────────────────────────────────────

function TeamSection() {
  const [members, setMembers] = useState<OrgTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrgTeamMembersAction().then((data) => {
      if (active) {
        setMembers(data);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : members.length > 0 ? (
        <div className="rounded-3xl overflow-hidden border border-border">
          <BridgesSection members={members} />
        </div>
      ) : (
        <div className="text-center py-12 text-foreground-muted">
          No team members listed yet.
        </div>
      )}
    </div>
  );
}

// ── History Section ──────────────────────────────────────────────────────────

function HistorySection() {
  const [milestones, setMilestones] = useState<OrgTimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getOrgTimelineItemsAction().then((data) => {
      if (active) {
        setMilestones(data.filter((item) => item.showOnTimeline));
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Our Journey
        </h2>
        <p className="text-foreground-secondary">
          From a small group of volunteer tutors to a growing ecosystem —
          here is how <span className="font-brand">The ANTs</span> has evolved.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : (
        <OrgTimeline items={milestones} />
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('mission');

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* ── Brand accent glows (CSS-rendered, warm gold/amber) ──── */}
      <style>{`
        .about-neon-accent {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          border-radius: 50%;
          filter: blur(60px);
          opacity: 0.22;
          transition: opacity 0.5s ease, filter 0.5s ease;
        }
        /* Gold glow — left side: warm gold glow */
        .about-neon-gold {
          width: clamp(200px, 22vw, 360px);
          height: clamp(200px, 22vw, 360px);
          left: -4%;
          top: 45%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at 50% 50%,
            rgba(197, 148, 25, 0.45) 0%,
            rgba(212, 168, 75, 0.22) 30%,
            rgba(197, 148, 25, 0.06) 60%,
            transparent 100%
          );
          box-shadow:
            0 0 60px rgba(197, 148, 25, 0.20),
            0 0 120px rgba(212, 168, 75, 0.10);
          animation: aboutNeonPulseGold 4s ease-in-out infinite;
        }
        /* Amber glow — right side: soft amber highlight */
        .about-neon-amber {
          width: clamp(200px, 22vw, 360px);
          height: clamp(200px, 22vw, 360px);
          right: -4%;
          top: 40%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at 50% 50%,
            rgba(212, 168, 75, 0.40) 0%,
            rgba(197, 148, 25, 0.20) 30%,
            rgba(212, 168, 75, 0.05) 60%,
            transparent 100%
          );
          box-shadow:
            0 0 60px rgba(212, 168, 75, 0.18),
            0 0 120px rgba(197, 148, 25, 0.08);
          animation: aboutNeonPulseAmber 4.5s ease-in-out infinite;
        }
        /* Keyframes: subtle breathing glow */
        @keyframes aboutNeonPulseGold {
          0%, 100% { opacity: 0.20; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.28; transform: translateY(-50%) scale(1.06); }
        }
        @keyframes aboutNeonPulseAmber {
          0%, 100% { opacity: 0.18; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.26; transform: translateY(-50%) scale(1.05); }
        }
        /* Responsive: smaller on tablet, hidden on mobile */
        @media (max-width: 900px) {
          .about-neon-gold,
          .about-neon-amber {
            width: clamp(140px, 16vw, 220px);
            height: clamp(140px, 16vw, 220px);
            opacity: 0.14;
          }
        }
        @media (max-width: 640px) {
          .about-neon-accent { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .about-neon-gold,
          .about-neon-amber { animation: none; }
        }
      `}</style>

      {/* Gold glow — left side */}
      <div className="about-neon-accent about-neon-gold" aria-hidden="true" />

      {/* Amber glow — right side */}
      <div className="about-neon-accent about-neon-amber" aria-hidden="true" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 pb-20">
        {/* Back button */}
        <BackButton href="/" label="Back to Home" />

        {/* Tab Nav with sliding pill indicator */}
        <div className="relative flex flex-wrap gap-1 p-1 bg-background-secondary rounded-xl border border-border mb-10 max-w-md mx-auto">
          {/* Sliding indicator pill */}
          <div
            className="absolute top-1 bottom-1 rounded-lg bg-background-card shadow-sm border border-border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              left: `calc(${TABS.findIndex((t) => t.key === activeTab) * (100 / TABS.length)}% + 0.25rem)`,
              width: `calc(${100 / TABS.length}% - 0.5rem)`,
            }}
          />
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative z-10 flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                activeTab === tab.key
                  ? 'text-foreground'
                  : 'text-foreground-muted hover:text-foreground-secondary'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'mission' && <MissionSection />}
        {activeTab === 'team' && <TeamSection />}
        {activeTab === 'history' && <HistorySection />}
      </div>
    </div>
  );
}

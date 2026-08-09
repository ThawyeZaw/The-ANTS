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
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
          Meet Our Team
        </h2>
        <p className="text-foreground-secondary">
          A diverse network of scholars, educators and student leaders working
          together to build bridges to global education.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {members.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
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
      {/* ── Neon accent elements (CSS-rendered, instant load) ──── */}
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
        /* Gold neon — left side: warm amber glow */
        .about-neon-gold {
          width: clamp(200px, 22vw, 360px);
          height: clamp(200px, 22vw, 360px);
          left: -4%;
          top: 45%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at 50% 50%,
            rgba(208, 105, 43, 0.55) 0%,
            rgba(255, 180, 70, 0.25) 30%,
            rgba(208, 105, 43, 0.08) 60%,
            transparent 100%
          );
          box-shadow:
            0 0 60px rgba(208, 105, 43, 0.25),
            0 0 120px rgba(255, 160, 40, 0.12);
          animation: aboutNeonPulseGold 4s ease-in-out infinite;
        }
        /* Blue neon — right side: cool cyan glow */
        .about-neon-blue {
          width: clamp(200px, 22vw, 360px);
          height: clamp(200px, 22vw, 360px);
          right: -4%;
          top: 40%;
          transform: translateY(-50%);
          background: radial-gradient(
            circle at 50% 50%,
            rgba(91, 158, 255, 0.55) 0%,
            rgba(91, 158, 255, 0.25) 30%,
            rgba(0, 200, 255, 0.08) 60%,
            transparent 100%
          );
          box-shadow:
            0 0 60px rgba(91, 158, 255, 0.25),
            0 0 120px rgba(0, 180, 255, 0.12);
          animation: aboutNeonPulseBlue 4.5s ease-in-out infinite;
        }
        /* Dark mode: stronger glow */
        [data-theme="dark"] .about-neon-accent {
          opacity: 0.32;
        }
        [data-theme="dark"] .about-neon-gold {
          box-shadow:
            0 0 80px rgba(255, 140, 40, 0.35),
            0 0 160px rgba(255, 160, 40, 0.15);
        }
        [data-theme="dark"] .about-neon-blue {
          box-shadow:
            0 0 80px rgba(91, 158, 255, 0.35),
            0 0 160px rgba(0, 180, 255, 0.15);
        }
        /* Keyframes: subtle breathing glow */
        @keyframes aboutNeonPulseGold {
          0%, 100% { opacity: 0.22; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.30; transform: translateY(-50%) scale(1.06); }
        }
        @keyframes aboutNeonPulseBlue {
          0%, 100% { opacity: 0.22; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.30; transform: translateY(-50%) scale(1.05); }
        }
        [data-theme="dark"] .about-neon-gold {
          animation-name: aboutNeonPulseGoldDark;
        }
        [data-theme="dark"] .about-neon-blue {
          animation-name: aboutNeonPulseBlueDark;
        }
        @keyframes aboutNeonPulseGoldDark {
          0%, 100% { opacity: 0.32; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.42; transform: translateY(-50%) scale(1.08); }
        }
        @keyframes aboutNeonPulseBlueDark {
          0%, 100% { opacity: 0.32; transform: translateY(-50%) scale(1); }
          50%      { opacity: 0.42; transform: translateY(-50%) scale(1.07); }
        }
        /* Responsive: smaller on tablet, hidden on mobile */
        @media (max-width: 900px) {
          .about-neon-gold,
          .about-neon-blue {
            width: clamp(140px, 16vw, 220px);
            height: clamp(140px, 16vw, 220px);
            opacity: 0.14;
          }
          [data-theme="dark"] .about-neon-accent {
            opacity: 0.20;
          }
        }
        @media (max-width: 640px) {
          .about-neon-accent { display: none; }
        }
        @media (prefers-reduced-motion: reduce) {
          .about-neon-gold,
          .about-neon-blue { animation: none; }
        }
      `}</style>

      {/* Gold neon — left side */}
      <div className="about-neon-accent about-neon-gold" aria-hidden="true" />

      {/* Blue neon — right side */}
      <div className="about-neon-accent about-neon-blue" aria-hidden="true" />

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

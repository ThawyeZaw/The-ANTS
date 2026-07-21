'use client';

import { useState } from 'react';
import Link from 'next/link';
import BackButton from '@/components/ui/BackButton';
import {
  Users,
  Target,
  Compass,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { getOrgTeamMembers, getOrgMilestones } from '@/lib/mock/database';
import TeamMemberCard from '@/components/about/TeamMemberCard';
import OrgTimeline from '@/components/about/OrgTimeline';
import type { OrgTeamMember } from '@/types';

// ── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'mission', label: 'Our Mission', icon: <Target className="h-4 w-4" /> },
  { key: 'team', label: 'Our Team', icon: <Users className="h-4 w-4" /> },
  { key: 'history', label: 'Our Journey', icon: <Clock className="h-4 w-4" /> },
] as const;

type TabKey = (typeof TABS)[number]['key'];

// ── Mission Section ──────────────────────────────────────────────────────────

function MissionSection() {
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

      {/* Who We Are */}
      <div className="bg-background-card border border-border rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Who We Are</h2>
        </div>
        <p className="text-foreground-secondary leading-relaxed text-base">
          Our greatest strength is our community of mentors. <span className="font-brand">The ANTs</span> teaching
          team is a diverse, global network of scholars who have successfully
          conquered the academic hurdles you are facing right now. Because our
          tutors come from a wide variety of prestigious academic pathways —
          including A-Levels, Polytechnics, University Foundation programs, the
          OSSD and top UK Universities — they bring rich, firsthand experience
          to every lesson.
        </p>
      </div>

      {/* The ANTs Advantage */}
      <div className="bg-background-card border border-border rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Compass className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground"><span className="font-brand">The ANTs</span> Advantage</h2>
        </div>
        <p className="text-foreground-secondary leading-relaxed text-base">
          When you learn with us, you are not just memorizing a syllabus. You
          are connecting with high-achieving seniors who understand your exact
          struggles. Whether you need rigorous IGCSE exam preparation or real-world
          advice on transitioning to higher education abroad, our team provides
          the academic strategies and peer mentorship you need to succeed
          globally.
        </p>
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
  const members: OrgTeamMember[] = getOrgTeamMembers();

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {members.map((member) => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}

// ── History Section ──────────────────────────────────────────────────────────

function HistorySection() {
  const milestones = getOrgMilestones();

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

      <OrgTimeline items={milestones} />
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
        <BackButton href="/" />

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

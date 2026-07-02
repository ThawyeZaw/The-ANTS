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
        <p className="text-lg text-foreground-secondary leading-relaxed">
          At The ANTS, our core focus is helping IGCSE students achieve absolute
          academic excellence. But we are more than just a traditional tutoring
          service — we are a dynamic, student-led ecosystem designed to help you
          navigate your exams and your future.
        </p>
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
          Our greatest strength is our community of mentors. The ANTS teaching
          team is a diverse, global network of scholars who have successfully
          conquered the academic hurdles you are facing right now. Because our
          tutors come from a wide variety of prestigious academic pathways —
          including A-Levels, Polytechnics, University Foundation programs, the
          OSSD, and top UK Universities — they bring rich, firsthand experience
          to every lesson.
        </p>
      </div>

      {/* The ANTS Advantage */}
      <div className="bg-background-card border border-border rounded-2xl p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <Compass className="h-5 w-5 text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">The ANTS Advantage</h2>
        </div>
        <p className="text-foreground-secondary leading-relaxed text-base">
          When you learn with us, you are not just memorizing a syllabus. You
          are connecting with high-achieving seniors who understand your exact
          struggles. Whether you need rigorous IGCSE exam prep or real-world
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
          Join The ANTS Today
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
          A diverse network of scholars, educators, and student leaders working
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
          here is how The ANTS has evolved.
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 pb-20">
        {/* Back button */}
        <BackButton href="/" />

        {/* Tab Nav */}
        <div className="flex flex-wrap gap-1 p-1 bg-background-secondary rounded-xl border border-border mb-10 max-w-md mx-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeTab === tab.key
                  ? 'bg-background-card text-foreground shadow-sm border border-border'
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

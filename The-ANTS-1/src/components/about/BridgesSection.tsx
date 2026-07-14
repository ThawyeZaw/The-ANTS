  'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ExternalLink, ChevronLeft, ChevronRight, GraduationCap, Star, Mail } from 'lucide-react';
import type { OrgTeamMember } from '@/types';

// ── Colour palette for avatar gradients (cycles by index) ─────────────────
const AVATAR_PALETTES = [
  { from: '#00C6FF', to: '#0072FF' },
  { from: '#7F7FD5', to: '#86A8E7' },
  { from: '#11998E', to: '#38EF7D' },
  { from: '#F093FB', to: '#F5576C' },
  { from: '#4FACFE', to: '#00F2FE' },
  { from: '#43E97B', to: '#38F9D7' },
  { from: '#FA709A', to: '#FEE140' },
];

// ── Teaching Area / Mentorship selector data ───────────────────────────────
function getMemberSelectors(member: OrgTeamMember) {
  const titleLower = member.title.toLowerCase();
  const bioLower = member.bio.toLowerCase();

  let teachingAreas = 'IGCSE Core';
  if (bioLower.includes('physics')) teachingAreas = 'Physics & Maths';
  else if (bioLower.includes('chemistry') || bioLower.includes('biology')) teachingAreas = 'Sciences';
  else if (titleLower.includes('curriculum')) teachingAreas = 'Curriculum Design';
  else if (titleLower.includes('technical') || titleLower.includes('developer')) teachingAreas = 'EdTech';
  else if (titleLower.includes('community') || titleLower.includes('events')) teachingAreas = 'Events & Engagement';
  else if (titleLower.includes('content')) teachingAreas = 'Content QA';

  let mentorshipLevel = 'Senior Mentor';
  if (titleLower.includes('founder')) mentorshipLevel = 'Lead Mentor';
  else if (titleLower.includes('alumni')) mentorshipLevel = 'Peer Mentor';
  else if (titleLower.includes('student')) mentorshipLevel = 'Student Mentor';
  else if (titleLower.includes('head')) mentorshipLevel = 'Department Lead';

  const contactMethod = member.linkedProfileUsername ? 'Profile Page' : 'Platform DM';

  return { teachingAreas, mentorshipLevel, contactMethod };
}

function getActionLabel(member: OrgTeamMember) {
  const titleLower = member.title.toLowerCase();
  if (
    titleLower.includes('technical') ||
    titleLower.includes('developer') ||
    titleLower.includes('curriculum') ||
    titleLower.includes('content')
  )
    return 'VIEW FULL RESUME';
  return 'REQUEST MENTORING';
}

// ── Avatar component ───────────────────────────────────────────────────────
function MemberAvatar({
  member,
  index,
  size = 'md',
}: {
  member: OrgTeamMember;
  index: number;
  size?: 'sm' | 'md' | 'lg';
}) {
  const palette = AVATAR_PALETTES[index % AVATAR_PALETTES.length];
  const initial = member.name.charAt(0).toUpperCase();

  const sizeMap: Record<string, string> = {
    sm: 'w-14 h-14 text-2xl',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-44 h-44 text-6xl',
  };

  return (
    <div
      className={`${sizeMap[size]} rounded-full flex items-center justify-center font-black select-none flex-shrink-0`}
      style={{
        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
        boxShadow: `0 4px 24px ${palette.from}55`,
      }}
    >
      <span className="text-white drop-shadow-md">{initial}</span>
    </div>
  );
}

// ── Pill selector sub-component ────────────────────────────────────────────
function PillSelector({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className="flex items-center justify-between px-4 py-2.5 rounded-full text-xs font-semibold cursor-pointer"
      style={{
        background: hovered ? 'rgba(0,80,150,0.35)' : 'rgba(0,30,70,0.65)',
        border: `1px solid ${hovered ? 'rgba(0,198,255,0.55)' : 'rgba(0,198,255,0.18)'}`,
        color: 'rgba(180,210,255,0.9)',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex items-center gap-2" style={{ color: '#00C6FF' }}>
        {icon}
        <span style={{ color: 'rgba(150,190,240,0.8)' }}>{label}</span>
      </span>
      <span style={{ color: '#FFFFFF' }}>{value}</span>
    </div>
  );
}

// ── Pop-out card ───────────────────────────────────────────────────────────
function PopOutCard({
  member,
  memberIndex,
  allMembers,
  onNavigate,
  onClose,
  onKeepOpen,
}: {
  member: OrgTeamMember;
  memberIndex: number;
  allMembers: OrgTeamMember[];
  onNavigate: (index: number) => void;
  onClose: () => void;
  onKeepOpen: () => void;
}) {
  const { teachingAreas, mentorshipLevel, contactMethod } = getMemberSelectors(member);
  const actionLabel = getActionLabel(member);
  const palette = AVATAR_PALETTES[memberIndex % AVATAR_PALETTES.length];
  const prevIndex = (memberIndex - 1 + allMembers.length) % allMembers.length;
  const nextIndex = (memberIndex + 1) % allMembers.length;
  const [ctaHovered, setCtaHovered] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
      aria-modal="true"
    >
      {/* Card wrapper — pointer-events re-enabled here */}
      <div
        className="relative w-full max-w-sm pointer-events-auto"
        style={{
          borderRadius: '2rem',
          overflow: 'hidden',
          background: 'linear-gradient(160deg, #0A1628 0%, #061020 60%, #030C1A 100%)',
          border: '1px solid rgba(0, 198, 255, 0.20)',
          boxShadow:
            '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(0,198,255,0.08), 0 0 60px rgba(0,100,200,0.18)',
        }}
        onMouseEnter={onKeepOpen}
        onMouseLeave={onClose}
      >
        {/* ── Portrait area ── */}
        <div
          className="relative w-full flex items-center justify-center"
          style={{ height: '220px', background: '#040E1E' }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at 50% 35%, ${palette.from}28 0%, #040E1E 72%)`,
            }}
          />
          <MemberAvatar member={member} index={memberIndex} size="lg" />

          {/* Bottom gradient fade */}
          <div
            className="absolute inset-x-0 bottom-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to top, #061020, transparent)' }}
          />

          {/* Left nav arrow */}
          <NavArrow direction="left" onClick={() => onNavigate(prevIndex)} />

          {/* Right nav arrow */}
          <NavArrow direction="right" onClick={() => onNavigate(nextIndex)} />

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {allMembers.map((_, i) => (
              <button
                key={i}
                onClick={() => onNavigate(i)}
                className="rounded-full cursor-pointer"
                style={{
                  width: i === memberIndex ? '18px' : '6px',
                  height: '6px',
                  background: i === memberIndex ? '#00C6FF' : 'rgba(255,255,255,0.3)',
                  transition: 'width 0.3s ease, background 0.3s ease',
                  border: 'none',
                  padding: 0,
                }}
                aria-label={`Go to ${allMembers[i].name}`}
              />
            ))}
          </div>

          {/* Alumni badge */}
          {member.isAlumni && (
            <span
              className="absolute top-3 right-3 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full z-10"
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                color: '#FCD34D',
              }}
            >
              Alumni
            </span>
          )}
        </div>

        {/* ── Content area ── */}
        <div className="px-5 pb-5 pt-4 space-y-4">
          {/* Name & Role */}
          <div>
            <h3 className="text-xl font-black leading-tight text-white">{member.name}</h3>
            <p className="text-sm font-semibold mt-0.5" style={{ color: '#00C6FF' }}>
              {member.title}
            </p>
          </div>

          {/* Bio */}
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(180,210,255,0.82)' }}>
            {member.bio}
          </p>

          {/* Pill selectors */}
          <div className="space-y-2">
            <PillSelector
              icon={<GraduationCap className="w-3.5 h-3.5" />}
              label="Teaching Areas"
              value={teachingAreas}
            />
            <PillSelector
              icon={<Star className="w-3.5 h-3.5" />}
              label="Mentorship Level"
              value={mentorshipLevel}
            />
            <PillSelector
              icon={<Mail className="w-3.5 h-3.5" />}
              label="Contact Method"
              value={contactMethod}
            />
          </div>

          {/* CTA button */}
          <a
            href={member.linkedProfileUsername ? `/profile/${member.linkedProfileUsername}` : '#'}
            className="flex w-full items-center justify-center gap-2 py-3.5 rounded-full text-xs font-black uppercase tracking-widest"
            style={{
              background: 'linear-gradient(90deg, #00C6FF, #0072FF)',
              color: '#000D1A',
              boxShadow: ctaHovered
                ? '0 6px 28px rgba(0,198,255,0.65)'
                : '0 4px 20px rgba(0,198,255,0.35)',
              transform: ctaHovered ? 'translateY(-1px)' : 'translateY(0)',
              letterSpacing: '0.12em',
              transition: 'box-shadow 0.25s ease, transform 0.25s ease',
              textDecoration: 'none',
            }}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
          >
            {actionLabel}
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Nav Arrow helper ───────────────────────────────────────────────────────
function NavArrow({
  direction,
  onClick,
}: {
  direction: 'left' | 'right';
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const isLeft = direction === 'left';

  return (
    <button
      onClick={onClick}
      className="absolute top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
      style={{
        [isLeft ? 'left' : 'right']: '12px',
        background: hovered ? 'rgba(0,198,255,0.18)' : 'rgba(0,20,50,0.75)',
        border: `1px solid ${hovered ? 'rgba(0,198,255,0.65)' : 'rgba(0,198,255,0.22)'}`,
        backdropFilter: 'blur(8px)',
        transition: 'background 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={isLeft ? 'Previous member' : 'Next member'}
    >
      {isLeft ? (
        <ChevronLeft className="w-4 h-4" style={{ color: '#00C6FF' }} />
      ) : (
        <ChevronRight className="w-4 h-4" style={{ color: '#00C6FF' }} />
      )}
    </button>
  );
}

// ── Grid preview card ──────────────────────────────────────────────────────
function GridPreviewCard({
  member,
  index,
  isBlurred,
  onHover,
}: {
  member: OrgTeamMember;
  index: number;
  isBlurred: boolean;
  onHover: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className="relative flex flex-col items-center gap-3 py-5 px-3 cursor-pointer rounded-2xl"
      style={{
        background: hovered && !isBlurred
          ? 'rgba(0,40,90,0.75)'
          : 'rgba(6,18,40,0.7)',
        border: `1px solid ${hovered && !isBlurred ? 'rgba(0,198,255,0.45)' : 'rgba(0,198,255,0.10)'}`,
        backdropFilter: 'blur(6px)',
        filter: isBlurred ? 'blur(3px) brightness(0.45)' : 'none',
        opacity: isBlurred ? 0.55 : 1,
        transform: isBlurred
          ? 'scale(0.97)'
          : hovered
          ? 'translateY(-4px) scale(1.03)'
          : 'scale(1)',
        boxShadow: hovered && !isBlurred ? '0 8px 32px rgba(0,100,200,0.3)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        userSelect: 'none',
      }}
      onMouseEnter={() => {
        setHovered(true);
        onHover();
      }}
      onMouseLeave={() => {
        setHovered(false);
      }}
      onFocus={onHover}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onHover();
      }}
    >
      <MemberAvatar member={member} index={index} size="md" />

      <h3 className="text-sm font-bold text-center leading-tight text-white">
        {member.name}
      </h3>

      <p
        className="text-[11px] font-semibold text-center leading-snug"
        style={{ color: '#00C6FF', opacity: 0.85 }}
      >
        {member.title}
      </p>
    </div>
  );
}

// ── Main BridgesSection component ─────────────────────────────────────────
export default function BridgesSection({ members }: { members: OrgTeamMember[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopout = useCallback((index: number) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setActiveIndex(index);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimerRef.current = setTimeout(() => setActiveIndex(null), 150);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  const sortedMembers = [...members].sort((a, b) => a.order - b.order);

  return (
    <section
      className="relative w-full py-16 px-4 overflow-hidden"
      style={{ background: '#030B18' }}
    >
      {/* Ambient radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,100,200,0.14) 0%, transparent 68%)',
        }}
      />

      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(0,198,255,0.3) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
          opacity: 0.18,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        {/* ── Header ── */}
        <div className="text-center mb-12">
          <p
            className="text-xs font-black uppercase tracking-[0.3em] mb-3"
            style={{ color: '#00C6FF' }}
          >
            Our People
          </p>

          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-black leading-tight"
            style={{ color: '#FFFFFF' }}
          >
            Bridges to{' '}
            <span
              style={{
                background: 'linear-gradient(90deg, #00C6FF 0%, #0072FF 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Global Education
            </span>
          </h2>

          <p
            className="mt-4 text-base max-w-xl mx-auto leading-relaxed"
            style={{ color: 'rgba(160,200,255,0.65)' }}
          >
            Meet the educators and mentors building pathways from Myanmar to the world.
            Hover any profile to explore their journey.
          </p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <div className="h-px w-12 rounded" style={{ background: 'rgba(0,198,255,0.28)' }} />
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00C6FF' }} />
            <div className="h-px w-12 rounded" style={{ background: 'rgba(0,198,255,0.28)' }} />
          </div>
        </div>

        {/* ── Card Grid ── */}
        <div
          className="grid gap-4"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          }}
          onMouseLeave={scheduleClose}
        >
          {sortedMembers.map((member, index) => (
            <GridPreviewCard
              key={member.id}
              member={member}
              index={index}
              isBlurred={activeIndex !== null && activeIndex !== index}
              onHover={() => openPopout(index)}
            />
          ))}
        </div>

        <p
          className="text-center text-xs mt-8"
          style={{ color: 'rgba(100,150,210,0.45)' }}
        >
          Hover any card to view full profile ·{' '}
          {sortedMembers.length} team members
        </p>
      </div>

      {/* ── Pop-out overlay ── */}
      {activeIndex !== null && (
        <PopOutCard
          member={sortedMembers[activeIndex]}
          memberIndex={activeIndex}
          allMembers={sortedMembers}
          onNavigate={openPopout}
          onClose={scheduleClose}
          onKeepOpen={cancelClose}
        />
      )}
    </section>
  );
}

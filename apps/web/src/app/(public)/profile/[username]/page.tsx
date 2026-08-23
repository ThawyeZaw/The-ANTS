'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Unified Public Profile Page (Student, Tutor, Contributor, Admin)
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2,
  ExternalLink,
  Award,
  Star,
  GraduationCap,
  Layers,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileAboutCard from '@/components/profile/ProfileAboutCard';
import ProfileActivity from '@/components/profile/ProfileActivity';
import CertificationSection from '@/components/profile/CertificationSection';
import TutorPublicProfile from '@/components/profile/TutorPublicProfile';
import ContributorPublicProfile from '@/components/profile/ContributorPublicProfile';
import { PROFILE_THEME_PRESETS, type Profile } from '@/types';
import { cn, formatDate } from '@/lib/utils';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const username = params.username as string;

  // Handle "me" → redirect to actual username
  useEffect(() => {
    if (username === 'me' && user) {
      router.replace(`/profile/${user.profile.username}`);
    }
  }, [username, user, router]);

  const {
    profile,
    tutorProfile,
    contributorProfile,
    stats,
    activities: timelineActivities,
    projects: rawProjects,
    portfolioActivities: rawActivities,
    achievements: rawAchievements,
    certifications: profileCerts,
    isLoading,
    isOwnProfile,
    notFound,
  } = useProfile(username);

  // ── Compute theme CSS variables ───────────────────────────────────────────
  const themeColors = useMemo(() => {
    if (!profile?.theme) return null;
    const preset = PROFILE_THEME_PRESETS.find((p) => p.key === profile.theme!.preset);
    if (!preset) return null;
    return {
      '--profile-accent': profile.theme.accentColor || preset.colors.accent,
      '--profile-bg': profile.theme.backgroundColor || preset.colors.background,
      '--profile-card': preset.colors.card,
    };
  }, [profile?.theme]);

  // ── Filter visible items ──────────────────────────────────────────────────
  const projects = useMemo(
    () => rawProjects.filter((p) => !p.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [rawProjects]
  );
  const activities = useMemo(
    () => rawActivities.filter((a) => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [rawActivities]
  );
  const achievements = useMemo(
    () => rawAchievements.filter((a) => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [rawAchievements]
  );
  const academicGrades = useMemo(
    () => (profile?.academicGrades || []).filter((g) => !g.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile?.academicGrades]
  );
  const testimonials = useMemo(
    () => (profile?.testimonials || []).filter((t) => !t.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile?.testimonials]
  );
  const certifications = useMemo(
    () => (profile?.certifications || []).filter((c) => !c.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile?.certifications]
  );

  // Loading state
  if (username === 'me' || isLoading) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 animate-fade-in">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
        <p className="text-sm font-medium text-foreground-muted">Loading profile...</p>
      </div>
    );
  }

  // 404 state
  if (notFound || !profile || (!profile.isPublic && !isOwnProfile)) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 animate-fade-in">
        <h1 className="text-xl font-bold text-foreground mb-3">Profile Unavailable</h1>
        <p className="text-sm text-foreground-secondary leading-relaxed mb-6">
          The user <span className="font-mono text-foreground font-semibold">@{username}</span> could not be found, or their profile is set to private.
        </p>
        <BackButton href="/" label="Back to Home" />
      </div>
    );
  }

  const userRoles = profile.roles || [profile.role];
  const isTutor = userRoles.includes('tutor') || userRoles.includes('teacher') || !!tutorProfile;
  const isContributor = (userRoles.includes('contributor') || userRoles.includes('admin') || userRoles.includes('main_contributor')) && !isTutor;

  // ── Render Dedicated Tutor Profile ─────────────────────────────────────────
  if (isTutor) {
    return (
      <TutorPublicProfile
        profile={profile}
        tutorProfile={tutorProfile}
        certifications={profileCerts}
        isOwnProfile={isOwnProfile}
      />
    );
  }

  // ── Render Contributor Profile ─────────────────────────────────────────────
  if (isContributor && contributorProfile) {
    return (
      <ContributorPublicProfile
        profile={profile}
      />
    );
  }

  // ── Section ordering for Student / General profile ─────────────────────────
  const showProjects = profile.sectionVisibility?.projects !== false && projects.length > 0;
  const showActivities = profile.sectionVisibility?.activities !== false && activities.length > 0;
  const showAchievements = profile.sectionVisibility?.achievements !== false && achievements.length > 0;
  const showGrades = profile.sectionVisibility?.academicGrades !== false && academicGrades.length > 0;
  const showTestimonials = profile.sectionVisibility?.testimonials !== false && testimonials.length > 0;
  const showCertifications = profile.sectionVisibility?.certifications !== false && certifications.length > 0;

  const sectionOrder = profile.sectionOrder || ['projects', 'activities', 'achievements', 'academicGrades', 'testimonials', 'certifications'];
  const sectionsMap: Record<string, { key: string; visible: boolean; content: React.ReactNode }> = {
    projects: {
      key: 'projects',
      visible: showProjects,
      content: <ProjectsSection key="projects" projects={projects} profile={profile} />,
    },
    activities: {
      key: 'activities',
      visible: showActivities,
      content: <ActivitiesSection key="activities" activities={activities} profile={profile} />,
    },
    achievements: {
      key: 'achievements',
      visible: showAchievements,
      content: <AchievementsSection key="achievements" achievements={achievements} profile={profile} />,
    },
    academicGrades: {
      key: 'academicGrades',
      visible: showGrades,
      content: <GradesSection key="academicGrades" grades={academicGrades} />,
    },
    testimonials: {
      key: 'testimonials',
      visible: showTestimonials,
      content: <TestimonialsSection key="testimonials" testimonials={testimonials} profile={profile} />,
    },
    certifications: {
      key: 'certifications',
      visible: showCertifications,
      content: <CertificationsSection key="certifications" certifications={certifications} profile={profile} />,
    },
  };

  const orderedSections = sectionOrder
    .map((key) => sectionsMap[key])
    .filter((s) => s && s.visible)
    .map((s) => s.content);

  const spacingClass = profile.spacing === 'spacious' ? 'space-y-10' : 'space-y-6';
  const widthClass = profile.width === 'full' ? 'max-w-7xl' : 'max-w-5xl';

  return (
    <div
      className={`${widthClass} mx-auto ${spacingClass} animate-fade-in pb-12`}
      style={themeColors ? (themeColors as React.CSSProperties) : undefined}
    >
      <BackButton noFallback label="Back to Explore" />

      {/* Private Profile Banner for Owner */}
      {isOwnProfile && profile.isPublic === false && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-semibold text-amber-600 dark:text-amber-400 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-4 h-4 text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-foreground">Private Profile</p>
              <p className="text-[11px] text-foreground-muted font-normal">
                Only you can see this page. Other users and visitors cannot view this profile.
              </p>
            </div>
          </div>
          <Link
            href="/settings/profile"
            className="px-4 py-2 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors whitespace-nowrap self-start sm:self-center shadow-xs"
          >
            Change in Settings
          </Link>
        </div>
      )}

      {/* Profile Hero */}
      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {/* About Me Panel */}
      <ProfileAboutCard profile={profile} />

      {/* Structured Certifications */}
      {profileCerts.length > 0 && (
        <CertificationSection certifications={profileCerts} />
      )}

      {/* Portfolio Sections */}
      {orderedSections.length > 0 && (
        <div className="space-y-6">
          {orderedSections}
        </div>
      )}

      {/* Recent Activity */}
      {timelineActivities.length > 0 && (
        <ProfileActivity activities={timelineActivities as any} />
      )}
    </div>
  );
}

// ── Portfolio Sections ───────────────────────────────────────────────────────

function ProjectsSection({ projects, profile }: { projects: any[]; profile: Profile }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Layers className="h-4 w-4 text-violet-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Featured Projects</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-3 hover:border-violet-500/30 transition-all duration-300"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-violet-500 transition-colors">
              {project.title}
            </h3>
            {project.description && (
              <p className="text-sm text-foreground-secondary leading-relaxed">{project.description}</p>
            )}
            {project.technologies && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {project.technologies.map((t: string, i: number) => (
                  <span key={i} className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-background-card border border-border text-foreground-muted">
                    {t}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivitiesSection({ activities, profile }: { activities: any[]; profile: Profile }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Activities & Leadership</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="group rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-2 hover:border-emerald-500/30 transition-all duration-300"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-500 transition-colors">{activity.name}</h3>
            <p className="text-xs font-semibold text-emerald-600">
              {activity.role} at {activity.organization}
            </p>
            {activity.description && (
              <p className="text-sm text-foreground-secondary leading-relaxed">{activity.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection({ achievements, profile }: { achievements: any[]; profile: Profile }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Award className="h-4 w-4 text-amber-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Achievements & Honors</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="group rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-1 hover:border-amber-500/30 transition-all duration-300"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-amber-500 transition-colors">{achievement.title}</h3>
            {achievement.description && (
              <p className="text-sm text-foreground-secondary leading-relaxed">{achievement.description}</p>
            )}
            {achievement.issuer && <span className="text-xs text-foreground-muted">{achievement.issuer}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}

function GradesSection({ grades }: { grades: any[] }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-blue-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Academic Results</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="group rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-1 hover:border-blue-500/30 transition-all duration-300"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-blue-500 transition-colors">{grade.title}</h3>
            {grade.description && (
              <p className="text-sm text-foreground-secondary">{grade.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection({ testimonials, profile }: { testimonials: any[]; profile: Profile }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-rose-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Testimonials</h2>
      </div>
      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-2"
          >
            <p className="text-sm text-foreground-secondary italic leading-relaxed">
              &ldquo;{testimonial.content}&rdquo;
            </p>
            <p className="text-xs font-semibold text-foreground">{testimonial.fromName} — <span className="text-foreground-muted font-normal">{testimonial.fromTitle}</span></p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationsSection({ certifications, profile }: { certifications: any[]; profile: Profile }) {
  return (
    <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-teal-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Certifications</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="group rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-1 hover:border-teal-500/30 transition-all duration-300"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-teal-500 transition-colors">{cert.title}</h3>
            <p className="text-xs text-foreground-muted">{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

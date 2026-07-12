'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — Public Profile Page (All Roles)
// Displays a user's public profile with projects, activities, achievements, 
// academic grades, and role-specific stats. Supports theme, layout, and section
// ordering customization.
// ──────────────────────────────────────────────────────────────────────────────

import BackButton from '@/components/ui/BackButton';
import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  UserX,
  Loader2,
  ExternalLink,
  Award,
  Pin,
  Star,
  GraduationCap,
  Code2,
  Camera,
  Music2,
  Globe,
  Link2,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActivity from '@/components/profile/ProfileActivity';
import CertificationSection from '@/components/profile/CertificationSection';
import ClubMembershipsPanel from '@/components/profile/ClubMembershipsPanel';
import { PROFILE_THEME_PRESETS, type Profile } from '@/types';
import { cn } from '@/lib/utils';

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
    stats,
    activities: timelineActivities,
    projects: rawProjects,
    portfolioActivities: rawActivities,
    achievements: rawAchievements,
    certifications: profileCerts,
    clubMemberships,
    clubProjects,
    clubActivity,
    isLoading,
    isOwnProfile,
    notFound,
  } = useProfile(username);

  // ── Compute theme CSS variables ───────────────────────────────────────────
  const themeColors = useMemo(() => {
    if (!profile?.theme) return null;
    const preset = PROFILE_THEME_PRESETS.find(p => p.key === profile.theme!.preset);
    if (!preset) return null;
    return {
      '--profile-accent': profile.theme.accentColor || preset.colors.accent,
      '--profile-bg': profile.theme.backgroundColor || preset.colors.background,
      '--profile-card': preset.colors.card,
    };
  }, [profile?.theme]);

  // ── Filter visible items ──────────────────────────────────────────────────
  const projects = useMemo(() =>
    rawProjects.filter(p => !p.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [rawProjects]);
  const activities = useMemo(() =>
    rawActivities.filter(a => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [rawActivities]);
  const achievements = useMemo(() =>
    rawAchievements.filter(a => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [rawAchievements]);
  const academicGrades = useMemo(() =>
    (profile?.academicGrades || []).filter(g => !g.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [profile?.academicGrades]);
  const testimonials = useMemo(() =>
    (profile?.testimonials || []).filter(t => !t.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [profile?.testimonials]);
  const certifications = useMemo(() =>
    (profile?.certifications || []).filter(c => !c.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
  [profile?.certifications]);

  // Merge club projects into portfolio projects if enabled
  const allProjects = useMemo(() => {
    const profileProjects = projects.map(p => ({ ...p, isClubProject: false }));
    if (profile?.showClubProjects !== false) {
      const clubProj = clubProjects.map(p => ({ ...p, isClubProject: true }));
      return [...profileProjects, ...clubProj];
    }
    return profileProjects;
  }, [projects, clubProjects, profile?.showClubProjects]);

  // Merge club activity into timeline
  const allTimelineActivities = useMemo(() => {
    if (profile?.showClubActivity !== false) {
      return [...timelineActivities, ...clubActivity].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return timelineActivities;
  }, [timelineActivities, clubActivity, profile?.showClubActivity]);

  // ── Pinned item ───────────────────────────────────────────────────────────
  const pinnedItemId = profile?.pinnedItemId;
  let pinnedItem: any = null;
  let pinnedType = '';
  if (pinnedItemId) {
    if (projects.find(p => p.id === pinnedItemId)) { pinnedItem = projects.find(p => p.id === pinnedItemId); pinnedType = 'project'; }
    else if (activities.find(a => a.id === pinnedItemId)) { pinnedItem = activities.find(a => a.id === pinnedItemId); pinnedType = 'activity'; }
    else if (achievements.find(a => a.id === pinnedItemId)) { pinnedItem = achievements.find(a => a.id === pinnedItemId); pinnedType = 'achievement'; }
    else if (academicGrades.find(g => g.id === pinnedItemId)) { pinnedItem = academicGrades.find(g => g.id === pinnedItemId); pinnedType = 'grade'; }
    else if (testimonials.find(t => t.id === pinnedItemId)) { pinnedItem = testimonials.find(t => t.id === pinnedItemId); pinnedType = 'testimonial'; }
    else if (certifications.find(c => c.id === pinnedItemId)) { pinnedItem = certifications.find(c => c.id === pinnedItemId); pinnedType = 'certification'; }
  }

  // ── Section visibility ────────────────────────────────────────────────────
  const showProjects = profile?.sectionVisibility?.projects !== false && allProjects.length > 0;
  const showActivities = profile?.sectionVisibility?.activities !== false && activities.length > 0;
  const showAchievements = profile?.sectionVisibility?.achievements !== false && achievements.length > 0;
  const showGrades = profile?.sectionVisibility?.academicGrades !== false && academicGrades.length > 0;
  const showTestimonials = profile?.sectionVisibility?.testimonials !== false && testimonials.length > 0;
  const showCertifications = profile?.sectionVisibility?.certifications !== false && certifications.length > 0;
  const showStructuredCerts = profileCerts.length > 0;
  const showClubs = profile?.showClubMemberships !== false && clubMemberships.length > 0;

  // ── Section ordering ──────────────────────────────────────────────────────
  const sectionOrder = profile?.sectionOrder || ['projects', 'activities', 'achievements', 'academicGrades', 'testimonials', 'certifications'];
  const sectionsMap: Record<string, { key: string; visible: boolean; content: React.ReactNode }> = {
    projects: {
      key: 'projects',
      visible: showProjects,
      content: <ProjectsSection key="projects" projects={allProjects} profile={profile!} />,
    },
    activities: {
      key: 'activities',
      visible: showActivities,
      content: <ActivitiesSection key="activities" activities={activities} profile={profile!} />,
    },
    achievements: {
      key: 'achievements',
      visible: showAchievements,
      content: <AchievementsSection key="achievements" achievements={achievements} profile={profile!} />,
    },
    academicGrades: {
      key: 'academicGrades',
      visible: showGrades,
      content: <GradesSection key="academicGrades" grades={academicGrades} />,
    },
    testimonials: {
      key: 'testimonials',
      visible: showTestimonials,
      content: <TestimonialsSection key="testimonials" testimonials={testimonials} profile={profile!} />,
    },
    certifications: {
      key: 'certifications',
      visible: showCertifications,
      content: <CertificationsSection key="certifications" certifications={certifications} profile={profile!} />,
    },
  };

  const orderedSections = sectionOrder
    .map(key => sectionsMap[key])
    .filter(s => s && s.visible)
    .map(s => s.content);

  const hasPortfolio = orderedSections.length > 0;
  const isContributor = profile?.role === 'contributor' || profile?.role === 'main_contributor';

  // ── Layout classes ────────────────────────────────────────────────────────
  const spacingClass = profile?.spacing === 'spacious' ? 'space-y-10' : 'space-y-6';
  const widthClass = profile?.width === 'full' ? 'max-w-7xl' : 'max-w-5xl';
  const sectionLayout = profile?.sectionLayout || 'layout-a';

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
        <BackButton href="/" label="Go Back" />
      </div>
    );
  }

  return (
    <div
      className={`${widthClass} mx-auto ${spacingClass} animate-fade-in pb-12`}
      style={themeColors ? (themeColors as React.CSSProperties) : undefined}
    >
      <BackButton href="/" label="Back" />

      {/* Profile Hero */}
      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {/* Stats (contributor/main_contributor only) */}
      {isContributor && stats && (
        <ProfileStats stats={stats} memberSince={profile.createdAt} />
      )}

      {/* ── Pinned Item Section ─── */}
      {pinnedItem && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--profile-accent)' }} />
            <Pin className="h-4 w-4" style={{ color: 'var(--profile-accent)' }} />
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground-secondary">Pinned Highlight</h2>
          </div>

          <div className="pl-4 border-l-2" style={{ borderColor: 'var(--profile-accent)' }}>
            {pinnedType === 'project' && (
              <div>
                <h3 className="text-lg font-bold text-foreground">{pinnedItem.title}</h3>
                {pinnedItem.role && <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--profile-accent)' }}>{pinnedItem.role}</p>}
                <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{pinnedItem.description}</p>
                {pinnedItem.technologies && pinnedItem.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {pinnedItem.technologies.map((tech: string) => (
                      <span key={tech} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-background-secondary/50 text-foreground-muted">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {pinnedItem.links?.live && (
                  <a href={pinnedItem.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors" style={{ backgroundColor: 'var(--profile-accent)', color: '#fff' }}>
                    View Project <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            {pinnedType === 'achievement' && (
              <div className="flex gap-3 items-start">
                <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--profile-accent)', opacity: 0.1 }}>
                  <Award className="h-4 w-4" style={{ color: 'var(--profile-accent)' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{pinnedItem.title}</h3>
                  <p className="text-xs font-medium text-foreground-muted mt-1">{pinnedItem.issuer} • {pinnedItem.date}</p>
                  {pinnedItem.description && <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{pinnedItem.description}</p>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── Portfolio Sections ─── */}
      {sectionLayout === 'layout-b' ? (
        /* Full-width single column */
        <div className="space-y-8">{orderedSections}</div>
      ) : sectionLayout === 'layout-c' ? (
        /* Two-column with sidebar (equal columns) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {orderedSections.filter((_, i) => i % 2 === 0)}
          </div>
          <div className="space-y-8">
            {orderedSections.filter((_, i) => i % 2 === 1)}
          </div>
        </div>
      ) : (
        /* Layout A: Two-column default (equal columns) */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            {orderedSections.filter((_, i) => i % 2 === 0)}
          </div>
          <div className="space-y-8">
            {orderedSections.filter((_, i) => i % 2 === 1)}
          </div>
        </div>
      )}

      {/* Activity Feed (contributor/main_contributor only) */}
      {isContributor && <ProfileActivity activities={allTimelineActivities} />}

      {/* Structured Academic Certifications */}
      {showStructuredCerts && (
        <CertificationSection certifications={profileCerts} />
      )}

      {/* Club Memberships */}
      {showClubs && (
        <ClubMembershipsPanel memberships={clubMemberships} />
      )}

      {/* Empty state */}
      {!hasPortfolio && !isContributor && !showStructuredCerts && !showClubs && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-12 text-center max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-5">
            <UserX className="h-7 w-7 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Portfolio Empty</h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {isOwnProfile
              ? 'Your portfolio is looking a bit empty! Head over to Settings > Edit Profile to add your projects, activities, academic grades, and achievements.'
              : `@${profile.username} hasn't added any public portfolio items yet.`}
          </p>
          {isOwnProfile && (
             <button onClick={() => router.push('/settings/profile')} className="mt-6 px-5 py-2.5 text-sm font-medium rounded-full bg-primary/20 border border-primary/30 text-primary hover:bg-primary/30 transition-all cursor-pointer backdrop-blur-sm">
               Setup Portfolio
             </button>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
//  Section Components (Continuous Flow — no card borders/backgrounds)
//  Sections stack seamlessly with only headers and subtle dividers.
// ═══════════════════════════════════════════════════════════════════════════════

function ProjectsSection({ projects, profile }: { projects: any[]; profile: Profile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Code2 className="h-4 w-4 text-violet-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Projects</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {projects.map((project) => (
          <div
            key={project.id}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-violet-500/20 hover:bg-violet-500/[0.03] hover:shadow-lg hover:shadow-violet-500/5"
          >
            <h3 className="font-bold text-foreground text-base group-hover:text-violet-400 transition-colors">
              {project.title}
            </h3>
            {project.role && (
              <p className="text-xs font-medium text-violet-400/80 mt-0.5">
                {project.role}
              </p>
            )}
            <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">
              {project.description}
            </p>
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.technologies.map((tech: string) => (
                  <span key={tech} className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-foreground-muted">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {project.links && Object.keys(project.links).length > 0 && (
              <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/5">
                {project.links.github && (
                  <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors">
                    <Code2 className="h-3 w-3" /> Source
                  </a>
                )}
                {project.links.live && (
                  <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors">
                    <ExternalLink className="h-3 w-3" /> Live Demo
                  </a>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function ActivitiesSection({ activities }: { activities: any[]; profile: Profile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Activities & CCA</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-emerald-400 transition-colors">{activity.name}</h3>
            <p className="text-xs font-medium text-emerald-400/80 mt-0.5">
              {activity.role} at {activity.organization}
            </p>
            <span className="inline-block mt-2 text-[11px] font-mono text-foreground-muted px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">
              {activity.start_date} {activity.end_date ? `— ${activity.end_date}` : '— Present'}
            </span>
            {activity.description && (
              <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{activity.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection({ achievements }: { achievements: any[]; profile: Profile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <Award className="h-4 w-4 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Achievements</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-amber-500/20 hover:bg-amber-500/[0.03]"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-amber-400 transition-colors">{achievement.title}</h3>
            {achievement.description && (
              <p className="text-sm text-foreground-secondary mt-1 leading-relaxed">{achievement.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-foreground-muted">
              {achievement.issuer && <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/5">{achievement.issuer}</span>}
              {achievement.date && <span className="text-foreground-muted/60">{achievement.date}</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GradesSection({ grades }: { grades: any[] }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-blue-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Academic Grades</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {grades.map((grade) => (
          <div
            key={grade.id}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-blue-500/20 hover:bg-blue-500/[0.03]"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-blue-400 transition-colors">{grade.title}</h3>
            {grade.description && (
              <p className="text-sm text-foreground-secondary mt-1 leading-relaxed">{grade.description}</p>
            )}
            {grade.fileUrl && (
              <a href={grade.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors">
                View Certificate <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection({ testimonials, profile }: { testimonials: any[]; profile: Profile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
          <Star className="h-4 w-4 text-rose-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Testimonials</h2>
      </div>
      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-rose-500/20 hover:bg-rose-500/[0.03]"
          >
            <p className="text-sm text-foreground-secondary italic leading-relaxed">
              &ldquo;{testimonial.content}&rdquo;
            </p>
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/5">
              <div className="w-7 h-7 rounded-full bg-rose-500/15 flex items-center justify-center border border-rose-500/20">
                <span className="text-[11px] font-bold text-rose-400">
                  {testimonial.fromName.charAt(0)}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{testimonial.fromName}</p>
                <p className="text-[11px] text-foreground-muted">{testimonial.fromTitle}</p>
              </div>
              {testimonial.date && (
                <span className="ml-auto text-[11px] text-foreground-muted">{testimonial.date}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CertificationsSection({ certifications, profile }: { certifications: any[]; profile: Profile }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center">
          <GraduationCap className="h-4 w-4 text-teal-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Certifications</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certifications.map((cert) => (
          <div
            key={cert.id}
            className="group rounded-xl border border-white/5 bg-white/[0.02] p-4 transition-all duration-300 hover:border-teal-500/20 hover:bg-teal-500/[0.03]"
          >
            <h3 className="font-bold text-foreground text-sm group-hover:text-teal-400 transition-colors">{cert.title}</h3>
            <p className="text-xs text-foreground-muted mt-0.5">{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</p>
            {cert.credentialUrl && (
              <a
                href={cert.credentialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs font-medium text-teal-400 hover:text-teal-300 transition-colors"
              >
                View Credential <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

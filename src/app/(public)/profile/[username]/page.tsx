'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Profile Page (All Roles)
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
  const showProjects = profile?.sectionVisibility?.projects !== false && projects.length > 0;
  const showActivities = profile?.sectionVisibility?.activities !== false && activities.length > 0;
  const showAchievements = profile?.sectionVisibility?.achievements !== false && achievements.length > 0;
  const showGrades = profile?.sectionVisibility?.academicGrades !== false && academicGrades.length > 0;
  const showTestimonials = profile?.sectionVisibility?.testimonials !== false && testimonials.length > 0;
  const showCertifications = profile?.sectionVisibility?.certifications !== false && certifications.length > 0;

  // ── Section ordering ──────────────────────────────────────────────────────
  const sectionOrder = profile?.sectionOrder || ['projects', 'activities', 'achievements', 'academicGrades', 'testimonials', 'certifications'];
  const sectionsMap: Record<string, { key: string; visible: boolean; content: React.ReactNode }> = {
    projects: {
      key: 'projects',
      visible: showProjects,
      content: <ProjectsSection key="projects" projects={projects} profile={profile!} />,
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
      {isContributor && <ProfileActivity activities={timelineActivities} />}

      {/* Empty state */}
      {!hasPortfolio && !isContributor && (
        <div className="text-center py-16 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <UserX className="h-5 w-5 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Portfolio Empty</h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {isOwnProfile
              ? 'Your portfolio is looking a bit empty! Head over to Settings > Edit Profile to add your projects, activities, academic grades, and achievements.'
              : `@${profile.username} hasn't added any public portfolio items yet.`}
          </p>
          {isOwnProfile && (
             <button onClick={() => router.push('/settings/profile')} className="mt-6 px-4 py-2 text-sm font-medium transition-all rounded-lg cursor-pointer" style={{ backgroundColor: 'var(--profile-accent, #6366f1)', color: '#fff' }}>
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
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full" style={{ backgroundColor: 'var(--profile-accent)' }} />
        <h2 className="text-lg font-bold text-foreground">Projects</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {projects.map((project) => (
          <div key={project.id} className="group">
            <div className="flex items-start gap-1 mb-1.5">
              <div
                className="w-0.5 h-5 mt-1.5 shrink-0 rounded-full transition-colors group-hover:opacity-100 opacity-40"
                style={{ backgroundColor: 'var(--profile-accent)' }}
              />
              <h3
                className="font-bold text-foreground text-base ml-1.5 transition-colors group-hover"
                style={{ '--hover-color': 'var(--profile-accent)' } as React.CSSProperties}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--profile-accent)')}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >
                {project.title}
              </h3>
            </div>
            {project.role && (
              <p className="text-xs font-medium ml-2.5 -mt-0.5" style={{ color: 'var(--profile-accent)' }}>
                {project.role}
              </p>
            )}
            <p className="text-sm text-foreground-secondary mt-2 ml-2.5 leading-relaxed">
              {project.description}
            </p>
            {project.technologies && project.technologies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2.5 ml-2.5">
                {project.technologies.map((tech: string) => (
                  <span key={tech} className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-background-secondary/50 text-foreground-muted">
                    {tech}
                  </span>
                ))}
              </div>
            )}
            {project.links && Object.keys(project.links).length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2.5 ml-2.5">
                {project.links.github && (
                  <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors">
                    <Code2 className="h-3 w-3" /> Source
                  </a>
                )}
                {project.links.live && (
                  <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium transition-colors" style={{ color: 'var(--profile-accent)' }}>
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
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-emerald-500" />
        <h2 className="text-lg font-bold text-foreground">Activities & CCA</h2>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {activities.map((activity) => (
          <div key={activity.id} className="group">
            <div className="flex items-start gap-2">
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                <Star className="h-3.5 w-3.5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground text-sm">{activity.name}</h3>
                <p className="text-xs font-medium text-emerald-500/80">
                  {activity.role} at {activity.organization}
                </p>
                <span className="inline-block mt-1 text-[11px] font-mono text-foreground-muted">
                  {activity.start_date} {activity.end_date ? `— ${activity.end_date}` : '— Present'}
                </span>
                {activity.description && (
                  <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{activity.description}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function AchievementsSection({ achievements }: { achievements: any[]; profile: Profile }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-amber-500" />
        <h2 className="text-lg font-bold text-foreground">Achievements</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex items-start gap-3 group">
            <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <Award className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm">{achievement.title}</h3>
              {achievement.description && (
                <p className="text-sm text-foreground-secondary mt-1 leading-relaxed">{achievement.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-foreground-muted">
                {achievement.issuer && <span>{achievement.issuer}</span>}
                {achievement.issuer && achievement.date && <span>•</span>}
                {achievement.date && <span>{achievement.date}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function GradesSection({ grades }: { grades: any[] }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-blue-500" />
        <h2 className="text-lg font-bold text-foreground">Academic Grades</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {grades.map((grade) => (
          <div key={grade.id} className="flex items-start gap-3 group">
            <div className="w-7 h-7 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-foreground text-sm">{grade.title}</h3>
              {grade.description && (
                <p className="text-sm text-foreground-secondary mt-1 leading-relaxed">{grade.description}</p>
              )}
              {grade.fileUrl && (
                <a href={grade.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-2 text-xs font-medium transition-colors" style={{ color: '#3b82f6' }}>
                  View Certificate <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TestimonialsSection({ testimonials, profile }: { testimonials: any[]; profile: Profile }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-rose-500" />
        <h2 className="text-lg font-bold text-foreground">Testimonials</h2>
      </div>
      <div className="space-y-4">
        {testimonials.map((testimonial) => (
          <div key={testimonial.id} className="pl-4 border-l-2 border-rose-500/20 group hover:border-rose-500/60 transition-colors">
            <p className="text-sm text-foreground-secondary italic leading-relaxed">
              &ldquo;{testimonial.content}&rdquo;
            </p>
            <div className="flex items-center gap-2 mt-3">
              <div className="w-6 h-6 rounded-full bg-rose-500/15 flex items-center justify-center">
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
    <section>
      <div className="flex items-center gap-3 mb-6 pb-2 border-b border-white/5">
        <div className="w-1 h-6 rounded-full bg-teal-500" />
        <h2 className="text-lg font-bold text-foreground">Certifications</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {certifications.map((cert) => (
          <div key={cert.id} className="flex items-start gap-3 group p-4 rounded-xl bg-background-secondary/50 hover:bg-background-secondary transition-colors">
            <div className="w-7 h-7 rounded-full bg-teal-500/10 flex items-center justify-center shrink-0 mt-0.5">
              <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-foreground text-sm">{cert.title}</h3>
              <p className="text-xs text-foreground-muted mt-0.5">{cert.issuer}{cert.date ? ` · ${cert.date}` : ''}</p>
              {cert.credentialUrl && (
                <a
                  href={cert.credentialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-teal-500 hover:text-teal-400 transition-colors"
                >
                  View Credential <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

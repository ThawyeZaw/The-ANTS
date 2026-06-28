'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Profile Page (All Roles)
// Displays a user's public profile by username with projects, activities,
// achievements, and role-specific stats.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserX, Loader2, ExternalLink, CalendarDays, Award, FolderGit2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActivity from '@/components/profile/ProfileActivity';

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
    activities,
    projects,
    portfolioActivities,
    achievements,
    isLoading,
    isOwnProfile,
    notFound,
  } = useProfile(username);

  // Show loading while resolving "me" redirect
  if (username === 'me') {
    return (
      <div className="flex items-center justify-center py-20 animate-fade-in">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-foreground-muted">Redirecting to your profile...</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="h-36 bg-background-secondary animate-pulse" />
          <div className="px-6 pb-6 -mt-12">
            <div className="flex items-end gap-4">
              <div className="h-24 w-24 rounded-2xl bg-background-secondary animate-pulse ring-4 ring-background-card" />
              <div className="flex-1 pb-1 space-y-2">
                <div className="h-6 w-48 bg-background-secondary rounded animate-pulse" />
                <div className="h-4 w-32 bg-background-secondary rounded animate-pulse" />
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-background-card border border-border rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound || !profile) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-error/10 text-error mb-4">
          <UserX className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-foreground mb-2">Profile Not Found</h1>
        <p className="text-foreground-muted mb-6">
          No user with the username <span className="font-mono text-foreground">@{username}</span> was found.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  const isContributor = profile.role === 'contributor' || profile.role === 'main_contributor';
  const hasProjects = projects.length > 0;
  const hasActivities = portfolioActivities.length > 0;
  const hasAchievements = achievements.length > 0;
  const hasPortfolio = hasProjects || hasActivities || hasAchievements;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card border border-border shadow-sm hover:shadow-md hover:border-primary/40 text-sm font-medium text-foreground transition-all duration-300 cursor-pointer w-fit"
      >
        <ArrowLeft className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-300" />
        Go Back
      </button>

      {/* Profile Hero */}
      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {/* Stats (contributor/main_contributor only) */}
      {isContributor && stats && (
        <ProfileStats stats={stats} memberSince={profile.createdAt} />
      )}

      {/* ── Projects Section ─── */}
      {hasProjects && (
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <FolderGit2 className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Projects</h2>
            <span className="text-xs text-foreground-muted ml-auto">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, idx) => (
              <div key={idx} className="border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all">
                <h3 className="font-semibold text-foreground text-sm">{project.title}</h3>
                {project.role && (
                  <p className="text-xs text-foreground-muted mt-0.5">{project.role}</p>
                )}
                <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">
                  {project.description}
                </p>
                {project.technologies && project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.technologies.map((tech) => (
                      <span key={tech} className="text-[10px] px-2 py-0.5 rounded-full bg-background-secondary text-foreground-muted border border-border">
                        {tech}
                      </span>
                    ))}
                  </div>
                )}
                {project.links && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {project.links.github && (
                      <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3" /> GitHub
                      </a>
                    )}
                    {project.links.live && (
                      <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3" /> Live Demo
                      </a>
                    )}
                    {project.links.website && (
                      <a href={project.links.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors">
                        <ExternalLink className="h-3 w-3" /> Website
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Activities / CCA Section ─── */}
      {hasActivities && (
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Activities & CCA</h2>
            <span className="text-xs text-foreground-muted ml-auto">{portfolioActivities.length} {portfolioActivities.length === 1 ? 'activity' : 'activities'}</span>
          </div>
          <div className="space-y-4">
            {portfolioActivities.map((activity, idx) => (
              <div key={idx} className="border border-border rounded-xl p-4 hover:border-primary/30 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{activity.name}</h3>
                    <p className="text-xs text-foreground-muted">{activity.organization} &middot; {activity.role}</p>
                  </div>
                  <span className="text-xs text-foreground-muted shrink-0 whitespace-nowrap">
                    {activity.start_date} {activity.end_date ? `- ${activity.end_date}` : '- Present'}
                  </span>
                </div>
                {activity.description && (
                  <p className="text-sm text-foreground-secondary mt-2 leading-relaxed">{activity.description}</p>
                )}
                {activity.verification_link && (
                  <a href={activity.verification_link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                    <ExternalLink className="h-3 w-3" /> Verify
                  </a>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Achievements Section ─── */}
      {hasAchievements && (
        <section className="bg-background-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <Award className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-foreground">Achievements</h2>
            <span className="text-xs text-foreground-muted ml-auto">{achievements.length} {achievements.length === 1 ? 'achievement' : 'achievements'}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement, idx) => (
              <div key={idx} className="border border-border rounded-xl p-4 hover:border-amber-500/30 transition-all">
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Award className="h-4 w-4 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">{achievement.title}</h3>
                    {achievement.description && (
                      <p className="text-sm text-foreground-secondary mt-1">{achievement.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2 text-xs text-foreground-muted">
                      {achievement.issuer && <span>{achievement.issuer}</span>}
                      {achievement.date && <span>{achievement.date}</span>}
                    </div>
                    {achievement.link && (
                      <a href={achievement.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                        <ExternalLink className="h-3 w-3" /> View
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Activity Feed (contributor/main_contributor only) */}
      {isContributor && <ProfileActivity activities={activities} />}

      {/* Empty state for users with no portfolio */}
      {!hasPortfolio && !isContributor && (
        <div className="bg-background-card border border-border rounded-2xl p-8 text-center">
          <p className="text-sm text-foreground-muted">
            {isOwnProfile
              ? 'Add projects, activities, and achievements to your profile in Settings to showcase your work.'
              : `${profile.name} has not added any portfolio items yet.`}
          </p>
        </div>
      )}
    </div>
  );
}
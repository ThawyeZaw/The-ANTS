'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Public Profile Page (All Roles)
// Displays a user's public profile with projects, activities, achievements, 
// academic grades, and role-specific stats.
// ──────────────────────────────────────────────────────────────────────────────

import { useEffect, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, UserX, Loader2, ExternalLink, CalendarDays, Award, FolderGit2, BookOpen, Pin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import ProfileHero from '@/components/profile/ProfileHero';
import ProfileStats from '@/components/profile/ProfileStats';
import ProfileActivity from '@/components/profile/ProfileActivity';
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

  // Filter out hidden items and apply sorting
  const projects = useMemo(() => rawProjects.filter(p => !p.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)), [rawProjects]);
  const activities = useMemo(() => rawActivities.filter(a => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)), [rawActivities]);
  const achievements = useMemo(() => rawAchievements.filter(a => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)), [rawAchievements]);
  const academicGrades = useMemo(() => (profile?.academicGrades || []).filter(g => !g.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)), [profile?.academicGrades]);

  // Find pinned item
  const pinnedItemId = profile?.pinnedItemId;
  let pinnedItem: any = null;
  let pinnedType = '';

  if (pinnedItemId) {
    if (projects.find(p => p.id === pinnedItemId)) { pinnedItem = projects.find(p => p.id === pinnedItemId); pinnedType = 'project'; }
    else if (activities.find(a => a.id === pinnedItemId)) { pinnedItem = activities.find(a => a.id === pinnedItemId); pinnedType = 'activity'; }
    else if (achievements.find(a => a.id === pinnedItemId)) { pinnedItem = achievements.find(a => a.id === pinnedItemId); pinnedType = 'achievement'; }
    else if (academicGrades.find(g => g.id === pinnedItemId)) { pinnedItem = academicGrades.find(g => g.id === pinnedItemId); pinnedType = 'grade'; }
  }

  // Section visibility checks
  const showProjects = profile?.sectionVisibility?.projects !== false && projects.length > 0;
  const showActivities = profile?.sectionVisibility?.activities !== false && activities.length > 0;
  const showAchievements = profile?.sectionVisibility?.achievements !== false && achievements.length > 0;
  const showGrades = profile?.sectionVisibility?.academicGrades !== false && academicGrades.length > 0;

  const hasPortfolio = showProjects || showActivities || showAchievements || showGrades;

  // Loading state
  if (username === 'me' || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] animate-fade-in">
        <div className="flex flex-col items-center gap-3 p-8 rounded-2xl bg-background-card/50 backdrop-blur-sm border border-white/5">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-foreground-muted">Loading profile...</p>
        </div>
      </div>
    );
  }

  // 404 state
  if (notFound || !profile || (!profile.isPublic && !isOwnProfile)) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 animate-fade-in">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-error/10 text-error mb-6 shadow-sm border border-error/20">
          <UserX className="h-10 w-10" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-3">Profile Unavailable</h1>
        <p className="text-foreground-secondary mb-8 max-w-md mx-auto leading-relaxed">
          The user <span className="font-mono text-foreground font-semibold">@{username}</span> could not be found, or their profile is set to private.
        </p>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-all shadow-md hover:shadow-lg cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>
      </div>
    );
  }

  const isContributor = profile.role === 'contributor' || profile.role === 'main_contributor';

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-12">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-background-card/50 backdrop-blur-md border border-white/10 shadow-sm hover:shadow-md hover:bg-white/5 text-sm font-medium text-foreground transition-all duration-300 cursor-pointer w-fit"
      >
        <ArrowLeft className="h-4 w-4 text-foreground-muted group-hover:text-primary group-hover:-translate-x-0.5 transition-all duration-300" />
        Back
      </button>

      {/* Profile Hero */}
      <ProfileHero profile={profile} isOwnProfile={isOwnProfile} />

      {/* Stats (contributor/main_contributor only) */}
      {isContributor && stats && (
        <ProfileStats stats={stats} memberSince={profile.createdAt} />
      )}

      {/* ── Pinned Item Section ─── */}
      {pinnedItem && (
        <section className="relative p-[1px] rounded-2xl bg-gradient-to-br from-primary/50 via-accent/30 to-background">
          <div className="bg-background/90 backdrop-blur-xl rounded-2xl p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                 <Pin className="h-4 w-4" />
              </div>
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider">Pinned Highlight</h2>
            </div>
            
            {pinnedType === 'project' && (
              <div>
                <h3 className="text-xl font-bold text-foreground">{pinnedItem.title}</h3>
                {pinnedItem.role && <p className="text-sm text-primary/80 font-medium mt-1">{pinnedItem.role}</p>}
                <p className="text-foreground-secondary mt-3 leading-relaxed">{pinnedItem.description}</p>
                {pinnedItem.links?.live && (
                  <a href={pinnedItem.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-4 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm">
                    View Project <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            )}
            
            {pinnedType === 'achievement' && (
              <div className="flex gap-4 items-start">
                 <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500 shrink-0">
                   <Award className="h-8 w-8" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-foreground">{pinnedItem.title}</h3>
                   <p className="text-sm font-medium text-foreground-muted mt-1">{pinnedItem.issuer} • {pinnedItem.date}</p>
                   {pinnedItem.description && <p className="text-foreground-secondary mt-3 leading-relaxed">{pinnedItem.description}</p>}
                 </div>
              </div>
            )}
            
            {/* Can add renders for pinned activity or grade similarly */}
          </div>
        </section>
      )}

      {/* Main Grid for Portfolio Items */}
      <div className={cn("grid gap-8", hasPortfolio ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1")}>
        
        {/* Left Column (Projects & Grades) */}
        <div className={cn("space-y-8", isContributor ? "lg:col-span-12" : "lg:col-span-7")}>
          
          {/* ── Projects Section ─── */}
          {showProjects && (
            <section className="bg-background-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    <FolderGit2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl font-bold text-foreground">Projects</h2>
                </div>
              </div>
              <div className={cn("grid gap-4", isContributor ? "md:grid-cols-2" : "grid-cols-1")}>
                {projects.map((project) => (
                  <div key={project.id} className="group relative bg-white/5 border border-white/5 rounded-2xl p-5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary/0 group-hover:bg-primary transition-colors" />
                    <h3 className="font-bold text-foreground text-lg group-hover:text-primary transition-colors">{project.title}</h3>
                    {project.role && (
                      <p className="text-xs font-medium text-primary/80 mt-1 uppercase tracking-wide">{project.role}</p>
                    )}
                    <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">
                      {project.description}
                    </p>
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {project.technologies.map((tech) => (
                          <span key={tech} className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-background-secondary/50 text-foreground-secondary border border-white/5">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                    {project.links && Object.keys(project.links).length > 0 && (
                      <div className="flex flex-wrap gap-3 mt-5 pt-4 border-t border-white/5">
                        {project.links.github && (
                          <a href={project.links.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" /> Source
                          </a>
                        )}
                        {project.links.live && (
                          <a href={project.links.live} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary-hover transition-colors">
                            <ExternalLink className="h-3.5 w-3.5" /> Live Demo
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Academic Grades Section ─── */}
          {showGrades && (
            <section className="bg-background-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <BookOpen className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Academic Grades</h2>
              </div>
              <div className="space-y-4">
                {academicGrades.map((grade) => (
                  <div key={grade.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div>
                      <h3 className="font-bold text-foreground">{grade.title}</h3>
                      {grade.description && <p className="text-sm text-foreground-secondary mt-1">{grade.description}</p>}
                    </div>
                    {grade.fileUrl && (
                      <a href={grade.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-500 text-sm font-medium hover:bg-blue-500/20 transition-colors shrink-0">
                        View Certificate <ExternalLink className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Column (Activities & Achievements) */}
        <div className={cn("space-y-8", isContributor ? "lg:col-span-12" : "lg:col-span-5")}>
          
          {/* ─── Achievements Section ─── */}
          {showAchievements && (
            <section className="bg-background-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <Award className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Achievements</h2>
              </div>
              <div className={cn("grid gap-4", isContributor ? "md:grid-cols-2" : "grid-cols-1")}>
                {achievements.map((achievement) => (
                  <div key={achievement.id} className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-amber-500/30 transition-colors">
                    <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center mt-0.5">
                      <Award className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{achievement.title}</h3>
                      {achievement.description && (
                        <p className="text-sm text-foreground-secondary mt-1.5 leading-relaxed">{achievement.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs font-medium text-foreground-muted">
                        {achievement.issuer && <span>{achievement.issuer}</span>}
                        {achievement.issuer && achievement.date && <span>•</span>}
                        {achievement.date && <span>{achievement.date}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ─── Activities / CCA Section ─── */}
          {showActivities && (
            <section className="bg-background-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <CalendarDays className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-foreground">Activities & CCA</h2>
              </div>
              <div className={cn("space-y-6", isContributor && "grid md:grid-cols-2 gap-6 space-y-0")}>
                {activities.map((activity) => (
                  <div key={activity.id} className="relative pl-6 before:content-[''] before:absolute before:left-0 before:top-2 before:w-2 before:h-2 before:rounded-full before:bg-emerald-500 after:content-[''] after:absolute after:left-[3px] after:top-6 after:w-[2px] after:h-[calc(100%-12px)] after:bg-white/5 last:after:hidden">
                    <h3 className="font-bold text-foreground">{activity.name}</h3>
                    <p className="text-sm text-emerald-500/80 font-medium mt-0.5">{activity.role} at {activity.organization}</p>
                    <span className="inline-block mt-1.5 text-xs font-mono text-foreground-muted px-2 py-0.5 rounded bg-background-secondary/50">
                      {activity.start_date} {activity.end_date ? `— ${activity.end_date}` : '— Present'}
                    </span>
                    {activity.description && (
                      <p className="text-sm text-foreground-secondary mt-3 leading-relaxed">{activity.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Activity Feed (contributor/main_contributor only) */}
      {isContributor && <ProfileActivity activities={timelineActivities} />}

      {/* Empty state for users with no portfolio */}
      {!hasPortfolio && !isContributor && (
        <div className="bg-background-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="inline-flex p-4 rounded-2xl bg-white/5 mb-4">
            <UserX className="h-8 w-8 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-bold text-foreground mb-2">Portfolio Empty</h2>
          <p className="text-sm text-foreground-secondary leading-relaxed">
            {isOwnProfile
              ? 'Your portfolio is looking a bit empty! Head over to Settings > Edit Profile to add your projects, activities, academic grades, and achievements.'
              : `@${profile.username} hasn't added any public portfolio items yet.`}
          </p>
          {isOwnProfile && (
             <button onClick={() => router.push('/settings/profile')} className="mt-6 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors shadow-sm cursor-pointer">
               Setup Portfolio
             </button>
          )}
        </div>
      )}
    </div>
  );
}
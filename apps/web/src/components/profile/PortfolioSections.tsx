'use client';

import { useMemo } from 'react';
import { Award, Star, GraduationCap, Layers } from 'lucide-react';
import AppIcon from '@/components/ui/AppIcon';
import CertificationSection from './CertificationSection';
import ProfileActivity from './ProfileActivity';
import ProfileAboutCard from './ProfileAboutCard';
import type { Profile } from '@/types';
import type { ActivityItem } from '@/hooks/useProfile';

interface PortfolioSectionsProps {
  profile: Profile;
  certifications?: any[];
  activities?: ActivityItem[];
}

export default function PortfolioSections({
  profile,
  certifications = [],
  activities = [],
}: PortfolioSectionsProps) {
  const projects = useMemo(
    () => (profile.projects || []).filter((p) => !p.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile.projects]
  );
  const portfolioActivities = useMemo(
    () => (profile.activities || []).filter((a) => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile.activities]
  );
  const achievements = useMemo(
    () => (profile.achievements || []).filter((a) => !a.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile.achievements]
  );
  const academicGrades = useMemo(
    () => (profile.academicGrades || []).filter((g) => !g.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile.academicGrades]
  );
  const testimonials = useMemo(
    () => (profile.testimonials || []).filter((t) => !t.isHidden).sort((a, b) => (a.order || 0) - (b.order || 0)),
    [profile.testimonials]
  );

  const showProjects = profile.sectionVisibility?.projects !== false && projects.length > 0;
  const showActivities = profile.sectionVisibility?.activities !== false && portfolioActivities.length > 0;
  const showAchievements = profile.sectionVisibility?.achievements !== false && achievements.length > 0;
  const showGrades = profile.sectionVisibility?.academicGrades !== false && academicGrades.length > 0;
  const showTestimonials = profile.sectionVisibility?.testimonials !== false && testimonials.length > 0;
  const showCertifications = profile.sectionVisibility?.certifications !== false && certifications.length > 0;

  return (
    <div className="space-y-6">
      <ProfileAboutCard profile={profile} />
      {showCertifications && <CertificationSection certifications={certifications} />}
      {showProjects && (
        <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <AppIcon icon={Layers} size="md" tone="secondary" frame="soft" />
            <h2 className="text-lg font-bold text-foreground">Featured Projects</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-3">
                <h3 className="font-bold text-foreground text-sm">{project.title}</h3>
                {project.description && (
                  <p className="text-sm text-foreground-secondary leading-relaxed">{project.description}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
      {showActivities && (
        <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <AppIcon icon={Star} size="md" tone="secondary" frame="soft" />
            <h2 className="text-lg font-bold text-foreground">Activities & Leadership</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {portfolioActivities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5 space-y-2">
                <h3 className="font-bold text-foreground text-sm">{activity.name}</h3>
                <p className="text-xs font-semibold text-foreground-secondary">
                  {activity.role} at {activity.organization}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
      {showAchievements && (
        <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <AppIcon icon={Award} size="md" tone="secondary" frame="soft" />
            <h2 className="text-lg font-bold text-foreground">Achievements & Honors</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5">
                <h3 className="font-bold text-foreground text-sm">{achievement.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}
      {showGrades && (
        <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <AppIcon icon={GraduationCap} size="md" tone="secondary" frame="soft" />
            <h2 className="text-lg font-bold text-foreground">Academic Results</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {academicGrades.map((grade) => (
              <div key={grade.id} className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5">
                <h3 className="font-bold text-foreground text-sm">{grade.title}</h3>
              </div>
            ))}
          </div>
        </section>
      )}
      {showTestimonials && (
        <section className="rounded-3xl border border-border bg-background-card p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-foreground">Testimonials</h2>
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-2xl border border-border/80 bg-background-secondary/40 p-5">
              <p className="text-sm text-foreground-secondary italic">&ldquo;{testimonial.content}&rdquo;</p>
            </div>
          ))}
        </section>
      )}
      {activities.length > 0 && <ProfileActivity activities={activities as any} />}
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  BookMarked,
  Library,
  Bookmark,
  History,
  Megaphone,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { useSavedNotes } from '@/hooks/useNotes';
import { getAllNavItems } from '@/components/layout/NavBar';
import DashboardLayout from '@/components/layout/DashboardLayout';
import {
  getStudentDashboardStats,
  mockExams,
  mockClubAnnouncements,
} from '@/lib/mock/database';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { role, isStudent } = useRole();
  const router = useRouter();
  const { savedNotes } = useSavedNotes(user?.id);
  const [recentPages, setRecentPages] = useState<any[]>([]);

  useEffect(() => {
    if (role && !isStudent) {
      router.replace(`/${role === 'main_contributor' ? 'main-contributor' : role}`);
    }
  }, [role, isStudent, router]);

  useEffect(() => {
    try {
      const recentStr = localStorage.getItem('recentPages');
      if (recentStr) {
        const recent: { href: string; timestamp: number }[] = JSON.parse(recentStr);
        const allItems = getAllNavItems();
        
        const mapped = recent
          .map(r => {
            const item = allItems.find(i => r.href.startsWith(i.href) && i.href !== '/');
            if (item) {
              return { ...item, timestamp: r.timestamp };
            }
            return null;
          })
          .filter(Boolean);
        
        const uniqueMapped = mapped.filter((v, i, a) => a.findIndex(t => (t?.label === v?.label)) === i);
        setRecentPages(uniqueMapped.slice(0, 3));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!user || !isStudent) return null;

  const firstName = user.profile.name.split(' ')[0];
  const welcomeSubtitle = "Here's your study snapshot for today. Keep up the great work!";
  const stats = getStudentDashboardStats(user.id);

  const mainContent = (
    <div className="space-y-6">
      {/* My Notes Card */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <BookMarked className="h-5 w-5 text-violet-500" />
            My Notes
          </h2>
          <Link href="/library" className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
            <Library className="h-4 w-4" />
            Browse Library
          </Link>
        </div>

        {savedNotes.length === 0 ? (
          <div className="bg-background-secondary/50 border border-dashed border-border rounded-xl p-6 text-center">
            <Bookmark className="h-8 w-8 text-foreground-muted mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No saved notes yet</p>
            <p className="text-xs text-foreground-muted mt-1">Browse the library and save notes to see them here.</p>
            <Link href="/library" className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:text-primary/80 transition-colors">
              <Library className="h-3.5 w-3.5" /> Explore Notes
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {savedNotes.slice(0, 4).map((note) => (
              <Link key={note.id} href={`/library/${note.id}`}
                className="group flex flex-col gap-1.5 bg-background-card/50 border border-border rounded-xl p-4 hover:border-primary/40 hover:shadow-md transition-all duration-200">
                <p className="font-semibold text-foreground text-sm line-clamp-2 group-hover:text-primary transition-colors">{note.title}</p>
                <p className="text-xs text-foreground-muted line-clamp-1">{note.summary}</p>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recently Accessed Card */}
      {recentPages.length > 0 && (
        <div className="glass rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-blue-500" />
              Recently Accessed
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recentPages.map((page, i) => (
              <Link
                key={`${page.href}-${i}`}
                href={page.href}
                className="group flex items-center gap-3 bg-background-card/50 border border-border rounded-xl p-4 hover:border-border-hover hover:shadow-md transition-all duration-200"
              >
                <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                  {page.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors truncate">
                    {page.label}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const sidebarContent = (
    <div className="space-y-6">
      {/* Club Announcements */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <Megaphone className="h-5 w-5 text-sky-500" />
            Club Announcements
          </h3>
        </div>
        <div className="space-y-3">
          {mockClubAnnouncements.slice(0, 3).map(ann => (
            <div key={ann.id} className="p-3 bg-background-secondary/50 rounded-xl border border-border/50">
              <p className="font-semibold text-sm text-foreground">{ann.title}</p>
              <p className="text-xs text-foreground-muted mt-1">{ann.content}</p>
            </div>
          ))}
          {mockClubAnnouncements.length === 0 && (
            <p className="text-sm text-foreground-muted">No announcements right now.</p>
          )}
        </div>
      </div>

      {/* Upcoming Exams */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2 text-foreground text-lg">
            <Clock className="h-5 w-5 text-rose-500" />
            Upcoming Exams
          </h3>
        </div>
        <div className="space-y-3">
          {mockExams.slice(0, 3).map(exam => (
            <div key={exam.id} className="p-3 bg-background-secondary/50 rounded-xl border border-border/50 flex flex-col justify-between">
              <div>
                <p className="font-semibold text-sm text-foreground">{exam.title}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{exam.exam_series}</p>
              </div>
              <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-500/10 self-start px-2 py-1 rounded-md">
                {new Date(exam.exam_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          ))}
          {mockExams.length === 0 && (
            <p className="text-sm text-foreground-muted">No upcoming exams.</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      firstName={firstName}
      welcomeSubtitle={welcomeSubtitle}
      stats={stats}
      mainContent={mainContent}
      sidebarContent={sidebarContent}
    />
  );
}

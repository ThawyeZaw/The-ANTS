import Link from 'next/link';
import { Compass, Home, LayoutDashboard, Calculator, Clock, BookOpen, CalendarDays } from 'lucide-react';

export default function NotFound() {
  const quickLinks = [
    { label: 'Grade Calculator', href: '/calculator', icon: Calculator, desc: 'Official CAIE & Edexcel boundaries' },
    { label: 'Exam Countdown', href: '/countdown', icon: Clock, desc: 'Live sitting timetable timers' },
    { label: 'Past Paper Tracker', href: '/past-papers', icon: BookOpen, desc: 'Score matrices & components' },
    { label: 'Smart Timetable', href: '/timetable', icon: CalendarDays, desc: 'Time-blocking weekly planner' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6 sm:p-12">
      {/* Header bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-brand font-black text-amber-500 text-lg">
            A
          </div>
          <span className="font-brand font-bold text-lg tracking-tight text-foreground">The ANTs</span>
        </Link>
        <Link
          href="/"
          className="text-xs font-medium text-foreground-secondary hover:text-foreground transition-colors"
        >
          the-ants.org
        </Link>
      </div>

      {/* Main 404 container */}
      <div className="max-w-2xl w-full mx-auto my-auto text-center py-12">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-6 text-amber-500 shadow-sm shadow-amber-500/5">
          <Compass className="w-10 h-10 animate-pulse" />
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-mono font-bold mb-4">
          ERROR 404 · PAGE NOT FOUND
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-4">
          This syllabus path or tool doesn&apos;t exist
        </h1>

        <p className="text-foreground-secondary text-base max-w-lg mx-auto mb-8 leading-relaxed">
          The page you requested may have been moved, renamed, or is temporarily unavailable. Let&apos;s get your revision back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary-hover shadow-sm transition-all hover:shadow-md cursor-pointer"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Link>

          <Link
            href="/student"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-background-card border border-border text-foreground font-semibold text-sm hover:bg-background-secondary transition-colors cursor-pointer"
          >
            <LayoutDashboard className="w-4 h-4 text-foreground-secondary" />
            Student Dashboard
          </Link>
        </div>

        {/* Quick Study Tools navigation */}
        <div className="pt-8 border-t border-border/60">
          <p className="text-xs font-semibold uppercase tracking-wider text-foreground-muted mb-4 text-center">
            Popular Study Tools
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 p-3 rounded-xl bg-background-card border border-border hover:border-border-hover hover:bg-background-secondary transition-all group"
                >
                  <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/15 flex items-center justify-center shrink-0 text-amber-500 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                      {item.label}
                    </div>
                    <div className="text-[11px] text-foreground-muted truncate">
                      {item.desc}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="max-w-4xl w-full mx-auto pt-8 text-center text-xs text-foreground-muted">
        © {new Date().getFullYear()} The ANTs Academic Community. Free forever for Myanmar students.
      </div>
    </div>
  );
}

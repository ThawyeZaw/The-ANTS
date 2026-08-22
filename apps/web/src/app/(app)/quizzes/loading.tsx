import { Loader2 } from 'lucide-react';

export default function QuizzesLoading() {
  return (
    <div className="animate-fade-in space-y-6">
      {/* Header skeleton */}
      <div className="h-9 w-48 bg-background-secondary rounded-lg animate-pulse" />
      <div className="h-4 w-72 bg-background-secondary rounded-lg animate-pulse" />
      
      {/* Skeleton cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border bg-background-card p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="h-5 w-3/4 bg-background-secondary rounded animate-pulse" />
                <div className="h-3 w-full bg-background-secondary rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-background-secondary rounded-full animate-pulse" />
            </div>
            <div className="flex gap-4">
              <div className="h-3 w-20 bg-background-secondary rounded animate-pulse" />
              <div className="h-3 w-24 bg-background-secondary rounded animate-pulse" />
            </div>
            <div className="flex gap-2 pt-2 border-t border-border">
              <div className="h-9 w-20 bg-background-secondary rounded-lg animate-pulse" />
              <div className="h-9 w-20 bg-background-secondary rounded-lg animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

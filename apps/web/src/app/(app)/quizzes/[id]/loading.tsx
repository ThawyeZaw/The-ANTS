import { Loader2 } from 'lucide-react';

export default function QuizDetailLoading() {
  return (
    <div className="animate-fade-in max-w-2xl mx-auto space-y-6">
      <div className="h-8 w-20 bg-background-secondary rounded-lg animate-pulse" />
      <div className="rounded-xl border border-border bg-background-card p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="h-7 w-3/4 bg-background-secondary rounded animate-pulse" />
            <div className="h-4 w-full bg-background-secondary rounded animate-pulse" />
          </div>
          <div className="h-6 w-20 bg-background-secondary rounded-full animate-pulse" />
        </div>
        <div className="flex gap-6">
          <div className="h-4 w-24 bg-background-secondary rounded animate-pulse" />
          <div className="h-4 w-32 bg-background-secondary rounded animate-pulse" />
        </div>
        <div className="space-y-3 pt-4 border-t border-border">
          <div className="h-4 w-32 bg-background-secondary rounded animate-pulse" />
          <div className="h-16 w-full bg-background-secondary rounded-lg animate-pulse" />
          <div className="h-16 w-full bg-background-secondary rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3 pt-4 border-t border-border">
          <div className="h-10 w-32 bg-background-secondary rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-background-secondary rounded-xl animate-pulse" />
          <div className="h-10 w-24 bg-background-secondary rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}

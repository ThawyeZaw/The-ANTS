import { Loader2 } from 'lucide-react';

export default function JoinQuizLoading() {
  return (
    <div className="animate-fade-in flex items-center justify-center min-h-[60vh]">
      <div className="rounded-xl border border-border bg-background-card p-8 max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-background-secondary animate-pulse" />
        </div>
        <div className="space-y-2 text-center">
          <div className="h-7 w-48 mx-auto bg-background-secondary rounded animate-pulse" />
          <div className="h-4 w-64 mx-auto bg-background-secondary rounded animate-pulse" />
        </div>
        <div className="h-14 w-full bg-background-secondary rounded-xl animate-pulse" />
        <div className="h-10 w-full bg-background-secondary rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

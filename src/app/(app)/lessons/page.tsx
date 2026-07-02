import BackButton from '@/components/ui/BackButton';
import LessonTracker from '@/components/Lessons/LessonTracker';

export default function LessonsPage() {
  return (
    <div className="space-y-6">
      <BackButton href="/dashboard" label="Back" />
      <LessonTracker />
    </div>
  );
}

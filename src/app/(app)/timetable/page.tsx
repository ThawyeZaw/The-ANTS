import { Metadata } from 'next';
import TimetableManager from '@/components/timetable/TimetableManager';
import BackButton from '@/components/ui/BackButton';

export const metadata: Metadata = {
  title: 'Smart Timetable — The ANTs',
  description:
    'Manage your weekly self-study sessions, classes, and work schedules with colour-coded drag-and-drop time blocks. Connected to your exam countdowns, assignments, and club events.',
};

export default function TimetablePage() {
  return (
    <div className="h-screen overflow-hidden flex flex-col">
      <div className="shrink-0 px-4 pt-4">
        <BackButton href="/dashboard" label="Back to Dashboard" />
      </div>
      <div className="flex-1 min-h-0">
        <TimetableManager />
      </div>
    </div>
  );
}

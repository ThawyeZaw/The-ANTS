import { Metadata } from 'next';
import TimetableManager from '@/components/timetable/TimetableManager';

export const metadata: Metadata = {
  title: 'Smart Timetable — The ANTs',
  description:
    'Manage your weekly self-study sessions, classes, and work schedules with colour-coded drag-and-drop time blocks. Connected to your exam countdowns, assignments, and club events.',
};

export default function TimetablePage() {
  return (
    <div className="h-screen overflow-hidden">
      <TimetableManager />
    </div>
  );
}

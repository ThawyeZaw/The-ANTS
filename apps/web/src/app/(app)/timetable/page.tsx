import { Metadata } from 'next';
import TimetableManager from '@/components/timetable/TimetableManager';
import BackButton from '@/components/ui/BackButton';

export const metadata: Metadata = {
  title: 'Timetable — The ANTs',
  description: 'Plan your day, week, and month. Every block is a task you can check off, including daily habits.',
};

export default function TimetablePage() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <TimetableManager />
    </div>
  );
}

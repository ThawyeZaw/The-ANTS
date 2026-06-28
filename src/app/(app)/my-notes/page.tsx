import MyNotesLibrary from '@/components/notes/MyNotesLibrary';

export const metadata = {
  title: 'My Notes - The ANTS',
};

export default function MyNotesPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <MyNotesLibrary />
    </div>
  );
}

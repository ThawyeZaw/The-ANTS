import { redirect } from 'next/navigation';

export default function MyNotesPage() {
  redirect('/workspace?tab=notes');
}

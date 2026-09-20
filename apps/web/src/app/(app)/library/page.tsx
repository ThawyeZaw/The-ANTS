import { redirect } from 'next/navigation';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /library now consolidates into /tools
// Redirect all visits to the unified Study Tools Hub.
// ──────────────────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  redirect('/tools');
}

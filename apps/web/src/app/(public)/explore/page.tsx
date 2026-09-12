// ──────────────────────────────────────────────────────────────────────────────
// The ANTs — /explore redirect
// The Explore Directory has moved to /team (Tutors & Contributors).
// ──────────────────────────────────────────────────────────────────────────────

import { permanentRedirect } from 'next/navigation';

export default function ExploreRedirectPage() {
  permanentRedirect('/team');
}

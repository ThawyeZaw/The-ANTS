// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Shared Type Definitions
// All app-wide types & interfaces live here. Import from '@/types'.
// ──────────────────────────────────────────────────────────────────────────────

/** The four user roles in the system. Matches the PostgreSQL enum. */
export type UserRole = 'student' | 'teacher' | 'contributor' | 'main_contributor';

/** Social links for contributor profiles */
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
}

/** User profile stored in the `profiles` table */
export interface Profile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  role: UserRole;
  bio?: string;
  title?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
}

/** Authenticated user object returned by auth operations */
export interface AuthUser {
  id: string;
  email: string;
  profile: Profile;
}

/** A single navigation link in the NavBar */
export interface NavLink {
  label: string;
  href: string;
  icon: string; // lucide-react icon name
  description?: string;
}

/** A grouped dropdown in the NavBar */
export interface NavGroup {
  label: string;
  icon: string;
  links: NavLink[];
  /** Which roles can see this group */
  allowedRoles: UserRole[];
}

// ──────────────────────────────────────────────────────────────────────────────
// Role Metadata — display names, descriptions, colors, and icons
// ──────────────────────────────────────────────────────────────────────────────

export interface RoleMetadata {
  key: UserRole;
  displayName: string;
  description: string;
  icon: string; // lucide-react icon name
  color: string; // Tailwind color class
  gradient: string; // CSS gradient string
}

export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  student: {
    key: 'student',
    displayName: 'Student',
    description: 'Access all personal study tools — timetables, flashcards, pomodoro, grade calculators, and more. Join classrooms and clubs.',
    icon: 'GraduationCap',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
  },
  teacher: {
    key: 'teacher',
    displayName: 'Teacher',
    description: 'Everything students get, plus create & manage virtual classrooms, issue assignments, and monitor student progress.',
    icon: 'BookOpen',
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-400',
  },
  contributor: {
    key: 'contributor',
    displayName: 'Contributor',
    description: 'Build and maintain global curriculum templates, create notes, lead clubs, and get a public contributor profile.',
    icon: 'Pencil',
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-400',
  },
  main_contributor: {
    key: 'main_contributor',
    displayName: 'Main Contributor',
    description: 'Senior gatekeeper — review, approve, or reject contributor submissions before they go public. Full platform access.',
    icon: 'Shield',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-400',
  },
};

/** All role keys as an array */
export const ALL_ROLES: UserRole[] = ['student', 'teacher', 'contributor', 'main_contributor'];

/** Feature card metadata for the home page and landing pages */
export interface FeatureCard {
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
  gradient: string;
}

/** Stat widget for role landing pages */
export interface StatWidget {
  label: string;
  value: string | number;
  icon: string;
  trend?: 'up' | 'down' | 'neutral';
  color: string;
}

/** Contributor profile fields (maps to `contributor_profiles` table) */
export interface ContributorProfile {
  id: string;
  title: string | null;
  bio: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  verification_documents_url: string | null;
}

/** Tracks the state of a user being invited through the multi-step flow */
export interface InvitedUser {
  email: string;
  name: string;
  role: UserRole;
  otpVerified: boolean;
}

// -----------------------------------------------------------------------------
// Clubs
// -----------------------------------------------------------------------------

export type ClubJoinMode = 'open' | 'invite_link' | 'approval_based';
export type ClubMemberRole = 'leader' | 'member';
export type ClubMembershipStatus = 'active' | 'pending' | 'rejected';
export type ClubJoinRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Club {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  join_mode: ClubJoinMode;
  invite_code: string | null;
  created_at: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  role: ClubMemberRole;
  membership_status: ClubMembershipStatus;
  joined_at: string | null;
}

export interface ClubMessage {
  id: string;
  club_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  created_by: string;
  title: string | null;
  content: string | null;
  created_at: string;
}

export interface ClubLink {
  id: string;
  club_id: string;
  title: string | null;
  url: string | null;
  shared_by: string;
  created_at: string;
}

export interface ClubJoinRequest {
  id: string;
  club_id: string;
  user_id: string;
  status: ClubJoinRequestStatus;
  requested_at: string;
}

export interface ClubCurriculum {
  id: string;
  club_id: string;
  curriculum_id: string;
}

export interface ClubSubject {
  id: string;
  club_id: string;
  subject_id: string;
}

// -----------------------------------------------------------------------------
// Flashcards & Spaced Repetition
// -----------------------------------------------------------------------------

/** Rating a user gives to a flashcard during review (maps to SM-2 quality scores) */
export type SRSRating = 'again' | 'good' | 'easy';

/** A flashcard deck (maps to `decks` table) */
export interface Deck {
  id: string;
  owner_id: string;
  curriculum_id: string | null;
  /** Optional link to a specific subject within a curriculum */
  subject_id: string | null;
  name: string;
  description: string | null;
  /** Free-text category tag, e.g. "Biology", "History", "Custom" */
  category: string | null;
  is_public: boolean;
  created_at: string;
}

/** A single flashcard (maps to `cards` table) */
export interface FlashCard {
  id: string;
  deck_id: string;
  front_text: string;
  back_text: string;
  created_at: string;
}

/** Per-user SRS state for a card (maps to `card_reviews` table) */
export interface CardReview {
  id: string;
  card_id: string;
  user_id: string;
  interval_days: number;
  ease_factor: number;
  next_review_date: string;
  last_rating: SRSRating | null;
}

/** State object for an active study session (client-side only, not persisted) */
export interface StudySessionState {
  deckId: string;
  dueCards: FlashCard[];
  currentIndex: number;
  isFlipped: boolean;
  hasFlipped: boolean;
  sessionComplete: boolean;
  cardRatings: Record<string, SRSRating>;
  pendingReviews: Record<string, { interval_days: number; ease_factor: number; next_review_date: string; last_rating: SRSRating }>;
}

/** A single card parsed from raw AI output (used in the AI import preview) */
export interface ParsedAICard {
  front: string;
  back: string;
  /** Whether the user has confirmed/edited this card in the preview */
  confirmed: boolean;
}

// -----------------------------------------------------------------------------
// Exams & Countdowns
// -----------------------------------------------------------------------------

export interface Exam {
  id: string;
  curriculum_id: string;
  title: string | null;
  exam_series: string | null;
  exam_date: string | null;
  created_at: string;
}

export interface ExamCountdown {
  id: string;
  user_id: string;
  exam_id: string | null;
  custom_title: string | null;
  target_date: string | null;
  priority_indicator: 'high' | 'medium' | 'low' | string | null;
  /** Group to display this countdown under (e.g. 'IGCSE', 'A LEVEL'). Falls back to 'Custom' if missing. */
  qualification_group?: string;
  created_at: string;
}

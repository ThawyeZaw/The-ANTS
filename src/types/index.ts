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

/** A single project entry in a user's portfolio */
export interface ProjectEntry {
  title: string;
  description: string;
  role?: string;
  technologies?: string[];
  links?: {
    github?: string;
    live?: string;
    website?: string;
    other?: string;
  };
  media?: string[];
}

/** A single CCA / activity entry */
export interface ActivityEntry {
  name: string;
  organization: string;
  role: string;
  start_date: string;
  end_date?: string;
  description?: string;
  verification_link?: string;
}

/** A single achievement or award entry */
export interface AchievementEntry {
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
  link?: string;
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
  isPublic?: boolean;
  projects?: ProjectEntry[];
  activities?: ActivityEntry[];
  achievements?: AchievementEntry[];
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

/** Available features that a club can enable or disable */
export type ClubFeature =
  | 'chat'
  | 'announcements'
  | 'links'
  | 'members'
  | 'projects'
  | 'activity_timeline'
  | 'leaderboard';

/** Default features enabled for a new club */
export const DEFAULT_CLUB_FEATURES: ClubFeature[] = ['chat', 'announcements', 'links', 'members'];

export interface Club {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  join_mode: ClubJoinMode;
  invite_code: string | null;
  enabled_features?: ClubFeature[];
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
// Role Upgrade Requests
// -----------------------------------------------------------------------------

export type UpgradeRequestStatus = 'pending' | 'approved' | 'rejected';

export interface RoleUpgradeRequest {
  id: string;
  user_id: string;
  current_role: UserRole;
  requested_role: UserRole;
  reason: string | null;
  status: UpgradeRequestStatus;
  reviewer_id: string | null;
  created_at: string;
  reviewed_at: string | null;
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
// Notes
// -----------------------------------------------------------------------------

/** Status lifecycle for a note */
export type NoteStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';

/** AI Generator style preference */
export type NoteStyle = 'concise' | 'detailed' | 'eli5' | 'academic';

// ── Note Block Types ──────────────────────────────────────────────────────────

export interface HeadingBlock {
  type: 'heading';
  id: string;
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  id: string;
  /** Supports basic markdown-like markers: **bold**, *italic*, [text](url) */
  text: string;
}

export interface LatexBlock {
  type: 'latex';
  id: string;
  /** The LaTeX source string, e.g. "E = mc^2" */
  expression: string;
  /** Display (block) vs inline rendering */
  display: boolean;
}

export interface SvgBlock {
  type: 'svg';
  id: string;
  /** Raw sanitized SVG markup */
  markup: string;
  /** Optional caption shown below */
  caption?: string;
}

/** One of our predefined animation templates */
export type AnimationTemplate =
  | 'pendulum'
  | 'wave_motion'
  | 'projectile'
  | 'cell_division'
  | 'lens_refraction'
  | 'circuit_dc'
  | 'dna_helix'
  | 'gas_particles'
  | 'titration'
  | 'spring_oscillation';

export interface AnimationBlock {
  type: 'animation';
  id: string;
  template: AnimationTemplate;
  /** Template-specific configuration key-value pairs */
  config?: Record<string, string | number | boolean>;
  caption?: string;
}

export interface ImageBlock {
  type: 'image';
  id: string;
  /** Public URL to the image (small — max ~500kb recommended) */
  url: string;
  alt?: string;
  caption?: string;
}

export interface LinkBlock {
  type: 'link';
  id: string;
  url: string;
  label: string;
  description?: string;
}

export interface CodeBlock {
  type: 'code';
  id: string;
  language: string;
  code: string;
  caption?: string;
}

export interface TableBlock {
  type: 'table';
  id: string;
  /** First row is treated as headers */
  rows: string[][];
}

export interface DividerBlock {
  type: 'divider';
  id: string;
}

/** Union of all block types */
export type NoteBlock =
  | HeadingBlock
  | ParagraphBlock
  | LatexBlock
  | SvgBlock
  | AnimationBlock
  | ImageBlock
  | LinkBlock
  | CodeBlock
  | TableBlock
  | DividerBlock;

// ── Note Entity ───────────────────────────────────────────────────────────────

export interface Note {
  id: string;
  title: string;
  /** Short blurb shown on note cards */
  summary?: string;
  /** FK to curriculums.id — nullable for general notes */
  curriculum_id: string | null;
  /** FK to subjects.id — nullable */
  subject_id: string | null;
  /** FK to topics.id — nullable */
  topic_id: string | null;
  /** Free-text syllabus point, e.g. "1.5.3 — Newton's Third Law" */
  syllabus_point?: string;
  /** Whether this note is tied to a specific syllabus/spec point */
  is_syllabus_based: boolean;
  /** Free-form searchable tags */
  tags: string[];
  /** Ordered array of content blocks */
  blocks: NoteBlock[];
  contributor_id: string;
  status: NoteStatus;
  visibility: 'private' | 'link' | 'public';
  /** Reviewer feedback (for rejected/revision-requested notes) */
  reviewer_feedback?: string;
  reviewer_id?: string;
  created_at: string;
  updated_at: string;
}

/** Junction table: which notes a user has saved to their dashboard */
export interface UserSavedNote {
  id: string;
  user_id: string;
  note_id: string;
  saved_at: string;
}

// ── Editor State (client-side only, not persisted) ────────────────────────────

export interface NoteEditorState {
  noteId: string | null;
  title: string;
  summary: string;
  curriculumId: string | null;
  subjectId: string | null;
  topicId: string | null;
  syllabusPoint: string;
  isSyllabusBased: boolean;
  tags: string[];
  blocks: NoteBlock[];
  isDirty: boolean;
  isSaving: boolean;
  status: NoteStatus;
  visibility: 'private' | 'link' | 'public';
}

// ── AI Prompt Context ─────────────────────────────────────────────────────────

export interface AIPromptContext {
  curriculum: string;       // e.g. "IGCSE"
  examBoard: string;        // e.g. "CAIE"
  subject: string;          // e.g. "Physics"
  topic: string;            // e.g. "Forces and Motion"
  syllabusPoint?: string;   // e.g. "1.5.3 — Newton's Third Law"
  style: NoteStyle;
  additionalContext?: string;
}

// ── Library Filters (client-side) ─────────────────────────────────────────────

export interface NoteFilters {
  search: string;
  curriculumId: string | null;
  subjectId: string | null;
  isSyllabusBased: boolean | null;
  tags: string[];
}
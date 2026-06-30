// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Shared Type Definitions
// All app-wide types & interfaces live here. Import from '@/types'.
// ──────────────────────────────────────────────────────────────────────────────

/** The four user roles in the system. Matches the PostgreSQL enum. */
export type UserRole = 'student' | 'teacher' | 'contributor' | 'main_contributor';

/** Predefined social platforms available for profile links */
export type SocialPlatform = 'github' | 'tiktok' | 'facebook' | 'website' | 'instagram';

/** A single social link entry in a user's profile */
export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform | 'custom';
  /** Display label (e.g. "GitHub" for predefined, "Medium" for custom) */
  label: string;
  /** Full URL including protocol */
  url: string;
  /** Whether to display this link on the public profile */
  visible: boolean;
  /** Optional order index for sorting */
  order?: number;
}

/** Legacy social links interface for backwards compatibility */
export interface SocialLinks {
  github?: string;
  linkedin?: string;
  twitter?: string;
  facebook?: string;
  website?: string;
}

/** A single project entry in a user's portfolio */
export interface ProjectEntry {
  id: string;
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
  isHidden?: boolean;
  order?: number;
}

/** A single CCA / activity entry */
export interface ActivityEntry {
  id: string;
  name: string;
  organization: string;
  role: string;
  start_date: string;
  end_date?: string;
  description?: string;
  verification_link?: string;
  isHidden?: boolean;
  order?: number;
}

/** A single achievement or award entry */
export interface AchievementEntry {
  id: string;
  title: string;
  description?: string;
  date?: string;
  issuer?: string;
  link?: string;
  isHidden?: boolean;
  order?: number;
}

/** A single academic grade / certificate entry */
export interface AcademicGradeEntry {
  id: string;
  title: string;
  description?: string;
  fileUrl: string; // URL to PDF or image
  isHidden?: boolean;
  order?: number;
}

/** Profile theme preset configuration */
export interface ThemePreset {
  key: string;
  name: string;
  colors: {
    accent: string;
    background: string;
    card: string;
  };
}

/** Curated theme presets for profile customization */
export const PROFILE_THEME_PRESETS: ThemePreset[] = [
  { key: 'default', name: 'Default', colors: { accent: '#6366f1', background: '#0a0a0f', card: '#13131a' } },
  { key: 'ocean', name: 'Ocean', colors: { accent: '#0ea5e9', background: '#0c1222', card: '#141e33' } },
  { key: 'sunset', name: 'Sunset', colors: { accent: '#f97316', background: '#1a0f0a', card: '#2a1a10' } },
  { key: 'forest', name: 'Forest', colors: { accent: '#22c55e', background: '#0a1a0f', card: '#112a18' } },
  { key: 'midnight', name: 'Midnight', colors: { accent: '#8b5cf6', background: '#0a0a14', card: '#14142a' } },
  { key: 'rose', name: 'Rose', colors: { accent: '#ec4899', background: '#1a0a14', card: '#2a1422' } },
  { key: 'aurora', name: 'Aurora', colors: { accent: '#06b6d4', background: '#0a141a', card: '#0f202a' } },
  { key: 'amber', name: 'Amber', colors: { accent: '#d97706', background: '#14100a', card: '#221a10' } },
];

/** Profile theme customization */
export interface ProfileTheme {
  /** Theme preset key */
  preset: string;
  /** Custom accent color override (hex) */
  accentColor?: string;
  /** Custom background color override (hex) */
  backgroundColor?: string;
}

/** Profile spacing density */
export type ProfileSpacing = 'compact' | 'spacious';
/** Profile content width */
export type ProfileWidth = 'full' | 'contained';
/** Profile section layout arrangement */
export type ProfileSectionLayout = 'layout-a' | 'layout-b' | 'layout-c';

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
  socialLinks?: SocialLinkItem[];
  isPublic?: boolean;
  pinnedItemId?: string;
  sectionVisibility?: {
    projects?: boolean;
    activities?: boolean;
    achievements?: boolean;
    academicGrades?: boolean;
  };
  sectionOrder?: string[];
  theme?: ProfileTheme;
  spacing?: ProfileSpacing;
  width?: ProfileWidth;
  sectionLayout?: ProfileSectionLayout;
  projects?: ProjectEntry[];
  activities?: ActivityEntry[];
  achievements?: AchievementEntry[];
  academicGrades?: AcademicGradeEntry[];
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

// -----------------------------------------------------------------------------
// Notes
// -----------------------------------------------------------------------------

export type NoteStatus = 'draft' | 'pending_review' | 'approved' | 'rejected';
export type NoteVisibility = 'private' | 'link' | 'public';

export type NoteStyle = 'concise' | 'detailed' | 'eli5' | 'academic';

export type PromptType = 'generate' | 'convert';

export interface AIPromptContext {
  curriculum: string;
  examBoard: string;
  subject: string;
  topic: string;
  syllabusPoint?: string;
  style: NoteStyle;
  additionalContext?: string;
  promptType: PromptType;
  /** Raw content of existing note to convert (only used when promptType === 'convert') */
  userNoteContent?: string;
}

export interface NoteFilters {
  search: string;
  curriculumId: string | null;
  subjectId: string | null;
  isSyllabusBased: boolean | null;
  tags: string[];
}

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
  visibility: NoteVisibility;
}

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
  /** One of our predefined animation templates (optional if script is provided) */
  template?: AnimationTemplate;
  /** Template-specific configuration key-value pairs */
  config?: Record<string, string | number | boolean>;
  /** Custom JavaScript code for user/AI-generated animations (runs in a sandboxed canvas) */
  script?: string;
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

export interface Note {
  id: string;
  title: string;
  /** Short blurb shown on note cards */
  summary?: string | null;
  /** FK to curriculums.id — nullable for general notes */
  curriculum_id: string | null;
  /** FK to subjects.id — nullable */
  subject_id: string | null;
  /** FK to topics.id — nullable */
  topic_id: string | null;
  /** Free-text syllabus point, e.g. "1.5.3 — Newton's Third Law" */
  syllabus_point?: string | null;
  /** Whether this note is tied to a specific syllabus/spec point */
  is_syllabus_based: boolean;
  /** Free-form searchable tags */
  tags: string[];
  /** Ordered array of content blocks */
  blocks: NoteBlock[];
  contributor_id: string;
  status: NoteStatus;
  visibility: NoteVisibility;
  /** Reviewer feedback (for rejected/revision-requested notes) */
  reviewer_feedback?: string | null;
  reviewer_id?: string | null;
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
export type ClubMemberRole = 'admin' | 'moderator' | 'member';
export type ClubMembershipStatus = 'active' | 'pending' | 'rejected';
export type ClubJoinRequestStatus = 'pending' | 'approved' | 'rejected';

/** Available features that a club can enable or disable */
export type ClubFeatureKey =
  | 'chat'
  | 'announcements'
  | 'links'
  | 'members'
  | 'projects'
  | 'activity_timeline'
  | 'leaderboard';

/** Feature configuration with visibility and enablement settings */
export interface ClubFeature {
  key: ClubFeatureKey;
  enabled: boolean;
  public_visible: boolean;
}

/** Default features enabled for a new club */
export const DEFAULT_CLUB_FEATURES: ClubFeature[] = [
  { key: 'chat', enabled: true, public_visible: true },
  { key: 'announcements', enabled: true, public_visible: true },
  { key: 'links', enabled: true, public_visible: true },
  { key: 'members', enabled: true, public_visible: true },
];

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
// Club Permission Helpers
// -----------------------------------------------------------------------------

/** Check if a user has admin permissions in a club */
export function isClubAdmin(role: ClubMemberRole): boolean {
  return role === 'admin';
}

/** Check if a user has moderator or admin permissions in a club */
export function isClubLeader(role: ClubMemberRole): boolean {
  return role === 'admin' || role === 'moderator';
}

/** Check if a user can modify club details */
export function canModifyClubDetails(role: ClubMemberRole): boolean {
  return role === 'admin';
}

/** Check if a user can manage club features */
export function canManageClubFeatures(role: ClubMemberRole): boolean {
  return role === 'admin';
}

/** Check if a user can make announcements */
export function canMakeAnnouncements(role: ClubMemberRole): boolean {
  return role === 'admin' || role === 'moderator';
}

/** Check if a user can add links */
export function canAddLinks(role: ClubMemberRole): boolean {
  return role === 'admin' || role === 'moderator';
}

/** Check if a user can send messages in chat */
export function canSendMessages(role: ClubMemberRole, membershipStatus: ClubMembershipStatus): boolean {
  return membershipStatus === 'active';
}

/** Check if a feature is enabled for a club */
export function isFeatureEnabled(club: Club, featureKey: ClubFeatureKey): boolean {
  const feature = club.enabled_features?.find(f => f.key === featureKey);
  return feature?.enabled ?? false;
}

/** Check if a feature is publicly visible for a club */
export function isFeaturePubliclyVisible(club: Club, featureKey: ClubFeatureKey): boolean {
  const feature = club.enabled_features?.find(f => f.key === featureKey);
  return feature?.public_visible ?? false;
}

/** Get all publicly visible features for a club */
export function getPubliclyVisibleFeatures(club: Club): ClubFeatureKey[] {
  return club.enabled_features
    ?.filter(f => f.public_visible)
    .map(f => f.key) || [];
}

// -----------------------------------------------------------------------------
// Classrooms
// -----------------------------------------------------------------------------

/** Roles within a classroom — supports multiple teachers */
export type ClassroomMemberRole = 'teacher' | 'student';

/** Available features that a classroom can enable or disable */
export type ClassroomFeatureKey =
  | 'assignments'
  | 'quizzes'
  | 'resources'
  | 'discussions'
  | 'links';

/** Feature configuration for a classroom */
export interface ClassroomFeature {
  key: ClassroomFeatureKey;
  enabled: boolean;
}

/** Default features enabled for a new classroom */
export const DEFAULT_CLASSROOM_FEATURES: ClassroomFeature[] = [
  { key: 'assignments', enabled: true },
  { key: 'quizzes', enabled: false },
  { key: 'resources', enabled: true },
  { key: 'discussions', enabled: false },
  { key: 'links', enabled: false },
];

export interface Classroom {
  id: string;
  name: string;
  description: string | null;
  invite_code: string | null;
  curriculum_ids: string[];
  enabled_features: ClassroomFeature[];
  created_at: string;
}

export interface ClassroomMember {
  id: string;
  classroom_id: string;
  user_id: string;
  role: ClassroomMemberRole;
  joined_at: string;
}

export interface ClassroomCurriculum {
  id: string;
  classroom_id: string;
  curriculum_id: string;
}

// ── Assignments ───────────────────────────────────────────────────────────────

export type AssignmentPriority = 'low' | 'medium' | 'high';
export type AssignmentStatus = 'draft' | 'published' | 'closed';

export interface Assignment {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  due_date: string;
  priority: AssignmentPriority;
  status: AssignmentStatus;
  total_points: number | null;
  attachment_urls: string[];
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string | null;
  attachment_urls: string[];
  submitted_at: string | null;
  grade: number | null;
  feedback: string | null;
  graded_at: string | null;
}

// ── Quizzes ───────────────────────────────────────────────────────────────────

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type QuizStatus = 'draft' | 'published' | 'closed';

export interface Quiz {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  due_date: string | null;
  status: QuizStatus;
  questions: QuizQuestion[];
  created_by: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: QuizAnswer[];
  score: number | null;
  total_points: number;
  started_at: string;
  submitted_at: string | null;
}

export interface QuizAnswer {
  question_id: string;
  answer: string;
  is_correct: boolean | null;
}

// ── Discussions ───────────────────────────────────────────────────────────────

export interface DiscussionTopic {
  id: string;
  classroom_id: string;
  title: string;
  content: string;
  assignment_id: string | null;
  is_pinned: boolean;
  is_locked: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionReply {
  id: string;
  topic_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// ── Classroom Resources ───────────────────────────────────────────────────────

export type ResourceType = 'pdf' | 'video' | 'document' | 'link' | 'image';

export interface ClassroomResource {
  id: string;
  classroom_id: string;
  title: string;
  description: string | null;
  type: ResourceType;
  url: string;
  curriculum_id: string | null;
  subject_id: string | null;
  uploaded_by: string;
  created_at: string;
}

// ── Classroom Permission Helpers ──────────────────────────────────────────────

/** Check if a user is a teacher in a classroom */
export function isClassroomTeacher(role: ClassroomMemberRole): boolean {
  return role === 'teacher';
}

/** Check if a user is a student in a classroom */
export function isClassroomStudent(role: ClassroomMemberRole): boolean {
  return role === 'student';
}

/** Check if a classroom feature is enabled */
export function isClassroomFeatureEnabled(
  classroom: Classroom,
  featureKey: ClassroomFeatureKey
): boolean {
  const feature = classroom.enabled_features?.find(f => f.key === featureKey);
  return feature?.enabled ?? false;
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
// Exams & Countdowns
// -----------------------------------------------------------------------------

export interface Exam {
  id: string;
  curriculum_id: string | null;
  title: string;
  exam_series: string | null;
  exam_date: string;
  created_at: string;
}

export interface ExamCountdown {
  id: string;
  user_id: string;
  exam_id: string | null;
  custom_title: string | null;
  target_date: string | null;
  priority_indicator: 'high' | 'medium' | 'low' | string | null;
  qualification_group?: string;
  created_at: string;
}

// -----------------------------------------------------------------------------
// Flashcards & Spaced Repetition
// -----------------------------------------------------------------------------

/** Rating a user gives to a flashcard during review (maps to SM-2 quality scores) */
export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

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
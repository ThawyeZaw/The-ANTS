// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Shared Type Definitions
// All app-wide types & interfaces live here. Import from '@/types'.
// ──────────────────────────────────────────────────────────────────────────────

/** User roles in the system. */
export type UserRole = 'student' | 'tutor' | 'contributor' | 'admin' | 'teacher' | 'main_contributor';

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

/** A testimonial from a peer, mentor, or student */
export interface TestimonialEntry {
  id: string;
  fromName: string;
  fromTitle: string;
  content: string;
  date?: string;
  isHidden?: boolean;
  order?: number;
}

/** A certification or qualification credential */
export interface CertificationEntry {
  id: string;
  title: string;
  issuer: string;
  date?: string;
  credentialUrl?: string;
  fileUrl?: string;
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
  { key: 'default', name: 'Default', colors: { accent: '#f59e0b', background: '#0b0c0e', card: '#1e2026' } },
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

/** A single curriculum selection made during onboarding */
export interface OnboardingCurriculumSelection {
  curriculumType: string;
  subjectIds: string[];
  subjectNames: string[];
  examSeries?: string;
  examYear?: number;
  examDate?: string; // ISO date string, for IELTS/GED custom dates
}

/** User profile stored in the `profiles` table */
export interface Profile {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  role: UserRole;
  roles: UserRole[];
  activeRole?: UserRole;
  telegramHandle?: string;
  hourlyRate?: string;
  teachingCurriculums?: string[];
  teachingSubjects?: string[];
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
    testimonials?: boolean;
    certifications?: boolean;
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
  testimonials?: TestimonialEntry[];
  certifications?: CertificationEntry[];
  customUrlSlug?: string | null;
  showClubMemberships?: boolean;
  showClubProjects?: boolean;
  showClubActivity?: boolean;
  certificationIds?: string[] | null;
  telegramChatId?: string | null;
  notificationPreferences?: {
    timetable?: { enabled: boolean; reminders: number[] };
    exams?: { enabled: boolean; reminders: number[] };
  } | null;
  createdAt: string;
  isVerified?: boolean;
  // Onboarding fields
  onboardingCompleted?: boolean;
  preferredName?: string;
  timezone?: string;
  institutionName?: string;
  onboardingData?: OnboardingCurriculumSelection[];
  /** Founder designation — independent of the role enum. Admin-assignable only. */
  founderType?: 'founder' | 'co_founder' | null;
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
    description: 'Access all personal study tools — timetables, pomodoro, grade calculators, and more.',
    icon: 'GraduationCap',
    color: 'text-blue-500',
    gradient: 'from-blue-500 to-cyan-400',
  },
  tutor: {
    key: 'tutor',
    displayName: 'Tutor',
    description: 'Provide tutoring, offer study schedules and curriculum sessions for students.',
    icon: 'BookOpen',
    color: 'text-emerald-500',
    gradient: 'from-emerald-500 to-teal-400',
  },
  teacher: {
    key: 'teacher',
    displayName: 'Teacher',
    description: 'Academic resources, study guides, and curriculum materials for learners.',
    icon: 'BookOpen',
    color: 'text-teal-500',
    gradient: 'from-teal-500 to-emerald-400',
  },
  contributor: {
    key: 'contributor',
    displayName: 'Contributor',
    description: 'Build and maintain global curriculum templates and exam data, and get a public contributor profile.',
    icon: 'Pencil',
    color: 'text-violet-500',
    gradient: 'from-violet-500 to-purple-400',
  },
  main_contributor: {
    key: 'main_contributor',
    displayName: 'Main Contributor',
    description: 'Senior gatekeeper — review, approve, or reject contributor submissions before they go public.',
    icon: 'Shield',
    color: 'text-amber-500',
    gradient: 'from-amber-500 to-orange-400',
  },
  admin: {
    key: 'admin',
    displayName: 'Admin',
    description: 'Platform administrator with full governance, role management, and system administration privileges.',
    icon: 'ShieldAlert',
    color: 'text-rose-500',
    gradient: 'from-rose-500 to-red-400',
  },
};

/** All role keys as an array */
export const ALL_ROLES: UserRole[] = ['student', 'tutor', 'teacher', 'contributor', 'main_contributor', 'admin'];

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
// Clubs — Showcase Library
// -----------------------------------------------------------------------------

/** Club field categories */
export type ClubField =
  | 'architecture'
  | 'computer_science'
  | 'volunteering'
  | 'mathematics'
  | 'science'
  | 'literature'
  | 'arts'
  | 'music'
  | 'debate'
  | 'entrepreneurship'
  | 'engineering'
  | 'medicine'
  | 'other';

/** Predefined section keys for club public pages */
export type ClubSectionKey = 'about' | 'projects' | 'members' | 'announcements';

/** Join mode for a club */
export type ClubJoinMode = 'open' | 'invite_link' | 'approval_based';

/** Club feature keys for granular visibility controls */
export type ClubFeatureKey = 'chat' | 'announcements' | 'links' | 'members' | 'projects' | 'activity_timeline' | 'leaderboard';

/** Feature configuration for a club */
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
  { key: 'projects', enabled: false, public_visible: false },
  { key: 'activity_timeline', enabled: false, public_visible: false },
  { key: 'leaderboard', enabled: false, public_visible: false },
];

export interface Club {
  id: string;
  name: string;
  description: string | null;
  tagline: string | null;
  cover_image_url: string | null;
  accent_color: string | null;
  custom_slug: string | null;
  field: ClubField;
  created_by: string;
  created_at: string;
  updated_at: string | null;
  join_mode?: ClubJoinMode;
  enabled_features?: ClubFeature[];
}

export interface ClubSection {
  id: string;
  club_id: string;
  section_key: ClubSectionKey;
  visible: boolean;
  order_no: number;
  title_override: string | null;
}

export interface ClubLeader {
  id: string;
  club_id: string;
  user_id: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  user_id: string;
  joined_at: string | null;
  membership_status?: string;
}

export interface ClubProjectLink {
  label: string;
  url: string;
}

export interface ClubProject {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  tags: string[];
  links: ClubProjectLink[];
  contributors: string[];
  created_at: string;
  updated_at: string | null;
}

export interface ClubAnnouncement {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  content: string;
  created_at: string;
}

// ── Default sections for new clubs ──
export const DEFAULT_CLUB_SECTIONS: Array<{ key: ClubSectionKey; label: string }> = [
  { key: 'about', label: 'About' },
  { key: 'projects', label: 'Projects' },
  { key: 'members', label: 'Members' },
  { key: 'announcements', label: 'Announcements' },
];

// ── Academic Certifications ──

export type CertificationType = 'igcse' | 'as_level' | 'a_level' | 'ielts' | 'toefl' | 'sat' | 'other';

export interface Certification {
  id: string;
  user_id: string;
  type: CertificationType;
  subject?: string | null;
  exam_board?: string | null;
  grade?: string | null;
  year?: number | null;
  certificate_url?: string | null;
  is_verified: boolean;
  verified_by?: string | null;
  is_hidden: boolean;
  order_no?: number | null;
  created_at: string;
}

/** Display metadata for certification types */
export const CERTIFICATION_TYPE_META: Record<CertificationType, { label: string; icon: string; color: string }> = {
  igcse: { label: 'IGCSE', icon: 'BookOpen', color: 'bg-blue-500/10 text-blue-400' },
  as_level: { label: 'AS Level', icon: 'BookOpen', color: 'bg-purple-500/10 text-purple-400' },
  a_level: { label: 'A Level', icon: 'BookOpen', color: 'bg-indigo-500/10 text-indigo-400' },
  ielts: { label: 'IELTS', icon: 'Globe', color: 'bg-emerald-500/10 text-emerald-400' },
  toefl: { label: 'TOEFL', icon: 'Globe', color: 'bg-teal-500/10 text-teal-400' },
  sat: { label: 'SAT', icon: 'PenTool', color: 'bg-amber-500/10 text-amber-400' },
  other: { label: 'Other', icon: 'Award', color: 'bg-gray-500/10 text-gray-400' },
};

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

// ── Library System Types ─────────────────────────────────────────────────────

/** Status of a piece of content in the contributor library pipeline */
export type LibraryStatus = 'pending_review' | 'approved' | 'rejected' | null;

/** Visibility level for user-created content */
export type ContentVisibility = 'private' | 'link' | 'public';

/** Supported qualification keys (board_qualification format) */
export type QualificationKey =
  | 'CAIE_IGCSE'
  | 'Edexcel_IGCSE'
  | 'Edexcel_IAL'
  | 'CAIE_AL'
  | 'IELTS'
  | 'OSSD'
  | 'GED';

/** Grading system identifier for grade calculator logic */
export type GradingSystem =
  | 'raw_marks_AG'      // Cambridge: A*-G via raw marks + boundaries
  | 'raw_marks_91'      // Edexcel IGCSE: 9-1 via raw marks
  | 'ums'               // Edexcel IAL: raw → UMS → aggregate
  | 'band'              // IELTS: 0-9.0 in 0.5 increments
  | 'percentage'        // OSSD: 0-100%
  | 'scaled';           // GED: 145-200 per subject

/** Describes the 3-level content hierarchy for a curriculum */
export interface HierarchyModel {
  /** Top level, e.g. "Subject" */
  level1: string;
  /** Middle level, e.g. "Paper", "Unit", "Module" */
  level2: string;
  /** Leaf level, e.g. "Topic", "Assignment" */
  level3: string;
}

/** Date type for exam entries — fixed (board-defined) or custom (user-picked) */
export type ExamDateType = 'fixed' | 'custom';

// ── End Library System Types ──────────────────────────────────────────────────

export interface Exam {
  id: string;
  curriculum_id: string | null;
  /** FK to subjects.id — nullable for exams not tied to a specific subject */
  subject_id: string | null;
  title: string;
  exam_series: string | null;
  exam_date: string;
  created_at: string;
  // ── Library System additions ──
  /** Exam board abbreviation, e.g. "CAIE", "Edexcel", "IELTS" */
  exam_board: string | null;
  /** Subject syllabus code, e.g. "0620", "4MA1" */
  syllabus_code: string | null;
  /** Qualification type, e.g. "IGCSE", "IAL", "IELTS" */
  qualification: string | null;
  /** For IAL: unit code, e.g. "WMA11". For IGCSE: paper number, e.g. "P1" */
  paper_code: string | null;
  /** Whether the date is globally fixed (board series) or must be set by user */
  date_type: ExamDateType;
  /** Library pipeline status — null means user-created, not in library */
  library_status: LibraryStatus;
}

export interface ExamGradeBoundary {
  id: string;
  exam_id: string;
  grade: string;
  min_mark: number;
  max_mark: number | null;
  boundary_level: string;
  created_at?: string;
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
  // ── Library System additions ──
  /** User override for the exam date (even for 'fixed' type exams) */
  custom_date_override: string | null;
  /** Token for link-sharing this countdown */
  share_token: string | null;
  /** Whether this countdown was created from the library (has linked exam) or is fully custom */
  is_custom: boolean;
  /** Visibility control: 'private' (owner only), 'link' (share_token), 'public' (library) */
  visibility: 'private' | 'link' | 'public';
}

// -----------------------------------------------------------------------------
// Course Manager — User Enrollments, Exam Targets & Overrides
// -----------------------------------------------------------------------------

/** Junction: a user enrols in a subject within a curriculum with an optional exam target */
export interface UserEnrollment {
  id: string;
  user_id: string;
  curriculum_id: string;
  subject_id: string;
  /** FK to exams.id — the exam series the user is targeting */
  exam_id: string | null;
  enrolled_at: string;
}

/** User-specific overrides for an exam entry (stored separately from library data) */
export interface UserExamOverride {
  id: string;
  user_id: string;
  exam_id: string;
  /** Overridden title (nullable — null means use library default) */
  custom_title: string | null;
  /** Overridden exam series label */
  custom_exam_series: string | null;
  /** Overridden exam date */
  custom_exam_date: string | null;
}

/** A completed exam in the user's exam history */
export interface UserExamHistory {
  id: string;
  user_id: string;
  curriculum_id: string;
  subject_id: string;
  exam_id: string | null;
  /** The date the exam was taken */
  exam_date: string;
  /** User-entered grade/result (e.g. "A*", "8", "Band 7") */
  result: string | null;
  /** Whether this was a real exam or a mock */
  is_mock: boolean;
  /** Optional free-form notes */
  notes: string | null;
  recorded_at: string;
}

// -----------------------------------------------------------------------------
// Topic
// -----------------------------------------------------------------------------

/** A topic within a subject (e.g. "Motion, Forces and Energy" in Physics) */
export interface Topic {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  /** Official syllabus reference code (e.g. "4.1.2") */
  syllabus_code: string | null;
  /** Learning objectives for this topic */
  learning_objectives: string | null;
  order_no: number;
}

// -----------------------------------------------------------------------------
// Review Queue & Version Control
// -----------------------------------------------------------------------------

/** All entity types that go through the review queue */
export type ReviewSubmissionType =
  | 'curriculum'
  | 'subject'
  | 'topic'
  | 'exam'
  | 'calculator'
  | 'countdown';

/** Predefined feedback category tags for rejected submissions */
export type ReviewFeedbackCategory =
  | 'inaccurate_content'
  | 'formatting_issues'
  | 'missing_information'
  | 'grammar_spelling'
  | 'duplicate_entry'
  | 'outdated_syllabus'
  | 'other';

/** Structured feedback for a rejected submission */
export interface ReviewFeedback {
  /** Selected category tags */
  categories: ReviewFeedbackCategory[];
  /** Free-text note from the reviewer */
  note: string;
}

/** A single item in the review queue */
export interface ReviewQueueItem {
  id: string;
  /** Who submitted it */
  contributor_id: string;
  /** What type of entity */
  submission_type: ReviewSubmissionType;
  /** FK to the actual entity (curriculums.id, subjects.id, etc.) */
  entity_id: string;
  /** The submitted data snapshot (JSON) — used for review & versioning */
  submitted_data: Record<string, unknown>;
  /** Whether this is a new entry or an edit to an existing published entry */
  is_update: boolean;
  /** ID of the published entity being updated (null for new entries) */
  published_entity_id: string | null;
  status: 'pending' | 'approved' | 'rejected';
  /** Who reviewed it */
  reviewer_id: string | null;
  /** Structured feedback (only when rejected) */
  feedback: ReviewFeedback | null;
  submitted_at: string;
  reviewed_at: string | null;
}

// ── Version History ───────────────────────────────────────────────────────────

/** A single field-level change in a version entry */
export interface FieldChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
}

/** A version history entry stored when published content is updated */
export interface VersionEntry {
  id: string;
  /** Which type of entity */
  entity_type: ReviewSubmissionType;
  /** FK to the entity */
  entity_id: string;
  /** Version number (auto-incrementing per entity) */
  version_number: number;
  /** RFC 6902 JSON Patch array describing field-level changes */
  changes: FieldChange[];
  /** Who made the change */
  changed_by: string;
  /** ID of the review queue item that triggered this version */
  review_item_id: string | null;
  changed_at: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Organisation — The ANTS
// ──────────────────────────────────────────────────────────────────────────────

/** A team member of The ANTS (may or may not have a linked user profile) */
export interface OrgTeamMember {
  id: string;
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  /** Optional link to an existing user profile by username */
  linkedProfileUsername?: string;
  order: number;
  isAlumni?: boolean;
}

/** Form data for creating/editing an org team member */
export interface OrgTeamMemberFormData {
  name: string;
  title: string;
  bio: string;
  photoUrl: string;
  linkedProfileUsername?: string;
  isAlumni?: boolean;
}

/** The organisation's mission statement stored as markdown */
export interface OrgMission {
  id: string;
  content: string;
  updatedAt: string;
}

/** A single timeline item — an event, milestone, or activity in The ANTS history */
export interface OrgTimelineItem {
  id: string;
  title: string;
  description: string;
  /** Display date string shown on the timeline/about page (e.g. "2024 Q1", "2025-06-10") */
  date: string;
  /** Optional category for filtering in gallery view */
  category?: 'workshop' | 'competition' | 'camp' | 'community' | 'other' | 'milestone';
  imageUrls: string[];
  location?: string;
  /** When true, this item appears on the /about page timeline */
  showOnTimeline: boolean;
  order: number;
  createdAt: string;
}

/** Form data for creating/editing an org timeline item */
export interface OrgTimelineItemFormData {
  title: string;
  description: string;
  date: string;
  category?: OrgTimelineItem['category'];
  imageUrls: string[];
  showOnTimeline?: boolean;
  location?: string;
}

// ── Timetable Types (re-exported from timetable.ts) ──────────────────────────
export type {
  TimetableEventType,
  TimetableEventSource,
  RecurrenceFrequency,
  RecurrenceRule,
  TimetableEvent,
  TimetableView,
  TimetableFilters,
  TimetableEventFormData,
} from './timetable';

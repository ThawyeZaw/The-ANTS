// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Mock Database Facade
// ──────────────────────────────────────────────────────────────────────────────
//
// MVP Phase 1: All features import data from this single facade.
// When Supabase is connected, these functions will be replaced with
// real database queries — but the function signatures stay the same.
//
// ⚠️  NEVER hardcode mock arrays inside component files.
//     Always import from '@/lib/mock/database'.
// ──────────────────────────────────────────────────────────────────────────────

import {
  Profile,
  AuthUser,
  UserRole,
  Club,
  ClubAnnouncement,
  ClubCurriculum,
  ClubJoinMode,
  ClubJoinRequest,
  ClubLink,
  ClubMember,
  ClubMessage,
  ClubSubject,
  ClubFeature,
  Deck,
  FlashCard,
  CardReview,
  SRSRating,
  ParsedAICard,
  Exam,
  ExamCountdown,
  RoleUpgradeRequest,
  UpgradeRequestStatus,
  ProjectEntry,
  ActivityEntry,
  AchievementEntry,
  SocialLinkItem,
  TestimonialEntry,
  CertificationEntry,
  OrgTeamMember,
  OrgTimelineItem,
  OrgTimelineItemFormData,
  DEFAULT_CLUB_FEATURES,
  Note,
  Classroom,
  ClassroomMember,
  ClassroomMemberRole,
  ClassroomCurriculum,
  ClassroomFeature,
  Assignment,
  AssignmentSubmission,
  Quiz,
  QuizQuestion,
  QuizAttempt,
  QuizAnswer,
  DiscussionTopic,
  DiscussionReply,
  ClassroomResource,
  UserSavedNote,
} from '@/types';
import { generateUsername } from '@/lib/utils';

// ── Mock User Profiles ──────────────────────────────────────────────────────

const mockProfiles: Profile[] = [
  {
    id: 'user-student-001',
    email: 'thiri@theants.edu',
    name: 'Thiri Aung',
    username: 'thiriaung',
    avatar: '',
    role: 'student',
    bio: 'IGCSE student aiming for straight A*s. Love physics and maths!',
    title: 'IGCSE Student',
    isPublic: true,
    projects: [
      {
        id: 'proj-1',
        title: 'Physics Experiment Simulator',
        description: 'A web-based physics lab simulator built for IGCSE students.',
        role: 'Lead Developer',
        technologies: ['React', 'Three.js', 'TypeScript'],
        links: { github: 'https://github.com/thiriaung/phys-sim' },
      },
    ],
    activities: [
      {
        id: 'act-1',
        name: 'Science Olympiad',
        organization: 'Myanmar Science Society',
        role: 'Team Member',
        start_date: '2025-09-01',
        end_date: '2026-03-01',
        description: 'Participated in national-level science competition.',
      },
    ],
    achievements: [
      {
        id: 'ach-1',
        title: 'IGCSE Outstanding Achievement Award',
        description: 'Awarded for top marks in Physics and Mathematics.',
        date: '2025-08-15',
        issuer: 'Cambridge Assessment',
      },
    ],
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-student-002',
    email: 'min.htet@theants.edu',
    name: 'Min Htet Naing',
    username: 'minhtetnaing',
    avatar: '',
    role: 'student',
    bio: 'A Level Biology student preparing for medical school entrance.',
    title: 'A Level Student',
    isPublic: true,
    projects: [
      {
        id: 'proj-2',
        title: 'Cell Biology Study Guide',
        description: 'Interactive study guide with diagrams and quizzes.',
        role: 'Creator',
        technologies: ['HTML', 'CSS', 'JavaScript'],
        links: { live: 'https://minhtet-biology.netlify.app' },
      },
    ],
    activities: [],
    achievements: [],
    createdAt: '2026-02-10T08:00:00Z',
  },
  {
    id: 'user-teacher-001',
    email: 'u.kyaw@theants.edu',
    name: 'U Kyaw Min',
    username: 'ukyawmin',
    avatar: '',
    role: 'teacher',
    bio: 'Experienced A Level Chemistry teacher with 10+ years of tutoring Myanmar students.',
    title: 'A Level Chemistry Teacher',
    isPublic: true,
    projects: [
      {
        id: 'proj-3',
        title: 'Chemistry Revision Portal',
        description: 'Comprehensive revision resources for A Level Chemistry.',
        role: 'Author',
        technologies: ['Next.js', 'Tailwind CSS'],
        links: { website: 'https://chemistry-revise.com' },
      },
    ],
    activities: [],
    achievements: [
      {
        id: 'ach-2',
        title: 'Best Teacher Award 2025',
        description: 'Recognized for excellence in online teaching.',
        date: '2025-12-01',
        issuer: 'Myanmar Online Education Association',
      },
    ],
    createdAt: '2025-09-01T08:00:00Z',
  },
  {
    id: 'user-teacher-002',
    email: 'daw.su@theants.edu',
    name: 'Daw Su Myat',
    username: 'dawsumyat',
    avatar: '',
    role: 'teacher',
    bio: 'IGCSE Mathematics specialist. Cambridge-certified trainer.',
    title: 'IGCSE Maths Teacher',
    isPublic: false,
    projects: [],
    activities: [],
    achievements: [],
    createdAt: '2025-11-15T08:00:00Z',
  },
  {
    id: 'user-contributor-001',
    email: 'aye.chan@theants.edu',
    name: 'Aye Chan Thu',
    username: 'ayechanthu',
    avatar: '',
    role: 'contributor',
    bio: 'Cambridge-trained educator building curriculum resources for Myanmar students.',
    title: 'Curriculum Developer',
    isPublic: true,
    socialLinks: [
      { id: 'sl1', platform: 'github', label: 'GitHub', url: 'https://github.com/ayechanthu', visible: true, order: 0 },
      { id: 'sl2', platform: 'website', label: 'Website', url: 'https://ayechanthu.dev', visible: true, order: 1 },
    ],
    projects: [
      {
        id: 'proj-4',
        title: 'IGCSE Physics Curriculum',
        description: 'Full curriculum template with lesson plans and assessments.',
        role: 'Lead Developer',
        technologies: ['Markdown', 'LaTeX'],
      },
    ],
    activities: [
      {
        id: 'act-2',
        name: 'Education Summit 2025',
        organization: 'Myanmar Education Forum',
        role: 'Speaker',
        start_date: '2025-11-01',
        end_date: '2025-11-03',
        description: 'Presented on digital curriculum development.',
      },
    ],
    achievements: [
      {
        id: 'ach-3',
        title: 'Published Curriculum Author',
        description: 'Authored 3 IGCSE curriculum templates on The ANTS.',
        date: '2025-06-20',
      },
    ],
    testimonials: [
      {
        id: 'test-1',
        fromName: 'Daw Hla Myint',
        fromTitle: 'Head of Content, The ANTS',
        content: 'Aye Chan Thu is one of the most dedicated curriculum developers I have worked with. His IGCSE Physics resources are thorough, accurate, and student-friendly.',
        date: '2025-12-01',
        order: 0,
      },
    ],
    certifications: [
      {
        id: 'cert-1',
        title: 'Cambridge CELTA',
        issuer: 'Cambridge Assessment English',
        date: '2024',
        order: 0,
      },
    ],
    createdAt: '2025-06-20T08:00:00Z',
  },
  {
    id: 'user-contributor-002',
    email: 'ko.zaw@theants.edu',
    name: 'Ko Zaw Win',
    username: 'kozawwin',
    avatar: '',
    role: 'contributor',
    bio: 'Former IGCSE examiner. Building free exam prep resources for Myanmar students.',
    title: 'Exam Resource Creator',
    isPublic: true,
    socialLinks: [
      { id: 'sl3', platform: 'facebook', label: 'Facebook', url: 'https://facebook.com/kozawwin', visible: true, order: 0 },
    ],
    projects: [],
    activities: [],
    achievements: [],
    createdAt: '2025-08-05T08:00:00Z',
  },
  {
    id: 'user-main-contributor-001',
    email: 'daw.hla@theants.edu',
    name: 'Daw Hla Myint',
    username: 'dawhlamyint',
    avatar: '',
    role: 'main_contributor',
    bio: 'Senior gatekeeper and lead reviewer. 15 years in international education.',
    title: 'Head of Content',
    isPublic: true,
    socialLinks: [
      { id: 'sl4', platform: 'github', label: 'GitHub', url: 'https://github.com/dawhlamyint', visible: true, order: 0 },
      { id: 'sl5', platform: 'website', label: 'Website', url: 'https://dawhlamyint.com', visible: true, order: 1 },
    ],
    projects: [
      {
        id: 'proj-5',
        title: 'Gatekeeper Review System',
        description: 'Designed the review workflow for curriculum submissions.',
        role: 'Project Lead',
        technologies: ['System Design', 'PostgreSQL'],
      },
    ],
    activities: [
      {
        id: 'act-3',
        name: 'International Education Conference',
        organization: 'Cambridge University Press',
        role: 'Panelist',
        start_date: '2026-02-15',
        end_date: '2026-02-16',
      },
    ],
    achievements: [
      {
        id: 'ach-4',
        title: '15 Years in Education',
        description: 'Recognized for contributions to Myanmar\'s education sector.',
        date: '2025-03-10',
      },
    ],
    createdAt: '2025-03-10T08:00:00Z',
  },
];

// ── Password Store (mock only — never do this in production!) ────────────────

const mockPasswords: Record<string, string> = {
  'thiri@theants.edu': 'student123',
  'min.htet@theants.edu': 'student123',
  'u.kyaw@theants.edu': 'teacher123',
  'daw.su@theants.edu': 'teacher123',
  'aye.chan@theants.edu': 'contributor123',
  'ko.zaw@theants.edu': 'contributor123',
  'daw.hla@theants.edu': 'maincontributor123',
};

// ── Role Upgrade Requests ────────────────────────────────────────────────────

export const mockRoleUpgradeRequests: RoleUpgradeRequest[] = [
  {
    id: 'upg-1',
    user_id: 'user-student-001',
    current_role: 'student',
    requested_role: 'teacher',
    reason: 'I have started tutoring and need to create classrooms.',
    status: 'pending',
    reviewer_id: null,
    created_at: '2026-06-20T08:00:00Z',
    reviewed_at: null,
  },
  {
    id: 'upg-2',
    user_id: 'user-student-002',
    current_role: 'student',
    requested_role: 'contributor',
    reason: 'I want to contribute curriculum resources for Biology.',
    status: 'approved',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-06-15T08:00:00Z',
    reviewed_at: '2026-06-18T10:00:00Z',
  },
];

// ── Auth Functions ───────────────────────────────────────────────────────────

/**
 * Authenticate a user with email and password.
 * Returns the AuthUser on success, null on failure.
 */
export function mockLogin(email: string, password: string): AuthUser | null {
  const normalizedEmail = email.toLowerCase().trim();
  const storedPassword = mockPasswords[normalizedEmail];

  if (!storedPassword || storedPassword !== password) {
    return null;
  }

  const profile = mockProfiles.find((p) => p.email === normalizedEmail);
  if (!profile) return null;

  return {
    id: profile.id,
    email: profile.email,
    profile,
  };
}

/**
 * Register a new user with email, password, and name.
 * In Phase 2 redesign, signup defaults to 'student' role only.
 * Other roles require main contributor approval.
 */
export function mockSignup(
  email: string,
  password: string,
  name: string
): AuthUser | { error: string } {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  if (mockPasswords[normalizedEmail]) {
    return { error: 'An account with this email already exists.' };
  }

  const newProfile: Profile = {
    id: `user-student-${Date.now()}`,
    email: normalizedEmail,
    name,
    username: generateUsername(name),
    avatar: '',
    role: 'student', // Signups are always 'student' initially
    createdAt: new Date().toISOString(),
  };

  // Add to in-memory stores
  mockProfiles.push(newProfile);
  mockPasswords[normalizedEmail] = password;

  return {
    id: newProfile.id,
    email: newProfile.email,
    profile: newProfile,
  };
}

// ── Profile Queries ──────────────────────────────────────────────────────────

/** Get a single profile by user ID */
export function getProfile(userId: string): Profile | undefined {
  return mockProfiles.find((p) => p.id === userId);
}

/** Get a profile by email */
export function getProfileByEmail(email: string): Profile | undefined {
  return mockProfiles.find((p) => p.email === email.toLowerCase().trim());
}

/** Get all profiles (admin use) */
export function getAllProfiles(): Profile[] {
  return [...mockProfiles];
}

/** Get all profiles with a specific role */
export function getProfilesByRole(role: UserRole): Profile[] {
  return mockProfiles.filter((p) => p.role === role);
}

/** Get a profile by username slug */
export function getProfileByUsername(username: string): Profile | undefined {
  return mockProfiles.find((p) => p.username === username.toLowerCase());
}

/**
 * Get all public profiles (isPublic === true).
 * Optionally filter by role(s).
 */
export function getPublicProfiles(roles?: UserRole[]): Profile[] {
  let filtered = mockProfiles.filter((p) => p.isPublic === true);
  if (roles && roles.length > 0) {
    filtered = filtered.filter((p) => roles.includes(p.role));
  }
  return filtered;
}

/**
 * Update a user's profile data in the mock store.
 * In production, this calls supabase.from('profiles').update().
 */
export function mockUpdateProfile(
  userId: string,
  data: Partial<Pick<Profile, 'name' | 'bio' | 'title' | 'socialLinks' | 'avatar' | 'isPublic' | 'projects' | 'activities' | 'achievements' | 'academicGrades' | 'pinnedItemId' | 'sectionVisibility' | 'sectionOrder' | 'theme' | 'spacing' | 'width' | 'sectionLayout'>>
): { success: true; profile: Profile } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  if (data.name !== undefined) {
    profile.name = data.name;
    profile.username = generateUsername(data.name);
  }
  if (data.bio !== undefined) profile.bio = data.bio;
  if (data.title !== undefined) profile.title = data.title;
  if (data.socialLinks !== undefined) profile.socialLinks = data.socialLinks;
  if (data.avatar !== undefined) profile.avatar = data.avatar;
  if (data.isPublic !== undefined) profile.isPublic = data.isPublic;
  if (data.pinnedItemId !== undefined) profile.pinnedItemId = data.pinnedItemId;
  if (data.sectionVisibility !== undefined) profile.sectionVisibility = data.sectionVisibility;
  if (data.sectionOrder !== undefined) profile.sectionOrder = data.sectionOrder;
  if (data.theme !== undefined) profile.theme = data.theme;
  if (data.spacing !== undefined) profile.spacing = data.spacing;
  if (data.width !== undefined) profile.width = data.width;
  if (data.sectionLayout !== undefined) profile.sectionLayout = data.sectionLayout;
  if (data.projects !== undefined) profile.projects = data.projects;
  if (data.activities !== undefined) profile.activities = data.activities;
  if (data.achievements !== undefined) profile.achievements = data.achievements;
  if (data.academicGrades !== undefined) profile.academicGrades = data.academicGrades;

  return { success: true, profile: { ...profile } };
}

// ── Role Management ──────────────────────────────────────────────────────────

/**
 * Legacy direct role update — kept for backward compatibility.
 * In the new system, this should be used only for testing.
 * It directly changes the role without going through the approval flow.
 */
export function mockUpdateRole(
  userId: string,
  newRole: UserRole
): { success: true; profile: Profile } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  const roleHierarchy: Record<UserRole, number> = {
    student: 0,
    teacher: 1,
    contributor: 2,
    main_contributor: 3,
  };

  const currentLevel = roleHierarchy[profile.role];
  const requestedLevel = roleHierarchy[newRole];

  if (requestedLevel <= currentLevel) {
    return { success: false, error: 'Can only upgrade to a higher role. Downgrades are not permitted.' };
  }

  profile.role = newRole;
  return { success: true, profile: { ...profile } };
}


/**
 * Request a role upgrade. Only upgrades are allowed (e.g. student → teacher).
 * A main_contributor must approve the request before the role changes.
 */
export function mockRequestRoleUpgrade(
  userId: string,
  requestedRole: UserRole,
  reason?: string
): { success: true; request: RoleUpgradeRequest } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  const roleHierarchy: Record<UserRole, number> = {
    student: 0,
    teacher: 1,
    contributor: 2,
    main_contributor: 3,
  };

  const currentLevel = roleHierarchy[profile.role];
  const requestedLevel = roleHierarchy[requestedRole];

  if (requestedLevel <= currentLevel) {
    return { success: false, error: 'You can only upgrade to a higher role. Downgrades are not permitted.' };
  }

  // Check for existing pending request
  const existing = mockRoleUpgradeRequests.find(
    (r) => r.user_id === userId && r.requested_role === requestedRole && r.status === 'pending'
  );
  if (existing) {
    return { success: false, error: 'You already have a pending upgrade request for this role.' };
  }

  const request: RoleUpgradeRequest = {
    id: `upg-${Date.now()}`,
    user_id: userId,
    current_role: profile.role,
    requested_role: requestedRole,
    reason: reason || null,
    status: 'pending',
    reviewer_id: null,
    created_at: new Date().toISOString(),
    reviewed_at: null,
  };

  mockRoleUpgradeRequests.push(request);
  return { success: true, request };
}

/**
 * Approve or reject a role upgrade request.
 * Only main_contributors can perform this action.
 */
export function mockReviewRoleUpgrade(
  requestId: string,
  reviewerId: string,
  status: 'approved' | 'rejected',
  feedback?: string
): { success: true } | { success: false; error: string } {
  const reviewer = mockProfiles.find((p) => p.id === reviewerId);
  if (!reviewer || reviewer.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can review upgrade requests.' };
  }

  const request = mockRoleUpgradeRequests.find((r) => r.id === requestId);
  if (!request) return { success: false, error: 'Upgrade request not found.' };
  if (request.status !== 'pending') return { success: false, error: 'This request has already been reviewed.' };

  request.status = status;
  request.reviewer_id = reviewerId;
  request.reviewed_at = new Date().toISOString();

  if (status === 'approved') {
    const profile = mockProfiles.find((p) => p.id === request.user_id);
    if (profile) {
      profile.role = request.requested_role;
    }
  }

  return { success: true };
}

/**
 * Main contributor can directly promote a user without a prior request.
 */
export function mockDirectPromote(
  userId: string,
  reviewerId: string,
  newRole: UserRole
): { success: true } | { success: false; error: string } {
  const reviewer = mockProfiles.find((p) => p.id === reviewerId);
  if (!reviewer || reviewer.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can promote users.' };
  }

  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  const roleHierarchy: Record<UserRole, number> = {
    student: 0,
    teacher: 1,
    contributor: 2,
    main_contributor: 3,
  };

  const currentLevel = roleHierarchy[profile.role];
  const requestedLevel = roleHierarchy[newRole];

  if (requestedLevel <= currentLevel) {
    return { success: false, error: 'Can only promote to a higher role.' };
  }

  profile.role = newRole;

  // Record the promotion as an approved request
  mockRoleUpgradeRequests.push({
    id: `upg-${Date.now()}`,
    user_id: userId,
    current_role: profile.role,
    requested_role: newRole,
    reason: 'Direct promotion by main contributor',
    status: 'approved',
    reviewer_id: reviewerId,
    created_at: new Date().toISOString(),
    reviewed_at: new Date().toISOString(),
  });

  return { success: true };
}

/** Get all pending upgrade requests (for main contributor dashboard) */
export function getPendingUpgradeRequests(): RoleUpgradeRequest[] {
  return mockRoleUpgradeRequests.filter((r) => r.status === 'pending');
}

/** Get all upgrade requests for a specific user */
export function getUserUpgradeRequests(userId: string): RoleUpgradeRequest[] {
  return mockRoleUpgradeRequests.filter((r) => r.user_id === userId);
}

// ── Type Guard ───────────────────────────────────────────────────────────────

/** Check if a signup result is an error */
export function isSignupError(
  result: AuthUser | { error: string }
): result is { error: string } {
  return 'error' in result;
}

// ── Contributor Invite Flow ──────────────────────────────────────────────────
// TODO: Replace with Supabase email invite + OTP when backend is connected.

/** Mock OTP code for testing */
const MOCK_OTP_CODE = '123456';

/**
 * Step 1: Invite a user by creating a skeleton profile.
 * In production, this sends an invite email with an OTP.
 */
export function mockInviteUser(
  email: string,
  name: string,
  role: UserRole
): { success: true; userId: string } | { success: false; error: string } {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  const existing = mockProfiles.find((p) => p.email === normalizedEmail);
  if (existing) {
    return { success: false, error: 'A user with this email already exists.' };
  }

  const userId = `user-${role}-${Date.now()}`;
  const newProfile: Profile = {
    id: userId,
    email: normalizedEmail,
    name,
    username: generateUsername(name),
    avatar: '',
    role,
    createdAt: new Date().toISOString(),
  };

  mockProfiles.push(newProfile);
  return { success: true, userId };
}

/**
 * Step 2: Verify OTP code.
 * In production, this validates against a Supabase-issued OTP.
 */
export function mockVerifyOtp(_email: string, otp: string): boolean {
  return otp === MOCK_OTP_CODE;
}

/**
 * Step 3: Complete the invited user's profile with password and details.
 * In production, this updates the profile row and creates a contributor_profiles row.
 */
export function mockCompleteProfile(
  userId: string,
  data: {
    password: string;
    title?: string;
    bio?: string;
    website_url?: string;
    facebook_url?: string;
    linkedin_url?: string;
    github_url?: string;
  }
): { success: true } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) {
    return { success: false, error: 'User not found.' };
  }

  // Update profile fields
  if (data.title) profile.title = data.title;
  if (data.bio) profile.bio = data.bio;
  if (data.website_url || data.linkedin_url || data.github_url || data.facebook_url) {
    const newLinks: SocialLinkItem[] = [];
    if (data.website_url) newLinks.push({ id: `sl_${Date.now()}_w`, platform: 'website', label: 'Website', url: data.website_url, visible: true });
    if (data.github_url) newLinks.push({ id: `sl_${Date.now()}_g`, platform: 'github', label: 'GitHub', url: data.github_url, visible: true });
    if (data.linkedin_url) newLinks.push({ id: `sl_${Date.now()}_l`, platform: 'custom', label: 'LinkedIn', url: data.linkedin_url, visible: true });
    if (data.facebook_url) newLinks.push({ id: `sl_${Date.now()}_f`, platform: 'facebook', label: 'Facebook', url: data.facebook_url, visible: true });
    profile.socialLinks = newLinks;
  }

  // Store password
  mockPasswords[profile.email] = data.password;

  // Add contributor profile entry if role is contributor or main_contributor
  if (profile.role === 'contributor' || profile.role === 'main_contributor') {
    mockContributorProfiles.push({
      id: userId,
      title: data.title || null,
      bio: data.bio || null,
      website_url: data.website_url || null,
      facebook_url: data.facebook_url || null,
      linkedin_url: data.linkedin_url || null,
      github_url: data.github_url || null,
      verification_documents_url: null,
    });
  }

  return { success: true };
}

// ── Mock Additional Profiles Data ────────────────────────────────────────────
export const mockStudentProfiles = [
  { id: 'user-student-001', target_exam_year: 2026, study_goals_metadata: { goal: 'A*' } }
];

export const mockTeacherProfiles = [
  { id: 'user-teacher-001', institution_name: 'Yangon International School', is_verified_teacher: true }
];

export const mockContributorProfiles: Array<{
  id: string;
  title: string | null;
  bio: string | null;
  website_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  verification_documents_url: string | null;
}> = [
    { id: 'user-contributor-001', title: 'Curriculum Developer', bio: 'Expert in science.', website_url: 'https://example.com', facebook_url: null, linkedin_url: 'https://linkedin.com/in/ayechanthu', github_url: 'https://github.com/ayechanthu', verification_documents_url: null },
    { id: 'user-main-contributor-001', title: 'Head of Content', bio: 'Senior reviewer.', website_url: 'https://dawhlamyint.com', facebook_url: null, linkedin_url: 'https://linkedin.com/in/dawhlamyint', github_url: null, verification_documents_url: null }
  ];

// ── Mock Curriculums & Topics ────────────────────────────────────────────────
export const mockCurriculums = [
  { id: 'curr-1', title: 'IGCSE Physics', description: 'Cambridge IGCSE Physics 0625', qualification: 'IGCSE', exam_board: 'CAIE', created_by: 'user-contributor-001', status: 'published', is_public: true, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }
];

export const mockSubjects = [
  { id: 'subj-1', curriculum_id: 'curr-1', title: 'Physics', description: 'Core Physics', order_no: 1 }
];

export const mockTopics = [
  { id: 'top-1', subject_id: 'subj-1', title: 'Forces and Motion', description: 'Understanding speed, velocity, and acceleration.', order_no: 1 },
  { id: 'top-2', subject_id: 'subj-1', title: 'Energy', description: 'Work, energy, and power.', order_no: 2 }
];

export const mockUserCurriculums = [
  { id: 'uc-1', user_id: 'user-student-001', curriculum_id: 'curr-1', selected_at: '2026-01-16T00:00:00Z' }
];

export const mockTopicProgress = [
  { id: 'tp-1', user_id: 'user-student-001', topic_id: 'top-1', confidence_level: 4, status: 'in_progress', updated_at: '2026-06-17T00:00:00Z' }
];

export const mockResources = [
  { id: 'res-1', curriculum_id: 'curr-1', contributor_id: 'user-contributor-001', title: 'Forces Cheatsheet', content: 'https://example.com/forces.pdf', resource_type: 'pdf', status: 'published', is_public: true, created_at: '2025-02-01T00:00:00Z', updated_at: '2025-02-01T00:00:00Z' }
];

export const mockEditorSubmissions: Array<{
  id: string;
  contributor_id: string;
  submission_type: string;
  entity_id: string;
  status: string;
  reviewer_id: string | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
}> = [
    { id: 'sub-1', contributor_id: 'user-contributor-001', submission_type: 'resource', entity_id: 'res-1', status: 'approved', reviewer_id: 'user-main-contributor-001', feedback: 'Looks good', submitted_at: '2025-01-20T00:00:00Z', reviewed_at: '2025-01-21T00:00:00Z' }
  ];


// ── Mock Classrooms ─────────────────────────────────────────────────────────
export const mockClassrooms: Classroom[] = [
  {
    id: 'class-1',
    name: 'Year 11 Physics',
    description: 'Ms. Kyaw\'s physics class — covering Mechanics, Waves, Electricity, and Thermal Physics.',
    invite_code: 'PHY11',
    curriculum_ids: ['curr-1'],
    enabled_features: [
      { key: 'assignments', enabled: true },
      { key: 'quizzes', enabled: true },
      { key: 'resources', enabled: true },
      { key: 'discussions', enabled: true },
      { key: 'links', enabled: true },
    ],
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'class-2',
    name: 'IGCSE Chemistry Lab',
    description: 'Practical chemistry for IGCSE students — Stoichiometry, Organic, and Acids & Bases.',
    invite_code: 'CHEM24',
    curriculum_ids: ['curr-1'],
    enabled_features: [
      { key: 'assignments', enabled: true },
      { key: 'quizzes', enabled: false },
      { key: 'resources', enabled: true },
      { key: 'discussions', enabled: false },
      { key: 'links', enabled: false },
    ],
    created_at: '2026-03-01T00:00:00Z',
  },
];

export const mockClassroomMembers: ClassroomMember[] = [
  { id: 'cm-1', classroom_id: 'class-1', user_id: 'user-teacher-001', role: 'teacher', joined_at: '2026-01-01T00:00:00Z' },
  { id: 'cm-2', classroom_id: 'class-1', user_id: 'user-teacher-002', role: 'teacher', joined_at: '2026-01-15T00:00:00Z' },
  { id: 'cm-3', classroom_id: 'class-1', user_id: 'user-student-001', role: 'student', joined_at: '2026-01-10T00:00:00Z' },
  { id: 'cm-4', classroom_id: 'class-1', user_id: 'user-student-002', role: 'student', joined_at: '2026-02-01T00:00:00Z' },
  { id: 'cm-5', classroom_id: 'class-2', user_id: 'user-teacher-001', role: 'teacher', joined_at: '2026-03-01T00:00:00Z' },
  { id: 'cm-6', classroom_id: 'class-2', user_id: 'user-student-001', role: 'student', joined_at: '2026-03-15T00:00:00Z' },
  // class-3 members
  { id: 'cm-7', classroom_id: 'class-3', user_id: 'user-teacher-001', role: 'teacher', joined_at: '2026-04-01T00:00:00Z' },
  { id: 'cm-8', classroom_id: 'class-3', user_id: 'user-student-001', role: 'student', joined_at: '2026-04-05T00:00:00Z' },
  { id: 'cm-9', classroom_id: 'class-3', user_id: 'user-student-002', role: 'student', joined_at: '2026-04-10T00:00:00Z' },
  // class-4 members
  { id: 'cm-10', classroom_id: 'class-4', user_id: 'user-teacher-002', role: 'teacher', joined_at: '2026-05-01T00:00:00Z' },
  { id: 'cm-11', classroom_id: 'class-4', user_id: 'user-student-001', role: 'student', joined_at: '2026-05-10T00:00:00Z' },
];

export const mockClassroomCurriculums: ClassroomCurriculum[] = [
  { id: 'cc-1', classroom_id: 'class-1', curriculum_id: 'curr-1' },
  { id: 'cc-2', classroom_id: 'class-2', curriculum_id: 'curr-1' },
];

// ── Mock Assignments ────────────────────────────────────────────────────────
export const mockAssignments: Assignment[] = [
  {
    id: 'assn-1',
    classroom_id: 'class-1',
    title: 'Forces Worksheet',
    description: 'Complete all questions on forces: Newton\'s Laws, friction, and free-body diagrams.',
    due_date: '2026-07-15T23:59:59Z',
    priority: 'high',
    status: 'published',
    total_points: 50,
    attachment_urls: ['https://example.com/worksheets/forces-v1.pdf'],
    created_by: 'user-teacher-001',
    created_at: '2026-06-15T00:00:00Z',
    updated_at: '2026-06-15T00:00:00Z',
  },
  {
    id: 'assn-2',
    classroom_id: 'class-1',
    title: 'Energy & Work Problems',
    description: 'Solve end-of-chapter problems on kinetic energy, potential energy, and conservation of energy.',
    due_date: '2026-07-22T23:59:59Z',
    priority: 'medium',
    status: 'published',
    total_points: 40,
    attachment_urls: [],
    created_by: 'user-teacher-002',
    created_at: '2026-06-20T00:00:00Z',
    updated_at: '2026-06-20T00:00:00Z',
  },
  {
    id: 'assn-3',
    classroom_id: 'class-2',
    title: 'Balancing Chemical Equations',
    description: 'Balance 20 chemical equations and identify reaction types.',
    due_date: '2026-07-10T23:59:59Z',
    priority: 'high',
    status: 'published',
    total_points: 30,
    attachment_urls: ['https://example.com/worksheets/balancing-equations.pdf'],
    created_by: 'user-teacher-001',
    created_at: '2026-06-18T00:00:00Z',
    updated_at: '2026-06-18T00:00:00Z',
  },
];

export let mockAssignmentSubmissions: AssignmentSubmission[] = [
  {
    id: 'asub-1',
    assignment_id: 'assn-1',
    student_id: 'user-student-001',
    content: 'Completed all questions. See attached PDF for diagrams.',
    attachment_urls: ['https://example.com/submissions/thiri-forces.pdf'],
    submitted_at: '2026-06-28T14:30:00Z',
    grade: 42,
    feedback: 'Excellent work! Clear free-body diagrams. Lost points on Q7 (friction direction).',
    graded_at: '2026-06-29T10:00:00Z',
  },
  {
    id: 'asub-2',
    assignment_id: 'assn-1',
    student_id: 'user-student-002',
    content: 'Here is my work for the Forces worksheet.',
    attachment_urls: [],
    submitted_at: '2026-06-27T21:00:00Z',
    grade: null,
    feedback: null,
    graded_at: null,
  },
  {
    id: 'asub-3',
    assignment_id: 'assn-3',
    student_id: 'user-student-001',
    content: null,
    attachment_urls: [],
    submitted_at: null,
    grade: null,
    feedback: null,
    graded_at: null,
  },
];

// ── Mock Quizzes ─────────────────────────────────────────────────────────────
export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    classroom_id: 'class-1',
    title: 'Forces & Motion Quick Check',
    description: 'Quick assessment on speed, velocity, acceleration, and Newton\'s Laws.',
    time_limit_minutes: 20,
    due_date: '2026-07-08T23:59:59Z',
    status: 'published',
    questions: [
      {
        id: 'q-1',
        type: 'multiple_choice',
        question_text: 'What is the SI unit of force?',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        correct_answer: 'Newton',
        points: 1,
        order: 1,
      },
      {
        id: 'q-2',
        type: 'multiple_choice',
        question_text: 'A car accelerates from 0 to 20 m/s in 5 seconds. What is its acceleration?',
        options: ['2 m/s²', '4 m/s²', '5 m/s²', '10 m/s²'],
        correct_answer: '4 m/s²',
        points: 1,
        order: 2,
      },
      {
        id: 'q-3',
        type: 'true_false',
        question_text: 'According to Newton\'s Third Law, forces always come in pairs acting on different objects.',
        options: null,
        correct_answer: 'true',
        points: 1,
        order: 3,
      },
      {
        id: 'q-4',
        type: 'short_answer',
        question_text: 'Explain why a passenger lurches forward when a bus brakes suddenly.',
        options: null,
        correct_answer: 'Inertia — the passenger\'s body continues moving forward while the bus decelerates.',
        points: 2,
        order: 4,
      },
    ],
    created_by: 'user-teacher-001',
    created_at: '2026-06-25T00:00:00Z',
  },
  {
    id: 'quiz-2',
    classroom_id: 'class-1',
    title: 'Energy Chapter Test',
    description: 'Covers work, kinetic energy, potential energy, and power.',
    time_limit_minutes: 30,
    due_date: null,
    status: 'draft',
    questions: [
      {
        id: 'q-5',
        type: 'multiple_choice',
        question_text: 'Which of the following is a correct statement about energy?',
        options: [
          'Energy can be created',
          'Energy can be destroyed',
          'Energy can be transferred but not created or destroyed',
          'Energy is only found in moving objects',
        ],
        correct_answer: 'Energy can be transferred but not created or destroyed',
        points: 1,
        order: 1,
      },
    ],
    created_by: 'user-teacher-002',
    created_at: '2026-06-28T00:00:00Z',
  },
];

export let mockQuizAttempts: QuizAttempt[] = [
  {
    id: 'qa-1',
    quiz_id: 'quiz-1',
    student_id: 'user-student-001',
    answers: [
      { question_id: 'q-1', answer: 'Newton', is_correct: true },
      { question_id: 'q-2', answer: '4 m/s²', is_correct: true },
      { question_id: 'q-3', answer: 'true', is_correct: true },
      { question_id: 'q-4', answer: 'Due to inertia, the passenger tends to stay in motion when the bus stops.', is_correct: true },
    ],
    score: 5,
    total_points: 5,
    started_at: '2026-06-30T10:00:00Z',
    submitted_at: '2026-06-30T10:18:00Z',
  },
];

// ── Mock Discussions ─────────────────────────────────────────────────────────
export const mockDiscussionTopics: DiscussionTopic[] = [
  {
    id: 'disc-1',
    classroom_id: 'class-1',
    title: 'Question about Newton\'s Third Law',
    content: 'I\'m confused about the difference between balanced forces and action-reaction pairs. Can someone explain?',
    assignment_id: null,
    is_pinned: false,
    is_locked: false,
    created_by: 'user-student-001',
    created_at: '2026-06-22T14:00:00Z',
    updated_at: '2026-06-22T14:00:00Z',
  },
  {
    id: 'disc-2',
    classroom_id: 'class-1',
    title: 'Forces Worksheet — Office Hours',
    content: 'Post your questions about the Forces Worksheet here. I\'ll check this thread daily.',
    assignment_id: 'assn-1',
    is_pinned: true,
    is_locked: false,
    created_by: 'user-teacher-001',
    created_at: '2026-06-16T09:00:00Z',
    updated_at: '2026-06-16T09:00:00Z',
  },
];

export let mockDiscussionReplies: DiscussionReply[] = [
  {
    id: 'drep-1',
    topic_id: 'disc-1',
    content: 'Action-reaction pairs act on *different* objects. Balanced forces act on the *same* object. For example, when you push a wall, you exert a force on the wall (action), and the wall exerts an equal force back on you (reaction).',
    created_by: 'user-teacher-002',
    created_at: '2026-06-22T16:30:00Z',
    updated_at: '2026-06-22T16:30:00Z',
  },
  {
    id: 'drep-2',
    topic_id: 'disc-1',
    content: 'Thank you! That makes it much clearer.',
    created_by: 'user-student-001',
    created_at: '2026-06-22T17:00:00Z',
    updated_at: '2026-06-22T17:00:00Z',
  },
  {
    id: 'drep-3',
    topic_id: 'disc-2',
    content: 'For Q7, should we draw the free-body diagram before or after calculating the net force?',
    created_by: 'user-student-002',
    created_at: '2026-06-17T11:00:00Z',
    updated_at: '2026-06-17T11:00:00Z',
  },
];

// ── Mock Classroom Resources ──────────────────────────────────────────────────
export const mockClassroomResources: ClassroomResource[] = [
  {
    id: 'cr-1',
    classroom_id: 'class-1',
    title: 'Physics Formula Sheet',
    description: 'Complete formula sheet for Mechanics, Waves, and Electricity topics.',
    type: 'pdf',
    url: 'https://example.com/resources/physics-formula-sheet.pdf',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    uploaded_by: 'user-teacher-001',
    created_at: '2026-01-10T00:00:00Z',
  },
  {
    id: 'cr-2',
    classroom_id: 'class-1',
    title: 'Forces & Motion — Khan Academy',
    description: 'Excellent video series covering Newton\'s Laws with interactive examples.',
    type: 'video',
    url: 'https://www.khanacademy.org/science/physics/forces-newtons-laws',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    uploaded_by: 'user-teacher-002',
    created_at: '2026-01-20T00:00:00Z',
  },
  {
    id: 'cr-3',
    classroom_id: 'class-1',
    title: 'PhET Forces Simulation',
    description: 'Interactive simulation for exploring forces and motion visually.',
    type: 'link',
    url: 'https://phet.colorado.edu/en/simulations/forces-and-motion-basics',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    uploaded_by: 'user-teacher-001',
    created_at: '2026-02-05T00:00:00Z',
  },
  {
    id: 'cr-4',
    classroom_id: 'class-2',
    title: 'Periodic Table — Interactive',
    description: 'Clickable periodic table with element properties.',
    type: 'link',
    url: 'https://ptable.com',
    curriculum_id: 'curr-1',
    subject_id: null,
    uploaded_by: 'user-teacher-001',
    created_at: '2026-03-10T00:00:00Z',
  },
];

// ── Mock Clubs ──────────────────────────────────────────────────────────────
export const mockClubs: Club[] = [
  {
    id: 'club-1',
    name: 'Science Enthusiasts',
    description: 'For students who love science, experiments, and exam-smart explanations.',
    created_by: 'user-contributor-001',
    join_mode: 'open',
    invite_code: null,
    enabled_features: [
      { key: 'chat', enabled: true, public_visible: true },
      { key: 'announcements', enabled: true, public_visible: true },
      { key: 'links', enabled: true, public_visible: true },
      { key: 'members', enabled: true, public_visible: true },
      { key: 'projects', enabled: true, public_visible: false },
      { key: 'activity_timeline', enabled: true, public_visible: true },
      { key: 'leaderboard', enabled: false, public_visible: false },
    ],
    created_at: '2025-10-01T00:00:00Z',
  },
  {
    id: 'club-2',
    name: 'A Level Chemistry Circle',
    description: 'Weekly problem solving, revision prompts, and resource drops for serious Chemistry learners.',
    created_by: 'user-contributor-002',
    join_mode: 'approval_based',
    invite_code: null,
    enabled_features: [
      { key: 'chat', enabled: true, public_visible: true },
      { key: 'announcements', enabled: true, public_visible: true },
      { key: 'links', enabled: true, public_visible: true },
      { key: 'members', enabled: true, public_visible: true },
      { key: 'projects', enabled: false, public_visible: false },
      { key: 'activity_timeline', enabled: false, public_visible: false },
      { key: 'leaderboard', enabled: true, public_visible: true },
    ],
    created_at: '2026-02-14T00:00:00Z',
  },
  {
    id: 'club-3',
    name: 'Exam Sprint Studio',
    description: 'Invite-only sprint room for mock exam accountability and focused revision planning.',
    created_by: 'user-main-contributor-001',
    join_mode: 'invite_link',
    invite_code: 'SPRINT26',
    enabled_features: [
      { key: 'chat', enabled: true, public_visible: false },
      { key: 'announcements', enabled: false, public_visible: false },
      { key: 'links', enabled: false, public_visible: false },
      { key: 'members', enabled: true, public_visible: false },
      { key: 'projects', enabled: false, public_visible: false },
      { key: 'activity_timeline', enabled: true, public_visible: false },
      { key: 'leaderboard', enabled: false, public_visible: false },
    ],
    created_at: '2026-04-05T00:00:00Z',
  },
];

export const mockClubMembers: ClubMember[] = [
  // Club 1 - Multiple leaders
  { id: 'clm-1', club_id: 'club-1', user_id: 'user-contributor-001', role: 'admin', membership_status: 'active', joined_at: '2025-10-01T00:00:00Z' },
  { id: 'clm-2', club_id: 'club-1', user_id: 'user-teacher-001', role: 'moderator', membership_status: 'active', joined_at: '2026-03-10T00:00:00Z' },
  { id: 'clm-3', club_id: 'club-1', user_id: 'user-student-001', role: 'member', membership_status: 'active', joined_at: '2026-01-15T00:00:00Z' },
  { id: 'clm-4', club_id: 'club-1', user_id: 'user-student-002', role: 'member', membership_status: 'active', joined_at: '2026-05-20T00:00:00Z' },
  
  // Club 2 - Multiple admins
  { id: 'clm-5', club_id: 'club-2', user_id: 'user-contributor-002', role: 'admin', membership_status: 'active', joined_at: '2026-02-14T00:00:00Z' },
  { id: 'clm-6', club_id: 'club-2', user_id: 'user-contributor-003', role: 'admin', membership_status: 'active', joined_at: '2026-03-01T00:00:00Z' },
  { id: 'clm-7', club_id: 'club-2', user_id: 'user-teacher-002', role: 'moderator', membership_status: 'active', joined_at: '2026-04-10T00:00:00Z' },
  { id: 'clm-8', club_id: 'club-2', user_id: 'user-student-003', role: 'member', membership_status: 'active', joined_at: '2026-05-05T00:00:00Z' },
  
  // Club 3 - Single admin with moderators
  { id: 'clm-9', club_id: 'club-3', user_id: 'user-main-contributor-001', role: 'admin', membership_status: 'active', joined_at: '2026-04-05T00:00:00Z' },
  { id: 'clm-10', club_id: 'club-3', user_id: 'user-contributor-004', role: 'moderator', membership_status: 'active', joined_at: '2026-05-15T00:00:00Z' },
  { id: 'clm-11', club_id: 'club-3', user_id: 'user-student-004', role: 'member', membership_status: 'active', joined_at: '2026-06-01T00:00:00Z' },
  // Club 4 - Literary Society
  { id: 'clm-12', club_id: 'club-4', user_id: 'user-teacher-002', role: 'admin', membership_status: 'active', joined_at: '2026-05-10T00:00:00Z' },
  { id: 'clm-13', club_id: 'club-4', user_id: 'user-student-001', role: 'member', membership_status: 'active', joined_at: '2026-05-12T00:00:00Z' },
  { id: 'clm-14', club_id: 'club-4', user_id: 'user-student-002', role: 'member', membership_status: 'active', joined_at: '2026-05-15T00:00:00Z' },
  // Club 5 - Math Olympiad
  { id: 'clm-15', club_id: 'club-5', user_id: 'user-teacher-001', role: 'admin', membership_status: 'active', joined_at: '2026-06-01T00:00:00Z' },
  { id: 'clm-16', club_id: 'club-5', user_id: 'user-student-001', role: 'member', membership_status: 'active', joined_at: '2026-06-05T00:00:00Z' },
];

export const mockClubMessages: ClubMessage[] = [
  { id: 'cmsg-1', club_id: 'club-1', sender_id: 'user-student-001', message: 'Hi everyone! Anyone revising forces this week?', created_at: '2026-06-10T10:00:00Z' },
  { id: 'cmsg-2', club_id: 'club-1', sender_id: 'user-contributor-001', message: 'Yes. I will drop a compact question set later today.', created_at: '2026-06-10T10:12:00Z' },
  { id: 'cmsg-3', club_id: 'club-2', sender_id: 'user-contributor-002', message: 'Welcome to the Chemistry Circle. Post your hardest equilibrium question here.', created_at: '2026-06-12T09:30:00Z' },
  { id: 'cmsg-4', club_id: 'club-4', sender_id: 'user-student-002', message: 'Has anyone read the new Murakami book? The prose is stunning.', created_at: '2026-06-20T14:00:00Z' },
  { id: 'cmsg-5', club_id: 'club-5', sender_id: 'user-teacher-001', message: 'This week: AMC 10 problems 15-20. Come prepared with solutions.', created_at: '2026-06-22T16:00:00Z' },
];

export const mockClubAnnouncements: ClubAnnouncement[] = [
  { id: 'cann-1', club_id: 'club-1', created_by: 'user-contributor-001', title: 'Science Fair', content: 'Bring one idea and one question to this month\'s science fair prep session.', created_at: '2026-06-01T00:00:00Z' },
  { id: 'cann-2', club_id: 'club-3', created_by: 'user-main-contributor-001', title: 'Sprint Rules', content: 'Share goals before each sprint and check in after your timer ends.', created_at: '2026-06-05T00:00:00Z' },
  { id: 'cann-3', club_id: 'club-4', created_by: 'user-teacher-002', title: 'Monthly Book Club', content: 'This month we are reading "Klara and the Sun" by Kazuo Ishiguro. Discussion on July 15.', created_at: '2026-06-15T00:00:00Z' },
  { id: 'cann-4', club_id: 'club-5', created_by: 'user-teacher-001', title: 'Olympiad Bootcamp', content: 'Summer intensive begins July 5. 4 weeks of daily problem sets and 2 mock contests.', created_at: '2026-06-25T00:00:00Z' },
];

export const mockClubLinks: ClubLink[] = [
  { id: 'clink-1', club_id: 'club-1', title: 'Physics Simulations', url: 'https://phet.colorado.edu/', shared_by: 'user-contributor-001', created_at: '2026-05-01T00:00:00Z' },
  { id: 'clink-2', club_id: 'club-2', title: 'Chemguide', url: 'https://www.chemguide.co.uk/', shared_by: 'user-contributor-002', created_at: '2026-05-22T00:00:00Z' },
  { id: 'clink-3', club_id: 'club-4', title: 'Poetry Foundation', url: 'https://www.poetryfoundation.org/', shared_by: 'user-teacher-002', created_at: '2026-06-10T00:00:00Z' },
  { id: 'clink-4', club_id: 'club-5', title: 'AOPS Wiki', url: 'https://artofproblemsolving.com/wiki/', shared_by: 'user-contributor-001', created_at: '2026-06-12T00:00:00Z' },
];

// ── Club Projects & Events ─────────────────────────────────────────────────

export const mockClubProjects: {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  created_at: string;
}[] = [
  {
    id: 'cp-1',
    club_id: 'club-1',
    created_by: 'user-contributor-001',
    title: 'Newton\'s Laws Demo App',
    description: 'Interactive web app demonstrating all three laws of motion with real-time physics simulations.',
    created_at: '2026-04-15T00:00:00Z',
  },
  {
    id: 'cp-2',
    club_id: 'club-2',
    created_by: 'user-contributor-002',
    title: 'Organic Chemistry Flashcards',
    description: 'A curated deck covering all IGCSE organic chemistry reaction mechanisms and functional groups.',
    created_at: '2026-05-20T00:00:00Z',
  },
  {
    id: 'cp-3',
    club_id: 'club-1',
    created_by: 'user-student-001',
    title: 'Physics Lab Report Template',
    description: 'Standardised LaTeX template for IGCSE physics lab reports with pre-built sections.',
    created_at: '2026-06-01T00:00:00Z',
  },
];

export const mockClubEvents: {
  id: string;
  club_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  created_at: string;
}[] = [
  {
    id: 'ce-1',
    club_id: 'club-1',
    created_by: 'user-contributor-001',
    title: 'Physics Olympiad Prep Session',
    description: 'Group study session covering past Olympiad problems — bring your own solutions to discuss.',
    event_date: '2026-07-10T14:00:00Z',
    created_at: '2026-06-25T08:00:00Z',
  },
  {
    id: 'ce-2',
    club_id: 'club-2',
    created_by: 'user-contributor-002',
    title: 'Chemistry Lab Safety Workshop',
    description: 'Mandatory refresher on lab safety protocols before the summer practical sessions.',
    event_date: '2026-07-05T10:00:00Z',
    created_at: '2026-06-20T09:00:00Z',
  },
  {
    id: 'ce-3',
    club_id: 'club-4',
    created_by: 'user-teacher-002',
    title: 'Poetry Reading Night',
    description: 'Open mic session — read your own work or a favourite poem. All genres welcome.',
    event_date: '2026-07-15T18:00:00Z',
    created_at: '2026-06-22T12:00:00Z',
  },
  {
    id: 'ce-4',
    club_id: 'club-5',
    created_by: 'user-contributor-001',
    title: 'Mock Olympiad Round 1',
    description: 'Timed mock competition under real Olympiad conditions. Prizes for top 3!',
    event_date: '2026-07-20T09:00:00Z',
    created_at: '2026-06-18T10:00:00Z',
  },
];

// ── Club Feature Management ─────────────────────────────────────────────────

/** Get all projects for a club */
export function getClubProjects(clubId: string) {
  return mockClubProjects.filter((p) => p.club_id === clubId);
}

/** Get all events for a club */
export function getClubEvents(clubId: string) {
  return mockClubEvents.filter((e) => e.club_id === clubId);
}

/** Add a project to a club */
export function addClubProject(
  clubId: string,
  userId: string,
  title: string,
  description: string
): { success: true; id: string } | { success: false; error: string } {
  const member = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === userId && m.membership_status === 'active'
  );
  if (!member) return { success: false, error: 'You must be a member to add projects.' };

  const id = `cp-${Date.now()}`;
  mockClubProjects.push({
    id,
    club_id: clubId,
    created_by: userId,
    title,
    description: description || null,
    created_at: new Date().toISOString(),
  });
  return { success: true, id };
}

/** Add an event to a club */
export function addClubEvent(
  clubId: string,
  userId: string,
  title: string,
  description: string,
  eventDate: string
): { success: true; id: string } | { success: false; error: string } {
  const member = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === userId && (m.role === 'admin' || m.role === 'moderator')
  );
  if (!member) return { success: false, error: 'Only club leaders can schedule events.' };

  const id = `ce-${Date.now()}`;
  mockClubEvents.push({
    id,
    club_id: clubId,
    created_by: userId,
    title,
    description: description || null,
    event_date: eventDate || new Date().toISOString(),
    created_at: new Date().toISOString(),
  });
  return { success: true, id };
}

/**
 * Update the enabled features for a club.
 * Only club admins can modify this.
 */
export function mockUpdateClubFeatures(
  clubId: string,
  userId: string,
  features: ClubFeature[]
): { success: true; club: Club } | { success: false; error: string } {
  const club = mockClubs.find((c) => c.id === clubId);
  if (!club) return { success: false, error: 'Club not found.' };

  const member = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === userId && m.role === 'admin'
  );
  if (!member) return { success: false, error: 'Only club admins can manage features.' };

  club.enabled_features = features;
  return { success: true, club: { ...club } };
}

/**
 * Update club details (name, description, join mode, invite code).
 * Only club admins can modify club details.
 */
export function updateClubDetails(
  clubId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string | null;
    join_mode?: ClubJoinMode;
    invite_code?: string | null;
  }
): { success: true; club: Club } | { success: false; error: string } {
  const club = mockClubs.find((c) => c.id === clubId);
  if (!club) return { success: false, error: 'Club not found.' };

  const member = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === userId && m.role === 'admin'
  );
  if (!member) return { success: false, error: 'Only club admins can modify club details.' };

  if (updates.name !== undefined) club.name = updates.name;
  if (updates.description !== undefined) club.description = updates.description;
  if (updates.join_mode !== undefined) club.join_mode = updates.join_mode;
  if (updates.invite_code !== undefined) club.invite_code = updates.invite_code;

  return { success: true, club: { ...club } };
}

/**
 * Promote a user to a leadership role (admin or moderator).
 * Only admins can promote users.
 */
export function promoteClubMember(
  clubId: string,
  adminUserId: string,
  targetUserId: string,
  newRole: 'admin' | 'moderator'
): { success: true; member: ClubMember } | { success: false; error: string } {
  const club = mockClubs.find((c) => c.id === clubId);
  if (!club) return { success: false, error: 'Club not found.' };

  const admin = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === adminUserId && m.role === 'admin'
  );
  if (!admin) return { success: false, error: 'Only club admins can promote members.' };

  const targetMember = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === targetUserId && m.membership_status === 'active'
  );
  if (!targetMember) return { success: false, error: 'Target user is not an active member of this club.' };

  targetMember.role = newRole;
  return { success: true, member: { ...targetMember } };
}

/**
 * Demote a leader to a regular member.
 * Only admins can demote users.
 * Admins cannot demote themselves (need another admin to do it).
 */
export function demoteClubLeader(
  clubId: string,
  adminUserId: string,
  targetUserId: string
): { success: true; member: ClubMember } | { success: false; error: string } {
  const club = mockClubs.find((c) => c.id === clubId);
  if (!club) return { success: false, error: 'Club not found.' };

  const admin = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === adminUserId && m.role === 'admin'
  );
  if (!admin) return { success: false, error: 'Only club admins can demote leaders.' };

  if (adminUserId === targetUserId) {
    return { success: false, error: 'Admins cannot demote themselves.' };
  }

  const targetMember = mockClubMembers.find(
    (m) => m.club_id === clubId && m.user_id === targetUserId && m.membership_status === 'active'
  );
  if (!targetMember) return { success: false, error: 'Target user is not an active member of this club.' };

  if (targetMember.role !== 'admin' && targetMember.role !== 'moderator') {
    return { success: false, error: 'Target user is not a leader.' };
  }

  targetMember.role = 'member';
  return { success: true, member: { ...targetMember } };
}

// ── Mock Timetable & Pomodoro ───────────────────────────────────────────────
export const mockTimetableEvents = [
  { id: 'te-1', user_id: 'user-student-001', title: 'Physics Revision', event_type: 'study', start_time: '2026-06-18T14:00:00Z', end_time: '2026-06-18T16:00:00Z', all_day: false, is_recurring: false, recurrence_pattern: null, color_code: '#3b82f6', metadata: {}, created_at: '2026-06-10T00:00:00Z' }
];

export const mockPomodoroSessions = [
  { id: 'ps-1', user_id: 'user-student-001', duration_minutes: 25, task_name: 'Physics Chapter 1', category: 'Study', completed_at: '2026-06-17T15:00:00Z' }
];

// ── Mock Flashcards ─────────────────────────────────────────────────────────
export const mockDecks: Deck[] = [
  {
    id: 'deck-1',
    owner_id: 'user-student-001',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    name: 'Physics Formulas',
    description: 'Core IGCSE Physics formulas — forces, motion, energy, waves.',
    category: 'Physics',
    is_public: true,
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'deck-2',
    owner_id: 'user-contributor-001',
    curriculum_id: null,
    subject_id: null,
    name: 'Biology Key Terms',
    description: 'Essential definitions for IGCSE & A Level Biology.',
    category: 'Biology',
    is_public: true,
    created_at: '2026-03-10T00:00:00Z',
  },
  {
    id: 'deck-3',
    owner_id: 'user-contributor-002',
    curriculum_id: null,
    subject_id: null,
    name: 'Chemistry Reactions',
    description: 'Key organic and inorganic reactions for A Level Chemistry.',
    category: 'Chemistry',
    is_public: true,
    created_at: '2026-04-05T00:00:00Z',
  },
  {
    id: 'deck-4',
    owner_id: 'user-student-001',
    curriculum_id: null,
    subject_id: null,
    name: 'Maths Revision',
    description: 'My personal maths notes and formulas.',
    category: 'Mathematics',
    is_public: false,
    created_at: '2026-05-15T00:00:00Z',
  },
  {
    id: 'deck-5',
    owner_id: 'user-student-002',
    curriculum_id: null,
    subject_id: null,
    name: 'IELTS Vocabulary',
    description: 'Academic word list for IELTS Academic band 7+.',
    category: 'IELTS',
    is_public: true,
    created_at: '2026-05-20T00:00:00Z',
  },
];

export let mockCards: FlashCard[] = [
  // deck-1: Physics Formulas
  { id: 'card-1', deck_id: 'deck-1', front_text: 'What is Newton\'s Second Law?', back_text: 'F = ma\n(Force = mass × acceleration)', created_at: '2026-02-01T00:00:00Z' },
  { id: 'card-2', deck_id: 'deck-1', front_text: 'Formula for speed', back_text: 'v = s / t\n(speed = distance ÷ time)', created_at: '2026-02-01T00:00:00Z' },
  { id: 'card-3', deck_id: 'deck-1', front_text: 'What is kinetic energy?', back_text: 'KE = ½mv²\n(half × mass × velocity squared)', created_at: '2026-02-01T00:00:00Z' },
  { id: 'card-4', deck_id: 'deck-1', front_text: 'Formula for gravitational potential energy', back_text: 'GPE = mgh\n(mass × gravitational field strength × height)', created_at: '2026-02-01T00:00:00Z' },
  { id: 'card-5', deck_id: 'deck-1', front_text: 'What is Ohm\'s Law?', back_text: 'V = IR\n(Voltage = Current × Resistance)', created_at: '2026-02-02T00:00:00Z' },
  { id: 'card-6', deck_id: 'deck-1', front_text: 'Formula for wave speed', back_text: 'v = fλ\n(wave speed = frequency × wavelength)', created_at: '2026-02-02T00:00:00Z' },
  // deck-2: Biology Key Terms
  { id: 'card-7', deck_id: 'deck-2', front_text: 'Define osmosis', back_text: 'The net movement of water molecules from a region of higher water potential to a region of lower water potential through a partially permeable membrane.', created_at: '2026-03-10T00:00:00Z' },
  { id: 'card-8', deck_id: 'deck-2', front_text: 'What is active transport?', back_text: 'Movement of substances against a concentration gradient using energy (ATP) and carrier proteins.', created_at: '2026-03-10T00:00:00Z' },
  { id: 'card-9', deck_id: 'deck-2', front_text: 'What is the role of mitochondria?', back_text: 'Site of aerobic respiration — produces ATP from glucose and oxygen.', created_at: '2026-03-11T00:00:00Z' },
  { id: 'card-10', deck_id: 'deck-2', front_text: 'Define homeostasis', back_text: 'The maintenance of a stable internal environment within tolerable limits despite changes in the external environment.', created_at: '2026-03-11T00:00:00Z' },
  { id: 'card-11', deck_id: 'deck-2', front_text: 'What is the difference between DNA and RNA?', back_text: 'DNA is double-stranded, contains deoxyribose and thymine. RNA is single-stranded, contains ribose and uracil.', created_at: '2026-03-12T00:00:00Z' },
  // deck-3: Chemistry Reactions
  { id: 'card-12', deck_id: 'deck-3', front_text: 'What is the product of an acid + metal carbonate?', back_text: 'Salt + Water + Carbon dioxide\n(e.g. HCl + CaCO₃ → CaCl₂ + H₂O + CO₂)', created_at: '2026-04-05T00:00:00Z' },
  { id: 'card-13', deck_id: 'deck-3', front_text: 'Define electrophilic addition', back_text: 'A reaction in which an electrophile attacks a π bond (double bond), adding across it to form a saturated product.', created_at: '2026-04-05T00:00:00Z' },
  { id: 'card-14', deck_id: 'deck-3', front_text: 'What is Le Chatelier\'s Principle?', back_text: 'If a dynamic equilibrium is disturbed by changing conditions, the position of equilibrium shifts to counteract the change.', created_at: '2026-04-06T00:00:00Z' },
  // deck-4: Maths Revision (private, student-001)
  { id: 'card-15', deck_id: 'deck-4', front_text: 'Quadratic formula', back_text: 'x = (-b ± √(b²-4ac)) / 2a', created_at: '2026-05-15T00:00:00Z' },
  { id: 'card-16', deck_id: 'deck-4', front_text: 'Area of a circle', back_text: 'A = πr²', created_at: '2026-05-15T00:00:00Z' },
  { id: 'card-17', deck_id: 'deck-4', front_text: 'Pythagoras theorem', back_text: 'a² + b² = c²\n(where c is the hypotenuse)', created_at: '2026-05-16T00:00:00Z' },
  // deck-5: IELTS Vocabulary
  { id: 'card-18', deck_id: 'deck-5', front_text: 'Ubiquitous', back_text: '(adj) Present, appearing, or found everywhere.\nE.g. "Mobile phones are now ubiquitous in modern society."', created_at: '2026-05-20T00:00:00Z' },
  { id: 'card-19', deck_id: 'deck-5', front_text: 'Proliferate', back_text: '(v) To increase rapidly in number or amount.\nE.g. "Social media platforms have proliferated in recent years."', created_at: '2026-05-20T00:00:00Z' },
  { id: 'card-20', deck_id: 'deck-5', front_text: 'Exacerbate', back_text: '(v) To make a problem or situation worse.\nE.g. "Pollution exacerbates the effects of climate change."', created_at: '2026-05-21T00:00:00Z' },
  // deck-6: History Dates
  { id: 'card-21', deck_id: 'deck-6', front_text: 'When did World War II end?', back_text: 'September 2, 1945 (V-J Day — Japan\'s surrender)', created_at: '2026-06-10T00:00:00Z' },
  { id: 'card-22', deck_id: 'deck-6', front_text: 'Treaty of Versailles signed in:', back_text: 'June 28, 1919', created_at: '2026-06-10T00:00:00Z' },
  { id: 'card-23', deck_id: 'deck-6', front_text: 'Fall of the Berlin Wall', back_text: 'November 9, 1989', created_at: '2026-06-10T00:00:00Z' },
  { id: 'card-24', deck_id: 'deck-6', front_text: 'First manned moon landing', back_text: 'July 20, 1969 (Apollo 11)', created_at: '2026-06-11T00:00:00Z' },
  // deck-7: Computer Science
  { id: 'card-25', deck_id: 'deck-7', front_text: 'What is the time complexity of binary search?', back_text: 'O(log n)', created_at: '2026-06-15T00:00:00Z' },
  { id: 'card-26', deck_id: 'deck-7', front_text: 'Define encapsulation in OOP', back_text: 'Bundling data and methods that operate on that data within a single unit (class), restricting direct access.', created_at: '2026-06-15T00:00:00Z' },
  { id: 'card-27', deck_id: 'deck-7', front_text: 'What does SQL stand for?', back_text: 'Structured Query Language', created_at: '2026-06-16T00:00:00Z' },
];

export let mockCardReviews: CardReview[] = [
  // student-001 has reviewed some deck-1 cards
  { id: 'cr-1', card_id: 'card-1', user_id: 'user-student-001', interval_days: 4, ease_factor: 2.6, next_review_date: '2026-06-29T00:00:00Z', last_rating: 'good' },
  { id: 'cr-2', card_id: 'card-2', user_id: 'user-student-001', interval_days: 1, ease_factor: 2.18, next_review_date: '2026-06-25T00:00:00Z', last_rating: 'again' },
  { id: 'cr-3', card_id: 'card-3', user_id: 'user-student-001', interval_days: 7, ease_factor: 2.65, next_review_date: '2026-07-01T00:00:00Z', last_rating: 'easy' },
  { id: 'cr-4', card_id: 'card-15', user_id: 'user-student-001', interval_days: 1, ease_factor: 2.5, next_review_date: '2026-06-25T00:00:00Z', last_rating: 'again' },
  { id: 'cr-5', card_id: 'card-16', user_id: 'user-student-001', interval_days: 3, ease_factor: 2.5, next_review_date: '2026-06-27T00:00:00Z', last_rating: 'good' },
];

// ── Mock Exams & Grades ─────────────────────────────────────────────────────
export const mockExams: Exam[] = [
  { id: 'exam-1', curriculum_id: 'curr-1', title: 'IGCSE Physics Paper 2', exam_series: 'May/June 2027', exam_date: '2027-05-15T09:00:00Z', created_at: '2025-12-01T00:00:00Z' }
];

export const mockExamCountdowns: ExamCountdown[] = [
  { id: 'ec-1', user_id: 'user-student-001', exam_id: 'exam-1', custom_title: 'Physics Finals!', target_date: '2027-05-15T09:00:00Z', priority_indicator: 'high', qualification_group: 'IGCSE', created_at: '2026-01-01T00:00:00Z' }
];

export const mockGradeBoundaries = [
  { id: 'gb-1', exam_id: 'exam-1', grade: 'A*', min_mark: 35, max_mark: 40 },
  { id: 'gb-2', exam_id: 'exam-1', grade: 'A', min_mark: 30, max_mark: 34 }
];

export const mockGradeEntries = [
  { id: 'ge-1', user_id: 'user-student-001', exam_id: 'exam-1', component_name: 'Mock Exam', raw_score: 36, max_score: 40, weight: 1.0, predicted_grade: 'A*', created_at: '2026-04-01T00:00:00Z' }
];

// ── Contributor Public Profiles ──────────────────────────────────────────────

export const mockContributorStats = [
  {
    contributor_id: 'user-contributor-001',
    username: 'ayechanthu',
    published_curriculums: 3,
    published_resources: 12,
    total_views: 2450,
  },
  {
    contributor_id: 'user-main-contributor-001',
    username: 'dawhlamyint',
    published_curriculums: 15,
    published_resources: 48,
    total_views: 12400,
  },
];

// ── Review Queue Dashboard ───────────────────────────────────────────────────

export const mockReviewQueueStats = [
  {
    reviewer_id: 'user-main-contributor-001',
    pending: 4,
    approved_this_month: 23,
    rejected_this_month: 5,
  },
];

// ── Curriculum Notes ─────────────────────────────────────────────────────────

export const mockCurriculumNotes = [
  {
    id: 'note-1',
    curriculum_id: 'curr-1',
    contributor_id: 'user-contributor-001',
    title: 'Forces Summary Notes',
    content: `
      <h1>Forces</h1>
      <p>A force is a push or pull acting on an object.</p>
    `,
    status: 'published',
    is_public: true,
    created_at: '2025-03-01T00:00:00Z',
    updated_at: '2025-03-01T00:00:00Z',
  },
  {
    id: 'note-2',
    curriculum_id: 'curr-1',
    contributor_id: 'user-contributor-001',
    title: 'Energy Notes',
    content: `
      <h1>Energy</h1>
      <p>Energy cannot be created or destroyed.</p>
    `,
    status: 'published',
    is_public: true,
    created_at: '2025-03-15T00:00:00Z',
    updated_at: '2025-03-15T00:00:00Z',
  },
];

// ── Club Join Requests ──────────────────────────────────────────────────────

export const mockClubJoinRequests: ClubJoinRequest[] = [
  {
    id: 'req-1',
    club_id: 'club-2',
    user_id: 'user-student-001',
    status: 'pending',
    requested_at: '2026-06-15T12:00:00Z',
  },
];

// ── Club Curriculum Links ───────────────────────────────────────────────────

export const mockClubCurriculums: ClubCurriculum[] = [
  {
    id: 'club-curr-1',
    club_id: 'club-1',
    curriculum_id: 'curr-1',
  },
  {
    id: 'club-curr-2',
    club_id: 'club-2',
    curriculum_id: 'curr-1',
  },
  {
    id: 'club-curr-3',
    club_id: 'club-3',
    curriculum_id: 'curr-1',
  },
];

export const mockClubSubjects: ClubSubject[] = [
  {
    id: 'club-subj-1',
    club_id: 'club-1',
    subject_id: 'subj-1',
  },
  {
    id: 'club-subj-2',
    club_id: 'club-2',
    subject_id: 'subj-1',
  },
];

// ── Notifications (Useful Across Features) ──────────────────────────────────

export const mockNotifications = [
  {
    id: 'notif-1',
    user_id: 'user-student-001',
    title: 'Assignment Due Soon',
    message: 'Forces Worksheet is due tomorrow.',
    type: 'assignment',
    is_read: false,
    created_at: '2026-06-17T09:00:00Z',
  },
  {
    id: 'notif-2',
    user_id: 'user-teacher-001',
    title: 'New Student Joined',
    message: 'A student joined Year 11 Physics.',
    type: 'classroom',
    is_read: false,
    created_at: '2026-06-17T10:00:00Z',
  },
];

// ── Activity Feed (Role Landing Pages) ──────────────────────────────────────

export const mockActivityFeed = [
  {
    id: 'activity-1',
    user_id: 'user-student-001',
    activity_type: 'pomodoro_completed',
    description: 'Completed Physics Chapter 1 Pomodoro Session',
    created_at: '2026-06-17T15:00:00Z',
  },
  {
    id: 'activity-2',
    user_id: 'user-contributor-001',
    activity_type: 'resource_published',
    description: 'Published Forces Cheatsheet',
    created_at: '2026-06-10T12:00:00Z',
  },
];


// ─────────────────────────────────────────────────────────────────────────────
// Query Helpers
// ─────────────────────────────────────────────────────────────────────────────

export const getCurriculum = (id: string) =>
  mockCurriculums.find(c => c.id === id);

export const getSubjectsByCurriculum = (curriculumId: string) =>
  mockSubjects.filter(s => s.curriculum_id === curriculumId);

export const getTopicsBySubject = (subjectId: string) =>
  mockTopics.filter(t => t.subject_id === subjectId);

// ── Classroom Queries ───────────────────────────────────────────────────────

export const getClassroom = (id: string) =>
  mockClassrooms.find(c => c.id === id);

export const getClassroomsByUser = (userId: string) => {
  const memberClassIds = mockClassroomMembers
    .filter(m => m.user_id === userId)
    .map(m => m.classroom_id);
  return mockClassrooms.filter(c => memberClassIds.includes(c.id));
};

export const getClassroomMembers = (classroomId: string) =>
  mockClassroomMembers.filter(m => m.classroom_id === classroomId);

export const getClassroomTeachers = (classroomId: string) =>
  mockClassroomMembers.filter(m => m.classroom_id === classroomId && m.role === 'teacher');

export const getClassroomTeacherIds = (classroomId: string) =>
  mockClassroomMembers
    .filter(m => m.classroom_id === classroomId && m.role === 'teacher')
    .map(m => m.user_id);

export const getClassroomStudents = (classroomId: string) =>
  mockClassroomMembers.filter(m => m.classroom_id === classroomId && m.role === 'student');

export const getClassroomMember = (classroomId: string, userId: string) =>
  mockClassroomMembers.find(m => m.classroom_id === classroomId && m.user_id === userId);

export const getAssignmentsByClassroom = (classroomId: string) =>
  mockAssignments.filter(a => a.classroom_id === classroomId);

export const getAssignment = (id: string) =>
  mockAssignments.find(a => a.id === id);

export const getSubmission = (assignmentId: string, studentId: string) =>
  mockAssignmentSubmissions.find(s => s.assignment_id === assignmentId && s.student_id === studentId);

export const getSubmissionsByAssignment = (assignmentId: string) =>
  mockAssignmentSubmissions.filter(s => s.assignment_id === assignmentId);

export const getQuizzesByClassroom = (classroomId: string) =>
  mockQuizzes.filter(q => q.classroom_id === classroomId);

export const getQuiz = (id: string) =>
  mockQuizzes.find(q => q.id === id);

export const getQuizAttemptsByQuiz = (quizId: string) =>
  mockQuizAttempts.filter(a => a.quiz_id === quizId);

export const getQuizAttempt = (quizId: string, studentId: string) =>
  mockQuizAttempts.find(a => a.quiz_id === quizId && a.student_id === studentId);

export const getDiscussionTopicsByClassroom = (classroomId: string) =>
  mockDiscussionTopics.filter(t => t.classroom_id === classroomId);

export const getDiscussionTopic = (id: string) =>
  mockDiscussionTopics.find(t => t.id === id);

export const getDiscussionReplies = (topicId: string) =>
  mockDiscussionReplies.filter(r => r.topic_id === topicId);

export const getResourcesByClassroom = (classroomId: string) =>
  mockClassroomResources.filter(r => r.classroom_id === classroomId);

// ── Classroom Mutations ─────────────────────────────────────────────────────

export const createClassroom = (data: Omit<Classroom, 'id' | 'created_at'>) => {
  const classroom: Classroom = {
    ...data,
    id: `class-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockClassrooms.push(classroom);
  return { success: true, classroom };
};

export const updateClassroom = (id: string, data: Partial<Classroom>) => {
  const idx = mockClassrooms.findIndex(c => c.id === id);
  if (idx === -1) return { success: false, error: 'Classroom not found' };
  mockClassrooms[idx] = { ...mockClassrooms[idx], ...data };
  return { success: true, classroom: mockClassrooms[idx] };
};

export const joinClassroom = (classroomId: string, userId: string, role: ClassroomMemberRole = 'student') => {
  const existing = mockClassroomMembers.find(m => m.classroom_id === classroomId && m.user_id === userId);
  if (existing) return { success: false, error: 'Already a member' };
  const member: ClassroomMember = {
    id: `cm-${Date.now()}`,
    classroom_id: classroomId,
    user_id: userId,
    role,
    joined_at: new Date().toISOString(),
  };
  mockClassroomMembers.push(member);
  return { success: true, member };
};

export const leaveClassroom = (classroomId: string, userId: string) => {
  const idx = mockClassroomMembers.findIndex(m => m.classroom_id === classroomId && m.user_id === userId);
  if (idx === -1) return { success: false, error: 'Not a member' };
  mockClassroomMembers.splice(idx, 1);
  return { success: true };
};

export const createAssignment = (data: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>) => {
  const assignment: Assignment = {
    ...data,
    id: `assn-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockAssignments.push(assignment);
  return { success: true, assignment };
};

export const updateAssignment = (id: string, data: Partial<Assignment>) => {
  const idx = mockAssignments.findIndex(a => a.id === id);
  if (idx === -1) return { success: false, error: 'Assignment not found' };
  mockAssignments[idx] = { ...mockAssignments[idx], ...data, updated_at: new Date().toISOString() };
  return { success: true, assignment: mockAssignments[idx] };
};

export const submitAssignment = (assignmentId: string, studentId: string, content: string | null, attachmentUrls: string[] = []) => {
  const existing = mockAssignmentSubmissions.find(s => s.assignment_id === assignmentId && s.student_id === studentId);
  if (existing) {
    existing.content = content;
    existing.attachment_urls = attachmentUrls;
    existing.submitted_at = new Date().toISOString();
    return { success: true, submission: existing };
  }
  const submission: AssignmentSubmission = {
    id: `asub-${Date.now()}`,
    assignment_id: assignmentId,
    student_id: studentId,
    content,
    attachment_urls: attachmentUrls,
    submitted_at: new Date().toISOString(),
    grade: null,
    feedback: null,
    graded_at: null,
  };
  mockAssignmentSubmissions.push(submission);
  return { success: true, submission };
};

export const gradeSubmission = (submissionId: string, grade: number, feedback: string | null) => {
  const sub = mockAssignmentSubmissions.find(s => s.id === submissionId);
  if (!sub) return { success: false, error: 'Submission not found' };
  sub.grade = grade;
  sub.feedback = feedback;
  sub.graded_at = new Date().toISOString();
  return { success: true, submission: sub };
};

export const createQuiz = (data: Omit<Quiz, 'id' | 'created_at'>) => {
  const quiz: Quiz = {
    ...data,
    id: `quiz-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockQuizzes.push(quiz);
  return { success: true, quiz };
};

export const updateQuiz = (id: string, data: Partial<Quiz>) => {
  const idx = mockQuizzes.findIndex(q => q.id === id);
  if (idx === -1) return { success: false, error: 'Quiz not found' };
  mockQuizzes[idx] = { ...mockQuizzes[idx], ...data };
  return { success: true, quiz: mockQuizzes[idx] };
};

export const submitQuizAttempt = (quizId: string, studentId: string, answers: QuizAnswer[]) => {
  const quiz = mockQuizzes.find(q => q.id === quizId);
  if (!quiz) return { success: false, error: 'Quiz not found' };

  // Auto-grade: compare answers against correct_answer for each question
  const gradedAnswers: QuizAnswer[] = answers.map(ans => {
    const question = quiz.questions.find(q => q.id === ans.question_id);
    if (!question) return ans;
    const isCorrect = question.type === 'short_answer'
      ? null // Short answer needs manual review
      : ans.answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    return { ...ans, is_correct: isCorrect };
  });

  const totalScore = gradedAnswers.reduce((sum, a) => {
    const question = quiz.questions.find(q => q.id === a.question_id);
    return sum + (a.is_correct === true ? (question?.points ?? 0) : 0);
  }, 0);

  const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

  const attempt: QuizAttempt = {
    id: `qa-${Date.now()}`,
    quiz_id: quizId,
    student_id: studentId,
    answers: gradedAnswers,
    score: totalScore,
    total_points: totalPoints,
    started_at: new Date().toISOString(),
    submitted_at: new Date().toISOString(),
  };

  // Remove previous attempt if exists
  const prevIdx = mockQuizAttempts.findIndex(a => a.quiz_id === quizId && a.student_id === studentId);
  if (prevIdx !== -1) mockQuizAttempts.splice(prevIdx, 1);

  mockQuizAttempts.push(attempt);
  return { success: true, attempt };
};

export const createDiscussionTopic = (data: Omit<DiscussionTopic, 'id' | 'created_at' | 'updated_at'>) => {
  const topic: DiscussionTopic = {
    ...data,
    id: `disc-${Date.now()}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockDiscussionTopics.push(topic);
  return { success: true, topic };
};

export const createDiscussionReply = (topicId: string, content: string, createdBy: string) => {
  const reply: DiscussionReply = {
    id: `drep-${Date.now()}`,
    topic_id: topicId,
    content,
    created_by: createdBy,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockDiscussionReplies.push(reply);
  return { success: true, reply };
};

export const addResource = (data: Omit<ClassroomResource, 'id' | 'created_at'>) => {
  const resource: ClassroomResource = {
    ...data,
    id: `cr-${Date.now()}`,
    created_at: new Date().toISOString(),
  };
  mockClassroomResources.push(resource);
  return { success: true, resource };
};

export const deleteResource = (id: string) => {
  const idx = mockClassroomResources.findIndex(r => r.id === id);
  if (idx === -1) return { success: false, error: 'Resource not found' };
  mockClassroomResources.splice(idx, 1);
  return { success: true };
};

export const updateResource = (id: string, data: Partial<ClassroomResource>) => {
  const idx = mockClassroomResources.findIndex(r => r.id === id);
  if (idx === -1) return { success: false, error: 'Resource not found' };
  mockClassroomResources[idx] = { ...mockClassroomResources[idx], ...data };
  return { success: true, resource: mockClassroomResources[idx] };
};

export const deleteAssignment = (id: string) => {
  const idx = mockAssignments.findIndex(a => a.id === id);
  if (idx === -1) return { success: false, error: 'Assignment not found' };
  mockAssignments.splice(idx, 1);
  // Also remove related submissions
  const submissionIds = mockAssignmentSubmissions.filter(s => s.assignment_id === id).map(s => s.id);
  mockAssignmentSubmissions = mockAssignmentSubmissions.filter(s => !submissionIds.includes(s.id));
  return { success: true };
};

export const deleteQuiz = (id: string) => {
  const idx = mockQuizzes.findIndex(q => q.id === id);
  if (idx === -1) return { success: false, error: 'Quiz not found' };
  mockQuizzes.splice(idx, 1);
  // Also remove related attempts
  mockQuizAttempts = mockQuizAttempts.filter(a => a.quiz_id !== id);
  return { success: true };
};

export const deleteDiscussionTopic = (id: string) => {
  const idx = mockDiscussionTopics.findIndex(t => t.id === id);
  if (idx === -1) return { success: false, error: 'Topic not found' };
  mockDiscussionTopics.splice(idx, 1);
  // Also remove related replies
  mockDiscussionReplies = mockDiscussionReplies.filter(r => r.topic_id !== id);
  return { success: true };
};

export const updateDiscussionTopic = (id: string, data: Partial<DiscussionTopic>) => {
  const idx = mockDiscussionTopics.findIndex(t => t.id === id);
  if (idx === -1) return { success: false, error: 'Topic not found' };
  mockDiscussionTopics[idx] = { ...mockDiscussionTopics[idx], ...data, updated_at: new Date().toISOString() };
  return { success: true, topic: mockDiscussionTopics[idx] };
};

export const getClub = (id: string) =>
  mockClubs.find(c => c.id === id);

export const getClubs = () =>
  [...mockClubs];

export const getClubMembers = (clubId: string) =>
  mockClubMembers.filter(m => m.club_id === clubId);

export const getClubMessages = (clubId: string) =>
  mockClubMessages.filter(m => m.club_id === clubId);

export const getClubAnnouncements = (clubId: string) =>
  mockClubAnnouncements.filter(a => a.club_id === clubId);

export const getClubLinks = (clubId: string) =>
  mockClubLinks.filter(l => l.club_id === clubId);

export const getClubJoinRequests = (clubId: string) =>
  mockClubJoinRequests.filter(r => r.club_id === clubId);

export const getClubCurriculumLinks = (clubId: string) =>
  mockClubCurriculums.filter(c => c.club_id === clubId);

export const getClubSubjectLinks = (clubId: string) =>
  mockClubSubjects.filter(s => s.club_id === clubId);

export const getUserClubMembership = (clubId: string, userId: string) =>
  mockClubMembers.find(m => m.club_id === clubId && m.user_id === userId);

export const getUserClubJoinRequest = (clubId: string, userId: string) =>
  mockClubJoinRequests.find(r => r.club_id === clubId && r.user_id === userId && r.status === 'pending');

export function createClub(data: {
  name: string;
  description?: string;
  created_by: string;
  join_mode: ClubJoinMode;
  invite_code?: string;
  curriculum_ids?: string[];
  subject_ids?: string[];
  enabled_features?: ClubFeature[];
}): Club {
  const now = new Date().toISOString();
  const club: Club = {
    id: `club-${Date.now()}`,
    name: data.name,
    description: data.description || null,
    created_by: data.created_by,
    join_mode: data.join_mode,
    invite_code: data.join_mode === 'invite_link' ? (data.invite_code || generateInviteCode(data.name)) : null,
    enabled_features: data.enabled_features || DEFAULT_CLUB_FEATURES,
    created_at: now,
  };

  mockClubs.unshift(club);
  mockClubMembers.push({
    id: `clm-${Date.now()}`,
    club_id: club.id,
    user_id: data.created_by,
    role: 'admin',
    membership_status: 'active',
    joined_at: now,
  });

  data.curriculum_ids?.forEach((curriculumId, index) => {
    mockClubCurriculums.push({
      id: `club-curr-${Date.now()}-${index}`,
      club_id: club.id,
      curriculum_id: curriculumId,
    });
  });

  data.subject_ids?.forEach((subjectId, index) => {
    mockClubSubjects.push({
      id: `club-subj-${Date.now()}-${index}`,
      club_id: club.id,
      subject_id: subjectId,
    });
  });

  return club;
}

export function joinOpenClub(clubId: string, userId: string): { success: true } | { success: false; error: string } {
  const club = getClub(clubId);
  if (!club) return { success: false, error: 'Club not found.' };
  if (club.join_mode !== 'open') return { success: false, error: 'This club is not open join.' };
  return addActiveClubMember(clubId, userId);
}

export function joinClubByInviteCode(
  clubId: string,
  userId: string,
  inviteCode: string
): { success: true } | { success: false; error: string } {
  const club = getClub(clubId);
  if (!club) return { success: false, error: 'Club not found.' };
  if (club.join_mode !== 'invite_link') return { success: false, error: 'This club does not use invite links.' };
  if (club.invite_code?.toLowerCase() !== inviteCode.trim().toLowerCase()) {
    return { success: false, error: 'Invite code does not match this club.' };
  }
  return addActiveClubMember(clubId, userId);
}

export function requestClubJoin(clubId: string, userId: string): { success: true } | { success: false; error: string } {
  const club = getClub(clubId);
  if (!club) return { success: false, error: 'Club not found.' };
  if (club.join_mode !== 'approval_based') return { success: false, error: 'This club does not require approval.' };
  if (getUserClubMembership(clubId, userId)?.membership_status === 'active') {
    return { success: false, error: 'You are already a member.' };
  }
  if (getUserClubJoinRequest(clubId, userId)) {
    return { success: false, error: 'Your request is already pending.' };
  }

  mockClubJoinRequests.push({
    id: `req-${Date.now()}`,
    club_id: clubId,
    user_id: userId,
    status: 'pending',
    requested_at: new Date().toISOString(),
  });
  return { success: true };
}

export function reviewClubJoinRequest(
  requestId: string,
  status: 'approved' | 'rejected'
): { success: true } | { success: false; error: string } {
  const request = mockClubJoinRequests.find(r => r.id === requestId);
  if (!request) return { success: false, error: 'Join request not found.' };

  request.status = status;
  if (status === 'approved') {
    addActiveClubMember(request.club_id, request.user_id);
  }
  return { success: true };
}

export function leaveClub(clubId: string, userId: string): { success: true } | { success: false; error: string } {
  const memberIndex = mockClubMembers.findIndex(m => m.club_id === clubId && m.user_id === userId && m.membership_status === 'active');
  if (memberIndex < 0) return { success: false, error: 'You are not an active member of this club.' };

  const member = mockClubMembers[memberIndex];
  const activeAdmins = mockClubMembers.filter(m => m.club_id === clubId && m.role === 'admin' && m.membership_status === 'active');
  if (member.role === 'admin' && activeAdmins.length === 1) {
    return { success: false, error: 'The sole admin cannot leave this club.' };
  }

  mockClubMembers.splice(memberIndex, 1);
  return { success: true };
}

export function sendClubMessage(clubId: string, senderId: string, message: string): ClubMessage {
  const newMessage: ClubMessage = {
    id: `cmsg-${Date.now()}`,
    club_id: clubId,
    sender_id: senderId,
    message,
    created_at: new Date().toISOString(),
  };
  mockClubMessages.push(newMessage);
  return newMessage;
}

export function createClubAnnouncement(
  clubId: string,
  createdBy: string,
  title: string,
  content: string
): ClubAnnouncement {
  const announcement: ClubAnnouncement = {
    id: `cann-${Date.now()}`,
    club_id: clubId,
    created_by: createdBy,
    title,
    content,
    created_at: new Date().toISOString(),
  };
  mockClubAnnouncements.unshift(announcement);
  return announcement;
}

export function shareClubLink(clubId: string, sharedBy: string, title: string, url: string): ClubLink {
  const link: ClubLink = {
    id: `clink-${Date.now()}`,
    club_id: clubId,
    title,
    url,
    shared_by: sharedBy,
    created_at: new Date().toISOString(),
  };
  mockClubLinks.unshift(link);
  return link;
}

function addActiveClubMember(clubId: string, userId: string): { success: true } | { success: false; error: string } {
  const existing = getUserClubMembership(clubId, userId);
  if (existing?.membership_status === 'active') {
    return { success: false, error: 'You are already a member.' };
  }

  if (existing) {
    existing.membership_status = 'active';
    existing.joined_at = new Date().toISOString();
    return { success: true };
  }

  mockClubMembers.push({
    id: `clm-${Date.now()}`,
    club_id: clubId,
    user_id: userId,
    role: 'member',
    membership_status: 'active',
    joined_at: new Date().toISOString(),
  });
  return { success: true };
}

function generateInviteCode(name: string): string {
  const prefix = name.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase() || 'CLUB';
  return `${prefix}${Math.floor(100 + Math.random() * 900)}`;
}

export const getDeck = (id: string): Deck | undefined =>
  mockDecks.find(d => d.id === id);

export const getCardsByDeck = (deckId: string): FlashCard[] =>
  mockCards.filter(c => c.deck_id === deckId);

export const getExam = (id: string) =>
  mockExams.find(e => e.id === id);

export const getExams = (): Exam[] =>
  [...mockExams];

export const createExamCountdown = (data: {
  user_id: string;
  exam_id: string | null;
  custom_title: string | null;
  target_date: string | null;
  priority_indicator: string;
  qualification_group: string;
}): ExamCountdown => {
  const countdown: ExamCountdown = {
    id: `ec-${Date.now()}`,
    user_id: data.user_id,
    exam_id: data.exam_id,
    custom_title: data.custom_title,
    target_date: data.target_date,
    priority_indicator: data.priority_indicator,
    qualification_group: data.qualification_group,
    created_at: new Date().toISOString(),
  };
  mockExamCountdowns.push(countdown);
  return countdown;
};

export const deleteExamCountdown = (id: string): { success: boolean } => {
  const idx = mockExamCountdowns.findIndex(c => c.id === id);
  if (idx < 0) return { success: false };
  mockExamCountdowns.splice(idx, 1);
  return { success: true };
};

export const getUserTimetable = (userId: string) =>
  mockTimetableEvents.filter(e => e.user_id === userId);

export const getUserPomodoroSessions = (userId: string) =>
  mockPomodoroSessions.filter(s => s.user_id === userId);

export const getUserCountdowns = (userId: string) =>
  mockExamCountdowns.filter(c => c.user_id === userId);

export const getUserNotifications = (userId: string) =>
  mockNotifications.filter(n => n.user_id === userId);

export const getUserActivityFeed = (userId: string) =>
  mockActivityFeed.filter(a => a.user_id === userId);

// ── Flashcard Query Helpers ──────────────────────────────────────────────────

/** All decks owned by a user */
export const getDecksByUser = (userId: string): Deck[] =>
  mockDecks.filter(d => d.owner_id === userId);

/** All public decks (for the library browser) */
export const getPublicDecks = (): Deck[] =>
  mockDecks.filter(d => d.is_public);

/** Get the SRS review record for a specific card + user */
export const getUserCardReview = (cardId: string, userId: string): CardReview | undefined =>
  mockCardReviews.find(r => r.card_id === cardId && r.user_id === userId);

/** Get all review records for a user on a deck's cards */
export const getDeckReviews = (deckId: string, userId: string): CardReview[] => {
  const cardIds = mockCards.filter(c => c.deck_id === deckId).map(c => c.id);
  return mockCardReviews.filter(r => cardIds.includes(r.card_id) && r.user_id === userId);
};

/**
 * Cards due for review (next_review_date <= now) or never reviewed yet.
 * Returns all cards that should appear in today's study session.
 */
export const getDueCards = (deckId: string, userId: string): FlashCard[] => {
  const cards = getCardsByDeck(deckId);
  const now = new Date().toISOString();
  return cards.filter(card => {
    const review = getUserCardReview(card.id, userId);
    if (!review) return true; // never studied = always due
    return review.next_review_date <= now;
  });
};

/** Total number of due cards across all of a user's decks */
export const getTotalDueCount = (userId: string): number => {
  const userDecks = getDecksByUser(userId);
  return userDecks.reduce((total, deck) => total + getDueCards(deck.id, userId).length, 0);
};

// ── Flashcard Mutation Helpers ───────────────────────────────────────────────

/** Create a new deck */
export function createDeck(data: {
  owner_id: string;
  name: string;
  description?: string;
  category?: string;
  curriculum_id?: string;
  subject_id?: string;
  is_public?: boolean;
}): Deck {
  const deck: Deck = {
    id: `deck-${Date.now()}`,
    owner_id: data.owner_id,
    curriculum_id: data.curriculum_id || null,
    subject_id: data.subject_id || null,
    name: data.name,
    description: data.description || null,
    category: data.category || null,
    is_public: data.is_public ?? false,
    created_at: new Date().toISOString(),
  };
  mockDecks.unshift(deck);
  return deck;
}

/** Update deck metadata */
export function updateDeck(
  deckId: string,
  data: Partial<Pick<Deck, 'name' | 'description' | 'category' | 'is_public' | 'curriculum_id' | 'subject_id'>>
): { success: true; deck: Deck } | { success: false; error: string } {
  const deck = mockDecks.find(d => d.id === deckId);
  if (!deck) return { success: false, error: 'Deck not found.' };
  Object.assign(deck, data);
  return { success: true, deck: { ...deck } };
}

/** Delete a deck and all its cards */
export function deleteDeck(deckId: string): { success: true } | { success: false; error: string } {
  const idx = mockDecks.findIndex(d => d.id === deckId);
  if (idx < 0) return { success: false, error: 'Deck not found.' };
  mockDecks.splice(idx, 1);
  // Remove all cards and their reviews
  const cardIds = mockCards.filter(c => c.deck_id === deckId).map(c => c.id);
  mockCards = mockCards.filter(c => c.deck_id !== deckId);
  mockCardReviews = mockCardReviews.filter(r => !cardIds.includes(r.card_id));
  return { success: true };
}

/**
 * Clone a public deck into a user's personal collection.
 * Creates a new deck + deep copies all cards. SRS state starts fresh.
 */
export function cloneDeck(deckId: string, userId: string): { success: true; deck: Deck } | { success: false; error: string } {
  const original = getDeck(deckId);
  if (!original) return { success: false, error: 'Deck not found.' };
  if (!original.is_public) return { success: false, error: 'This deck is private.' };

  const newDeck: Deck = {
    ...original,
    id: `deck-${Date.now()}`,
    owner_id: userId,
    name: `${original.name} (Copy)`,
    is_public: false,
    created_at: new Date().toISOString(),
  };
  mockDecks.unshift(newDeck);

  const originalCards = getCardsByDeck(deckId);
  originalCards.forEach(card => {
    mockCards.push({
      id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      deck_id: newDeck.id,
      front_text: card.front_text,
      back_text: card.back_text,
      created_at: new Date().toISOString(),
    });
  });

  return { success: true, deck: newDeck };
}

/** Add a card to a deck */
export function createCard(data: {
  deck_id: string;
  front_text: string;
  back_text: string;
}): FlashCard {
  const card: FlashCard = {
    id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    deck_id: data.deck_id,
    front_text: data.front_text,
    back_text: data.back_text,
    created_at: new Date().toISOString(),
  };
  mockCards.push(card);
  return card;
}

/** Get decks related to a curriculum and/or subject */
export function getRelatedDecks(curriculumId?: string | null, subjectId?: string | null): Deck[] {
  return mockDecks.filter((d) => {
    if (curriculumId && d.curriculum_id === curriculumId) return true;
    if (subjectId && d.subject_id === subjectId) return true;
    return false;
  });
}

/** Update an existing card's content */
export function updateCard(
  cardId: string,
  data: Partial<Pick<FlashCard, 'front_text' | 'back_text'>>
): { success: true; card: FlashCard } | { success: false; error: string } {
  const card = mockCards.find(c => c.id === cardId);
  if (!card) return { success: false, error: 'Card not found.' };
  if (data.front_text !== undefined) card.front_text = data.front_text;
  if (data.back_text !== undefined) card.back_text = data.back_text;
  return { success: true, card: { ...card } };
}

/** Delete a card and its review records */
export function deleteCard(cardId: string): { success: true } | { success: false; error: string } {
  const idx = mockCards.findIndex(c => c.id === cardId);
  if (idx < 0) return { success: false, error: 'Card not found.' };
  mockCards.splice(idx, 1);
  mockCardReviews = mockCardReviews.filter(r => r.card_id !== cardId);
  return { success: true };
}

/**
 * Batch-import parsed AI cards into a deck.
 * Returns the created cards.
 */
export function importCardsFromParsed(deckId: string, cards: ParsedAICard[]): FlashCard[] {
  return cards.map(c => createCard({
    deck_id: deckId,
    front_text: c.front,
    back_text: c.back,
  }));
}

/**
 * Create or update the SRS review state for a card after a study session rating.
 * This is the main mutation called by the SM-2 algorithm result.
 */
export function upsertCardReview(
  cardId: string,
  userId: string,
  data: {
    interval_days: number;
    ease_factor: number;
    next_review_date: string;
    last_rating: SRSRating;
  }
): CardReview {
  const existing = mockCardReviews.find(r => r.card_id === cardId && r.user_id === userId);
  if (existing) {
    existing.interval_days = data.interval_days;
    existing.ease_factor = data.ease_factor;
    existing.next_review_date = data.next_review_date;
    existing.last_rating = data.last_rating;
    return { ...existing };
  }
  const newReview: CardReview = {
    id: `cr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    card_id: cardId,
    user_id: userId,
    ...data,
  };
  mockCardReviews.push(newReview);
  return newReview;
}

// ── Mock Notes ──────────────────────────────────────────────────────────────
export const mockNotes: Note[] = [
  {
    id: 'note-001',
    title: "Newton's Laws of Motion — Complete Guide",
    summary: "A thorough walkthrough of all three of Newton's laws with equations, examples, and interactive animations.",
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    topic_id: 'top-1',
    syllabus_point: "1.5 — Newton's Laws of Motion",
    is_syllabus_based: true,
    tags: ['forces', 'newton', 'motion', 'physics'],
    contributor_id: 'user-contributor-001',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-05-10T08:00:00Z',
    updated_at: '2026-05-11T10:00:00Z',
    blocks: [
      { type: 'heading', id: 'b1', level: 1, text: "Newton's Laws of Motion" },
      { type: 'paragraph', id: 'b2', text: "Newton's three laws form the foundation of classical mechanics. Understanding them is essential for any IGCSE Physics student." },
      { type: 'heading', id: 'b3', level: 2, text: 'First Law — Inertia' },
      { type: 'paragraph', id: 'b4', text: '**An object remains at rest or in uniform motion unless acted upon by a resultant force.**' },
      { type: 'latex', id: 'b5', expression: '\\sum F = 0 \\implies a = 0', display: true },
      { type: 'animation', id: 'b6', template: 'pendulum', caption: 'A pendulum in the absence of friction continues indefinitely — illustrating inertia.' },
      { type: 'heading', id: 'b7', level: 2, text: 'Second Law — F = ma' },
      { type: 'latex', id: 'b8', expression: 'F = ma', display: true },
      { type: 'paragraph', id: 'b9', text: 'The acceleration of an object is directly proportional to the net force and inversely proportional to its mass.' },
      { type: 'heading', id: 'b10', level: 2, text: 'Third Law — Action & Reaction' },
      { type: 'paragraph', id: 'b11', text: '**For every action there is an equal and opposite reaction.** The forces act on *different* objects.' },
      { type: 'divider', id: 'b12' },
      { type: 'link', id: 'b13', url: 'https://phet.colorado.edu/en/simulations/forces-and-motion-basics', label: 'PhET: Forces and Motion', description: 'Interactive simulation to explore Newton\u2019s laws visually.' },
    ],
  },
  {
    id: 'note-002',
    title: 'Kinetic Theory of Gases',
    summary: 'Explains the behaviour of ideal gases using the kinetic molecular model, including PV = nRT derivation.',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    topic_id: null,
    syllabus_point: '2.2 — Ideal Gases',
    is_syllabus_based: true,
    tags: ['gases', 'kinetic theory', 'thermodynamics'],
    contributor_id: 'user-contributor-001',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-05-20T09:00:00Z',
    updated_at: '2026-05-21T11:00:00Z',
    blocks: [
      { type: 'heading', id: 'c1', level: 1, text: 'Kinetic Theory of Gases' },
      { type: 'paragraph', id: 'c2', text: 'The kinetic theory models gas behaviour by treating molecules as **point masses** in constant random motion.' },
      { type: 'animation', id: 'c3', template: 'gas_particles', caption: 'Gas molecules in random motion — increase temperature to see them speed up.' },
      { type: 'heading', id: 'c4', level: 2, text: 'The Ideal Gas Law' },
      { type: 'latex', id: 'c5', expression: 'PV = nRT', display: true },
      {
        type: 'table', id: 'c6', rows: [
          ['Symbol', 'Quantity', 'Unit'],
          ['P', 'Pressure', 'Pa'],
          ['V', 'Volume', 'm³'],
          ['n', 'Amount of substance', 'mol'],
          ['R', 'Molar gas constant (8.314)', 'J mol⁻¹ K⁻¹'],
          ['T', 'Temperature', 'K'],
        ]
      },
      { type: 'divider', id: 'c7' },
      { type: 'heading', id: 'c8', level: 2, text: 'Assumptions of an Ideal Gas' },
      { type: 'paragraph', id: 'c9', text: '1. Molecules have negligible volume compared to the container.\n2. No intermolecular forces (except during collisions).\n3. Collisions are perfectly elastic.\n4. Average kinetic energy is proportional to absolute temperature.' },
    ],
  },
  {
    id: 'note-003',
    title: 'DNA Structure & Replication',
    summary: 'A visual guide to the double helix model, base pairing rules, and semi-conservative replication.',
    curriculum_id: null,
    subject_id: null,
    topic_id: null,
    is_syllabus_based: false,
    tags: ['biology', 'DNA', 'genetics', 'replication'],
    contributor_id: 'user-main-contributor-001',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-contributor-001',
    created_at: '2026-06-01T07:00:00Z',
    updated_at: '2026-06-02T09:00:00Z',
    blocks: [
      { type: 'heading', id: 'd1', level: 1, text: 'DNA Structure & Replication' },
      { type: 'animation', id: 'd2', template: 'dna_helix', caption: 'The DNA double helix — rotate to explore the structure.' },
      { type: 'heading', id: 'd3', level: 2, text: 'Base Pairing Rules' },
      {
        type: 'table', id: 'd4', rows: [
          ['Base', 'Pairs With', 'Bond Type'],
          ['Adenine (A)', 'Thymine (T)', '2 hydrogen bonds'],
          ['Guanine (G)', 'Cytosine (C)', '3 hydrogen bonds'],
        ]
      },
      { type: 'heading', id: 'd5', level: 2, text: 'Semi-Conservative Replication' },
      { type: 'paragraph', id: 'd6', text: 'Each new DNA molecule retains one original strand and one newly synthesised strand — proven by the **Meselson-Stahl experiment** (1958).' },
      { type: 'divider', id: 'd7' },
      { type: 'link', id: 'd8', url: 'https://www.khanacademy.org/science/ap-biology/gene-expression-and-regulation/replication/a/dna-replication-review', label: 'Khan Academy — DNA Replication', description: 'Review article with diagrams and practice questions.' },
    ],
  },
  {
    id: 'note-004',
    title: 'Organic Chemistry — Functional Groups',
    summary: 'Reference sheet covering the key functional groups in A-Level Chemistry with IUPAC naming rules.',
    curriculum_id: null,
    subject_id: null,
    topic_id: null,
    is_syllabus_based: false,
    tags: ['chemistry', 'organic', 'functional groups', 'A-Level'],
    contributor_id: 'user-contributor-001',
    status: 'pending_review',
    visibility: 'private',
    created_at: '2026-06-15T12:00:00Z',
    updated_at: '2026-06-15T12:00:00Z',
    blocks: [
      { type: 'heading', id: 'e1', level: 1, text: 'Organic Chemistry — Functional Groups' },
      { type: 'paragraph', id: 'e2', text: 'A **functional group** is an atom or group of atoms responsible for the characteristic reactions of a compound.' },
      {
        type: 'table', id: 'e3', rows: [
          ['Class', 'Functional Group', 'Example'],
          ['Alkane', '-CH₃ / -CH₂-', 'Methane (CH₄)'],
          ['Alkene', '-C=C-', 'Ethene (C₂H₄)'],
          ['Alcohol', '-OH', 'Ethanol (C₂H₅OH)'],
          ['Aldehyde', '-CHO', 'Ethanal'],
          ['Ketone', '-C=O-', 'Propanone'],
          ['Carboxylic acid', '-COOH', 'Ethanoic acid'],
          ['Amine', '-NH₂', 'Methylamine'],
          ['Ester', '-COO-', 'Ethyl ethanoate'],
        ]
      },
      { type: 'heading', id: 'e4', level: 2, text: 'Addition Reactions (Alkenes)' },
      { type: 'paragraph', id: 'e5', text: 'Alkenes undergo *addition reactions* across the C=C double bond. Reagents include H₂ (hydrogenation), HBr (hydrohalogenation), and Br₂ (bromine water test).' },
    ],
  },
  {
    id: 'note-005',
    title: 'Quadratic Equations & Discriminant',
    summary: 'Solving quadratics by factorisation, completing the square, and the quadratic formula. Includes the discriminant condition.',
    curriculum_id: null,
    subject_id: null,
    topic_id: null,
    is_syllabus_based: false,
    tags: ['mathematics', 'algebra', 'quadratics', 'IGCSE'],
    contributor_id: 'user-contributor-001',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-06-05T10:00:00Z',
    updated_at: '2026-06-06T08:00:00Z',
    blocks: [
      { type: 'heading', id: 'f1', level: 1, text: 'Quadratic Equations' },
      { type: 'paragraph', id: 'f2', text: 'A quadratic equation has the general form:' },
      { type: 'latex', id: 'f3', expression: 'ax^2 + bx + c = 0', display: true },
      { type: 'heading', id: 'f4', level: 2, text: 'The Quadratic Formula' },
      { type: 'latex', id: 'f5', expression: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}', display: true },
      { type: 'heading', id: 'f6', level: 2, text: 'The Discriminant' },
      { type: 'latex', id: 'f7', expression: '\\Delta = b^2 - 4ac', display: true },
      {
        type: 'table', id: 'f8', rows: [
          ['Discriminant', 'Nature of Roots'],
          ['Δ > 0', 'Two distinct real roots'],
          ['Δ = 0', 'One repeated real root'],
          ['Δ < 0', 'No real roots (complex)'],
        ]
      },
    ],
  },
  {
    id: 'note-006',
    title: 'Electromagnetic Spectrum',
    summary: 'From radio waves to gamma rays — understand wavelength, frequency, and real-world applications.',
    curriculum_id: 'curr-1',
    subject_id: 'subj-1',
    topic_id: null,
    syllabus_point: '3.1 — Electromagnetic Waves',
    is_syllabus_based: true,
    tags: ['physics', 'waves', 'electromagnetic', 'IGCSE'],
    contributor_id: 'user-contributor-002',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-06-10T10:00:00Z',
    updated_at: '2026-06-10T10:00:00Z',
    blocks: [
      { type: 'heading', id: 'g1', level: 1, text: 'Electromagnetic Spectrum' },
      { type: 'paragraph', id: 'g2', text: 'The EM spectrum arranges all types of electromagnetic radiation by wavelength and frequency.' },
      {
        type: 'table', id: 'g3', rows: [
          ['Region', 'Wavelength', 'Uses'],
          ['Radio', '> 0.1 m', 'Broadcasting, MRI'],
          ['Microwave', '1 mm – 0.1 m', 'Cooking, radar'],
          ['Infrared', '700 nm – 1 mm', 'Remote controls, thermal imaging'],
          ['Visible', '400 – 700 nm', 'Sight, photography'],
          ['UV', '10 – 400 nm', 'Sterilisation, tanning'],
          ['X-ray', '0.01 – 10 nm', 'Medical imaging'],
          ['Gamma', '< 0.01 nm', 'Cancer treatment'],
        ]
      },
      { type: 'latex', id: 'g4', expression: 'c = f\\lambda', display: true },
      { type: 'paragraph', id: 'g5', text: 'All EM waves travel at the speed of light in a vacuum: **c = 3 × 10⁸ m/s**.' },
    ],
  },
  {
    id: 'note-007',
    title: 'Past Simple vs Present Perfect',
    summary: 'Clear comparison of the two most confused tenses in English grammar with timeline visualisations.',
    curriculum_id: null,
    subject_id: null,
    topic_id: null,
    is_syllabus_based: false,
    tags: ['english', 'grammar', 'tenses', 'IELTS'],
    contributor_id: 'user-contributor-002',
    status: 'approved',
    visibility: 'public',
    reviewer_id: 'user-main-contributor-001',
    created_at: '2026-06-18T11:00:00Z',
    updated_at: '2026-06-18T11:00:00Z',
    blocks: [
      { type: 'heading', id: 'h1', level: 1, text: 'Past Simple vs Present Perfect' },
      { type: 'paragraph', id: 'h2', text: 'These two tenses cause the most confusion for English learners. The key difference is **time reference**.' },
      { type: 'heading', id: 'h3', level: 2, text: 'Past Simple' },
      { type: 'paragraph', id: 'h4', text: '**Form:** Subject + past verb (V2)\n**Use:** Completed actions at a specific time in the past.\n**Signal words:** yesterday, last week, in 2010, ago' },
      { type: 'heading', id: 'h5', level: 2, text: 'Present Perfect' },
      { type: 'paragraph', id: 'h6', text: '**Form:** Subject + has/have + past participle (V3)\n**Use:** Actions with present relevance or unspecified time.\n**Signal words:** ever, never, just, yet, already, since, for' },
      {
        type: 'table', id: 'h7', rows: [
          ['Past Simple', 'Present Perfect'],
          ['I ate lunch at 1 PM.', 'I have already eaten lunch.'],
          ['She lived in Paris in 2015.', 'She has lived in Paris since 2015.'],
          ['Did you finish?', 'Have you finished yet?'],
        ]
      },
    ],
  },
];

export const mockUserSavedNotes: UserSavedNote[] = [
  { id: 'usn-001', user_id: 'user-student-001', note_id: 'note-001', saved_at: '2026-06-10T09:00:00Z' },
  { id: 'usn-002', user_id: 'user-student-001', note_id: 'note-005', saved_at: '2026-06-12T14:00:00Z' },
];

// ── Notes Queries ────────────────────────────────────────────────────────────

/** Get all approved (public) notes, with optional filters */
export function getNotes(filters?: {
  curriculumId?: string;
  subjectId?: string;
  topicId?: string;
  isSyllabusBased?: boolean;
  search?: string;
  tags?: string[];
}): Note[] {
  let result = mockNotes.filter((n) => n.status === 'approved');

  if (filters?.curriculumId) {
    const target = filters.curriculumId;
    result = result.filter((n) => n.curriculum_id === target);
  }
  if (filters?.subjectId) {
    const target = filters.subjectId;
    result = result.filter((n) => n.subject_id === target);
  }
  if (filters?.topicId) {
    const target = filters.topicId;
    result = result.filter((n) => n.topic_id === target);
  }
  if (filters?.isSyllabusBased !== undefined) {
    const target = filters.isSyllabusBased;
    result = result.filter((n) => n.is_syllabus_based === target);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        (n.summary ?? '').toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  if (filters?.tags && filters.tags.length > 0) {
    const targetTags = filters.tags;
    result = result.filter((n) =>
      targetTags.some((tag) => n.tags.includes(tag))
    );
  }

  return result;
}

/** Get a single note by ID (any status) */
export function getNoteById(noteId: string): Note | undefined {
  return mockNotes.find((n) => n.id === noteId);
}

/** Get all notes created by a specific contributor (all statuses) */
export function getNotesByContributor(contributorId: string): Note[] {
  return mockNotes.filter((n) => n.contributor_id === contributorId);
}

/** Get all notes pending review (for main contributor review queue) */
export function getPendingNotes(): Note[] {
  return mockNotes.filter((n) => n.status === 'pending_review');
}

/** Create a new note draft */
export function createNote(
  contributorId: string,
  data: Omit<Note, 'id' | 'contributor_id' | 'status' | 'created_at' | 'updated_at'>
): Note {
  const note: Note = {
    ...data,
    id: `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    contributor_id: contributorId,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  mockNotes.push(note);
  return { ...note };
}

/** Update an existing draft note (only if status is draft or rejected) */
export function updateNote(
  noteId: string,
  contributorId: string,
  data: Partial<Omit<Note, 'id' | 'contributor_id' | 'status' | 'created_at' | 'reviewer_id' | 'reviewer_feedback'>>
): { success: true; note: Note } | { success: false; error: string } {
  const note = mockNotes.find((n) => n.id === noteId);
  if (!note) return { success: false, error: 'Note not found.' };
  if (note.contributor_id !== contributorId) return { success: false, error: 'You do not own this note.' };

  Object.assign(note, data);
  note.updated_at = new Date().toISOString();

  if (note.status === 'approved') {
    note.status = 'pending_review';
    // Re-submit to the queue
    mockEditorSubmissions.push({
      id: `sub-note-${Date.now()}`,
      contributor_id: contributorId,
      submission_type: 'note',
      entity_id: noteId,
      status: 'pending_review',
      reviewer_id: null,
      feedback: null,
      submitted_at: new Date().toISOString(),
      reviewed_at: null,
    });
  }

  return { success: true, note: { ...note } };
}

/** Submit a draft note for main-contributor review */
export function submitNoteForReview(
  noteId: string,
  contributorId: string
): { success: true } | { success: false; error: string } {
  const note = mockNotes.find((n) => n.id === noteId);
  if (!note) return { success: false, error: 'Note not found.' };
  if (note.contributor_id !== contributorId) return { success: false, error: 'You do not own this note.' };
  if (note.status !== 'draft' && note.status !== 'rejected') {
    return { success: false, error: 'Only draft or rejected notes can be submitted for review.' };
  }
  if (!note.title.trim() || note.blocks.length === 0) {
    return { success: false, error: 'Note must have a title and at least one content block.' };
  }

  note.status = 'pending_review';
  note.updated_at = new Date().toISOString();

  // Add to editor_submissions
  mockEditorSubmissions.push({
    id: `sub-note-${Date.now()}`,
    contributor_id: contributorId,
    submission_type: 'note',
    entity_id: noteId,
    status: 'pending_review',
    reviewer_id: null,
    feedback: null,
    submitted_at: new Date().toISOString(),
    reviewed_at: null,
  });

  return { success: true };
}

/** Approve a note (main contributor only — cannot approve own note) */
export function approveNote(
  noteId: string,
  reviewerId: string
): { success: true } | { success: false; error: string } {
  const reviewer = mockProfiles.find((p) => p.id === reviewerId);
  if (!reviewer || reviewer.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can approve notes.' };
  }

  const note = mockNotes.find((n) => n.id === noteId);
  if (!note) return { success: false, error: 'Note not found.' };
  if (note.contributor_id === reviewerId) {
    return { success: false, error: 'A main contributor cannot approve their own note.' };
  }
  if (note.status !== 'pending_review') {
    return { success: false, error: 'Only notes pending review can be approved.' };
  }

  note.status = 'approved';
  note.visibility = 'public';
  note.reviewer_id = reviewerId;
  note.reviewer_feedback = undefined;
  note.updated_at = new Date().toISOString();

  const submission = mockEditorSubmissions.find(
    (s) => s.entity_id === noteId && s.submission_type === 'note'
  );
  if (submission) {
    submission.status = 'approved';
    submission.reviewer_id = reviewerId;
    submission.reviewed_at = new Date().toISOString();
  }

  return { success: true };
}

/** Reject a note (main contributor only — cannot reject own note) */
export function rejectNote(
  noteId: string,
  reviewerId: string,
  feedback: string
): { success: true } | { success: false; error: string } {
  const reviewer = mockProfiles.find((p) => p.id === reviewerId);
  if (!reviewer || reviewer.role !== 'main_contributor') {
    return { success: false, error: 'Only main contributors can reject notes.' };
  }

  const note = mockNotes.find((n) => n.id === noteId);
  if (!note) return { success: false, error: 'Note not found.' };
  if (note.contributor_id === reviewerId) {
    return { success: false, error: 'A main contributor cannot reject their own note.' };
  }
  if (note.status !== 'pending_review') {
    return { success: false, error: 'Only notes pending review can be rejected.' };
  }

  note.status = 'rejected';
  note.reviewer_id = reviewerId;
  note.reviewer_feedback = feedback;
  note.updated_at = new Date().toISOString();

  const submission = mockEditorSubmissions.find(
    (s) => s.entity_id === noteId && s.submission_type === 'note'
  );
  if (submission) {
    submission.status = 'rejected';
    submission.reviewer_id = reviewerId;
    submission.feedback = feedback;
    submission.reviewed_at = new Date().toISOString();
  }

  return { success: true };
}

/** Delete a draft or rejected note */
export function deleteNote(
  noteId: string,
  contributorId: string
): { success: true } | { success: false; error: string } {
  const idx = mockNotes.findIndex((n) => n.id === noteId);
  if (idx < 0) return { success: false, error: 'Note not found.' };
  const note = mockNotes[idx];
  if (note.contributor_id !== contributorId) return { success: false, error: 'You do not own this note.' };
  mockNotes.splice(idx, 1);
  return { success: true };
}

// ── User Saved Notes ─────────────────────────────────────────────────────────

/** Get all notes saved by a user */
export function getUserSavedNotes(userId: string): Note[] {
  const savedIds = mockUserSavedNotes
    .filter((s) => s.user_id === userId)
    .map((s) => s.note_id);
  return mockNotes.filter((n) => savedIds.includes(n.id));
}

/** Check if a user has saved a specific note */
export function isNoteSaved(userId: string, noteId: string): boolean {
  return mockUserSavedNotes.some((s) => s.user_id === userId && s.note_id === noteId);
}

/** Save a note to a user's dashboard */
export function saveNote(
  userId: string,
  noteId: string
): { success: true } | { success: false; error: string } {
  if (isNoteSaved(userId, noteId)) {
    return { success: false, error: 'Note already saved.' };
  }
  const note = mockNotes.find((n) => n.id === noteId);
  if (!note) {
    return { success: false, error: 'Note not available.' };
  }
  mockUserSavedNotes.push({
    id: `usn-${Date.now()}`,
    user_id: userId,
    note_id: noteId,
    saved_at: new Date().toISOString(),
  });
  return { success: true };
}

/** Remove a note from a user's saved list */
export function unsaveNote(
  userId: string,
  noteId: string
): { success: true } | { success: false; error: string } {
  const idx = mockUserSavedNotes.findIndex(
    (s) => s.user_id === userId && s.note_id === noteId
  );
  if (idx < 0) return { success: false, error: 'Saved note not found.' };
  mockUserSavedNotes.splice(idx, 1);
  return { success: true };
}

// ══════════════════════════════════════════════════════════════════════════════
// Organisation — The ANTS (Mock Data & Queries)
// ══════════════════════════════════════════════════════════════════════════════

// ── Team Members ─────────────────────────────────────────────────────────────

const mockTeamMembers: OrgTeamMember[] = [
  {
    id: 'team-001',
    name: 'Ko Zaw Win',
    title: 'Founder & Lead Mentor',
    bio: 'Passionate about bridging the gap between Myanmar students and global education. Specializes in IGCSE Physics and Mathematics with over 8 years of teaching experience.',
    photoUrl: '',
    linkedProfileUsername: 'kozawwin',
    order: 0,
  },
  {
    id: 'team-002',
    name: 'Aye Chan Thu',
    title: 'Head of Curriculum Development',
    bio: 'Cambridge-trained educator dedicated to building world-class curriculum resources tailored for Myanmar students pursuing international qualifications.',
    photoUrl: '',
    linkedProfileUsername: 'ayechanthu',
    order: 1,
  },
  {
    id: 'team-003',
    name: 'Daw Hla Myint',
    title: 'Head of Content & Quality Assurance',
    bio: 'Senior gatekeeper with 15 years in international education. Ensures every resource and submission meets our rigorous quality standards.',
    photoUrl: '',
    linkedProfileUsername: 'dawhlamyint',
    order: 2,
  },
  {
    id: 'team-004',
    name: 'Thiri Aung',
    title: 'Student Ambassador & Peer Mentor',
    bio: 'IGCSE high-achiever who helps new students navigate the platform and organizes peer study groups. Pursuing straight A*s across all subjects.',
    photoUrl: '',
    linkedProfileUsername: 'thiriaung',
    order: 3,
  },
  {
    id: 'team-005',
    name: 'May Thu Kyaw',
    title: 'Community & Events Coordinator',
    bio: 'Organizes our CCA programs, workshops, and community-building events. Background in educational psychology and student engagement.',
    photoUrl: '',
    order: 4,
  },
  {
    id: 'team-006',
    name: 'Htet Lin Aung',
    title: 'Technical Lead & Platform Developer',
    bio: 'Full-stack developer responsible for building and maintaining The ANTS platform. Passionate about edtech and creating tools that make learning accessible.',
    photoUrl: '',
    order: 5,
  },
  {
    id: 'team-007',
    name: 'Su Myat Noe',
    title: 'A-Level Specialist (Alumni)',
    bio: 'Former A-Level student who achieved 4 A*s and now mentors current students. Specializes in Chemistry and Biology.',
    photoUrl: '',
    isAlumni: true,
    order: 6,
  },
];

/** Get all team members sorted by order */
export function getOrgTeamMembers(): OrgTeamMember[] {
  return [...mockTeamMembers].sort((a, b) => a.order - b.order);
}

// ── Organisation Timeline Items ──────────────────────────────────────────────

let mockTimelineItems: OrgTimelineItem[] = [
  {
    id: 'tl-001',
    title: 'The ANTS Founded',
    description: 'Founded by Ko Zaw Win with a small group of volunteer tutors, offering IGCSE Physics and Maths tutoring to students in Yangon.',
    date: '2022',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 0,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-002',
    title: 'First Cohort Graduates',
    description: 'Our first cohort of 15 IGCSE students completed their exams, with 80% achieving A*–B grades. Expanded to include Chemistry and Biology.',
    date: '2023',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 1,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-003',
    title: 'Online Platform Launch',
    description: 'Launched the first version of The ANTS digital platform — bringing timetables, flashcards, and lesson trackers online for students across Myanmar.',
    date: '2024 Q1',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 2,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-004',
    title: 'Mentor Network Expansion',
    description: 'Grew our mentor network to include scholars from A-Level, Polytechnic, University Foundation, OSSD, and UK university pathways.',
    date: '2024 Q3',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 3,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-005',
    title: 'Clubs & Classrooms',
    description: 'Rolled out virtual classrooms for teachers and community clubs for students — creating spaces for collaboration beyond individual study.',
    date: '2025 Q1',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 4,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-006',
    title: '100+ Active Students',
    description: 'Crossed 100 active students on the platform. Introduced CCA activities and the public contributor network.',
    date: '2025 Q3',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 5,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-007',
    title: 'Global Community Vision',
    description: 'Expanding to support students across Southeast Asia with a full ecosystem of academic tools, peer mentorship, and global university pathway guidance.',
    date: '2026',
    category: 'milestone',
    imageUrls: [],
    showOnTimeline: true,
    order: 6,
    createdAt: '2025-01-01T08:00:00Z',
  },
  {
    id: 'tl-008',
    title: 'IGCSE Intensive Bootcamp (Physics)',
    description: 'A 2-week intensive revision bootcamp covering all CAIE IGCSE Physics topics. Includes past paper walkthroughs, lab demonstrations, and one-on-one mentoring sessions.',
    date: '2025-06-10',
    category: 'workshop',
    imageUrls: [],
    showOnTimeline: false,
    location: 'Online (Zoom)',
    order: 7,
    createdAt: '2025-05-01T08:00:00Z',
  },
  {
    id: 'tl-009',
    title: 'Science Olympiad Team Training',
    description: 'Preparatory training sessions for the Myanmar Science Olympiad. Students worked in teams on experimental design, theory, and problem-solving under mentor guidance.',
    date: '2025-08-15',
    category: 'competition',
    imageUrls: [],
    showOnTimeline: false,
    location: 'Yangon, Myanmar',
    order: 8,
    createdAt: '2025-07-20T08:00:00Z',
  },
  {
    id: 'tl-010',
    title: 'Study Abroad Info Session: UK & Canada Pathways',
    description: 'An information session where mentors shared their experiences with A-Levels, OSSD, Foundation programs, and UK university applications. Q&A with current university students.',
    date: '2025-09-22',
    category: 'community',
    imageUrls: [],
    showOnTimeline: false,
    location: 'Online (Google Meet)',
    order: 9,
    createdAt: '2025-09-10T08:00:00Z',
  },
  {
    id: 'tl-011',
    title: 'Year-End Academic Awards Ceremony',
    description: 'Celebrated student achievements across all subjects. Recognized top performers, most improved students, and outstanding peer mentors.',
    date: '2025-12-18',
    category: 'community',
    imageUrls: [],
    showOnTimeline: false,
    location: 'The ANTS Learning Center, Yangon',
    order: 10,
    createdAt: '2025-12-01T08:00:00Z',
  },
  {
    id: 'tl-012',
    title: 'CCA Leadership Camp',
    description: 'A 3-day camp focused on developing leadership, teamwork, and communication skills through workshops, group projects, and outdoor activities.',
    date: '2026-01-15',
    category: 'camp',
    imageUrls: [],
    showOnTimeline: false,
    location: 'Hlawga National Park, Yangon',
    order: 11,
    createdAt: '2025-12-20T08:00:00Z',
  },
  {
    id: 'tl-013',
    title: 'IGCSE Maths Intensive Revision',
    description: 'Weekend intensive covering the most challenging IGCSE Maths topics: vectors, transformations, and probability. Included exam strategy sessions.',
    date: '2026-03-05',
    category: 'workshop',
    imageUrls: [],
    showOnTimeline: false,
    location: 'Online (Zoom)',
    order: 12,
    createdAt: '2026-02-15T08:00:00Z',
  },
];

// ── Timeline Item Queries ────────────────────────────────────────────────────

/** Get all timeline items sorted by order */
export function getOrgTimelineItems(): OrgTimelineItem[] {
  return [...mockTimelineItems].sort((a, b) => a.order - b.order);
}

/** Get items where showOnTimeline is true (for /about timeline display) */
export function getOrgMilestones(): OrgTimelineItem[] {
  return mockTimelineItems.filter((i) => i.showOnTimeline).sort((a, b) => a.order - b.order);
}

/** Get items where showOnTimeline is false (for gallery, excluding timeline items) */
export function getOrgActivities(): OrgTimelineItem[] {
  return mockTimelineItems.filter((i) => !i.showOnTimeline).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Get a single item by ID */
export function getOrgTimelineItem(id: string): OrgTimelineItem | undefined {
  return mockTimelineItems.find((i) => i.id === id);
}

/** Add a new timeline item */
export function addOrgTimelineItem(data: OrgTimelineItemFormData): { success: true; item: OrgTimelineItem } {
  const item: OrgTimelineItem = {
    id: `tl-${Date.now()}`,
    title: data.title,
    description: data.description,
    date: data.date,
    category: data.category,
    imageUrls: data.imageUrls,
    location: data.location,
    showOnTimeline: data.showOnTimeline ?? (data.category === 'milestone'),
    order: mockTimelineItems.length,
    createdAt: new Date().toISOString(),
  };
  mockTimelineItems.push(item);
  return { success: true, item };
}

/** Update an existing timeline item */
export function updateOrgTimelineItem(
  id: string,
  data: Partial<OrgTimelineItemFormData>
): { success: true; item: OrgTimelineItem } | { success: false; error: string } {
  const idx = mockTimelineItems.findIndex((i) => i.id === id);
  if (idx < 0) return { success: false, error: 'Item not found.' };
  if (data.title !== undefined) mockTimelineItems[idx].title = data.title;
  if (data.description !== undefined) mockTimelineItems[idx].description = data.description;
  if (data.date !== undefined) mockTimelineItems[idx].date = data.date;
  if (data.category !== undefined) mockTimelineItems[idx].category = data.category;
  if (data.imageUrls !== undefined) mockTimelineItems[idx].imageUrls = data.imageUrls;
  if (data.location !== undefined) mockTimelineItems[idx].location = data.location;
  if (data.showOnTimeline !== undefined) mockTimelineItems[idx].showOnTimeline = data.showOnTimeline;
  return { success: true, item: { ...mockTimelineItems[idx] } };
}

/** Delete a timeline item */
export function deleteOrgTimelineItem(id: string): { success: true } | { success: false; error: string } {
  const idx = mockTimelineItems.findIndex((i) => i.id === id);
  if (idx < 0) return { success: false, error: 'Item not found.' };
  mockTimelineItems.splice(idx, 1);
  return { success: true };
}
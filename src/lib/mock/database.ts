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
  Deck,
  FlashCard,
  CardReview,
  SRSRating,
  ParsedAICard,
  Exam,
  ExamCountdown,
} from '@/types';
import { generateUsername } from '@/lib/utils';

// ── Mock User Profiles ──────────────────────────────────────────────────────

const mockProfiles: Profile[] = [
  {
    id: 'user-student-001',
    email: 'thiri@theants.edu',
    full_name: 'Thiri Aung',
    username: 'thiriaung',
    avatar_url: null,
    role: 'student',
    created_at: '2026-01-15T08:00:00Z',
    updated_at: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-student-002',
    email: 'min.htet@theants.edu',
    full_name: 'Min Htet Naing',
    username: 'minhtetnaing',
    avatar_url: null,
    role: 'student',
    created_at: '2026-02-10T08:00:00Z',
    updated_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 'user-teacher-001',
    email: 'u.kyaw@theants.edu',
    full_name: 'U Kyaw Min',
    username: 'ukyawmin',
    avatar_url: null,
    role: 'teacher',
    created_at: '2025-09-01T08:00:00Z',
    updated_at: '2025-09-01T08:00:00Z',
  },
  {
    id: 'user-teacher-002',
    email: 'daw.su@theants.edu',
    full_name: 'Daw Su Myat',
    username: 'dawsumyat',
    avatar_url: null,
    role: 'teacher',
    created_at: '2025-11-15T08:00:00Z',
    updated_at: '2025-11-15T08:00:00Z',
  },
  {
    id: 'user-contributor-001',
    email: 'aye.chan@theants.edu',
    full_name: 'Aye Chan Thu',
    username: 'ayechanthu',
    avatar_url: null,
    role: 'contributor',
    created_at: '2025-06-20T08:00:00Z',
    updated_at: '2025-06-20T08:00:00Z',
  },
  {
    id: 'user-contributor-002',
    email: 'ko.zaw@theants.edu',
    full_name: 'Ko Zaw Win',
    username: 'kozawwin',
    avatar_url: null,
    role: 'contributor',
    created_at: '2025-08-05T08:00:00Z',
    updated_at: '2025-08-05T08:00:00Z',
  },
  {
    id: 'user-main-contributor-001',
    email: 'daw.hla@theants.edu',
    full_name: 'Daw Hla Myint',
    username: 'dawhlamyint',
    avatar_url: null,
    role: 'main_contributor',
    created_at: '2025-03-10T08:00:00Z',
    updated_at: '2025-03-10T08:00:00Z',
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
 * Register a new user with email, password, name, and role.
 * Returns the created AuthUser. In production, this would create a
 * Supabase auth user + profile row.
 */
export function mockSignup(
  email: string,
  password: string,
  name: string,
  role: UserRole
): AuthUser | { error: string } {
  const normalizedEmail = email.toLowerCase().trim();

  // Check if email already exists
  if (mockPasswords[normalizedEmail]) {
    return { error: 'An account with this email already exists.' };
  }

  const newProfile: Profile = {
    id: `user-${role}-${Date.now()}`,
    email: normalizedEmail,
    full_name: name,
    username: generateUsername(name),
    avatar_url: null,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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
 * Update a user's profile data in the mock store.
 * In production, this calls supabase.from('profiles').update().
 */
export function mockUpdateProfile(
  userId: string,
  data: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
): { success: true; profile: Profile } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  if (data.full_name !== undefined) {
    profile.full_name = data.full_name;
    profile.username = generateUsername(data.full_name);
  }
  if (data.avatar_url !== undefined) profile.avatar_url = data.avatar_url;

  return { success: true, profile: { ...profile } };
}

/**
 * Change a user's role in the mock store.
 * In production, this calls supabase.from('profiles').update({ role }).
 */
export function mockUpdateRole(
  userId: string,
  newRole: UserRole
): { success: true; profile: Profile } | { success: false; error: string } {
  const profile = mockProfiles.find((p) => p.id === userId);
  if (!profile) return { success: false, error: 'User not found.' };

  profile.role = newRole;
  return { success: true, profile: { ...profile } };
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
    full_name: name,
    username: generateUsername(name),
    avatar_url: null,
    role,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
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

  // Note: bio, title, etc. should now be updated via a separate mockUpdateContributorProfile call.
  // We'll update the mockContributorProfiles array directly here for the invite flow.

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

export const mockEditorSubmissions = [
  { id: 'sub-1', contributor_id: 'user-contributor-001', submission_type: 'resource', entity_id: 'res-1', status: 'approved', reviewer_id: 'user-main-contributor-001', feedback: 'Looks good', submitted_at: '2025-01-20T00:00:00Z', reviewed_at: '2025-01-21T00:00:00Z' }
];

// ── Mock Classrooms ─────────────────────────────────────────────────────────
export const mockClassrooms = [
  { id: 'class-1', name: 'Year 11 Physics', description: 'Ms. Kyaw\'s physics class.', teacher_id: 'user-teacher-001', invite_code: 'PHY11', created_at: '2026-01-01T00:00:00Z' }
];

export const mockClassroomMembers = [
  { id: 'cm-1', classroom_id: 'class-1', user_id: 'user-student-001', joined_at: '2026-01-10T00:00:00Z' }
];

export const mockClassroomCurriculums = [
  { id: 'cc-1', classroom_id: 'class-1', curriculum_id: 'curr-1' }
];

export const mockAssignments = [
  { id: 'assn-1', classroom_id: 'class-1', title: 'Forces Worksheet', description: 'Complete all questions on forces.', due_date: '2026-06-30T23:59:59Z', priority: 'high', created_by: 'user-teacher-001', created_at: '2026-06-15T00:00:00Z' }
];

export const mockAssignmentSubmissions = [
  { id: 'asub-1', assignment_id: 'assn-1', student_id: 'user-student-001', submission_text: 'Done!', status: 'submitted', submitted_at: '2026-06-16T12:00:00Z' }
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
    created_at: '2025-10-01T00:00:00Z',
  },
  {
    id: 'club-2',
    name: 'A Level Chemistry Circle',
    description: 'Weekly problem solving, revision prompts, and resource drops for serious Chemistry learners.',
    created_by: 'user-contributor-002',
    join_mode: 'approval_based',
    invite_code: null,
    created_at: '2026-02-14T00:00:00Z',
  },
  {
    id: 'club-3',
    name: 'Exam Sprint Studio',
    description: 'Invite-only sprint room for mock exam accountability and focused revision planning.',
    created_by: 'user-main-contributor-001',
    join_mode: 'invite_link',
    invite_code: 'SPRINT26',
    created_at: '2026-04-05T00:00:00Z',
  },
];

export const mockClubMembers: ClubMember[] = [
  { id: 'clm-1', club_id: 'club-1', user_id: 'user-contributor-001', role: 'leader', membership_status: 'active', joined_at: '2025-10-01T00:00:00Z' },
  { id: 'clm-2', club_id: 'club-1', user_id: 'user-student-001', role: 'member', membership_status: 'active', joined_at: '2026-01-15T00:00:00Z' },
  { id: 'clm-3', club_id: 'club-1', user_id: 'user-teacher-001', role: 'member', membership_status: 'active', joined_at: '2026-03-10T00:00:00Z' },
  { id: 'clm-4', club_id: 'club-2', user_id: 'user-contributor-002', role: 'leader', membership_status: 'active', joined_at: '2026-02-14T00:00:00Z' },
  { id: 'clm-5', club_id: 'club-3', user_id: 'user-main-contributor-001', role: 'leader', membership_status: 'active', joined_at: '2026-04-05T00:00:00Z' },
];

export const mockClubMessages: ClubMessage[] = [
  { id: 'cmsg-1', club_id: 'club-1', sender_id: 'user-student-001', message: 'Hi everyone! Anyone revising forces this week?', created_at: '2026-06-10T10:00:00Z' },
  { id: 'cmsg-2', club_id: 'club-1', sender_id: 'user-contributor-001', message: 'Yes. I will drop a compact question set later today.', created_at: '2026-06-10T10:12:00Z' },
  { id: 'cmsg-3', club_id: 'club-2', sender_id: 'user-contributor-002', message: 'Welcome to the Chemistry Circle. Post your hardest equilibrium question here.', created_at: '2026-06-12T09:30:00Z' },
];

export const mockClubAnnouncements: ClubAnnouncement[] = [
  { id: 'cann-1', club_id: 'club-1', created_by: 'user-contributor-001', title: 'Science Fair', content: 'Bring one idea and one question to this month\'s science fair prep session.', created_at: '2026-06-01T00:00:00Z' },
  { id: 'cann-2', club_id: 'club-3', created_by: 'user-main-contributor-001', title: 'Sprint Rules', content: 'Share goals before each sprint and check in after your timer ends.', created_at: '2026-06-05T00:00:00Z' },
];

export const mockClubLinks: ClubLink[] = [
  { id: 'clink-1', club_id: 'club-1', title: 'Physics Simulations', url: 'https://phet.colorado.edu/', shared_by: 'user-contributor-001', created_at: '2026-05-01T00:00:00Z' },
  { id: 'clink-2', club_id: 'club-2', title: 'Chemguide', url: 'https://www.chemguide.co.uk/', shared_by: 'user-contributor-002', created_at: '2026-05-22T00:00:00Z' },
];

// ── Mock Timetable & Pomodoro ───────────────────────────────────────────────
export const mockTimetableEvents = [
  { id: 'te-1', user_id: 'user-student-001', title: 'Physics Revision', event_type: 'study', start_time: '2026-06-18T14:00:00Z', end_time: '2026-06-18T16:00:00Z', all_day: false, is_recurring: false, recurrence_pattern: null, color_code: '#3b82f6', metadata: {}, created_at: '2026-06-10T00:00:00Z' }
];

export const mockPomodoroSessions = [
  { id: 'ps-1', user_id: 'user-student-001', duration_minutes: 25, task_name: 'Physics Chapter 1', category: 'Study', completed_at: '2026-06-17T15:00:00Z' }
];

// ── Mock Flashcards ─────────────────────────────────────────────────────────
export let mockDecks: Deck[] = [
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

export let mockExamCountdowns: ExamCountdown[] = [
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

export const mockNotes = [
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

// ── Classroom Student Progress ──────────────────────────────────────────────

export const mockClassroomProgress = [
  {
    classroom_id: 'class-1',
    student_id: 'user-student-001',
    curriculum_completion: 62,
    assignments_completed: 8,
    assignments_total: 10,
    average_confidence_level: 4,
    last_active_at: '2026-06-17T12:00:00Z',
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

export const getClassroom = (id: string) =>
  mockClassrooms.find(c => c.id === id);

export const getClassroomMembers = (classroomId: string) =>
  mockClassroomMembers.filter(m => m.classroom_id === classroomId);

export const getAssignmentsByClassroom = (classroomId: string) =>
  mockAssignments.filter(a => a.classroom_id === classroomId);

export const getClub = (id: string) =>
  mockClubs.find(c => c.id === id);

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
}): Club {
  const now = new Date().toISOString();
  const club: Club = {
    id: `club-${Date.now()}`,
    name: data.name,
    description: data.description || null,
    created_by: data.created_by,
    join_mode: data.join_mode,
    invite_code: data.join_mode === 'invite_link' ? (data.invite_code || generateInviteCode(data.name)) : null,
    created_at: now,
  };

  mockClubs.unshift(club);
  mockClubMembers.push({
    id: `clm-${Date.now()}`,
    club_id: club.id,
    user_id: data.created_by,
    role: 'leader',
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
  const activeLeaders = mockClubMembers.filter(m => m.club_id === clubId && m.role === 'leader' && m.membership_status === 'active');
  if (member.role === 'leader' && activeLeaders.length === 1) {
    return { success: false, error: 'The sole leader cannot leave this club.' };
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

// ── Exam & Countdown Helpers ──────────────────────────────────────────────────

export const getExams = (): Exam[] => [...mockExams];

export function createExamCountdown(data: Omit<ExamCountdown, 'id' | 'created_at'>): ExamCountdown {
  const countdown: ExamCountdown = {
    ...data,
    id: `ec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    created_at: new Date().toISOString(),
  };
  mockExamCountdowns.unshift(countdown);
  return countdown;
}

export function deleteExamCountdown(id: string): { success: true } | { success: false; error: string } {
  const idx = mockExamCountdowns.findIndex(c => c.id === id);
  if (idx < 0) return { success: false, error: 'Countdown not found.' };
  mockExamCountdowns.splice(idx, 1);
  return { success: true };
}

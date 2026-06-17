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

import { Profile, AuthUser, UserRole } from '@/types';

// ── Mock User Profiles ──────────────────────────────────────────────────────

const mockProfiles: Profile[] = [
  {
    id: 'user-student-001',
    email: 'thiri@theants.edu',
    name: 'Thiri Aung',
    avatar: '',
    role: 'student',
    bio: 'IGCSE student aiming for straight A*s. Love physics and maths!',
    title: 'IGCSE Student',
    createdAt: '2026-01-15T08:00:00Z',
  },
  {
    id: 'user-teacher-001',
    email: 'u.kyaw@theants.edu',
    name: 'U Kyaw Min',
    avatar: '',
    role: 'teacher',
    bio: 'Experienced A Level Chemistry teacher with 10+ years of tutoring Myanmar students.',
    title: 'A Level Chemistry Teacher',
    createdAt: '2025-09-01T08:00:00Z',
  },
  {
    id: 'user-contributor-001',
    email: 'aye.chan@theants.edu',
    name: 'Aye Chan Thu',
    avatar: '',
    role: 'contributor',
    bio: 'Cambridge-trained educator building curriculum resources for Myanmar students.',
    title: 'Curriculum Developer',
    socialLinks: {
      github: 'https://github.com/ayechanthu',
      linkedin: 'https://linkedin.com/in/ayechanthu',
    },
    createdAt: '2025-06-20T08:00:00Z',
  },
  {
    id: 'user-main-contributor-001',
    email: 'daw.hla@theants.edu',
    name: 'Daw Hla Myint',
    avatar: '',
    role: 'main_contributor',
    bio: 'Senior gatekeeper and lead reviewer. 15 years in international education.',
    title: 'Head of Content',
    socialLinks: {
      linkedin: 'https://linkedin.com/in/dawhlamyint',
      website: 'https://dawhlamyint.com',
    },
    createdAt: '2025-03-10T08:00:00Z',
  },
];

// ── Password Store (mock only — never do this in production!) ────────────────

const mockPasswords: Record<string, string> = {
  'thiri@theants.edu': 'student123',
  'u.kyaw@theants.edu': 'teacher123',
  'aye.chan@theants.edu': 'contributor123',
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
    name,
    avatar: '',
    role,
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

// ── Type Guard ───────────────────────────────────────────────────────────────

/** Check if a signup result is an error */
export function isSignupError(
  result: AuthUser | { error: string }
): result is { error: string } {
  return 'error' in result;
}

// ── Mock Additional Profiles Data ────────────────────────────────────────────
export const mockStudentProfiles = [
  { id: 'user-student-001', target_exam_year: 2026, study_goals_metadata: { goal: 'A*' } }
];

export const mockTeacherProfiles = [
  { id: 'user-teacher-001', institution_name: 'Yangon International School', is_verified_teacher: true }
];

export const mockContributorProfiles = [
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
export const mockClubs = [
  { id: 'club-1', name: 'Science Enthusiasts', description: 'For students who love science.', created_by: 'user-contributor-001', join_mode: 'open', invite_code: 'SCI101', created_at: '2025-10-01T00:00:00Z' }
];

export const mockClubMembers = [
  { id: 'clm-1', club_id: 'club-1', user_id: 'user-student-001', role: 'member', membership_status: 'active', joined_at: '2026-01-15T00:00:00Z' }
];

export const mockClubMessages = [
  { id: 'cmsg-1', club_id: 'club-1', sender_id: 'user-student-001', message: 'Hi everyone!', created_at: '2026-06-10T10:00:00Z' }
];

export const mockClubAnnouncements = [
  { id: 'cann-1', club_id: 'club-1', created_by: 'user-contributor-001', title: 'Science Fair', content: 'Don\'t forget about the upcoming fair.', created_at: '2026-06-01T00:00:00Z' }
];

export const mockClubLinks = [
  { id: 'clink-1', club_id: 'club-1', title: 'Physics Simulations', url: 'https://phet.colorado.edu/', shared_by: 'user-contributor-001', created_at: '2026-05-01T00:00:00Z' }
];

// ── Mock Timetable & Pomodoro ───────────────────────────────────────────────
export const mockTimetableEvents = [
  { id: 'te-1', user_id: 'user-student-001', title: 'Physics Revision', event_type: 'study', start_time: '2026-06-18T14:00:00Z', end_time: '2026-06-18T16:00:00Z', all_day: false, is_recurring: false, recurrence_pattern: null, color_code: '#3b82f6', metadata: {}, created_at: '2026-06-10T00:00:00Z' }
];

export const mockPomodoroSessions = [
  { id: 'ps-1', user_id: 'user-student-001', duration_minutes: 25, task_name: 'Physics Chapter 1', category: 'Study', completed_at: '2026-06-17T15:00:00Z' }
];

// ── Mock Flashcards ─────────────────────────────────────────────────────────
export const mockDecks = [
  { id: 'deck-1', owner_id: 'user-student-001', curriculum_id: 'curr-1', name: 'Physics Formulas', description: 'Important formulas for IGCSE', is_public: true, created_at: '2026-02-01T00:00:00Z' }
];

export const mockCards = [
  { id: 'card-1', deck_id: 'deck-1', front_text: 'F = ?', back_text: 'ma', created_at: '2026-02-01T00:00:00Z' },
  { id: 'card-2', deck_id: 'deck-1', front_text: 'v = ?', back_text: 's/t', created_at: '2026-02-01T00:00:00Z' }
];

export const mockCardReviews = [
  { id: 'cr-1', card_id: 'card-1', user_id: 'user-student-001', interval_days: 1, ease_factor: 2.5, next_review_date: '2026-06-18T00:00:00Z', last_rating: 'good' }
];

// ── Mock Exams & Grades ─────────────────────────────────────────────────────
export const mockExams = [
  { id: 'exam-1', curriculum_id: 'curr-1', title: 'IGCSE Physics Paper 2', exam_series: 'May/June 2026', exam_date: '2026-05-15T09:00:00Z', created_at: '2025-12-01T00:00:00Z' }
];

export const mockExamCountdowns = [
  { id: 'ec-1', user_id: 'user-student-001', exam_id: 'exam-1', custom_title: 'Physics Finals!', target_date: '2026-05-15T09:00:00Z', priority_indicator: 'high', created_at: '2026-01-01T00:00:00Z' }
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

export const mockClubJoinRequests = [
  {
    id: 'req-1',
    club_id: 'club-1',
    user_id: 'user-student-001',
    status: 'pending',
    requested_at: '2026-06-15T12:00:00Z',
  },
];

// ── Club Curriculum Links ───────────────────────────────────────────────────

export const mockClubCurriculums = [
  {
    id: 'club-curr-1',
    club_id: 'club-1',
    curriculum_id: 'curr-1',
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

export const getDeck = (id: string) =>
  mockDecks.find(d => d.id === id);

export const getCardsByDeck = (deckId: string) =>
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
// Centralized query key factory for TanStack Query
// Ensures consistency across all query hooks

export const queryKeys = {
  // Auth / Profile
  profile: {
    all: ['profile'] as const,
    byUsername: (username: string) => ['profile', username] as const,
    own: ['profile', 'own'] as const,
  },

  // Clubs
  clubs: {
    all: ['clubs'] as const,
    bySlug: (slug: string) => ['clubs', slug] as const,
    members: (clubId: string) => ['clubs', clubId, 'members'] as const,
    projects: (clubId: string) => ['clubs', clubId, 'projects'] as const,
    announcements: (clubId: string) => ['clubs', clubId, 'announcements'] as const,
  },

  // Classrooms
  classrooms: {
    all: ['classrooms'] as const,
    byId: (id: string) => ['classrooms', id] as const,
    assignments: (classroomId: string) => ['classrooms', classroomId, 'assignments'] as const,
    discussions: (classroomId: string) => ['classrooms', classroomId, 'discussions'] as const,
    resources: (classroomId: string) => ['classrooms', classroomId, 'resources'] as const,
    members: (classroomId: string) => ['classrooms', classroomId, 'members'] as const,
  },

  // Quizzes (standalone)
  quizzes: {
    all: ['quizzes'] as const,
    byId: (id: string) => ['quizzes', id] as const,
    myQuizzes: ['quizzes', 'mine'] as const,
    library: ['quizzes', 'library'] as const,
    session: (sessionId: string) => ['quizzes', 'session', sessionId] as const,
  },

  // Lessons
  curriculums: {
    all: ['curriculums'] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    byCurriculum: (curriculumId: string) => ['subjects', curriculumId] as const,
  },
  topics: {
    all: ['topics'] as const,
    bySubject: (subjectId: string) => ['topics', subjectId] as const,
  },
  enrollments: {
    byUser: (userId: string) => ['enrollments', userId] as const,
  },
  topicProgress: {
    byUser: (userId: string) => ['topicProgress', userId] as const,
  },
  countdowns: {
    bySubjects: (subjectIds: string[]) => ['countdowns', ...subjectIds] as const,
  },
};

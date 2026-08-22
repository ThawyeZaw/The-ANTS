import { relations } from 'drizzle-orm';
import {
  profiles,
  studentProfiles,
  teacherProfiles,
  contributorProfiles,
  certifications,
  roleUpgradeRequests,
  roleUpgradeApplications,
} from './profiles';
import {
  curriculums,
  subjects,
  topics,
  userCurriculums,
  topicProgress,
  resources,
  editorSubmissions,
} from './curriculums';
import {
  classrooms,
  classroomMembers,
  classroomCurriculums,
  assignments,
  assignmentSubmissions,
  quizzes,
  quizAttempts,
  discussionTopics,
  discussionReplies,
  classroomResources,
} from './classrooms';
import {
  clubs,
  clubMembers,
  clubCurriculums,
  clubSubjects,
  clubMessages,
  clubAnnouncements,
  clubLinks,
  clubJoinRequests,
  clubProjects,
  clubEvents,
  clubMilestones,
  clubMemberContributions,
} from './clubs';
import {
  timetableEvents,
  pomodoroSessions,
  decks,
  cards,
  cardReviews,
  exams,
  examCountdowns,
  gradeBoundaries,
  gradeEntries,
  userEnrollments,
  userExamOverrides,
  userExamHistory,
  notes,
  userSavedNotes,
  userNotes,
  examSchedules,
} from './study_tools';
import {
  reviewQueue,
  versionHistory,
  notifications,
  notificationQueue,
  notificationPreferences,
  activityFeed,
} from './system';
import { user, session, account } from './auth';

// ── Profile Relations ───────────────────────────────────────────────────────

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [profiles.id],
    references: [studentProfiles.id],
  }),
  teacherProfile: one(teacherProfiles, {
    fields: [profiles.id],
    references: [teacherProfiles.id],
  }),
  contributorProfile: one(contributorProfiles, {
    fields: [profiles.id],
    references: [contributorProfiles.id],
  }),
  certifications: many(certifications),
  roleUpgradeRequests: many(roleUpgradeRequests),
  roleUpgradeApplications: many(roleUpgradeApplications),
  timetableEvents: many(timetableEvents),
  pomodoroSessions: many(pomodoroSessions),
  decks: many(decks),
  notes: many(notes),
  userNotes: many(userNotes),
  userSavedNotes: many(userSavedNotes),
  examCountdowns: many(examCountdowns),
  gradeEntries: many(gradeEntries),
  userEnrollments: many(userEnrollments),
  userCurriculums: many(userCurriculums),
  topicProgress: many(topicProgress),
  classroomMemberships: many(classroomMembers),
  clubMemberships: many(clubMembers),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences, {
    fields: [profiles.id],
    references: [notificationPreferences.user_id],
  }),
}));

// ── Curriculum Relations ───────────────────────────────────────────────────

export const curriculumsRelations = relations(curriculums, ({ many }) => ({
  subjects: many(subjects),
  userCurriculums: many(userCurriculums),
  classroomCurriculums: many(classroomCurriculums),
  clubCurriculums: many(clubCurriculums),
  userEnrollments: many(userEnrollments),
  exams: many(exams),
  notes: many(notes),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  curriculum: one(curriculums, {
    fields: [subjects.curriculum_id],
    references: [curriculums.id],
  }),
  topics: many(topics),
  exams: many(exams),
  decks: many(decks),
  notes: many(notes),
  userNotes: many(userNotes),
  resources: many(resources),
  gradeBoundaries: many(gradeBoundaries),
  gradeEntries: many(gradeEntries),
  examCountdowns: many(examCountdowns),
  classroomCurriculums: many(classroomCurriculums),
  clubSubjects: many(clubSubjects),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subject_id],
    references: [subjects.id],
  }),
  resources: many(resources),
  topicProgress: many(topicProgress),
  decks: many(decks),
  notes: many(notes),
  userNotes: many(userNotes),
  pomodoroSessions: many(pomodoroSessions),
}));

// ── Classroom Relations ────────────────────────────────────────────────────

export const classroomsRelations = relations(classrooms, ({ one, many }) => ({
  teacher: one(profiles, {
    fields: [classrooms.teacher_id],
    references: [profiles.id],
  }),
  members: many(classroomMembers),
  curriculums: many(classroomCurriculums),
  assignments: many(assignments),
  quizzes: many(quizzes),
  discussions: many(discussionTopics),
  resources: many(classroomResources),
}));

export const classroomMembersRelations = relations(classroomMembers, ({ one }) => ({
  classroom: one(classrooms, {
    fields: [classroomMembers.classroom_id],
    references: [classrooms.id],
  }),
  user: one(profiles, {
    fields: [classroomMembers.user_id],
    references: [profiles.id],
  }),
}));

export const assignmentsRelations = relations(assignments, ({ one, many }) => ({
  classroom: one(classrooms, {
    fields: [assignments.classroom_id],
    references: [classrooms.id],
  }),
  submissions: many(assignmentSubmissions),
}));

export const assignmentSubmissionsRelations = relations(assignmentSubmissions, ({ one }) => ({
  assignment: one(assignments, {
    fields: [assignmentSubmissions.assignment_id],
    references: [assignments.id],
  }),
  student: one(profiles, {
    fields: [assignmentSubmissions.student_id],
    references: [profiles.id],
  }),
  grader: one(profiles, {
    fields: [assignmentSubmissions.graded_by],
    references: [profiles.id],
  }),
}));

// ── Club Relations ─────────────────────────────────────────────────────────

export const clubsRelations = relations(clubs, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [clubs.owner_id],
    references: [profiles.id],
  }),
  members: many(clubMembers),
  curriculums: many(clubCurriculums),
  subjects: many(clubSubjects),
  messages: many(clubMessages),
  announcements: many(clubAnnouncements),
  links: many(clubLinks),
  joinRequests: many(clubJoinRequests),
  projects: many(clubProjects),
  events: many(clubEvents),
  milestones: many(clubMilestones),
  contributions: many(clubMemberContributions),
}));

export const clubMembersRelations = relations(clubMembers, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMembers.club_id],
    references: [clubs.id],
  }),
  user: one(profiles, {
    fields: [clubMembers.user_id],
    references: [profiles.id],
  }),
}));

export const clubMessagesRelations = relations(clubMessages, ({ one }) => ({
  club: one(clubs, {
    fields: [clubMessages.club_id],
    references: [clubs.id],
  }),
  user: one(profiles, {
    fields: [clubMessages.user_id],
    references: [profiles.id],
  }),
}));

// ── Flashcards & SRS Relations ─────────────────────────────────────────────

export const decksRelations = relations(decks, ({ one, many }) => ({
  owner: one(profiles, {
    fields: [decks.owner_id],
    references: [profiles.id],
  }),
  subject: one(subjects, {
    fields: [decks.subject_id],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [decks.topic_id],
    references: [topics.id],
  }),
  cards: many(cards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  deck: one(decks, {
    fields: [cards.deck_id],
    references: [decks.id],
  }),
  reviews: many(cardReviews),
}));

export const cardReviewsRelations = relations(cardReviews, ({ one }) => ({
  card: one(cards, {
    fields: [cardReviews.card_id],
    references: [cards.id],
  }),
  user: one(profiles, {
    fields: [cardReviews.user_id],
    references: [profiles.id],
  }),
}));

// ── Exams & Study Tools Relations ──────────────────────────────────────────

export const examsRelations = relations(exams, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [exams.subject_id],
    references: [subjects.id],
  }),
  curriculum: one(curriculums, {
    fields: [exams.curriculum_id],
    references: [curriculums.id],
  }),
  countdowns: many(examCountdowns),
  gradeBoundaries: many(gradeBoundaries),
  gradeEntries: many(gradeEntries),
  schedules: many(examSchedules),
}));

export const gradeBoundariesRelations = relations(gradeBoundaries, ({ one }) => ({
  exam: one(exams, {
    fields: [gradeBoundaries.exam_id],
    references: [exams.id],
  }),
  subject: one(subjects, {
    fields: [gradeBoundaries.subject_id],
    references: [subjects.id],
  }),
}));

export const examCountdownsRelations = relations(examCountdowns, ({ one }) => ({
  user: one(profiles, {
    fields: [examCountdowns.user_id],
    references: [profiles.id],
  }),
  exam: one(exams, {
    fields: [examCountdowns.exam_id],
    references: [exams.id],
  }),
  subject: one(subjects, {
    fields: [examCountdowns.subject_id],
    references: [subjects.id],
  }),
}));

export const gradeEntriesRelations = relations(gradeEntries, ({ one }) => ({
  user: one(profiles, {
    fields: [gradeEntries.user_id],
    references: [profiles.id],
  }),
  exam: one(exams, {
    fields: [gradeEntries.exam_id],
    references: [exams.id],
  }),
  subject: one(subjects, {
    fields: [gradeEntries.subject_id],
    references: [subjects.id],
  }),
}));

export const examSchedulesRelations = relations(examSchedules, ({ one }) => ({
  exam: one(exams, {
    fields: [examSchedules.exam_id],
    references: [exams.id],
  }),
}));

export const timetableEventsRelations = relations(timetableEvents, ({ one }) => ({
  user: one(profiles, {
    fields: [timetableEvents.user_id],
    references: [profiles.id],
  }),
}));

export const pomodoroSessionsRelations = relations(pomodoroSessions, ({ one }) => ({
  user: one(profiles, {
    fields: [pomodoroSessions.user_id],
    references: [profiles.id],
  }),
  subject: one(subjects, {
    fields: [pomodoroSessions.subject_id],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [pomodoroSessions.topic_id],
    references: [topics.id],
  }),
}));

export const userEnrollmentsRelations = relations(userEnrollments, ({ one }) => ({
  user: one(profiles, {
    fields: [userEnrollments.user_id],
    references: [profiles.id],
  }),
  curriculum: one(curriculums, {
    fields: [userEnrollments.curriculum_id],
    references: [curriculums.id],
  }),
  subject: one(subjects, {
    fields: [userEnrollments.subject_id],
    references: [subjects.id],
  }),
  exam: one(exams, {
    fields: [userEnrollments.exam_id],
    references: [exams.id],
  }),
}));

export const userExamOverridesRelations = relations(userExamOverrides, ({ one }) => ({
  user: one(profiles, {
    fields: [userExamOverrides.user_id],
    references: [profiles.id],
  }),
  exam: one(exams, {
    fields: [userExamOverrides.exam_id],
    references: [exams.id],
  }),
}));

export const userExamHistoryRelations = relations(userExamHistory, ({ one }) => ({
  user: one(profiles, {
    fields: [userExamHistory.user_id],
    references: [profiles.id],
  }),
  curriculum: one(curriculums, {
    fields: [userExamHistory.curriculum_id],
    references: [curriculums.id],
  }),
  subject: one(subjects, {
    fields: [userExamHistory.subject_id],
    references: [subjects.id],
  }),
  exam: one(exams, {
    fields: [userExamHistory.exam_id],
    references: [exams.id],
  }),
}));

export const notesRelations = relations(notes, ({ one, many }) => ({
  contributor: one(profiles, {
    fields: [notes.contributor_id],
    references: [profiles.id],
  }),
  curriculum: one(curriculums, {
    fields: [notes.curriculum_id],
    references: [curriculums.id],
  }),
  subject: one(subjects, {
    fields: [notes.subject_id],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [notes.topic_id],
    references: [topics.id],
  }),
  savedByUsers: many(userSavedNotes),
}));

export const userSavedNotesRelations = relations(userSavedNotes, ({ one }) => ({
  user: one(profiles, {
    fields: [userSavedNotes.user_id],
    references: [profiles.id],
  }),
  note: one(notes, {
    fields: [userSavedNotes.note_id],
    references: [notes.id],
  }),
}));

export const userNotesRelations = relations(userNotes, ({ one }) => ({
  user: one(profiles, {
    fields: [userNotes.user_id],
    references: [profiles.id],
  }),
  curriculum: one(curriculums, {
    fields: [userNotes.curriculum_id],
    references: [curriculums.id],
  }),
  subject: one(subjects, {
    fields: [userNotes.subject_id],
    references: [subjects.id],
  }),
  topic: one(topics, {
    fields: [userNotes.topic_id],
    references: [topics.id],
  }),
}));

// ── Better Auth Relations ──────────────────────────────────────────────────

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

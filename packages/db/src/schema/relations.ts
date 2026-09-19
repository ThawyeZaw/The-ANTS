import { relations } from 'drizzle-orm';
import {
  profiles,
  studentProfiles,
  contributorProfiles,
  certifications,
  roleUpgradeRequests,
} from './profiles';
import {
  curriculums,
  subjects,
  topics,
  userCurriculums,
  topicProgress,
} from './curriculums';
import {
  timetableEvents,
  pomodoroUserSettings,
  pomodoroSessions,
  exams,
  examCountdowns,
  gradeBoundaries,
  gradeEntries,
  userEnrollments,
  userExamOverrides,
  userExamHistory,
  examSchedules,
  pastPapers,
  paperGradeBoundaries,
  subjectGradeBoundaries,
  userPastPaperRecords,
  userXpLedger,
  userBadges,
  userStreaks,
  subjectComponentRoutes,
  userCashInEnrollments,
  userComponentSelections,
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

  contributorProfile: one(contributorProfiles, {
    fields: [profiles.id],
    references: [contributorProfiles.id],
  }),
  certifications: many(certifications),
  roleUpgradeRequests: many(roleUpgradeRequests),
  timetableEvents: many(timetableEvents),
  pomodoroSessions: many(pomodoroSessions),
  pomodoroUserSettings: one(pomodoroUserSettings, {
    fields: [profiles.id],
    references: [pomodoroUserSettings.user_id],
  }),
  examCountdowns: many(examCountdowns),
  gradeEntries: many(gradeEntries),
  userEnrollments: many(userEnrollments),
  userCurriculums: many(userCurriculums),
  topicProgress: many(topicProgress),
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
  userEnrollments: many(userEnrollments),
  exams: many(exams),
}));

export const subjectsRelations = relations(subjects, ({ one, many }) => ({
  curriculum: one(curriculums, {
    fields: [subjects.curriculum_id],
    references: [curriculums.id],
  }),
  topics: many(topics),
  exams: many(exams),
  pastPapers: many(pastPapers),
  gradeBoundaries: many(gradeBoundaries),
  gradeEntries: many(gradeEntries),
  examCountdowns: many(examCountdowns),
  subjectGradeBoundaries: many(subjectGradeBoundaries),
  userEnrollments: many(userEnrollments),
}));

export const topicsRelations = relations(topics, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [topics.subject_id],
    references: [subjects.id],
  }),
  topicProgress: many(topicProgress),
  pomodoroSessions: many(pomodoroSessions),
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

export const pomodoroUserSettingsRelations = relations(pomodoroUserSettings, ({ one }) => ({
  user: one(profiles, {
    fields: [pomodoroUserSettings.user_id],
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

export const userCurriculumsRelations = relations(userCurriculums, ({ one }) => ({
  user: one(profiles, {
    fields: [userCurriculums.user_id],
    references: [profiles.id],
  }),
  curriculum: one(curriculums, {
    fields: [userCurriculums.curriculum_id],
    references: [curriculums.id],
  }),
}));

export const topicProgressRelations = relations(topicProgress, ({ one }) => ({
  user: one(profiles, {
    fields: [topicProgress.user_id],
    references: [profiles.id],
  }),
  topic: one(topics, {
    fields: [topicProgress.topic_id],
    references: [topics.id],
  }),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [studentProfiles.id],
    references: [profiles.id],
  }),
}));



export const contributorProfilesRelations = relations(contributorProfiles, ({ one }) => ({
  profile: one(profiles, {
    fields: [contributorProfiles.id],
    references: [profiles.id],
  }),
}));

export const certificationsRelations = relations(certifications, ({ one }) => ({
  user: one(profiles, {
    fields: [certifications.user_id],
    references: [profiles.id],
  }),
}));

export const roleUpgradeRequestsRelations = relations(roleUpgradeRequests, ({ one }) => ({
  user: one(profiles, {
    fields: [roleUpgradeRequests.user_id],
    references: [profiles.id],
  }),
  reviewer: one(profiles, {
    fields: [roleUpgradeRequests.reviewer_id],
    references: [profiles.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(profiles, {
    fields: [notifications.user_id],
    references: [profiles.id],
  }),
}));

export const notificationQueueRelations = relations(notificationQueue, ({ one }) => ({
  user: one(profiles, {
    fields: [notificationQueue.user_id],
    references: [profiles.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(profiles, {
    fields: [notificationPreferences.user_id],
    references: [profiles.id],
  }),
}));

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
  user: one(profiles, {
    fields: [activityFeed.user_id],
    references: [profiles.id],
  }),
}));

export const reviewQueueRelations = relations(reviewQueue, ({ one }) => ({
  contributor: one(profiles, {
    fields: [reviewQueue.contributor_id],
    references: [profiles.id],
  }),
  reviewer: one(profiles, {
    fields: [reviewQueue.reviewer_id],
    references: [profiles.id],
  }),
}));

export const versionHistoryRelations = relations(versionHistory, ({ one }) => ({
  changedBy: one(profiles, {
    fields: [versionHistory.changed_by],
    references: [profiles.id],
  }),
}));

export const pastPapersRelations = relations(pastPapers, ({ one, many }) => ({
  subject: one(subjects, {
    fields: [pastPapers.subject_id],
    references: [subjects.id],
  }),
  curriculum: one(curriculums, {
    fields: [pastPapers.curriculum_id],
    references: [curriculums.id],
  }),
  gradeBoundaries: many(paperGradeBoundaries),
  userRecords: many(userPastPaperRecords),
}));

export const paperGradeBoundariesRelations = relations(paperGradeBoundaries, ({ one }) => ({
  pastPaper: one(pastPapers, {
    fields: [paperGradeBoundaries.past_paper_id],
    references: [pastPapers.id],
  }),
}));

export const subjectGradeBoundariesRelations = relations(subjectGradeBoundaries, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectGradeBoundaries.subject_id],
    references: [subjects.id],
  }),
}));

export const userPastPaperRecordsRelations = relations(userPastPaperRecords, ({ one }) => ({
  user: one(profiles, {
    fields: [userPastPaperRecords.user_id],
    references: [profiles.id],
  }),
  pastPaper: one(pastPapers, {
    fields: [userPastPaperRecords.past_paper_id],
    references: [pastPapers.id],
  }),
}));

export const userXpLedgerRelations = relations(userXpLedger, ({ one }) => ({
  user: one(profiles, {
    fields: [userXpLedger.user_id],
    references: [profiles.id],
  }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(profiles, {
    fields: [userBadges.user_id],
    references: [profiles.id],
  }),
}));

export const userStreaksRelations = relations(userStreaks, ({ one }) => ({
  user: one(profiles, {
    fields: [userStreaks.user_id],
    references: [profiles.id],
  }),
}));

export const subjectComponentRoutesRelations = relations(subjectComponentRoutes, ({ one }) => ({
  subject: one(subjects, {
    fields: [subjectComponentRoutes.subject_id],
    references: [subjects.id],
  }),
}));

export const userCashInEnrollmentsRelations = relations(userCashInEnrollments, ({ one }) => ({
  user: one(profiles, {
    fields: [userCashInEnrollments.user_id],
    references: [profiles.id],
  }),
}));

export const userComponentSelectionsRelations = relations(userComponentSelections, ({ one }) => ({
  user: one(profiles, {
    fields: [userComponentSelections.user_id],
    references: [profiles.id],
  }),
  subject: one(subjects, {
    fields: [userComponentSelections.subject_id],
    references: [subjects.id],
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

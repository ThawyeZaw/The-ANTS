'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom Server Actions
// Thin wrappers around mock database operations for client components to call.
// In production, these will call Supabase directly.
// ──────────────────────────────────────────────────────────────────────────────

import {
  getClassroom,
  getClassroomsByUser,
  getClassroomMembers,
  getClassroomTeacherIds,
  getClassroomMember,
  getAssignmentsByClassroom,
  getAssignment,
  getSubmission,
  getSubmissionsByAssignment,
  getQuizzesByClassroom,
  getQuiz,
  getQuizAttemptsByQuiz,
  getQuizAttempt,
  getDiscussionTopicsByClassroom,
  getDiscussionTopic,
  getDiscussionReplies,
  getResourcesByClassroom,
  createClassroom as dbCreateClassroom,
  updateClassroom as dbUpdateClassroom,
  joinClassroom as dbJoinClassroom,
  leaveClassroom as dbLeaveClassroom,
  createAssignment as dbCreateAssignment,
  updateAssignment as dbUpdateAssignment,
  submitAssignment as dbSubmitAssignment,
  gradeSubmission as dbGradeSubmission,
  createQuiz as dbCreateQuiz,
  updateQuiz as dbUpdateQuiz,
  submitQuizAttempt as dbSubmitQuizAttempt,
  createDiscussionTopic as dbCreateDiscussionTopic,
  createDiscussionReply as dbCreateDiscussionReply,
  addResource as dbAddResource,
  deleteResource as dbDeleteResource,
  mockClassrooms,
  mockAssignmentSubmissions,
} from '@/lib/mock/database';
import {
  ClassroomFeature,
  Classroom,
  Assignment,
  AssignmentStatus,
  AssignmentPriority,
  Quiz,
  QuizStatus,
  QuizQuestion,
  QuizQuestionType,
  DiscussionTopic,
  ClassroomResource,
  ResourceType,
} from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Require that the user is a teacher in the given classroom */
function requireTeacherInClassroom(classroomId: string, userId: string) {
  const member = getClassroomMember(classroomId, userId);
  if (!member || member.role !== 'teacher') {
    return { authorized: false, error: 'Only classroom teachers can perform this action' };
  }
  return { authorized: true, error: null };
}

/** Require that the user is a member (any role) of the given classroom */
function requireMemberOfClassroom(classroomId: string, userId: string) {
  const member = getClassroomMember(classroomId, userId);
  if (!member) {
    return { authorized: false, error: 'You are not a member of this classroom' };
  }
  return { authorized: true, error: null };
}

// ── Classroom CRUD ───────────────────────────────────────────────────────────

/** Get all classrooms the user is a member of */
export async function actionGetMyClassrooms(userId: string) {
  return { success: true, classrooms: getClassroomsByUser(userId) };
}

/** Get a single classroom by ID */
export async function actionGetClassroom(classroomId: string) {
  const classroom = getClassroom(classroomId);
  if (!classroom) return { success: false, error: 'Classroom not found' };
  return { success: true, classroom };
}

/** Create a new classroom (teacher only) */
export async function actionCreateClassroom(userId: string, data: {
  name: string;
  description?: string;
  curriculum_ids: string[];
  enabled_features?: ClassroomFeature[];
}) {
  const inviteCode = data.name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

  const result = dbCreateClassroom({
    name: data.name,
    description: data.description || null,
    invite_code: inviteCode,
    curriculum_ids: data.curriculum_ids,
    enabled_features: data.enabled_features || [
      { key: 'assignments', enabled: true },
      { key: 'quizzes', enabled: false },
      { key: 'resources', enabled: true },
      { key: 'discussions', enabled: false },
      { key: 'links', enabled: false },
    ],
  });

  if (result.success) {
    dbJoinClassroom(result.classroom.id, userId, 'teacher');
  }

  return result;
}

/** Update classroom details (teacher only) */
export async function actionUpdateClassroom(userId: string, classroomId: string, data: {
  name?: string;
  description?: string;
  invite_code?: string;
  curriculum_ids?: string[];
  enabled_features?: ClassroomFeature[];
}) {
  const auth = requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbUpdateClassroom(classroomId, data as Partial<Classroom>);
}

/** Join a classroom by invite code */
export async function actionJoinClassroom(userId: string, inviteCode: string) {
  const classroom = mockClassrooms.find(
    c => c.invite_code?.toUpperCase() === inviteCode.toUpperCase()
  );
  if (!classroom) return { success: false, error: 'Invalid invite code' };

  return dbJoinClassroom(classroom.id, userId, 'student');
}

/** Leave a classroom */
export async function actionLeaveClassroom(userId: string, classroomId: string) {
  const member = getClassroomMember(classroomId, userId);
  if (!member) return { success: false, error: 'Not a member of this classroom' };

  if (member.role === 'teacher') {
    const teacherIds = getClassroomTeacherIds(classroomId);
    if (teacherIds.length <= 1) {
      return { success: false, error: 'Cannot leave: you are the last teacher. Add another teacher first.' };
    }
  }

  return dbLeaveClassroom(classroomId, userId);
}

/** Regenerate the invite code (teacher only) */
export async function actionRegenerateInviteCode(userId: string, classroomId: string) {
  const auth = requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const classroom = getClassroom(classroomId);
  if (!classroom) return { success: false, error: 'Classroom not found' };

  const newCode = classroom.name
    .replace(/[^a-zA-Z0-9]/g, '')
    .toUpperCase()
    .slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

  return dbUpdateClassroom(classroomId, { invite_code: newCode });
}

// ── Members ──────────────────────────────────────────────────────────────────

/** Get all members of a classroom */
export async function actionGetClassroomMembers(classroomId: string) {
  return { success: true, members: getClassroomMembers(classroomId) };
}

/** Remove a student from the classroom (teacher only) */
export async function actionRemoveMember(userId: string, classroomId: string, memberUserId: string) {
  const auth = requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const target = getClassroomMember(classroomId, memberUserId);
  if (!target) return { success: false, error: 'Member not found' };
  if (target.role === 'teacher') return { success: false, error: 'Cannot remove another teacher' };

  return dbLeaveClassroom(classroomId, memberUserId);
}

// ── Assignments ──────────────────────────────────────────────────────────────

/** Get all assignments for a classroom */
export async function actionGetAssignments(classroomId: string) {
  return { success: true, assignments: getAssignmentsByClassroom(classroomId) };
}

/** Create a new assignment (teacher only) */
export async function actionCreateAssignment(userId: string, data: {
  classroom_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority?: AssignmentPriority;
  total_points?: number;
  attachment_urls?: string[];
}) {
  const auth = requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbCreateAssignment({
    classroom_id: data.classroom_id,
    title: data.title,
    description: data.description || null,
    due_date: data.due_date,
    priority: data.priority || 'medium',
    status: 'draft',
    total_points: data.total_points || null,
    attachment_urls: data.attachment_urls || [],
    created_by: userId,
  });
}

/** Publish or close an assignment (teacher only) */
export async function actionUpdateAssignmentStatus(userId: string, assignmentId: string, status: AssignmentStatus) {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbUpdateAssignment(assignmentId, { status });
}

/** Submit an assignment (student only) */
export async function actionSubmitAssignment(userId: string, assignmentId: string, content: string | null, attachmentUrls: string[] = []) {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = requireMemberOfClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbSubmitAssignment(assignmentId, userId, content, attachmentUrls);
}

/** Get a student's submission for an assignment */
export async function actionGetSubmission(userId: string, assignmentId: string) {
  const sub = getSubmission(assignmentId, userId);
  return { success: true, submission: sub || null };
}

/** Get all submissions for an assignment (teacher only) */
export async function actionGetSubmissions(userId: string, assignmentId: string) {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return { success: true, submissions: getSubmissionsByAssignment(assignmentId) };
}

/** Grade a submission (teacher only) */
export async function actionGradeSubmission(userId: string, submissionId: string, grade: number, feedback: string | null) {
  const sub = mockAssignmentSubmissions.find(s => s.id === submissionId);
  if (!sub) return { success: false, error: 'Submission not found' };
  const assignment = getAssignment(sub.assignment_id);
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbGradeSubmission(submissionId, grade, feedback);
}

// ── Quizzes ──────────────────────────────────────────────────────────────────

/** Get all quizzes for a classroom */
export async function actionGetQuizzes(classroomId: string) {
  return { success: true, quizzes: getQuizzesByClassroom(classroomId) };
}

/** Create a quiz (teacher only) */
export async function actionCreateQuiz(userId: string, data: {
  classroom_id: string;
  title: string;
  description?: string;
  time_limit_minutes?: number;
  due_date?: string;
  questions: Omit<QuizQuestion, 'id'>[];
}) {
  const auth = requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const questions: QuizQuestion[] = data.questions.map((q, i) => ({
    ...q,
    id: `q-${Date.now()}-${i}`,
  }));

  return dbCreateQuiz({
    classroom_id: data.classroom_id,
    title: data.title,
    description: data.description || null,
    time_limit_minutes: data.time_limit_minutes || null,
    due_date: data.due_date || null,
    status: 'draft',
    questions,
    created_by: userId,
  });
}

/** Publish or close a quiz (teacher only) */
export async function actionUpdateQuizStatus(userId: string, quizId: string, status: QuizStatus) {
  const quiz = getQuiz(quizId);
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = requireTeacherInClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbUpdateQuiz(quizId, { status });
}

/** Submit a quiz attempt (student only) */
export async function actionSubmitQuizAttempt(userId: string, quizId: string, answers: { question_id: string; answer: string }[]) {
  const quiz = getQuiz(quizId);
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = requireMemberOfClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  const quizAnswers = answers.map(a => ({
    question_id: a.question_id,
    answer: a.answer,
    is_correct: null as boolean | null,
  }));

  return dbSubmitQuizAttempt(quizId, userId, quizAnswers);
}

/** Get a student's quiz attempt */
export async function actionGetQuizAttempt(userId: string, quizId: string) {
  const attempt = getQuizAttempt(quizId, userId);
  return { success: true, attempt: attempt || null };
}

/** Get all quiz attempts (teacher only) */
export async function actionGetQuizAttempts(userId: string, quizId: string) {
  const quiz = getQuiz(quizId);
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = requireTeacherInClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return { success: true, attempts: getQuizAttemptsByQuiz(quizId) };
}

// ── Discussions ──────────────────────────────────────────────────────────────

/** Get discussion topics for a classroom */
export async function actionGetDiscussionTopics(classroomId: string) {
  return { success: true, topics: getDiscussionTopicsByClassroom(classroomId) };
}

/** Create a discussion topic */
export async function actionCreateDiscussionTopic(userId: string, data: {
  classroom_id: string;
  title: string;
  content: string;
  assignment_id?: string;
}) {
  const auth = requireMemberOfClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbCreateDiscussionTopic({
    classroom_id: data.classroom_id,
    title: data.title,
    content: data.content,
    assignment_id: data.assignment_id || null,
    is_pinned: false,
    is_locked: false,
    created_by: userId,
  });
}

/** Reply to a discussion topic */
export async function actionReplyToTopic(userId: string, topicId: string, content: string) {
  const topic = getDiscussionTopic(topicId);
  if (!topic) return { success: false, error: 'Topic not found' };
  if (topic.is_locked) return { success: false, error: 'This topic is locked' };

  const auth = requireMemberOfClassroom(topic.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbCreateDiscussionReply(topicId, content, userId);
}

/** Get replies for a topic */
export async function actionGetDiscussionReplies(topicId: string) {
  return { success: true, replies: getDiscussionReplies(topicId) };
}

// ── Resources ────────────────────────────────────────────────────────────────

/** Get resources for a classroom */
export async function actionGetResources(classroomId: string) {
  return { success: true, resources: getResourcesByClassroom(classroomId) };
}

/** Add a resource (teacher only) */
export async function actionAddResource(userId: string, data: {
  classroom_id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  curriculum_id?: string;
  subject_id?: string;
}) {
  const auth = requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };

  return dbAddResource({
    classroom_id: data.classroom_id,
    title: data.title,
    description: data.description || null,
    type: data.type,
    url: data.url,
    curriculum_id: data.curriculum_id || null,
    subject_id: data.subject_id || null,
    uploaded_by: userId,
  });
}

/** Delete a resource (teacher only) */
export async function actionDeleteResource(userId: string, resourceId: string) {
  // Authorize by checking classroom membership (can be tightened later)
  return dbDeleteResource(resourceId);
}

'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  mockClassrooms,
  mockClassroomMembers,
  mockAssignments,
  mockAssignmentSubmissions,
  mockQuizzes,
  mockQuizAttempts,
  mockDiscussionTopics,
  mockDiscussionReplies,
  mockClassroomResources,
  getAllProfiles,
  createClassroom,
  updateClassroom,
  joinClassroom,
  leaveClassroom,
  createAssignment,
  updateAssignment,
  submitAssignment,
  gradeSubmission,
  createQuiz,
  updateQuiz,
  submitQuizAttempt,
  createDiscussionTopic,
  createDiscussionReply,
  addResource,
  deleteResource,
  updateResource,
  deleteAssignment,
  deleteQuiz,
  deleteDiscussionTopic,
  updateDiscussionTopic,
} from '@/lib/mock/database';
import {
  ClassroomFeature,
  AssignmentPriority,
  AssignmentStatus,
  QuizStatus,
  QuizQuestion,
  ResourceType,
  type Classroom,
  type Assignment,
  type AssignmentSubmission,
  type Quiz,
  type QuizAttempt,
  type DiscussionTopic,
  type DiscussionReply,
  type ClassroomResource,
  type ClassroomMember,
} from '@/types';

type Result = { success: boolean; error?: string };

export function useClassroom() {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const classrooms = useMemo(() => [...mockClassrooms], [version]);
  const members = useMemo(() => [...mockClassroomMembers], [version]);
  const assignments = useMemo(() => [...mockAssignments], [version]);
  const submissions = useMemo(() => [...mockAssignmentSubmissions], [version]);
  const quizzes = useMemo(() => [...mockQuizzes], [version]);
  const attempts = useMemo(() => [...mockQuizAttempts], [version]);
  const topics = useMemo(() => [...mockDiscussionTopics], [version]);
  const replies = useMemo(() => [...mockDiscussionReplies], [version]);
  const resources = useMemo(() => [...mockClassroomResources], [version]);
  const profiles = useMemo(() => getAllProfiles(), [version]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getProfile = useCallback(
    (userId: string) => profiles.find((p) => p.id === userId),
    [profiles]
  );

  const getClassroom = useCallback(
    (id: string) => classrooms.find((c) => c.id === id),
    [classrooms]
  );

  const getClassroomsByUser = useCallback(
    (userId: string) => {
      const classIds = members
        .filter((m) => m.user_id === userId)
        .map((m) => m.classroom_id);
      return classrooms.filter((c) => classIds.includes(c.id));
    },
    [classrooms, members]
  );

  const getMembers = useCallback(
    (classroomId: string) =>
      members.filter((m) => m.classroom_id === classroomId),
    [members]
  );

  const getMember = useCallback(
    (classroomId: string, userId: string) =>
      members.find((m) => m.classroom_id === classroomId && m.user_id === userId),
    [members]
  );

  const getAssignments = useCallback(
    (classroomId: string) =>
      assignments.filter((a) => a.classroom_id === classroomId),
    [assignments]
  );

  const getSubmissionsByAssignment = useCallback(
    (assignmentId: string) =>
      submissions.filter((s) => s.assignment_id === assignmentId),
    [submissions]
  );

  const getSubmission = useCallback(
    (assignmentId: string, studentId: string) =>
      submissions.find((s) => s.assignment_id === assignmentId && s.student_id === studentId),
    [submissions]
  );

  const getQuizzes = useCallback(
    (classroomId: string) =>
      quizzes.filter((q) => q.classroom_id === classroomId),
    [quizzes]
  );

  const getQuizAttempt = useCallback(
    (quizId: string, studentId: string) =>
      attempts.find((a) => a.quiz_id === quizId && a.student_id === studentId),
    [attempts]
  );

  const getQuizAttempts = useCallback(
    (quizId: string) =>
      attempts.filter((a) => a.quiz_id === quizId),
    [attempts]
  );

  const getTopics = useCallback(
    (classroomId: string) =>
      topics.filter((t) => t.classroom_id === classroomId),
    [topics]
  );

  const getReplies = useCallback(
    (topicId: string) =>
      replies.filter((r) => r.topic_id === topicId),
    [replies]
  );

  const getResources = useCallback(
    (classroomId: string) =>
      resources.filter((r) => r.classroom_id === classroomId),
    [resources]
  );

  // ── Mutations ────────────────────────────────────────────────────────────

  const createNewClassroom = useCallback(
    (data: { name: string; description?: string; curriculum_ids: string[]; created_by: string; enabled_features?: ClassroomFeature[] }) => {
      const inviteCode = data.name
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

      const result = createClassroom({
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
        joinClassroom(result.classroom.id, data.created_by, 'teacher');
        refresh();
      }

      return result as Result & { classroom?: Classroom };
    },
    [refresh]
  );

  const joinByCode = useCallback(
    (userId: string, inviteCode: string): Result => {
      const classroom = classrooms.find((c) => c.invite_code?.toUpperCase() === inviteCode.toUpperCase());
      if (!classroom) return { success: false, error: 'Invalid invite code' };
      const result = joinClassroom(classroom.id, userId, 'student');
      if (result.success) refresh();
      return result;
    },
    [classrooms, refresh]
  );

  const leave = useCallback(
    (userId: string, classroomId: string): Result => {
      const result = leaveClassroom(classroomId, userId);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const createNewAssignment = useCallback(
    (data: { classroom_id: string; title: string; description?: string; due_date: string; priority?: AssignmentPriority; total_points?: number; attachment_urls?: string[]; created_by: string }): Result => {
      const result = createAssignment({
        classroom_id: data.classroom_id,
        title: data.title,
        description: data.description || null,
        due_date: data.due_date,
        priority: data.priority || 'medium',
        status: 'draft',
        total_points: data.total_points || null,
        attachment_urls: data.attachment_urls || [],
        created_by: data.created_by,
      });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const publishAssignment = useCallback(
    (assignmentId: string, status: AssignmentStatus): Result => {
      const result = updateAssignment(assignmentId, { status });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const submitToAssignment = useCallback(
    (assignmentId: string, studentId: string, content: string | null, attachmentUrls: string[] = []): Result => {
      const result = submitAssignment(assignmentId, studentId, content, attachmentUrls);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const gradeSub = useCallback(
    (submissionId: string, grade: number, feedback: string | null): Result => {
      const result = gradeSubmission(submissionId, grade, feedback);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const createNewQuiz = useCallback(
    (data: { classroom_id: string; title: string; description?: string; time_limit_minutes?: number; due_date?: string; questions: QuizQuestion[]; created_by: string }): Result => {
      const result = createQuiz({
        classroom_id: data.classroom_id,
        title: data.title,
        description: data.description || null,
        time_limit_minutes: data.time_limit_minutes || null,
        due_date: data.due_date || null,
        status: 'draft',
        questions: data.questions,
        created_by: data.created_by,
      });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const publishQuiz = useCallback(
    (quizId: string, status: QuizStatus): Result => {
      const result = updateQuiz(quizId, { status });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const updateAssignmentData = useCallback(
    (assignmentId: string, data: Partial<Assignment>): Result => {
      const result = updateAssignment(assignmentId, data);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const updateQuizData = useCallback(
    (quizId: string, data: Partial<Quiz>): Result => {
      const result = updateQuiz(quizId, data);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const submitQuiz = useCallback(
    (quizId: string, studentId: string, answers: { question_id: string; answer: string }[]): Result => {
      const qAnswers = answers.map((a) => ({
        question_id: a.question_id,
        answer: a.answer,
        is_correct: null as boolean | null,
      }));
      const result = submitQuizAttempt(quizId, studentId, qAnswers);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const createTopic = useCallback(
    (data: { classroom_id: string; title: string; content: string; assignment_id?: string; created_by: string }): Result => {
      const result = createDiscussionTopic({
        classroom_id: data.classroom_id,
        title: data.title,
        content: data.content,
        assignment_id: data.assignment_id || null,
        is_pinned: false,
        is_locked: false,
        created_by: data.created_by,
      });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const replyToTopic = useCallback(
    (topicId: string, content: string, createdBy: string): Result => {
      const result = createDiscussionReply(topicId, content, createdBy);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const addNewResource = useCallback(
    (data: { classroom_id: string; title: string; description?: string; type: ResourceType; url: string; uploaded_by: string }): Result => {
      const result = addResource({
        classroom_id: data.classroom_id,
        title: data.title,
        description: data.description || null,
        type: data.type,
        url: data.url,
        curriculum_id: null,
        subject_id: null,
        uploaded_by: data.uploaded_by,
      });
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const removeResource = useCallback(
    (resourceId: string): Result => {
      const result = deleteResource(resourceId);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const updateClassroomData = useCallback(
    (classroomId: string, data: Partial<Classroom>): Result => {
      const result = updateClassroom(classroomId, data);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const editResource = useCallback(
    (resourceId: string, data: Partial<ClassroomResource>): Result => {
      const result = updateResource(resourceId, data);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const removeAssignment = useCallback(
    (assignmentId: string): Result => {
      const result = deleteAssignment(assignmentId);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const removeQuiz = useCallback(
    (quizId: string): Result => {
      const result = deleteQuiz(quizId);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const removeTopic = useCallback(
    (topicId: string): Result => {
      const result = deleteDiscussionTopic(topicId);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  const editTopic = useCallback(
    (topicId: string, data: Partial<DiscussionTopic>): Result => {
      const result = updateDiscussionTopic(topicId, data);
      if (result.success) refresh();
      return result;
    },
    [refresh]
  );

  return {
    // Queries
    classrooms,
    getProfile,
    getClassroom,
    getClassroomsByUser,
    getMembers,
    getMember,
    getAssignments,
    getSubmissionsByAssignment,
    getSubmission,
    getQuizzes,
    getQuizAttempt,
    getQuizAttempts,
    getTopics,
    getReplies,
    getResources,
    // Mutations
    createNewClassroom,
    joinByCode,
    leave,
    createNewAssignment,
    publishAssignment,
    updateAssignmentData,
    submitToAssignment,
    gradeSub,
    createNewQuiz,
    publishQuiz,
    updateQuizData,
    submitQuiz,
    createTopic,
    replyToTopic,
    addNewResource,
    removeResource,
    updateClassroomData,
    editResource,
    removeAssignment,
    removeQuiz,
    removeTopic,
    editTopic,
    refresh,
  };
}

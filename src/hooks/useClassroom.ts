'use client';

import { useCallback, useMemo, useState, useEffect } from 'react';
import {
  ClassroomFeature, AssignmentPriority, AssignmentStatus, QuizStatus, QuizQuestion, ResourceType,
  type Classroom, type Assignment, type AssignmentSubmission, type Quiz, type QuizAttempt,
  type DiscussionTopic, type DiscussionReply, type ClassroomResource, type ClassroomMember,
} from '@/types';
import { createClient } from '@/lib/supabase/client';

type Result = { success: boolean; error?: string };

export function useClassroom() {
  const supabase = createClient();
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const [cRes, pRes] = await Promise.all([
        supabase.from('classrooms').select('*'),
        supabase.from('profiles').select('id, name, username, avatar_url'),
      ]);
      setClassrooms((cRes.data as Classroom[]) ?? []);
      setProfiles(pRes.data ?? []);
    })();
  }, [version, supabase]);

  const getProfile = useCallback(
    (userId: string) => profiles.find((p) => p.id === userId),
    [profiles]
  );

  const getClassroom = useCallback(
    (id: string) => classrooms.find((c) => c.id === id),
    [classrooms]
  );

  const getClassroomsByUser = useCallback(
    async (userId: string) => {
      const { data: members } = await supabase.from('classroom_members').select('classroom_id').eq('user_id', userId);
      const ids = (members ?? []).map((m: any) => m.classroom_id);
      return classrooms.filter((c) => ids.includes(c.id));
    },
    [classrooms, supabase]
  );

  const getMembers = useCallback(
    async (classroomId: string) => {
      const { data } = await supabase.from('classroom_members').select('*, profiles(*)').eq('classroom_id', classroomId);
      return (data as ClassroomMember[]) ?? [];
    },
    [supabase]
  );

  const getMember = useCallback(
    async (classroomId: string, userId: string) => {
      const { data } = await supabase.from('classroom_members').select('*').eq('classroom_id', classroomId).eq('user_id', userId).single();
      return data as ClassroomMember ?? null;
    },
    [supabase]
  );

  const getAssignments = useCallback(
    async (classroomId: string) => {
      const { data } = await supabase.from('assignments').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
      return (data as Assignment[]) ?? [];
    },
    [supabase]
  );

  const getSubmissionsByAssignment = useCallback(
    async (assignmentId: string) => {
      const { data } = await supabase.from('assignment_submissions').select('*, profiles(name)').eq('assignment_id', assignmentId);
      return (data as AssignmentSubmission[]) ?? [];
    },
    [supabase]
  );

  const getSubmission = useCallback(
    async (assignmentId: string, studentId: string) => {
      const { data } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', studentId).single();
      return data as AssignmentSubmission ?? null;
    },
    [supabase]
  );

  const getQuizzes = useCallback(
    async (classroomId: string) => {
      const { data } = await supabase.from('quizzes').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
      return (data as Quiz[]) ?? [];
    },
    [supabase]
  );

  const getQuizAttempt = useCallback(
    async (quizId: string, studentId: string) => {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('student_id', studentId).single();
      return data as QuizAttempt ?? null;
    },
    [supabase]
  );

  const getQuizAttempts = useCallback(
    async (quizId: string) => {
      const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId);
      return (data as QuizAttempt[]) ?? [];
    },
    [supabase]
  );

  const getTopics = useCallback(
    async (classroomId: string) => {
      const { data } = await supabase.from('discussion_topics').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
      return (data as DiscussionTopic[]) ?? [];
    },
    [supabase]
  );

  const getReplies = useCallback(
    async (topicId: string) => {
      const { data } = await supabase.from('discussion_replies').select('*').eq('topic_id', topicId).order('created_at');
      return (data as DiscussionReply[]) ?? [];
    },
    [supabase]
  );

  const getResources = useCallback(
    async (classroomId: string) => {
      const { data } = await supabase.from('classroom_resources').select('*').eq('classroom_id', classroomId);
      return (data as ClassroomResource[]) ?? [];
    },
    [supabase]
  );

  // ── Mutations ──

  const createNewClassroom = useCallback(
    async (data: { name: string; description?: string; curriculum_ids: string[]; created_by: string; enabled_features?: ClassroomFeature[] }) => {
      const inviteCode = data.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

      const { data: classroom, error } = await supabase.from('classrooms').insert({
        name: data.name, description: data.description || null, invite_code: inviteCode,
        curriculum_ids: data.curriculum_ids,
        enabled_features: data.enabled_features || [
          { key: 'assignments', enabled: true }, { key: 'quizzes', enabled: false },
          { key: 'resources', enabled: true }, { key: 'discussions', enabled: false }, { key: 'links', enabled: false },
        ],
      }).select().single();

      if (error) return { success: false, error: error.message };
      if (classroom) {
        await supabase.from('classroom_members').insert({ classroom_id: classroom.id, user_id: data.created_by, role: 'teacher' });
        refresh();
        return { success: true, classroom };
      }
      return { success: false, error: 'Failed to create classroom' };
    },
    [refresh, supabase]
  );

  const joinByCode = useCallback(
    async (userId: string, inviteCode: string): Promise<Result> => {
      const { data: classroom } = await supabase.from('classrooms').select('id, invite_code').ilike('invite_code', inviteCode).single();
      if (!classroom) return { success: false, error: 'Invalid invite code' };
      const { error } = await supabase.from('classroom_members').upsert({ classroom_id: classroom.id, user_id: userId, role: 'student' });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const leave = useCallback(
    async (userId: string, classroomId: string): Promise<Result> => {
      const { error } = await supabase.from('classroom_members').delete().eq('classroom_id', classroomId).eq('user_id', userId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const createNewAssignment = useCallback(
    async (data: { classroom_id: string; title: string; description?: string; due_date: string; priority?: AssignmentPriority; total_points?: number; attachment_urls?: string[]; created_by: string }): Promise<Result> => {
      const { error } = await supabase.from('assignments').insert({
        classroom_id: data.classroom_id, title: data.title, description: data.description || null,
        due_date: data.due_date, priority: data.priority || 'medium', status: 'draft',
        total_points: data.total_points || null, attachment_urls: data.attachment_urls || [], created_by: data.created_by,
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const publishAssignment = useCallback(
    async (assignmentId: string, status: AssignmentStatus): Promise<Result> => {
      const { error } = await supabase.from('assignments').update({ status }).eq('id', assignmentId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const updateAssignmentData = useCallback(
    async (assignmentId: string, data: Partial<Assignment>): Promise<Result> => {
      const { error } = await supabase.from('assignments').update(data).eq('id', assignmentId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const submitToAssignment = useCallback(
    async (assignmentId: string, studentId: string, content: string | null, attachmentUrls: string[] = []): Promise<Result> => {
      const { error } = await supabase.from('assignment_submissions').upsert({
        assignment_id: assignmentId, student_id: studentId, content, attachment_urls: attachmentUrls, submitted_at: new Date().toISOString(),
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const gradeSub = useCallback(
    async (submissionId: string, grade: number, feedback: string | null): Promise<Result> => {
      const { error } = await supabase.from('assignment_submissions').update({ grade, feedback }).eq('id', submissionId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const createNewQuiz = useCallback(
    async (data: { classroom_id: string; title: string; description?: string; time_limit_minutes?: number; due_date?: string; questions: QuizQuestion[]; created_by: string }): Promise<Result> => {
      const { error } = await supabase.from('quizzes').insert({
        classroom_id: data.classroom_id, title: data.title, description: data.description || null,
        time_limit_minutes: data.time_limit_minutes || null, due_date: data.due_date || null,
        status: 'draft', questions: data.questions, created_by: data.created_by,
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const publishQuiz = useCallback(
    async (quizId: string, status: QuizStatus): Promise<Result> => {
      const { error } = await supabase.from('quizzes').update({ status }).eq('id', quizId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const updateQuizData = useCallback(
    async (quizId: string, data: Partial<Quiz>): Promise<Result> => {
      const { error } = await supabase.from('quizzes').update(data).eq('id', quizId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const submitQuiz = useCallback(
    async (quizId: string, studentId: string, answers: { question_id: string; answer: string }[]): Promise<Result> => {
      const qAnswers = answers.map((a) => ({ question_id: a.question_id, answer: a.answer, is_correct: null as boolean | null }));
      const { error } = await supabase.from('quiz_attempts').upsert({
        quiz_id: quizId, student_id: studentId, answers: qAnswers, started_at: new Date().toISOString(), completed_at: new Date().toISOString(),
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const createTopic = useCallback(
    async (data: { classroom_id: string; title: string; content: string; assignment_id?: string; created_by: string }): Promise<Result> => {
      const { error } = await supabase.from('discussion_topics').insert({
        classroom_id: data.classroom_id, title: data.title, content: data.content,
        assignment_id: data.assignment_id || null, is_pinned: false, is_locked: false, created_by: data.created_by,
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const replyToTopic = useCallback(
    async (topicId: string, content: string, createdBy: string): Promise<Result> => {
      const { error } = await supabase.from('discussion_replies').insert({ topic_id: topicId, content, created_by: createdBy });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const addNewResource = useCallback(
    async (data: { classroom_id: string; title: string; description?: string; type: ResourceType; url: string; uploaded_by: string }): Promise<Result> => {
      const { error } = await supabase.from('classroom_resources').insert({
        classroom_id: data.classroom_id, title: data.title, description: data.description || null,
        type: data.type, url: data.url, uploaded_by: data.uploaded_by,
      });
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const removeResource = useCallback(
    async (resourceId: string): Promise<Result> => {
      const { error } = await supabase.from('classroom_resources').delete().eq('id', resourceId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const updateClassroomData = useCallback(
    async (classroomId: string, data: Partial<Classroom>): Promise<Result> => {
      const { error } = await supabase.from('classrooms').update(data).eq('id', classroomId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const editResource = useCallback(
    async (resourceId: string, data: Partial<ClassroomResource>): Promise<Result> => {
      const { error } = await supabase.from('classroom_resources').update(data).eq('id', resourceId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const removeAssignment = useCallback(
    async (assignmentId: string): Promise<Result> => {
      const { error } = await supabase.from('assignments').delete().eq('id', assignmentId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const removeQuiz = useCallback(
    async (quizId: string): Promise<Result> => {
      const { error } = await supabase.from('quizzes').delete().eq('id', quizId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const removeTopic = useCallback(
    async (topicId: string): Promise<Result> => {
      const { error } = await supabase.from('discussion_topics').delete().eq('id', topicId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  const editTopic = useCallback(
    async (topicId: string, data: Partial<DiscussionTopic>): Promise<Result> => {
      const { error } = await supabase.from('discussion_topics').update(data).eq('id', topicId);
      if (!error) refresh();
      return error ? { success: false, error: error.message } : { success: true };
    },
    [refresh, supabase]
  );

  return {
    classrooms,
    getProfile, getClassroom, getClassroomsByUser,
    getMembers, getMember,
    getAssignments, getSubmissionsByAssignment, getSubmission,
    getQuizzes, getQuizAttempt, getQuizAttempts,
    getTopics, getReplies, getResources,
    createNewClassroom, joinByCode, leave,
    createNewAssignment, publishAssignment, updateAssignmentData,
    submitToAssignment, gradeSub,
    createNewQuiz, publishQuiz, updateQuizData, submitQuiz,
    createTopic, replyToTopic,
    addNewResource, removeResource,
    updateClassroomData, editResource,
    removeAssignment, removeQuiz, removeTopic, editTopic,
    refresh,
  };
}

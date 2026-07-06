'use server';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Classroom Server Actions (Supabase)
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/server';
import { ClassroomFeature, AssignmentStatus, AssignmentPriority, QuizStatus, QuizQuestion, ResourceType } from '@/types';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function requireTeacherInClassroom(classroomId: string, userId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase.from('classroom_members').select('role').eq('classroom_id', classroomId).eq('user_id', userId).single();
  if (!member || member.role !== 'teacher') return { authorized: false, error: 'Only classroom teachers can perform this action' };
  return { authorized: true, error: null };
}

async function requireMemberOfClassroom(classroomId: string, userId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase.from('classroom_members').select('id').eq('classroom_id', classroomId).eq('user_id', userId).single();
  if (!member) return { authorized: false, error: 'You are not a member of this classroom' };
  return { authorized: true, error: null };
}

// ── Classroom CRUD ───────────────────────────────────────────────────────────

export async function actionGetMyClassrooms(userId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase.from('classroom_members').select('classroom_id').eq('user_id', userId);
  const ids = (members ?? []).map((m: any) => m.classroom_id);
  if (ids.length === 0) return { success: true, classrooms: [] };
  const { data: classrooms } = await supabase.from('classrooms').select('*').in('id', ids);
  return { success: true, classrooms: classrooms ?? [] };
}

export async function actionGetClassroom(classroomId: string) {
  const supabase = await createClient();
  const { data: classroom, error } = await supabase.from('classrooms').select('*').eq('id', classroomId).single();
  if (error || !classroom) return { success: false, error: 'Classroom not found' };
  return { success: true, classroom };
}

export async function actionCreateClassroom(userId: string, data: {
  name: string; description?: string; curriculum_ids: string[]; enabled_features?: ClassroomFeature[];
}) {
  const supabase = await createClient();
  const inviteCode = data.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');

  const { data: classroom, error } = await supabase.from('classrooms').insert({
    name: data.name, description: data.description || null, invite_code: inviteCode,
    curriculum_ids: data.curriculum_ids,
    enabled_features: data.enabled_features || [
      { key: 'assignments', enabled: true }, { key: 'quizzes', enabled: false },
      { key: 'resources', enabled: true }, { key: 'discussions', enabled: false }, { key: 'links', enabled: false },
    ],
  }).select().single();

  if (error || !classroom) return { success: false, error: error?.message ?? 'Failed to create classroom' };
  await supabase.from('classroom_members').insert({ classroom_id: classroom.id, user_id: userId, role: 'teacher' });
  return { success: true, classroom };
}

export async function actionUpdateClassroom(userId: string, classroomId: string, data: {
  name?: string; description?: string; invite_code?: string; curriculum_ids?: string[]; enabled_features?: ClassroomFeature[];
}) {
  const auth = await requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { error } = await supabase.from('classrooms').update(data).eq('id', classroomId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionJoinClassroom(userId: string, inviteCode: string) {
  const supabase = await createClient();
  const { data: classroom } = await supabase.from('classrooms').select('id').ilike('invite_code', inviteCode).single();
  if (!classroom) return { success: false, error: 'Invalid invite code' };
  const { error } = await supabase.from('classroom_members').upsert({ classroom_id: classroom.id, user_id: userId, role: 'student' });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionLeaveClassroom(userId: string, classroomId: string) {
  const supabase = await createClient();
  const { data: member } = await supabase.from('classroom_members').select('role').eq('classroom_id', classroomId).eq('user_id', userId).single();
  if (!member) return { success: false, error: 'Not a member of this classroom' };
  if (member.role === 'teacher') {
    const { count } = await supabase.from('classroom_members').select('*', { count: 'exact', head: true }).eq('classroom_id', classroomId).eq('role', 'teacher');
    if ((count ?? 0) <= 1) return { success: false, error: 'Cannot leave: you are the last teacher.' };
  }
  const { error } = await supabase.from('classroom_members').delete().eq('classroom_id', classroomId).eq('user_id', userId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionRegenerateInviteCode(userId: string, classroomId: string) {
  const auth = await requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { data: classroom } = await supabase.from('classrooms').select('name').eq('id', classroomId).single();
  if (!classroom) return { success: false, error: 'Classroom not found' };
  const newCode = classroom.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) + Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const { error } = await supabase.from('classrooms').update({ invite_code: newCode }).eq('id', classroomId);
  return error ? { success: false, error: error.message } : { success: true };
}

// ── Members ──────────────────────────────────────────────────────────────────

export async function actionGetClassroomMembers(classroomId: string) {
  const supabase = await createClient();
  const { data: members } = await supabase.from('classroom_members').select('*, profiles(*)').eq('classroom_id', classroomId);
  return { success: true, members: members ?? [] };
}

export async function actionRemoveMember(userId: string, classroomId: string, memberUserId: string) {
  const auth = await requireTeacherInClassroom(classroomId, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { data: target } = await supabase.from('classroom_members').select('role').eq('classroom_id', classroomId).eq('user_id', memberUserId).single();
  if (!target) return { success: false, error: 'Member not found' };
  if (target.role === 'teacher') return { success: false, error: 'Cannot remove another teacher' };
  const { error } = await supabase.from('classroom_members').delete().eq('classroom_id', classroomId).eq('user_id', memberUserId);
  return error ? { success: false, error: error.message } : { success: true };
}

// ── Assignments ──────────────────────────────────────────────────────────────

export async function actionGetAssignments(classroomId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('assignments').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
  return { success: true, assignments: data ?? [] };
}

export async function actionCreateAssignment(userId: string, data: {
  classroom_id: string; title: string; description?: string; due_date: string;
  priority?: AssignmentPriority; total_points?: number; attachment_urls?: string[];
}) {
  const auth = await requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { data: assignment, error } = await supabase.from('assignments').insert({
    classroom_id: data.classroom_id, title: data.title, description: data.description || null,
    due_date: data.due_date, priority: data.priority || 'medium', status: 'draft',
    total_points: data.total_points || null, attachment_urls: data.attachment_urls || [], created_by: userId,
  }).select().single();
  if (error || !assignment) return { success: false, error: error?.message ?? 'Failed to create assignment' };
  return { success: true, assignment };
}

export async function actionUpdateAssignmentStatus(userId: string, assignmentId: string, status: AssignmentStatus) {
  const supabase = await createClient();
  const { data: assignment } = await supabase.from('assignments').select('classroom_id').eq('id', assignmentId).single();
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = await requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { error } = await supabase.from('assignments').update({ status }).eq('id', assignmentId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionSubmitAssignment(userId: string, assignmentId: string, content: string | null, attachmentUrls: string[] = []) {
  const supabase = await createClient();
  const { data: assignment } = await supabase.from('assignments').select('classroom_id').eq('id', assignmentId).single();
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = await requireMemberOfClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { error } = await supabase.from('assignment_submissions').upsert({ assignment_id: assignmentId, student_id: userId, content, attachment_urls: attachmentUrls, submitted_at: new Date().toISOString() });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionGetSubmission(userId: string, assignmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('assignment_submissions').select('*').eq('assignment_id', assignmentId).eq('student_id', userId).single();
  return { success: true, submission: data || null };
}

export async function actionGetSubmissions(userId: string, assignmentId: string) {
  const supabase = await createClient();
  const { data: assignment } = await supabase.from('assignments').select('classroom_id').eq('id', assignmentId).single();
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = await requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { data } = await supabase.from('assignment_submissions').select('*, profiles(name)').eq('assignment_id', assignmentId);
  return { success: true, submissions: data ?? [] };
}

export async function actionGradeSubmission(userId: string, submissionId: string, grade: number, feedback: string | null) {
  const supabase = await createClient();
  const { data: sub } = await supabase.from('assignment_submissions').select('assignment_id').eq('id', submissionId).single();
  if (!sub) return { success: false, error: 'Submission not found' };
  const { data: assignment } = await supabase.from('assignments').select('classroom_id').eq('id', sub.assignment_id).single();
  if (!assignment) return { success: false, error: 'Assignment not found' };
  const auth = await requireTeacherInClassroom(assignment.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { error } = await supabase.from('assignment_submissions').update({ grade, feedback }).eq('id', submissionId);
  return error ? { success: false, error: error.message } : { success: true };
}

// ── Quizzes ──────────────────────────────────────────────────────────────────

export async function actionGetQuizzes(classroomId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('quizzes').select('*').eq('classroom_id', classroomId);
  return { success: true, quizzes: data ?? [] };
}

export async function actionCreateQuiz(userId: string, data: { classroom_id: string; title: string; description?: string; time_limit_minutes?: number; due_date?: string; questions: Omit<QuizQuestion, 'id'>[] }) {
  const auth = await requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const questions: QuizQuestion[] = data.questions.map((q, i) => ({ ...q, id: `q-${Date.now()}-${i}` }));
  const { data: quiz, error } = await supabase.from('quizzes').insert({
    classroom_id: data.classroom_id, title: data.title, description: data.description || null,
    time_limit_minutes: data.time_limit_minutes || null, due_date: data.due_date || null,
    status: 'draft', questions, created_by: userId,
  }).select().single();
  if (error || !quiz) return { success: false, error: error?.message ?? 'Failed to create quiz' };
  return { success: true, quiz };
}

export async function actionUpdateQuizStatus(userId: string, quizId: string, status: QuizStatus) {
  const supabase = await createClient();
  const { data: quiz } = await supabase.from('quizzes').select('classroom_id').eq('id', quizId).single();
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = await requireTeacherInClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { error } = await supabase.from('quizzes').update({ status }).eq('id', quizId);
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionSubmitQuizAttempt(userId: string, quizId: string, answers: { question_id: string; answer: string }[]) {
  const supabase = await createClient();
  const { data: quiz } = await supabase.from('quizzes').select('classroom_id').eq('id', quizId).single();
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = await requireMemberOfClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const qAnswers = answers.map(a => ({ question_id: a.question_id, answer: a.answer, is_correct: null as boolean | null }));
  const { error } = await supabase.from('quiz_attempts').upsert({ quiz_id: quizId, student_id: userId, answers: qAnswers, started_at: new Date().toISOString(), completed_at: new Date().toISOString() });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionGetQuizAttempt(userId: string, quizId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId).eq('student_id', userId).single();
  return { success: true, attempt: data || null };
}

export async function actionGetQuizAttempts(userId: string, quizId: string) {
  const supabase = await createClient();
  const { data: quiz } = await supabase.from('quizzes').select('classroom_id').eq('id', quizId).single();
  if (!quiz) return { success: false, error: 'Quiz not found' };
  const auth = await requireTeacherInClassroom(quiz.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { data } = await supabase.from('quiz_attempts').select('*').eq('quiz_id', quizId);
  return { success: true, attempts: data ?? [] };
}

// ── Discussions ──────────────────────────────────────────────────────────────

export async function actionGetDiscussionTopics(classroomId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('discussion_topics').select('*').eq('classroom_id', classroomId).order('created_at', { ascending: false });
  return { success: true, topics: data ?? [] };
}

export async function actionCreateDiscussionTopic(userId: string, data: { classroom_id: string; title: string; content: string; assignment_id?: string }) {
  const auth = await requireMemberOfClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { error } = await supabase.from('discussion_topics').insert({
    classroom_id: data.classroom_id, title: data.title, content: data.content,
    assignment_id: data.assignment_id || null, is_pinned: false, is_locked: false, created_by: userId,
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionReplyToTopic(userId: string, topicId: string, content: string) {
  const supabase = await createClient();
  const { data: topic } = await supabase.from('discussion_topics').select('classroom_id, is_locked').eq('id', topicId).single();
  if (!topic) return { success: false, error: 'Topic not found' };
  if (topic.is_locked) return { success: false, error: 'This topic is locked' };
  const auth = await requireMemberOfClassroom(topic.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const { error } = await supabase.from('discussion_replies').insert({ topic_id: topicId, content, created_by: userId });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionGetDiscussionReplies(topicId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('discussion_replies').select('*').eq('topic_id', topicId).order('created_at');
  return { success: true, replies: data ?? [] };
}

// ── Resources ────────────────────────────────────────────────────────────────

export async function actionGetResources(classroomId: string) {
  const supabase = await createClient();
  const { data } = await supabase.from('classroom_resources').select('*').eq('classroom_id', classroomId);
  return { success: true, resources: data ?? [] };
}

export async function actionAddResource(userId: string, data: { classroom_id: string; title: string; description?: string; type: ResourceType; url: string }) {
  const auth = await requireTeacherInClassroom(data.classroom_id, userId);
  if (!auth.authorized) return { success: false, error: auth.error };
  const supabase = await createClient();
  const { error } = await supabase.from('classroom_resources').insert({
    classroom_id: data.classroom_id, title: data.title, description: data.description || null,
    type: data.type, url: data.url, uploaded_by: userId,
  });
  return error ? { success: false, error: error.message } : { success: true };
}

export async function actionDeleteResource(userId: string, resourceId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from('classroom_resources').delete().eq('id', resourceId);
  return error ? { success: false, error: error.message } : { success: true };
}

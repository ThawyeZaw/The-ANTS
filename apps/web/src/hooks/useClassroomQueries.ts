'use client';

// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — TanStack Query Hooks for Classrooms
// Query + Mutation hooks replacing the legacy useClassroom version/useEffect
// pattern for all non-quiz classroom operations.
// ──────────────────────────────────────────────────────────────────────────────

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { createClient } from '@/lib/supabase/client';
import type {
  Classroom,
  ClassroomMember,
  Assignment,
  AssignmentSubmission,
  DiscussionTopic,
  DiscussionReply,
  ClassroomResource,
  AssignmentPriority,
  ResourceType,
} from '@/types';

// ── Query Hooks ──────────────────────────────────────────────────────────────

/** Fetches all classrooms and their creator profiles in parallel. */
export function useClassroomList() {
  return useQuery({
    queryKey: queryKeys.classrooms.all,
    queryFn: async () => {
      const supabase = createClient();
      const [cRes, pRes] = await Promise.all([
        supabase.from('classrooms').select('*'),
        supabase.from('profiles').select('id, name, username, avatar_url'),
      ]);
      if (cRes.error) throw new Error(cRes.error.message);
      if (pRes.error) throw new Error(pRes.error.message);
      return {
        classrooms: (cRes.data as unknown as Classroom[]) ?? [],
        profiles: pRes.data ?? [],
      };
    },
  });
}

/** Fetches a single classroom by id. Enabled only when `id` is truthy. */
export function useClassroomDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.classrooms.byId(id),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase.from('classrooms').select('*').eq('id', id).single();
      if (error) throw new Error(error.message);
      return data as unknown as Classroom;
    },
    enabled: !!id,
  });
}

/** Fetches assignments for a classroom. */
export function useAssignments(classroomId: string) {
  return useQuery({
    queryKey: queryKeys.classrooms.assignments(classroomId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as unknown as Assignment[]) ?? [];
    },
    enabled: !!classroomId,
  });
}

/** Fetches discussion topics for a classroom. */
export function useDiscussionTopics(classroomId: string) {
  return useQuery({
    queryKey: queryKeys.classrooms.discussions(classroomId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('discussion_topics')
        .select('*')
        .eq('classroom_id', classroomId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data as DiscussionTopic[]) ?? [];
    },
    enabled: !!classroomId,
  });
}

/** Fetches resources for a classroom. */
export function useClassroomResources(classroomId: string) {
  return useQuery({
    queryKey: queryKeys.classrooms.resources(classroomId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('classroom_resources')
        .select('*')
        .eq('classroom_id', classroomId);
      if (error) throw new Error(error.message);
      return (data as unknown as ClassroomResource[]) ?? [];
    },
    enabled: !!classroomId,
  });
}

/** Fetches members (with profile data) for a classroom. */
export function useClassroomMembers(classroomId: string) {
  return useQuery({
    queryKey: queryKeys.classrooms.members(classroomId),
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('classroom_members')
        .select('*, profiles(*)')
        .eq('classroom_id', classroomId);
      if (error) throw new Error(error.message);
      return (data as unknown as ClassroomMember[]) ?? [];
    },
    enabled: !!classroomId,
  });
}

// ── Mutation Hooks ───────────────────────────────────────────────────────────

interface CreateClassroomInput {
  name: string;
  description?: string;
  curriculum_ids: string[];
  created_by: string;
  enabled_features?: { key: string; enabled: boolean }[];
}

/** Creates a new classroom, adds the creator as a teacher, and invalidates the classroom list cache. */
export function useCreateClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateClassroomInput) => {
      const supabase = createClient();
      const inviteCode =
        input.name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4) +
        Math.floor(Math.random() * 100).toString().padStart(2, '0');

      const { data: classroom, error } = await supabase
        .from('classrooms')
        .insert({
          name: input.name,
          description: input.description ?? null,
          invite_code: inviteCode,
          curriculum_ids: input.curriculum_ids,
          created_by: input.created_by,
          enabled_features: input.enabled_features ?? [
            { key: 'assignments', enabled: true },
            { key: 'quizzes', enabled: false },
            { key: 'resources', enabled: true },
            { key: 'discussions', enabled: false },
            { key: 'links', enabled: false },
          ],
        } as any)
        .select()
        .single();

      if (error) throw new Error(error.message);
      if (!classroom) throw new Error('Failed to create classroom');

      const { error: memberError } = await supabase
        .from('classroom_members')
        .insert({ classroom_id: classroom.id, user_id: input.created_by, role: 'teacher' });

      if (memberError) throw new Error(memberError.message);

      return classroom as unknown as Classroom;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.all });
    },
  });
}

interface JoinClassroomInput {
  userId: string;
  inviteCode: string;
}

/** Joins a classroom via invite code. Invalidates the classroom list and members cache. */
export function useJoinClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, inviteCode }: JoinClassroomInput) => {
      const supabase = createClient();
      const { data: classroom, error: findError } = await supabase
        .from('classrooms')
        .select('id, invite_code')
        .ilike('invite_code', inviteCode)
        .single();

      if (findError || !classroom) throw new Error('Invalid invite code');

      const { error } = await supabase
        .from('classroom_members')
        .upsert({ classroom_id: classroom.id, user_id: userId, role: 'student' });

      if (error) throw new Error(error.message);

      return classroom;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.members(_data.id) });
    },
  });
}

interface LeaveClassroomInput {
  userId: string;
  classroomId: string;
}

/** Leaves a classroom. Invalidates the members cache for that classroom. */
export function useLeaveClassroom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, classroomId }: LeaveClassroomInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('classroom_members')
        .delete()
        .eq('classroom_id', classroomId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.members(variables.classroomId) });
    },
  });
}

interface CreateAssignmentInput {
  classroom_id: string;
  title: string;
  description?: string;
  due_date: string;
  priority?: AssignmentPriority;
  total_points?: number;
  attachment_urls?: string[];
  created_by: string;
}

/** Creates a new assignment. Invalidates the assignments cache. */
export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('assignments').insert({
        classroom_id: input.classroom_id,
        title: input.title,
        description: input.description ?? null,
        due_date: input.due_date,
        priority: input.priority ?? 'medium',
        status: 'draft',
        total_points: input.total_points ?? null,
        attachment_urls: input.attachment_urls ?? [],
        created_by: input.created_by,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.assignments(variables.classroom_id) });
    },
  });
}

interface SubmitAssignmentInput {
  assignmentId: string;
  studentId: string;
  content: string | null;
  attachmentUrls?: string[];
}

/** Submits (or updates) an assignment submission. Invalidates the assignments cache. */
export function useSubmitAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ assignmentId, studentId, content, attachmentUrls = [] }: SubmitAssignmentInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('assignment_submissions').upsert({
        assignment_id: assignmentId,
        student_id: studentId,
        content,
        attachment_urls: attachmentUrls,
        submitted_at: new Date().toISOString(),
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      // We invalidate assignments so the detail query picks up submission changes
      queryClient.invalidateQueries({
        queryKey: queryKeys.classrooms.assignments(variables.assignmentId),
      });
    },
  });
}

interface GradeSubmissionInput {
  submissionId: string;
  classroomId: string;
  grade: number;
  feedback: string | null;
}

/** Grades a submission. Invalidates the assignments cache for the classroom. */
export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, grade, feedback }: GradeSubmissionInput) => {
      const supabase = createClient();
      const { error } = await supabase
        .from('assignment_submissions')
        .update({ grade, feedback })
        .eq('id', submissionId);

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.classrooms.assignments(variables.classroomId),
      });
    },
  });
}

interface CreateTopicInput {
  classroom_id: string;
  title: string;
  content: string;
  assignment_id?: string;
  created_by: string;
}

/** Creates a new discussion topic. Invalidates the discussions cache. */
export function useCreateTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateTopicInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('discussion_topics').insert({
        classroom_id: input.classroom_id,
        title: input.title,
        content: input.content,
        assignment_id: input.assignment_id ?? null,
        is_pinned: false,
        is_locked: false,
        created_by: input.created_by,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.discussions(variables.classroom_id) });
    },
  });
}

interface ReplyToTopicInput {
  topicId: string;
  classroomId: string;
  content: string;
  createdBy: string;
}

/** Replies to a discussion topic. Invalidates the discussions cache. */
export function useReplyToTopic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ topicId, content, createdBy }: ReplyToTopicInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('discussion_replies').insert({
        topic_id: topicId,
        content,
        created_by: createdBy,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.discussions(variables.classroomId) });
    },
  });
}

interface AddResourceInput {
  classroom_id: string;
  title: string;
  description?: string;
  type: ResourceType;
  url: string;
  uploaded_by: string;
}

/** Adds a resource to a classroom. Invalidates the resources cache. */
export function useAddResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddResourceInput) => {
      const supabase = createClient();
      const { error } = await supabase.from('classroom_resources').insert({
        classroom_id: input.classroom_id,
        title: input.title,
        description: input.description ?? null,
        type: input.type,
        url: input.url,
        uploaded_by: input.uploaded_by,
      });

      if (error) throw new Error(error.message);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.resources(variables.classroom_id) });
    },
  });
}

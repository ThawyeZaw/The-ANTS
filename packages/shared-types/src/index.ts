import { z } from 'zod';

export type UserRole = 'student' | 'tutor' | 'contributor' | 'admin' | 'teacher' | 'main_contributor';

export interface ProfileDTO {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar_url?: string | null;
  role: UserRole;
  roles: UserRole[];
  bio?: string | null;
  title?: string | null;
  is_public?: boolean | null;
  timezone?: string | null;
  telegram_chat_id?: string | null;
  created_at?: string | null;
}

export interface TimetableEventDTO {
  id: string;
  user_id: string;
  title: string;
  event_type?: string | null;
  start_time: string;
  end_time: string;
  all_day?: boolean | null;
  is_recurring?: boolean | null;
  recurrence_pattern?: Record<string, any> | null;
  color_code?: string | null;
  metadata?: Record<string, any> | null;
  created_at?: string | null;
  is_virtual?: boolean;
  source_type?: 'timetable' | 'exam' | 'assignment';
}

export interface FlashcardDeckDTO {
  id: string;
  owner_id: string;
  name: string;
  description?: string | null;
  is_public?: boolean | null;
  card_count?: number | null;
  tags?: string[] | null;
  exam_board?: string | null;
  exam_series?: string | null;
  exam_paper?: string | null;
  syllabus_code?: string | null;
  library_status?: string | null;
  share_token?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface FlashcardDTO {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  order_index?: number | null;
  image_url?: string | null;
}

export interface NoteDTO {
  id: string;
  title: string;
  summary?: string | null;
  curriculum_id?: string | null;
  subject_id?: string | null;
  topic_id?: string | null;
  syllabus_point?: string | null;
  is_syllabus_based?: boolean | null;
  tags?: string[] | null;
  blocks: any[];
  contributor_id?: string | null;
  status?: string | null;
  visibility?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface UserNoteDTO {
  id: string;
  user_id: string;
  title: string;
  content?: string | null;
  blocks: any[];
  tags?: string[] | null;
  color?: string | null;
  is_pinned?: boolean | null;
  topic_id?: string | null;
  subject_id?: string | null;
  curriculum_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

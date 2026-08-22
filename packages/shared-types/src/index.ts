import { z } from 'zod';

export type UserRole = 'student' | 'teacher' | 'contributor' | 'main_contributor';

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
  source_type?: 'timetable' | 'exam' | 'assignment' | 'club_event' | 'club_milestone';
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

export interface ClassroomDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  teacher_id: string;
  is_archived?: boolean | null;
  created_at?: string | null;
}

export interface ClubDTO {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_url?: string | null;
  banner_url?: string | null;
  is_public?: boolean | null;
  join_mode?: string | null;
  owner_id: string;
  enabled_features?: Record<string, boolean> | null;
  created_at?: string | null;
}

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

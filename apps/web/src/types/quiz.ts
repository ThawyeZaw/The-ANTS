// ── Quiz Type Definitions (Standalone) ─────────────────────────────────

export type QuizQuestionType = 'multiple_choice' | 'true_false' | 'short_answer';
export type QuizStatus = 'draft' | 'published' | 'archived';
export type QuizVisibility = 'public' | 'private';
export type QuizSessionStatus = 'waiting' | 'active' | 'finished';
export type QuizReviewStatus = 'pending_review' | 'approved' | 'rejected';

export interface QuizStandaloneQuestion {
  id: string;
  type: QuizQuestionType;
  question_text: string;
  options: string[] | null;
  correct_answer: string;
  points: number;
  order: number;
}

export interface QuizStandaloneBase {
  id: string;
  title: string;
  description: string | null;
  questions: QuizStandaloneQuestion[];
  created_by: string;
  is_public: boolean;
  status: QuizStatus;
  curriculum_id: string | null;
  difficulty: string | null;
  time_limit_minutes: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizStandaloneUser extends QuizStandaloneBase {
  // For user-created quizzes
  share_code: string | null;
}

export interface QuizStandaloneOfficial extends QuizStandaloneBase {
  // For official (contributor) quizzes in the Library
  review_status: QuizReviewStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
}

export interface QuizSession {
  id: string;
  quiz_id: string;
  host_id: string;
  join_code: string;
  status: QuizSessionStatus;
  current_question_index: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface QuizSessionParticipant {
  id: string;
  session_id: string;
  user_id: string;
  display_name: string;
  answers: QuizSessionAnswer[];
  score: number;
  joined_at: string;
}

export interface QuizSessionAnswer {
  question_id: string;
  answer: string;
  is_correct: boolean | null;
  answered_at: string;
}

export interface QuizAttemptStandalone {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: { question_id: string; answer: string; is_correct: boolean | null }[];
  score: number | null;
  total_points: number;
  started_at: string;
  submitted_at: string | null;
}

-- ============================================================================
-- The ANTS — Migration 10: Database Indexes
-- Performance-critical composite, partial, and foreign key indexes (spec.md Section 26).
-- ============================================================================

-- 1. COMPOSITE INDEXES
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom_user ON public.classroom_members (classroom_id, user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom_status ON public.assignments (classroom_id, status);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_user ON public.assignment_submissions (assignment_id, student_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_user ON public.quiz_attempts (quiz_id, student_id);
CREATE INDEX IF NOT EXISTS idx_club_members_club_user ON public.club_members (club_id, user_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_club_created ON public.club_messages (club_id, created_at);
CREATE INDEX IF NOT EXISTS idx_club_join_requests_club ON public.club_join_requests (club_id, status);
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_next_review ON public.card_reviews (user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_cards_deck_order ON public.cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_decks_user_public ON public.decks (owner_id, is_public);
CREATE INDEX IF NOT EXISTS idx_topic_progress_user_topic ON public.topic_progress (user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculums_user ON public.user_curriculums (user_id, curriculum_id);
CREATE INDEX IF NOT EXISTS idx_exam_countdowns_user ON public.exam_countdowns (user_id, target_date);
CREATE INDEX IF NOT EXISTS idx_grade_entries_user ON public.grade_entries (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_notes_user_status ON public.notes (contributor_id, status);
CREATE INDEX IF NOT EXISTS idx_user_saved_notes_user ON public.user_saved_notes (user_id, note_id);
CREATE INDEX IF NOT EXISTS idx_editor_submissions_status ON public.editor_submissions (status, submitted_at);
CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_status ON public.role_upgrade_requests (status, created_at);
CREATE INDEX IF NOT EXISTS idx_review_queue_status ON public.review_queue (status, submitted_at);

-- 2. PARTIAL INDEXES
CREATE INDEX IF NOT EXISTS idx_notes_public_published ON public.notes (created_at) WHERE visibility = 'public' AND status = 'approved';
CREATE INDEX IF NOT EXISTS idx_decks_public_active ON public.decks (created_at) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_editor_submissions_reviewable ON public.editor_submissions (submitted_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_clubs_public_active ON public.clubs (created_at) WHERE is_showcase = true;
CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_pending ON public.role_upgrade_requests (created_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_review_queue_pending ON public.review_queue (submitted_at) WHERE status = 'pending';

-- 3. FOREIGN KEY INDEXES
CREATE INDEX IF NOT EXISTS idx_classrooms_creator ON public.classrooms (created_by);
CREATE INDEX IF NOT EXISTS idx_classroom_members_classroom ON public.classroom_members (classroom_id);
CREATE INDEX IF NOT EXISTS idx_assignments_classroom ON public.assignments (classroom_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_classroom ON public.quizzes (classroom_id);
CREATE INDEX IF NOT EXISTS idx_discussion_topics_classroom ON public.discussion_topics (classroom_id);
CREATE INDEX IF NOT EXISTS idx_clubs_creator ON public.clubs (created_by);
CREATE INDEX IF NOT EXISTS idx_club_members_club ON public.club_members (club_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_club ON public.club_messages (club_id);
CREATE INDEX IF NOT EXISTS idx_club_messages_sender ON public.club_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_decks_creator ON public.decks (owner_id);
CREATE INDEX IF NOT EXISTS idx_cards_deck ON public.cards (deck_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_card ON public.card_reviews (card_id);
CREATE INDEX IF NOT EXISTS idx_notes_creator ON public.notes (contributor_id);
CREATE INDEX IF NOT EXISTS idx_user_saved_notes_note ON public.user_saved_notes (note_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject ON public.exams (subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_curriculum ON public.exams (curriculum_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_user ON public.exam_schedules (user_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam ON public.exam_schedules (exam_id);
CREATE INDEX IF NOT EXISTS idx_grade_boundaries_exam ON public.grade_boundaries (exam_id);
CREATE INDEX IF NOT EXISTS idx_editor_submissions_contributor ON public.editor_submissions (contributor_id);
CREATE INDEX IF NOT EXISTS idx_review_queue_contributor ON public.review_queue (contributor_id);
CREATE INDEX IF NOT EXISTS idx_role_upgrade_requests_user ON public.role_upgrade_requests (user_id);
CREATE INDEX IF NOT EXISTS idx_curriculums_created_by ON public.curriculums (created_by);
CREATE INDEX IF NOT EXISTS idx_subjects_curriculum ON public.subjects (curriculum_id);
CREATE INDEX IF NOT EXISTS idx_topics_subject ON public.topics (subject_id);
CREATE INDEX IF NOT EXISTS idx_user_curriculums_curriculum ON public.user_curriculums (curriculum_id);
CREATE INDEX IF NOT EXISTS idx_topic_progress_topic ON public.topic_progress (topic_id);
CREATE INDEX IF NOT EXISTS idx_resources_curriculum ON public.resources (curriculum_id);
CREATE INDEX IF NOT EXISTS idx_certifications_user ON public.certifications (user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_events_user ON public.timetable_events (user_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_user ON public.pomodoro_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_enrollments_user ON public.user_enrollments (user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_overrides_user ON public.user_exam_overrides (user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_history_user ON public.user_exam_history (user_id);
CREATE INDEX IF NOT EXISTS idx_club_curriculums_club ON public.club_curriculums (club_id);
CREATE INDEX IF NOT EXISTS idx_club_subjects_club ON public.club_subjects (club_id);
CREATE INDEX IF NOT EXISTS idx_club_projects_club ON public.club_projects (club_id);
CREATE INDEX IF NOT EXISTS idx_club_events_club ON public.club_events (club_id);
CREATE INDEX IF NOT EXISTS idx_club_milestones_club ON public.club_milestones (club_id);
CREATE INDEX IF NOT EXISTS idx_club_member_contributions_club ON public.club_member_contributions (club_id);
CREATE INDEX IF NOT EXISTS idx_club_member_contributions_user ON public.club_member_contributions (user_id);

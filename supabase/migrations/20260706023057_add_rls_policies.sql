-- ============================================================================
-- The ANTS — Migration 9: RLS Policies
-- Row-Level Security policies for all tables (spec.md Section 25).
-- All policies use DROP IF EXISTS first for idempotent re-runs.
-- ============================================================================

-- 1. ENABLE RLS ON ALL TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.editor_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_curriculums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_member_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pomodoro_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_countdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exam_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_exam_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_upgrade_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_notes ENABLE ROW LEVEL SECURITY;

-- 2. PROFILES & EXTENDED PROFILES

DROP POLICY IF EXISTS profiles_owner_select ON public.profiles;
CREATE POLICY profiles_owner_select ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS profiles_owner_insert ON public.profiles;
CREATE POLICY profiles_owner_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS profiles_owner_update ON public.profiles;
CREATE POLICY profiles_owner_update ON public.profiles FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS profiles_admin_role_update ON public.profiles;
CREATE POLICY profiles_admin_role_update ON public.profiles FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'main_contributor'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'main_contributor'));
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_public_read ON public.profiles FOR SELECT TO anon USING (is_public = true);

-- Role-change guard: only main_contributors can update the role column
CREATE OR REPLACE FUNCTION public.check_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role
       AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'main_contributor')
    THEN
        RAISE EXCEPTION 'Only main_contributors can change user roles';
    END IF;
    RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS check_role_update_profiles ON public.profiles;
CREATE TRIGGER check_role_update_profiles
    BEFORE UPDATE OF role ON public.profiles
    FOR EACH ROW
    WHEN (OLD.role IS DISTINCT FROM NEW.role)
    EXECUTE FUNCTION public.check_role_update();

DROP POLICY IF EXISTS student_profiles_owner_all ON public.student_profiles;
CREATE POLICY student_profiles_owner_all ON public.student_profiles FOR ALL TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS teacher_profiles_owner_all ON public.teacher_profiles;
CREATE POLICY teacher_profiles_owner_all ON public.teacher_profiles FOR ALL TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS contributor_profiles_owner_all ON public.contributor_profiles;
CREATE POLICY contributor_profiles_owner_all ON public.contributor_profiles FOR ALL TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS contributor_profiles_public_read ON public.contributor_profiles;
CREATE POLICY contributor_profiles_public_read ON public.contributor_profiles FOR SELECT TO anon, authenticated USING (true);

-- 3. CURRICULUM HIERARCHY

DROP POLICY IF EXISTS curriculums_contributor_all ON public.curriculums;
CREATE POLICY curriculums_contributor_all ON public.curriculums FOR ALL TO authenticated USING (auth.uid() = created_by);
DROP POLICY IF EXISTS curriculums_public_select ON public.curriculums;
CREATE POLICY curriculums_public_select ON public.curriculums FOR SELECT TO anon, authenticated USING (status = 'published' AND is_public = true);

DROP POLICY IF EXISTS subjects_contributor_all ON public.subjects;
CREATE POLICY subjects_contributor_all ON public.subjects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.curriculums WHERE curriculums.id = subjects.curriculum_id AND curriculums.created_by = auth.uid()));
DROP POLICY IF EXISTS subjects_public_select ON public.subjects;
CREATE POLICY subjects_public_select ON public.subjects FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.curriculums WHERE curriculums.id = subjects.curriculum_id AND curriculums.status = 'published' AND curriculums.is_public = true));

DROP POLICY IF EXISTS topics_contributor_all ON public.topics;
CREATE POLICY topics_contributor_all ON public.topics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.subjects JOIN public.curriculums ON curriculums.id = subjects.curriculum_id WHERE subjects.id = topics.subject_id AND curriculums.created_by = auth.uid()));
DROP POLICY IF EXISTS topics_public_select ON public.topics;
CREATE POLICY topics_public_select ON public.topics FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.subjects JOIN public.curriculums ON curriculums.id = subjects.curriculum_id WHERE subjects.id = topics.subject_id AND curriculums.status = 'published' AND curriculums.is_public = true));

-- 4. USER CURRICULUM TRACKING

DROP POLICY IF EXISTS user_curriculums_owner_all ON public.user_curriculums;
CREATE POLICY user_curriculums_owner_all ON public.user_curriculums FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS topic_progress_owner_all ON public.topic_progress;
CREATE POLICY topic_progress_owner_all ON public.topic_progress FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 5. RESOURCES & EDITOR SUBMISSIONS

DROP POLICY IF EXISTS resources_contributor_all ON public.resources;
CREATE POLICY resources_contributor_all ON public.resources FOR ALL TO authenticated USING (auth.uid() = contributor_id);
DROP POLICY IF EXISTS resources_public_select ON public.resources;
CREATE POLICY resources_public_select ON public.resources FOR SELECT TO anon, authenticated USING (is_public = true AND status = 'published');

DROP POLICY IF EXISTS editor_submissions_owner_select ON public.editor_submissions;
CREATE POLICY editor_submissions_owner_select ON public.editor_submissions FOR SELECT TO authenticated USING (auth.uid() = contributor_id);
DROP POLICY IF EXISTS editor_submissions_owner_insert ON public.editor_submissions;
CREATE POLICY editor_submissions_owner_insert ON public.editor_submissions FOR INSERT TO authenticated WITH CHECK (auth.uid() = contributor_id);
DROP POLICY IF EXISTS editor_submissions_reviewer_select ON public.editor_submissions;
CREATE POLICY editor_submissions_reviewer_select ON public.editor_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'main_contributor'));
DROP POLICY IF EXISTS editor_submissions_reviewer_update ON public.editor_submissions;
CREATE POLICY editor_submissions_reviewer_update ON public.editor_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'main_contributor'));

-- 6. CLASSROOMS

DROP POLICY IF EXISTS classrooms_teacher_all ON public.classrooms;
CREATE POLICY classrooms_teacher_all ON public.classrooms FOR ALL TO authenticated USING (auth.uid() = created_by);
DROP POLICY IF EXISTS classrooms_student_select ON public.classrooms;
CREATE POLICY classrooms_student_select ON public.classrooms FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = classrooms.id AND classroom_members.user_id = auth.uid()));
DROP POLICY IF EXISTS classrooms_public_select ON public.classrooms;
CREATE POLICY classrooms_public_select ON public.classrooms FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS classroom_members_self_insert ON public.classroom_members;
CREATE POLICY classroom_members_self_insert ON public.classroom_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS classroom_members_member_select ON public.classroom_members;
CREATE POLICY classroom_members_member_select ON public.classroom_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = classroom_members.classroom_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS classroom_members_teacher_delete ON public.classroom_members;
CREATE POLICY classroom_members_teacher_delete ON public.classroom_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = classroom_members.classroom_id AND classrooms.created_by = auth.uid()));

DROP POLICY IF EXISTS classroom_curriculums_teacher_all ON public.classroom_curriculums;
CREATE POLICY classroom_curriculums_teacher_all ON public.classroom_curriculums FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = classroom_curriculums.classroom_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS classroom_curriculums_member_select ON public.classroom_curriculums;
CREATE POLICY classroom_curriculums_member_select ON public.classroom_curriculums FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = classroom_curriculums.classroom_id AND classroom_members.user_id = auth.uid()));

DROP POLICY IF EXISTS assignments_teacher_all ON public.assignments;
CREATE POLICY assignments_teacher_all ON public.assignments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = assignments.classroom_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS assignments_member_select ON public.assignments;
CREATE POLICY assignments_member_select ON public.assignments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = assignments.classroom_id AND classroom_members.user_id = auth.uid()));

DROP POLICY IF EXISTS assignment_submissions_owner_all ON public.assignment_submissions;
CREATE POLICY assignment_submissions_owner_all ON public.assignment_submissions FOR ALL TO authenticated USING (auth.uid() = student_id);
DROP POLICY IF EXISTS assignment_submissions_teacher_select ON public.assignment_submissions;
CREATE POLICY assignment_submissions_teacher_select ON public.assignment_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments JOIN public.classrooms ON classrooms.id = assignments.classroom_id WHERE assignments.id = assignment_submissions.assignment_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS assignment_submissions_teacher_update ON public.assignment_submissions;
CREATE POLICY assignment_submissions_teacher_update ON public.assignment_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.assignments JOIN public.classrooms ON classrooms.id = assignments.classroom_id WHERE assignments.id = assignment_submissions.assignment_id AND classrooms.created_by = auth.uid()));

DROP POLICY IF EXISTS quizzes_teacher_all ON public.quizzes;
CREATE POLICY quizzes_teacher_all ON public.quizzes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = quizzes.classroom_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS quizzes_member_select ON public.quizzes;
CREATE POLICY quizzes_member_select ON public.quizzes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = quizzes.classroom_id AND classroom_members.user_id = auth.uid()));

DROP POLICY IF EXISTS quiz_attempts_owner_all ON public.quiz_attempts;
CREATE POLICY quiz_attempts_owner_all ON public.quiz_attempts FOR ALL TO authenticated USING (auth.uid() = student_id);
DROP POLICY IF EXISTS quiz_attempts_teacher_select ON public.quiz_attempts;
CREATE POLICY quiz_attempts_teacher_select ON public.quiz_attempts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes JOIN public.classrooms ON classrooms.id = quizzes.classroom_id WHERE quizzes.id = quiz_attempts.quiz_id AND classrooms.created_by = auth.uid()));

DROP POLICY IF EXISTS discussion_topics_member_all ON public.discussion_topics;
CREATE POLICY discussion_topics_member_all ON public.discussion_topics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = discussion_topics.classroom_id AND classroom_members.user_id = auth.uid()));
DROP POLICY IF EXISTS discussion_topics_public_read ON public.discussion_topics;
CREATE POLICY discussion_topics_public_read ON public.discussion_topics FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS discussion_replies_owner_all ON public.discussion_replies;
CREATE POLICY discussion_replies_owner_all ON public.discussion_replies FOR ALL TO authenticated USING (auth.uid() = created_by);

DROP POLICY IF EXISTS classroom_resources_teacher_all ON public.classroom_resources;
CREATE POLICY classroom_resources_teacher_all ON public.classroom_resources FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.classrooms WHERE classrooms.id = classroom_resources.classroom_id AND classrooms.created_by = auth.uid()));
DROP POLICY IF EXISTS classroom_resources_member_select ON public.classroom_resources;
CREATE POLICY classroom_resources_member_select ON public.classroom_resources FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.classroom_members WHERE classroom_members.classroom_id = classroom_resources.classroom_id AND classroom_members.user_id = auth.uid()));

-- 7. CLUBS

DROP POLICY IF EXISTS clubs_owner_all ON public.clubs;
CREATE POLICY clubs_owner_all ON public.clubs FOR ALL TO authenticated USING (auth.uid() = created_by);
DROP POLICY IF EXISTS clubs_public_read ON public.clubs;
CREATE POLICY clubs_public_read ON public.clubs FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS club_members_self_insert ON public.club_members;
CREATE POLICY club_members_self_insert ON public.club_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS club_members_member_select ON public.club_members;
CREATE POLICY club_members_member_select ON public.club_members FOR SELECT TO authenticated USING (auth.uid() = user_id OR EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid()));
DROP POLICY IF EXISTS club_members_admin_delete ON public.club_members;
CREATE POLICY club_members_admin_delete ON public.club_members FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members cm WHERE cm.club_id = club_members.club_id AND cm.user_id = auth.uid() AND cm.role IN ('admin', 'moderator')) OR auth.uid() = user_id);

DROP POLICY IF EXISTS club_curriculums_leader_all ON public.club_curriculums;
CREATE POLICY club_curriculums_leader_all ON public.club_curriculums FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_curriculums.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_curriculums_member_select ON public.club_curriculums;
CREATE POLICY club_curriculums_member_select ON public.club_curriculums FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_curriculums.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_subjects_leader_all ON public.club_subjects;
CREATE POLICY club_subjects_leader_all ON public.club_subjects FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_subjects.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_subjects_member_select ON public.club_subjects;
CREATE POLICY club_subjects_member_select ON public.club_subjects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_subjects.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_messages_member_all ON public.club_messages;
CREATE POLICY club_messages_member_all ON public.club_messages FOR ALL TO authenticated USING (auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_messages.club_id AND club_members.user_id = auth.uid() AND club_members.membership_status = 'active'));
DROP POLICY IF EXISTS club_messages_member_select ON public.club_messages;
CREATE POLICY club_messages_member_select ON public.club_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_messages.club_id AND club_members.user_id = auth.uid() AND club_members.membership_status = 'active'));

DROP POLICY IF EXISTS club_announcements_leader_all ON public.club_announcements;
CREATE POLICY club_announcements_leader_all ON public.club_announcements FOR ALL TO authenticated USING (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_announcements.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_announcements_member_select ON public.club_announcements;
CREATE POLICY club_announcements_member_select ON public.club_announcements FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_announcements.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_links_member_all ON public.club_links;
CREATE POLICY club_links_member_all ON public.club_links FOR ALL TO authenticated USING (auth.uid() = shared_by AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_links.club_id AND club_members.user_id = auth.uid()));
DROP POLICY IF EXISTS club_links_member_select ON public.club_links;
CREATE POLICY club_links_member_select ON public.club_links FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_links.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_join_requests_owner_all ON public.club_join_requests;
CREATE POLICY club_join_requests_owner_all ON public.club_join_requests FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS club_join_requests_leader_select ON public.club_join_requests;
CREATE POLICY club_join_requests_leader_select ON public.club_join_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_join_requests.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_join_requests_leader_update ON public.club_join_requests;
CREATE POLICY club_join_requests_leader_update ON public.club_join_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_join_requests.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));

DROP POLICY IF EXISTS club_projects_member_all ON public.club_projects;
CREATE POLICY club_projects_member_all ON public.club_projects FOR ALL TO authenticated USING (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_projects.club_id AND club_members.user_id = auth.uid()));
DROP POLICY IF EXISTS club_projects_member_select ON public.club_projects;
CREATE POLICY club_projects_member_select ON public.club_projects FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_projects.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_events_leader_all ON public.club_events;
CREATE POLICY club_events_leader_all ON public.club_events FOR ALL TO authenticated USING (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_events.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_events_member_select ON public.club_events;
CREATE POLICY club_events_member_select ON public.club_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_events.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_milestones_leader_all ON public.club_milestones;
CREATE POLICY club_milestones_leader_all ON public.club_milestones FOR ALL TO authenticated USING (auth.uid() = created_by AND EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_milestones.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_milestones_member_select ON public.club_milestones;
CREATE POLICY club_milestones_member_select ON public.club_milestones FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_milestones.club_id AND club_members.user_id = auth.uid()));

DROP POLICY IF EXISTS club_member_contributions_leader_all ON public.club_member_contributions;
CREATE POLICY club_member_contributions_leader_all ON public.club_member_contributions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.club_members WHERE club_members.club_id = club_member_contributions.club_id AND club_members.user_id = auth.uid() AND club_members.role IN ('admin', 'moderator')));
DROP POLICY IF EXISTS club_member_contributions_owner_select ON public.club_member_contributions;
CREATE POLICY club_member_contributions_owner_select ON public.club_member_contributions FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 8. CERTIFICATIONS

DROP POLICY IF EXISTS certifications_owner_all ON public.certifications;
CREATE POLICY certifications_owner_all ON public.certifications FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS certifications_public_read ON public.certifications;
CREATE POLICY certifications_public_read ON public.certifications FOR SELECT TO anon, authenticated USING (is_hidden = false);

-- 9. PERSONAL STUDY TOOLS

DROP POLICY IF EXISTS timetable_events_owner_all ON public.timetable_events;
CREATE POLICY timetable_events_owner_all ON public.timetable_events FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS pomodoro_sessions_owner_all ON public.pomodoro_sessions;
CREATE POLICY pomodoro_sessions_owner_all ON public.pomodoro_sessions FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS decks_owner_all ON public.decks;
CREATE POLICY decks_owner_all ON public.decks FOR ALL TO authenticated USING (auth.uid() = owner_id);
DROP POLICY IF EXISTS decks_public_select ON public.decks;
CREATE POLICY decks_public_select ON public.decks FOR SELECT TO anon, authenticated USING (is_public = true);

DROP POLICY IF EXISTS cards_owner_all ON public.cards;
CREATE POLICY cards_owner_all ON public.cards FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.decks WHERE decks.id = cards.deck_id AND decks.owner_id = auth.uid()));
DROP POLICY IF EXISTS cards_public_select ON public.cards;
CREATE POLICY cards_public_select ON public.cards FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.decks WHERE decks.id = cards.deck_id AND decks.is_public = true));

DROP POLICY IF EXISTS card_reviews_owner_all ON public.card_reviews;
CREATE POLICY card_reviews_owner_all ON public.card_reviews FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS notes_owner_all ON public.notes;
CREATE POLICY notes_owner_all ON public.notes FOR ALL TO authenticated USING (auth.uid() = contributor_id);
DROP POLICY IF EXISTS notes_public_select ON public.notes;
CREATE POLICY notes_public_select ON public.notes FOR SELECT TO anon, authenticated USING (visibility = 'public' AND status = 'approved');

DROP POLICY IF EXISTS user_saved_notes_owner_all ON public.user_saved_notes;
CREATE POLICY user_saved_notes_owner_all ON public.user_saved_notes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 10. EXAMS & GRADES

DROP POLICY IF EXISTS exams_contributor_all ON public.exams;
CREATE POLICY exams_contributor_all ON public.exams FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('contributor', 'main_contributor')));
DROP POLICY IF EXISTS exams_public_select ON public.exams;
CREATE POLICY exams_public_select ON public.exams FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS exam_schedules_contributor_all ON public.exam_schedules;
CREATE POLICY exam_schedules_contributor_all ON public.exam_schedules FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('contributor', 'main_contributor')));
DROP POLICY IF EXISTS exam_schedules_owner_all ON public.exam_schedules;
CREATE POLICY exam_schedules_owner_all ON public.exam_schedules FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS exam_schedules_public_select ON public.exam_schedules;
CREATE POLICY exam_schedules_public_select ON public.exam_schedules FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS exam_countdowns_owner_all ON public.exam_countdowns;
CREATE POLICY exam_countdowns_owner_all ON public.exam_countdowns FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS grade_boundaries_contributor_all ON public.grade_boundaries;
CREATE POLICY grade_boundaries_contributor_all ON public.grade_boundaries FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('contributor', 'main_contributor')));
DROP POLICY IF EXISTS grade_boundaries_public_select ON public.grade_boundaries;
CREATE POLICY grade_boundaries_public_select ON public.grade_boundaries FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS grade_entries_owner_all ON public.grade_entries;
CREATE POLICY grade_entries_owner_all ON public.grade_entries FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_enrollments_owner_all ON public.user_enrollments;
CREATE POLICY user_enrollments_owner_all ON public.user_enrollments FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_exam_overrides_owner_all ON public.user_exam_overrides;
CREATE POLICY user_exam_overrides_owner_all ON public.user_exam_overrides FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS user_exam_history_owner_all ON public.user_exam_history;
CREATE POLICY user_exam_history_owner_all ON public.user_exam_history FOR ALL TO authenticated USING (auth.uid() = user_id);

-- 11. REVIEW QUEUE & VERSION HISTORY

DROP POLICY IF EXISTS review_queue_reviewer_all ON public.review_queue;
CREATE POLICY review_queue_reviewer_all ON public.review_queue FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'main_contributor'));
DROP POLICY IF EXISTS review_queue_owner_select ON public.review_queue;
CREATE POLICY review_queue_owner_select ON public.review_queue FOR SELECT TO authenticated USING (auth.uid() = contributor_id);
DROP POLICY IF EXISTS review_queue_owner_insert ON public.review_queue;
CREATE POLICY review_queue_owner_insert ON public.review_queue FOR INSERT TO authenticated WITH CHECK (auth.uid() = contributor_id);

DROP POLICY IF EXISTS version_history_owner_select ON public.version_history;
CREATE POLICY version_history_owner_select ON public.version_history FOR SELECT TO authenticated USING (auth.uid() = changed_by);

-- 12. ROLE UPGRADE SYSTEM

DROP POLICY IF EXISTS role_upgrade_requests_owner_all ON public.role_upgrade_requests;
CREATE POLICY role_upgrade_requests_owner_all ON public.role_upgrade_requests FOR ALL TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS role_upgrade_requests_reviewer_select ON public.role_upgrade_requests;
CREATE POLICY role_upgrade_requests_reviewer_select ON public.role_upgrade_requests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'main_contributor'));
DROP POLICY IF EXISTS role_upgrade_requests_reviewer_update ON public.role_upgrade_requests;
CREATE POLICY role_upgrade_requests_reviewer_update ON public.role_upgrade_requests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'main_contributor'));

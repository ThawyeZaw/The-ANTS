-- ============================================================================
-- The ANTS — Phase 5 (Missing Indexes) + Phase 6 (Storage Buckets)
-- ============================================================================
-- Phase 5: 2 indexes missing from the comprehensive initial migration.
-- Phase 6: 4 storage buckets with RLS policies per spec.md Section 27.
-- ============================================================================

-- ============================================================================
-- PHASE 5: MISSING INDEXES
-- ============================================================================

-- 5.1 club_members by user_id — enables fast "my clubs" listing queries
CREATE INDEX IF NOT EXISTS idx_club_members_user ON public.club_members (user_id);

-- 5.2 editor_submissions partial index for approved status — enables fast approved content listing
CREATE INDEX IF NOT EXISTS idx_editor_submissions_approved ON public.editor_submissions (submitted_at) WHERE status = 'approved';

-- ============================================================================
-- PHASE 6: STORAGE BUCKETS
-- ============================================================================
-- Bucket definitions per spec.md Section 27.2
-- RLS policies per spec.md Section 27.3
-- ============================================================================

-- 6.1 Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('avatars', 'avatars', true, 5242880,
     ARRAY['image/jpeg', 'image/png', 'image/webp']),
    ('notes-images', 'notes-images', false, 10485760,
     ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']),
    ('role-upgrade-evidence', 'role-upgrade-evidence', false, 20971520,
     ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
    ('assignment-attachments', 'assignment-attachments', false, 52428800,
     ARRAY['application/pdf', 'application/zip', 'application/msword',
           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
           'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
           'image/jpeg', 'image/png'])
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 6.2 RLS Policies: avatars (public read, owner write)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_public_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'avatars');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_owner_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "avatars_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_owner_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "avatars_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'avatars_owner_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "avatars_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'avatars' AND owner = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- 6.3 RLS Policies: notes-images (authenticated read, owner write)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notes_images_authenticated_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "notes_images_authenticated_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'notes-images');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notes_images_owner_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "notes_images_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'notes-images' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notes_images_owner_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "notes_images_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'notes-images' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notes_images_owner_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "notes_images_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'notes-images' AND owner = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- 6.4 RLS Policies: role-upgrade-evidence (owner + main_contributor read, owner write)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_upgrade_evidence_restricted_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "role_upgrade_evidence_restricted_read" ON storage.objects FOR SELECT TO authenticated USING (
            bucket_id = 'role-upgrade-evidence'
            AND (owner = auth.uid() OR EXISTS (
                SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'main_contributor'
            ))
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_upgrade_evidence_owner_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "role_upgrade_evidence_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'role-upgrade-evidence' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_upgrade_evidence_owner_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "role_upgrade_evidence_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'role-upgrade-evidence' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'role_upgrade_evidence_owner_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "role_upgrade_evidence_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'role-upgrade-evidence' AND owner = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- 6.5 RLS Policies: assignment-attachments (classroom members read, teacher write)
-- File path pattern: {classroomId}/{assignmentId}/{filename}
-- Extracts classroom_id from the first path segment via regexp_match.
-- Note: spec.md referenced 'creator_id' — actual column is 'created_by'.
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'assignment_attachments_classroom_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "assignment_attachments_classroom_read" ON storage.objects FOR SELECT TO authenticated USING (
            bucket_id = 'assignment-attachments'
            AND EXISTS (
                SELECT 1 FROM public.classroom_members
                WHERE classroom_id = (regexp_match(name, '^([^/]+)'))[1]::uuid
                  AND user_id = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'assignment_attachments_teacher_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "assignment_attachments_teacher_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
            bucket_id = 'assignment-attachments'
            AND EXISTS (
                SELECT 1 FROM public.classrooms
                WHERE id = (regexp_match(name, '^([^/]+)'))[1]::uuid
                  AND created_by = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'assignment_attachments_teacher_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "assignment_attachments_teacher_update" ON storage.objects FOR UPDATE TO authenticated USING (
            bucket_id = 'assignment-attachments'
            AND EXISTS (
                SELECT 1 FROM public.classrooms
                WHERE id = (regexp_match(name, '^([^/]+)'))[1]::uuid
                  AND created_by = auth.uid()
            )
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'assignment_attachments_teacher_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "assignment_attachments_teacher_delete" ON storage.objects FOR DELETE TO authenticated USING (
            bucket_id = 'assignment-attachments'
            AND EXISTS (
                SELECT 1 FROM public.classrooms
                WHERE id = (regexp_match(name, '^([^/]+)'))[1]::uuid
                  AND created_by = auth.uid()
            )
        );
    END IF;
END $$;

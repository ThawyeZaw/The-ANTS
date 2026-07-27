-- ============================================================================
-- The ANTS — Timeline Images Storage Bucket
-- ============================================================================
-- Public bucket for org-activities timeline image uploads.
-- RLS: public read (anon + authenticated), owner write.
-- ============================================================================

-- Create timeline-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('timeline-images', 'timeline-images', true, 5242880,
     ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS Policies: timeline-images (public read, owner write)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timeline_images_public_read' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "timeline_images_public_read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'timeline-images');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timeline_images_owner_insert' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "timeline_images_owner_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'timeline-images' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timeline_images_owner_update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "timeline_images_owner_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'timeline-images' AND owner = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'timeline_images_owner_delete' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "timeline_images_owner_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'timeline-images' AND owner = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- The ANTS — Update avatars bucket constraints (2MB, JPEG/PNG only)
-- ============================================================================

UPDATE storage.buckets
SET file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png']
WHERE id = 'avatars';

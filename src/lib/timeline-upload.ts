// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Timeline Image Upload Utility
// Handles file validation and upload to Supabase Storage 'timeline-images' bucket.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a timeline image to Supabase Storage.
 * Validates file size (max 5MB) and type (JPEG/PNG/WebP).
 */
export async function uploadTimelineImage(file: File): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Only JPEG, PNG, and WebP images are allowed.' };
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'Image must be under 5MB.' };
  }

  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client not available.' };
  }

  // Determine file extension
  const extMap: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  const ext = extMap[file.type] || 'jpg';
  const fileName = `timeline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('timeline-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('timeline-images')
    .getPublicUrl(fileName);

  return { success: true, url: urlData.publicUrl };
}

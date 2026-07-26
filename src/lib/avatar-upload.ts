// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Avatar Upload Utility
// Handles file validation and upload to Supabase Storage 'avatars' bucket.
// ──────────────────────────────────────────────────────────────────────────────

import { createClient } from '@/lib/supabase/client';

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a profile avatar image to Supabase Storage.
 * Validates file size (max 2MB) and type (JPEG/PNG only).
 * Overwrites any previous avatar for the same user.
 */
export async function uploadAvatar(file: File, userId: string): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { success: false, error: 'Only JPEG and PNG images are allowed.' };
  }

  // Validate file size
  if (file.size > MAX_SIZE) {
    return { success: false, error: 'Image must be under 2MB.' };
  }

  const supabase = createClient();
  if (!supabase) {
    return { success: false, error: 'Supabase client not available.' };
  }

  // Generate a unique filename: userId + timestamp + extension
  const ext = file.type === 'image/png' ? 'png' : 'jpg';
  const fileName = `${userId}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Get the public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName);

  return { success: true, url: urlData.publicUrl };
}

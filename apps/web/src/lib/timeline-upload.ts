// ──────────────────────────────────────────────────────────────────────────────
// The ANTS — Timeline Image Upload Utility (Cloudflare R2 Storage)
// Handles file validation and upload to R2 storage 'timeline-images' bucket via API.
// ──────────────────────────────────────────────────────────────────────────────

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload a timeline image to Cloudflare R2 storage.
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

  try {
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const fileName = `timeline_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const res = await fetch(`${API_BASE_URL}/api/storage/presigned-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bucket: 'timeline-images',
        fileName,
        contentType: file.type,
        sizeBytes: file.size,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to generate upload URL' };
    }

    const data = await res.json();
    return { success: true, url: data.publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message || 'Image upload failed.' };
  }
}

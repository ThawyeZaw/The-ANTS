import { Hono } from 'hono';
import { z } from 'zod';

export function createStorageRoutes() {
  const router = new Hono();

  // Presigned upload URL generator for Cloudflare R2
  router.post('/presigned-url', async (c) => {
    const body = await c.req.json();

    const PresignedSchema = z.object({
      bucket: z.enum(['avatars', 'certificates', 'resources', 'attachments', 'timeline-images']),
      fileName: z.string().min(1),
      contentType: z.string().min(1),
      sizeBytes: z.number().max(50 * 1024 * 1024), // 50MB max
    });

    const parsed = PresignedSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.format() }, 400);
    }

    const { bucket, fileName, contentType } = parsed.data;
    const sanitizedFileName = `${Date.now()}-${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const publicUrl = `https://assets.the-ants.org/${bucket}/${sanitizedFileName}`;

    return c.json({
      success: true,
      bucket,
      fileName: sanitizedFileName,
      uploadUrl: `/api/storage/upload/${bucket}/${sanitizedFileName}`, // Direct upload endpoint or presigned S3 url
      publicUrl,
    });
  });

  return router;
}

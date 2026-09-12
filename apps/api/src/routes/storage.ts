import { Hono } from 'hono';
import { z } from 'zod';

const ALLOWED_BUCKETS = ['avatars', 'certificates', 'resources', 'attachments', 'timeline-images'] as const;
const MAX_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

type StorageBindings = {
  ASSETS_BUCKET?: R2Bucket;
  /** Optional override for the public file origin (e.g. a CDN or custom domain). */
  R2_PUBLIC_BASE_URL?: string;
};

type StorageEnv = {
  Bindings: StorageBindings;
};

/**
 * Builds the public URL for a stored object.
 * Priority: R2_PUBLIC_BASE_URL > request origin (local) > https://api.the-ants.org.
 * Private R2 bucket `the-ants-assets` is not publicly browsable; files are served
 * by the API Worker at `/api/storage/file/...`. Leave R2_PUBLIC_BASE_URL unset unless
 * you add a custom public domain/CDN later.
 */
function buildPublicUrl(c: { req: { url: string } }, env: StorageBindings, bucket: string, fileName: string): string {
  const override = env.R2_PUBLIC_BASE_URL?.replace(/\/+$/, '');
  const requestOrigin = new URL(c.req.url).origin;
  const isLocal =
    requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');
  const origin = override || (isLocal ? requestOrigin : 'https://api.the-ants.org');
  return `${origin}/api/storage/file/${bucket}/${fileName}`;
}

export function createStorageRoutes() {
  const router = new Hono<StorageEnv>();

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
    const publicUrl = buildPublicUrl(c, c.env ?? {}, bucket, sanitizedFileName);

    return c.json({
      success: true,
      bucket,
      fileName: sanitizedFileName,
      contentType,
      uploadUrl: `/api/storage/upload/${bucket}/${sanitizedFileName}`, // Direct upload endpoint or presigned S3 url
      publicUrl,
    });
  });

  // Binary upload endpoint — streams the file into the R2 ASSETS_BUCKET binding.
  // Contract: POST /api/storage/upload/:bucket/:fileName with the raw file as body.
  router.post('/upload/:bucket/:fileName', async (c) => {
    const bucket = c.req.param('bucket') as (typeof ALLOWED_BUCKETS)[number];
    const fileNameParam = c.req.param('fileName');

    if (!ALLOWED_BUCKETS.includes(bucket)) {
      return c.json({ error: `Invalid bucket. Allowed: ${ALLOWED_BUCKETS.join(', ')}` }, 400);
    }
    if (!fileNameParam || !/^[a-zA-Z0-9._-]+$/.test(fileNameParam)) {
      return c.json({ error: 'Invalid file name' }, 400);
    }

    const bucketBinding = c.env?.ASSETS_BUCKET;
    if (!bucketBinding) {
      return c.json(
        { error: 'Object storage is not configured (missing ASSETS_BUCKET R2 binding)' },
        503
      );
    }

    const contentType = c.req.header('Content-Type') || 'application/octet-stream';
    const contentLength = Number(c.req.header('Content-Length') || '0');
    if (contentLength > MAX_SIZE_BYTES) {
      return c.json({ error: 'File exceeds the 50MB size limit' }, 413);
    }

    try {
      const arrayBuffer = await c.req.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        return c.json({ error: 'Empty request body' }, 400);
      }
      if (arrayBuffer.byteLength > MAX_SIZE_BYTES) {
        return c.json({ error: 'File exceeds the 50MB size limit' }, 413);
      }

      await bucketBinding.put(`${bucket}/${fileNameParam}`, arrayBuffer, {
        httpMetadata: { contentType },
      });

      return c.json({
        success: true,
        bucket,
        fileName: fileNameParam,
        publicUrl: buildPublicUrl(c, c.env ?? {}, bucket, fileNameParam),
      });
    } catch (err: any) {
      console.error('[storage] Upload failed:', err);
      return c.json({ error: err?.message || 'Failed to store object' }, 500);
    }
  });

  // Public file serving — reads straight from the R2 binding so objects are
  // reachable on any Worker origin (workers.dev included) with zero DNS setup.
  router.get('/file/:bucket/:fileName', async (c) => {
    const bucket = c.req.param('bucket');
    const fileNameParam = c.req.param('fileName');

    if (!ALLOWED_BUCKETS.includes(bucket as (typeof ALLOWED_BUCKETS)[number])) {
      return c.json({ error: 'Invalid bucket' }, 400);
    }
    if (!fileNameParam || !/^[a-zA-Z0-9._-]+$/.test(fileNameParam)) {
      return c.json({ error: 'Invalid file name' }, 400);
    }

    const bucketBinding = c.env?.ASSETS_BUCKET;
    if (!bucketBinding) {
      return c.json(
        { error: 'Object storage is not configured (missing ASSETS_BUCKET R2 binding)' },
        503
      );
    }

    try {
      const object = await bucketBinding.get(`${bucket}/${fileNameParam}`);
      if (!object) {
        return c.json({ error: 'Not found' }, 404);
      }

      const headers = new Headers();
      headers.set(
        'Content-Type',
        object.httpMetadata?.contentType || 'application/octet-stream'
      );
      // Object names are timestamped/unique → safe to cache forever.
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      headers.set('ETag', object.httpEtag);

      return new Response(object.body, { headers });
    } catch (err: any) {
      console.error('[storage] Read failed:', err);
      return c.json({ error: err?.message || 'Failed to read object' }, 500);
    }
  });

  return router;
}

import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// Phase 2: default in-memory/cache behavior for preview.
// Phase 3+: optionally enable R2 incremental cache via wrangler binding
// NEXT_INC_CACHE_R2_BUCKET + r2IncrementalCache override.
export default defineCloudflareConfig({});

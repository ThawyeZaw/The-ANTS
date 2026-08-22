import { hc } from 'hono/client';
import type { AppType } from '../../../api/src/index';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8787';

export const apiClient = hc<AppType>(API_BASE_URL);

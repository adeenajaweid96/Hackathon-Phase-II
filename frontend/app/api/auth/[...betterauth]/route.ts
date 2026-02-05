/**
 * Better Auth API Route Handler
 *
 * Handles Better Auth callbacks and session management.
 * This route is required for Better Auth to function properly.
 */

import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);

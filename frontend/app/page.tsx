/**
 * Home Page
 *
 * Server Component that handles redirect logic based on authentication state.
 * - Authenticated users: redirect to /todos
 * - Unauthenticated users: redirect to /signin
 *
 * Note: This is a temporary landing page. The actual redirect logic
 * is handled by middleware and client-side navigation.
 */

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Todo App',
  description: 'A modern todo application for managing your tasks',
};

// ============================================================================
// Page Component
// ============================================================================

export default function HomePage() {
  // Redirect to signin page
  // The middleware will handle authenticated users and redirect them to /todos
  redirect('/signin');
}

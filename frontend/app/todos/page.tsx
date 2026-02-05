/**
 * Todos Page
 *
 * Main page for displaying and managing todos.
 * Server Component wrapper that includes the TodoList and actions.
 */

import type { Metadata } from 'next';
import { TodosPageClient } from './TodosPageClient';

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'My Todos',
  description: 'Manage your todos and stay organized',
};

// ============================================================================
// Page Component
// ============================================================================

export default function TodosPage() {
  return <TodosPageClient />;
}

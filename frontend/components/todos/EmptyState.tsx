/**
 * Empty State Component
 *
 * Displays a friendly message when the user has no todos.
 * Encourages the user to create their first todo.
 */

import React from 'react';

// ============================================================================
// Component
// ============================================================================

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      {/* Icon */}
      <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      </div>

      {/* Message */}
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No todos yet
      </h3>
      <p className="text-gray-600 max-w-sm mb-6">
        Get started by creating your first todo. Stay organized and track your tasks efficiently.
      </p>

      {/* Call to Action */}
      <div className="text-sm text-gray-500">
        Click the "Add Todo" button above to create your first task
      </div>
    </div>
  );
}

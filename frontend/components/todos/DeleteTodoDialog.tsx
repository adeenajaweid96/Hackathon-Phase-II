/**
 * Delete Todo Dialog Component
 *
 * Client Component that displays a confirmation dialog before deleting a todo.
 * Prevents accidental deletion and provides clear feedback.
 */

'use client';

import React, { useState } from 'react';
import { useDeleteTodo } from '@/lib/hooks/useTodos';
import { parseApiError } from '@/lib/utils/error-handlers';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Todo } from '@/lib/types';

// ============================================================================
// Component Props
// ============================================================================

interface DeleteTodoDialogProps {
  todo: Todo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function DeleteTodoDialog({
  todo,
  onSuccess,
  onCancel,
}: DeleteTodoDialogProps) {
  const deleteTodo = useDeleteTodo();
  const [isDeleting, setIsDeleting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ============================================================================
  // Delete Handler
  // ============================================================================

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setApiError(null);

      await deleteTodo.mutateAsync(todo.id);

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = parseApiError(error);
      setApiError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-4">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {apiError}
        </div>
      )}

      {/* Warning Icon */}
      <div className="flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
      </div>

      {/* Confirmation Message */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Delete this todo?
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          This action cannot be undone. The todo will be permanently deleted.
        </p>
      </div>

      {/* Todo Preview */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="font-medium text-gray-900 mb-1">{todo.title}</h4>
        {todo.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {todo.description}
          </p>
        )}
        {todo.completed && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-2">
            Completed
          </span>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="md"
            disabled={isDeleting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleDelete}
          variant="danger"
          size="md"
          disabled={isDeleting}
        >
          {isDeleting ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Deleting...
            </span>
          ) : (
            'Delete Todo'
          )}
        </Button>
      </div>
    </div>
  );
}

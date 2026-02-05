/**
 * Todo Item Component
 *
 * Client Component that displays a single todo item.
 * Includes completion checkbox, title, description, and action buttons.
 */

'use client';

import React, { useState } from 'react';
import { Todo } from '@/lib/types';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';
import { useToggleTodo } from '@/lib/hooks/useTodos';

// ============================================================================
// Component Props
// ============================================================================

interface TodoItemProps {
  todo: Todo;
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TodoItem({ todo, onEdit, onDelete }: TodoItemProps) {
  const toggleTodo = useToggleTodo();
  const [isToggling, setIsToggling] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleToggle = async () => {
    try {
      setIsToggling(true);
      await toggleTodo.mutateAsync({
        id: todo.id,
        completed: !todo.completed,
      });
    } catch (error) {
      console.error('Failed to toggle todo:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(todo);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(todo);
    }
  };

  // ============================================================================
  // Format Date
  // ============================================================================

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      const hours = Math.floor(diffInHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div
      className={`group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${
        todo.completed ? 'bg-gray-50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={todo.completed}
            onChange={handleToggle}
            disabled={isToggling}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? 'incomplete' : 'complete'}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          <h3
            className={`text-base font-medium text-gray-900 mb-1 ${
              todo.completed ? 'line-through text-gray-500' : ''
            }`}
          >
            {todo.title}
          </h3>

          {/* Description */}
          {todo.description && (
            <p
              className={`text-sm text-gray-600 mb-2 ${
                todo.completed ? 'line-through text-gray-400' : ''
              }`}
            >
              {todo.description}
            </p>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Created {formatDate(todo.created_at)}</span>
            {todo.updated_at !== todo.created_at && (
              <>
                <span>•</span>
                <span>Updated {formatDate(todo.updated_at)}</span>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex-shrink-0 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          {/* Edit Button */}
          <Button
            onClick={handleEdit}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-primary-600"
            aria-label={`Edit "${todo.title}"`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </Button>

          {/* Delete Button */}
          <Button
            onClick={handleDelete}
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-red-600"
            aria-label={`Delete "${todo.title}"`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Completed Badge */}
      {todo.completed && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Completed
          </span>
        </div>
      )}
    </div>
  );
}

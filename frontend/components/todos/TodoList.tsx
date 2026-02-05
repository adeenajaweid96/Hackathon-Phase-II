/**
 * Todo List Component
 *
 * Client Component that renders a list of todos.
 * Handles empty state and displays todos in a grid layout.
 */

'use client';

import React from 'react';
import { Todo } from '@/lib/types';
import { TodoItem } from './TodoItem';
import { EmptyState } from './EmptyState';

// ============================================================================
// Component Props
// ============================================================================

interface TodoListProps {
  todos: Todo[];
  onEdit?: (todo: Todo) => void;
  onDelete?: (todo: Todo) => void;
}

// ============================================================================
// Component
// ============================================================================

export function TodoList({ todos, onEdit, onDelete }: TodoListProps) {
  // ============================================================================
  // Empty State
  // ============================================================================

  if (todos.length === 0) {
    return <EmptyState />;
  }

  // ============================================================================
  // Sort Todos
  // ============================================================================

  // Sort by: incomplete first, then by creation date (newest first)
  const sortedTodos = [...todos].sort((a, b) => {
    // Incomplete todos come first
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    // Then sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // ============================================================================
  // Statistics
  // ============================================================================

  const completedCount = todos.filter((todo) => todo.completed).length;
  const totalCount = todos.length;
  const completionPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Statistics Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">{completedCount}</span> of{' '}
            <span className="font-medium text-gray-900">{totalCount}</span> completed
          </div>
          <div className="text-sm font-medium text-gray-900">
            {completionPercentage}%
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Todo Items */}
      <div className="space-y-3">
        {sortedTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
      </div>
    </div>
  );
}

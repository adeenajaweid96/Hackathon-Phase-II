/**
 * Task Card Component
 *
 * Compact card for displaying task in the dashboard columns
 */

'use client';

import React from 'react';
import { Todo, Priority, Status } from '@/lib/types';
import { useToggleTodo } from '@/lib/hooks/useTodos';

interface TaskCardProps {
  todo: Todo;
  onClick: () => void;
  onEdit: () => void;
}

const priorityColors: Record<Priority, string> = {
  low: 'bg-gray-100 text-gray-700 border-gray-300',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  high: 'bg-red-100 text-red-700 border-red-300',
};

const statusColors: Record<Status, string> = {
  not_started: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

const statusLabels: Record<Status, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed: 'Completed',
};

export function TaskCard({ todo, onClick, onEdit }: TaskCardProps) {
  const toggleTodo = useToggleTodo();
  const [isToggling, setIsToggling] = React.useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  return (
    <div
      onClick={onClick}
      className={`group relative bg-white border rounded-lg p-4 hover:shadow-md transition-all cursor-pointer ${
        todo.completed ? 'border-gray-200 bg-gray-50' : 'border-gray-300'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Checkbox */}
        <button
          onClick={handleToggle}
          disabled={isToggling}
          className="flex-shrink-0 mt-1"
        >
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              todo.completed
                ? 'bg-green-500 border-green-500'
                : 'border-gray-300 hover:border-green-500'
            }`}
          >
            {todo.completed && (
              <svg
                className="w-3 h-3 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3
            className={`text-sm font-medium mb-1 ${
              todo.completed ? 'line-through text-gray-500' : 'text-gray-900'
            }`}
          >
            {todo.title}
          </h3>

          {todo.description && (
            <p
              className={`text-xs mb-2 line-clamp-2 ${
                todo.completed ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {todo.description}
            </p>
          )}

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                priorityColors[todo.priority]
              }`}
            >
              {todo.priority.toUpperCase()}
            </span>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                statusColors[todo.status]
              }`}
            >
              {statusLabels[todo.status]}
            </span>
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={handleEdit}
          className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
        >
          <svg
            className="w-4 h-4 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

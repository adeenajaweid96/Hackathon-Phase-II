/**
 * Task Detail Modal Component
 *
 * Modal for viewing full task details
 */

'use client';

import React from 'react';
import { Todo, Priority, Status } from '@/lib/types';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { useDeleteTodo } from '@/lib/hooks/useTodos';

interface TaskDetailModalProps {
  isOpen: boolean;
  todo: Todo;
  onClose: () => void;
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

export function TaskDetailModal({ isOpen, todo, onClose, onEdit }: TaskDetailModalProps) {
  const deleteTodo = useDeleteTodo();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      setIsDeleting(true);
      await deleteTodo.mutateAsync(todo.id);
      onClose();
    } catch (error) {
      console.error('Failed to delete todo:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Task Details">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{todo.title}</h3>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border ${
                priorityColors[todo.priority]
              }`}
            >
              {todo.priority.toUpperCase()} PRIORITY
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                statusColors[todo.status]
              }`}
            >
              {statusLabels[todo.status]}
            </span>
            {todo.completed && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                ✓ COMPLETED
              </span>
            )}
          </div>
        </div>

        {/* Description */}
        {todo.description && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-4 border border-gray-200">
              {todo.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Created</h4>
            <p className="text-sm text-gray-900">{formatDate(todo.created_at)}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-500 mb-1">Last Updated</h4>
            <p className="text-sm text-gray-900">{formatDate(todo.updated_at)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button
            onClick={handleDelete}
            variant="danger"
            size="sm"
            disabled={isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Task'}
          </Button>
          <div className="flex items-center gap-3">
            <Button onClick={onClose} variant="ghost" size="sm">
              Close
            </Button>
            <Button onClick={onEdit} variant="primary" size="sm">
              Edit Task
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}

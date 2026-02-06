/**
 * Create Todo Modal Component
 *
 * Modal for creating new tasks with title, description, priority, and status
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateTodo } from '@/lib/hooks/useTodos';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Priority, Status } from '@/lib/types';

const createTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  priority: z.enum(['low', 'medium', 'high']),
  status: z.enum(['not_started', 'in_progress', 'completed']),
});

type CreateTodoFormData = z.infer<typeof createTodoSchema>;

interface CreateTodoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTodoModal({ isOpen, onClose }: CreateTodoModalProps) {
  const createTodo = useCreateTodo();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTodoFormData>({
    resolver: zodResolver(createTodoSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      status: 'not_started',
    },
  });

  const onSubmit = async (data: CreateTodoFormData) => {
    try {
      setIsSubmitting(true);
      await createTodo.mutateAsync(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Failed to create todo:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose} title="Add New Task">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Task Title *
          </label>
          <Input
            id="title"
            type="text"
            placeholder="Enter task title"
            {...register('title')}
            error={!!errors.title}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            placeholder="Enter task description (optional)"
            {...register('description')}
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            Priority *
          </label>
          <select
            id="priority"
            {...register('priority')}
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          {errors.priority && (
            <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
          )}
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status *
          </label>
          <select
            id="status"
            {...register('status')}
            disabled={isSubmitting}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          {errors.status && (
            <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center">
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </span>
            ) : (
              'Create Task'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

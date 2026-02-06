/**
 * Edit Todo Form Component
 *
 * Client Component for editing existing todos.
 * Pre-fills form with current todo data and allows updating title and description.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateTodoSchema,
  UpdateTodoFormData,
  getTitleCharacterCount,
  getDescriptionCharacterCount,
} from '@/lib/validation/todo-schemas';
import { useUpdateTodo } from '@/lib/hooks/useTodos';
import { parseApiError } from '@/lib/utils/error-handlers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Todo } from '@/lib/types';

// ============================================================================
// Component Props
// ============================================================================

interface EditTodoFormProps {
  todo: Todo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function EditTodoForm({ todo, onSuccess, onCancel }: EditTodoFormProps) {
  const updateTodo = useUpdateTodo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<UpdateTodoFormData>({
    resolver: zodResolver(updateTodoSchema),
    mode: 'onBlur',
    defaultValues: {
      title: todo.title,
      description: todo.description || '',
    },
  });

  // Watch fields for character count
  const title = watch('title', todo.title);
  const description = watch('description', todo.description || '');

  const titleCount = getTitleCharacterCount(title || '');
  const descriptionCount = getDescriptionCharacterCount(description || '');

  // ============================================================================
  // Form Submission
  // ============================================================================

  const onSubmit = async (data: UpdateTodoFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      // Only send changed fields
      const updates: UpdateTodoFormData = {};
      if (data.title && data.title !== todo.title) {
        updates.title = data.title;
      }
      if (data.description !== todo.description) {
        updates.description = data.description || '';
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        if (onCancel) {
          onCancel();
        }
        return;
      }

      await updateTodo.mutateAsync({
        id: todo.id,
        data: updates,
      });

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      const errorMessage = parseApiError(error);
      setApiError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {apiError}
        </div>
      )}

      {/* Title Field */}
      <div className="form-group">
        <label
          htmlFor="edit-title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="edit-title"
          type="text"
          placeholder="Enter todo title"
          {...register('title')}
          error={!!errors.title}
          disabled={isSubmitting}
          autoFocus
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {errors.title && (
              <p className="error-text">{errors.title.message}</p>
            )}
          </div>
          <p
            className={`text-xs ${
              titleCount.isValid ? 'text-gray-500' : 'text-red-600'
            }`}
          >
            {titleCount.count}/{titleCount.max}
          </p>
        </div>
      </div>

      {/* Description Field */}
      <div className="form-group">
        <label
          htmlFor="edit-description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <Textarea
          id="edit-description"
          placeholder="Add more details about this todo..."
          rows={4}
          {...register('description')}
          error={!!errors.description}
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between mt-1">
          <div>
            {errors.description && (
              <p className="error-text">{errors.description.message}</p>
            )}
          </div>
          <p
            className={`text-xs ${
              descriptionCount.isValid ? 'text-gray-500' : 'text-red-600'
            }`}
          >
            {descriptionCount.count}/{descriptionCount.max}
          </p>
        </div>
      </div>

      {/* Completion Status Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                todo.completed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {todo.completed ? 'Completed' : 'In Progress'}
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Use the checkbox to toggle completion
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            size="md"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={isSubmitting || !isDirty}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}

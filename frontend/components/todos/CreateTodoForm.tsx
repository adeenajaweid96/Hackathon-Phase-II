/**
 * Create Todo Form Component
 *
 * Client Component for creating new todos.
 * Includes title and description fields with validation and character counts.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createTodoSchema,
  CreateTodoFormData,
  getTitleCharacterCount,
  getDescriptionCharacterCount,
} from '@/lib/validation/todo-schemas';
import { useCreateTodo } from '@/lib/hooks/useTodos';
import { parseApiError } from '@/lib/utils/error-handlers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// Component Props
// ============================================================================

interface CreateTodoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function CreateTodoForm({ onSuccess, onCancel }: CreateTodoFormProps) {
  const createTodo = useCreateTodo();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateTodoFormData>({
    resolver: zodResolver(createTodoSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Watch fields for character count
  const title = watch('title', '');
  const description = watch('description', '');

  const titleCount = getTitleCharacterCount(title);
  const descriptionCount = getDescriptionCharacterCount(description);

  // ============================================================================
  // Form Submission
  // ============================================================================

  const onSubmit = async (data: CreateTodoFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await createTodo.mutateAsync({
        title: data.title,
        description: data.description || undefined,
      });

      // Reset form
      reset();

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
          htmlFor="title"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Title <span className="text-red-500">*</span>
        </label>
        <Input
          id="title"
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
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Description <span className="text-gray-400 text-xs">(optional)</span>
        </label>
        <Textarea
          id="description"
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <LoadingSpinner size="sm" className="mr-2" />
              Creating...
            </span>
          ) : (
            'Create Todo'
          )}
        </Button>
      </div>
    </form>
  );
}

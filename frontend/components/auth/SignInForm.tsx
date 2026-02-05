/**
 * Sign In Form Component
 *
 * Client Component for user authentication with email and password.
 * Includes form validation and error handling.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signInSchema, SignInFormData } from '@/lib/validation/auth-schemas';
import { useAuthContext } from '@/lib/providers/AuthProvider';
import { parseApiError } from '@/lib/utils/error-handlers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// Component
// ============================================================================

export function SignInForm() {
  const router = useRouter();
  const { signIn } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
    mode: 'onBlur',
  });

  // ============================================================================
  // Form Submission
  // ============================================================================

  const onSubmit = async (data: SignInFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await signIn(data.email, data.password);

      // Show success toast
      toast.success('Welcome back! Signed in successfully.');

      // Redirect is handled by AuthProvider
    } catch (error) {
      const errorMessage = parseApiError(error);
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* API Error Message */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md text-sm">
          {apiError}
        </div>
      )}

      {/* Email Field */}
      <div className="form-group">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          {...register('email')}
          error={!!errors.email}
          disabled={isSubmitting}
        />
        {errors.email && (
          <p className="error-text mt-1">{errors.email.message}</p>
        )}
      </div>

      {/* Password Field */}
      <div className="form-group">
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="Enter your password"
          {...register('password')}
          error={!!errors.password}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="error-text mt-1">{errors.password.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center">
            <LoadingSpinner size="sm" className="mr-2" />
            Signing In...
          </span>
        ) : (
          'Sign In'
        )}
      </Button>

      {/* Sign Up Link */}
      <div className="text-center text-sm text-gray-600">
        Don't have an account?{' '}
        <a
          href="/signup"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Create one
        </a>
      </div>
    </form>
  );
}

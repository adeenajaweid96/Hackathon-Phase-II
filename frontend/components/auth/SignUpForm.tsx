/**
 * Sign Up Form Component
 *
 * Client Component for user registration with email and password.
 * Includes form validation, password strength indicator, and error handling.
 */

'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { signUpSchema, SignUpFormData, getPasswordStrength, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/lib/validation/auth-schemas';
import { useAuthContext } from '@/lib/providers/AuthProvider';
import { parseApiError } from '@/lib/utils/error-handlers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// Component
// ============================================================================

export function SignUpForm() {
  const router = useRouter();
  const { signUp } = useAuthContext();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onBlur',
  });

  // Watch password field for strength indicator
  const password = watch('password', '');

  // Update password strength when password changes
  React.useEffect(() => {
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(0);
    }
  }, [password]);

  // ============================================================================
  // Form Submission
  // ============================================================================

  const onSubmit = async (data: SignUpFormData) => {
    try {
      setIsSubmitting(true);
      setApiError(null);

      await signUp(data.email, data.password);

      // Show success toast
      toast.success('Account created successfully! Welcome aboard.');

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
          autoComplete="new-password"
          placeholder="Create a strong password"
          {...register('password')}
          error={!!errors.password}
          disabled={isSubmitting}
        />
        {errors.password && (
          <p className="error-text mt-1">{errors.password.message}</p>
        )}

        {/* Password Strength Indicator */}
        {password && (
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">Password Strength:</span>
              <span className="text-xs font-medium text-gray-700">
                {getPasswordStrengthLabel(passwordStrength)}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                style={{ width: `${(passwordStrength / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Password Requirements */}
        <div className="mt-2 text-xs text-gray-600 space-y-1">
          <p>Password must contain:</p>
          <ul className="list-disc list-inside space-y-0.5 ml-2">
            <li>At least 8 characters</li>
            <li>One uppercase letter</li>
            <li>One lowercase letter</li>
            <li>One number</li>
            <li>One special character</li>
          </ul>
        </div>
      </div>

      {/* Confirm Password Field */}
      <div className="form-group">
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
          Confirm Password
        </label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          {...register('confirmPassword')}
          error={!!errors.confirmPassword}
          disabled={isSubmitting}
        />
        {errors.confirmPassword && (
          <p className="error-text mt-1">{errors.confirmPassword.message}</p>
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
            Creating Account...
          </span>
        ) : (
          'Create Account'
        )}
      </Button>

      {/* Sign In Link */}
      <div className="text-center text-sm text-gray-600">
        Already have an account?{' '}
        <a
          href="/signin"
          className="font-medium text-primary-600 hover:text-primary-700"
        >
          Sign in
        </a>
      </div>
    </form>
  );
}

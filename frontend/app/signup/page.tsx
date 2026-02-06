/**
 * Sign Up Page
 *
 * Server Component that renders the sign up form.
 * Provides metadata and page structure for user registration.
 */

import type { Metadata } from 'next';
import { SignUpForm } from '@/components/auth/SignUpForm';

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account to start managing your todos',
};

// ============================================================================
// Page Component
// ============================================================================

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Start organizing your tasks today
          </p>
        </div>

        {/* Sign Up Form Card */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <SignUpForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </div>
      </div>
    </div>
  );
}

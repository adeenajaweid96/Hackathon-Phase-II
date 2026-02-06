/**
 * Sign In Page
 *
 * Server Component that renders the sign in form.
 * Provides metadata and page structure for user authentication.
 */

import type { Metadata } from 'next';
import { SignInForm } from '@/components/auth/SignInForm';

// ============================================================================
// Metadata
// ============================================================================

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign in to your account to access your todos',
};

// ============================================================================
// Page Component
// ============================================================================

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to continue managing your todos
          </p>
        </div>

        {/* Sign In Form Card */}
        <div className="bg-white py-8 px-6 shadow-lg rounded-lg">
          <SignInForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          Need help? Contact support@todo-app.example.com
        </div>
      </div>
    </div>
  );
}

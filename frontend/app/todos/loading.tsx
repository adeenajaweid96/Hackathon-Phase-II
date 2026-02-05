/**
 * Loading State for Todos Page
 *
 * Displays a loading spinner while todos are being fetched.
 */

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Loading your todos...</p>
      </div>
    </div>
  );
}

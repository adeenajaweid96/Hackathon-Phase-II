/**
 * Logout Button Component
 *
 * Client Component that handles user logout.
 * Calls the logout API and clears the session.
 */

'use client';

import React, { useState } from 'react';
import { useAuthContext } from '@/lib/providers/AuthProvider';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

// ============================================================================
// Component Props
// ============================================================================

interface LogoutButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  children?: React.ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function LogoutButton({
  variant = 'ghost',
  size = 'md',
  className = '',
  children = 'Logout',
}: LogoutButtonProps) {
  const { signOut } = useAuthContext();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ============================================================================
  // Logout Handler
  // ============================================================================

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await signOut();
      // Redirect is handled by AuthProvider
    } catch (error) {
      // Error is handled by AuthProvider
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? (
        <span className="flex items-center justify-center">
          <LoadingSpinner size="sm" className="mr-2" />
          Logging out...
        </span>
      ) : (
        children
      )}
    </Button>
  );
}

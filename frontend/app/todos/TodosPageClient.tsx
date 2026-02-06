/**
 * Todos Page Client Component
 *
 * Client Component that handles the todos page logic.
 * Fetches todos, manages state, and handles user interactions.
 */

'use client';

import React, { useState } from 'react';
import { useTodos } from '@/lib/hooks/useTodos';
import { useAuthContext } from '@/lib/providers/AuthProvider';
import { TodoList } from '@/components/todos/TodoList';
import { CreateTodoForm } from '@/components/todos/CreateTodoForm';
import { EditTodoForm } from '@/components/todos/EditTodoForm';
import { DeleteTodoDialog } from '@/components/todos/DeleteTodoDialog';
import { LogoutButton } from '@/components/auth/LogoutButton';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Todo } from '@/lib/types';

// ============================================================================
// Component
// ============================================================================

export function TodosPageClient() {
  const { user } = useAuthContext();
  const { data: todos, isLoading, error } = useTodos();
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleCreateClick = () => {
    setIsCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false);
  };

  const handleCreateCancel = () => {
    setIsCreateModalOpen(false);
  };

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setSelectedTodo(null);
  };

  const handleEditCancel = () => {
    setIsEditModalOpen(false);
    setSelectedTodo(null);
  };

  const handleDeleteClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    setSelectedTodo(null);
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setSelectedTodo(null);
  };

  // ============================================================================
  // Loading State
  // ============================================================================

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your todos...</p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Error State
  // ============================================================================

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Failed to load todos
          </h2>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'An unexpected error occurred'}
          </p>
          <Button onClick={() => window.location.reload()} variant="primary">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Todos</h1>
              {user && (
                <p className="text-sm text-gray-600 mt-1">
                  Welcome back, {user.email.split('@')[0]}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleCreateClick}
                variant="primary"
                size="md"
                className="flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Todo
              </Button>
              <LogoutButton variant="ghost" size="md" />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <TodoList
          todos={todos || []}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </main>

      {/* Create Todo Modal */}
      {isCreateModalOpen && (
        <Dialog
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Todo"
        >
          <CreateTodoForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </Dialog>
      )}

      {/* Edit Todo Modal */}
      {isEditModalOpen && selectedTodo && (
        <Dialog
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Todo"
        >
          <EditTodoForm
            todo={selectedTodo}
            onSuccess={handleEditSuccess}
            onCancel={handleEditCancel}
          />
        </Dialog>
      )}

      {/* Delete Todo Modal */}
      {isDeleteModalOpen && selectedTodo && (
        <Dialog
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Todo"
        >
          <DeleteTodoDialog
            todo={selectedTodo}
            onSuccess={handleDeleteSuccess}
            onCancel={handleDeleteCancel}
          />
        </Dialog>
      )}
    </div>
  );
}

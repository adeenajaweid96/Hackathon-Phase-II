/**
 * Todo Dashboard Page
 *
 * Main dashboard with search, progress tracking, and two-column layout
 */

'use client';

import React, { useState, useMemo } from 'react';
import { useTodos } from '@/lib/hooks/useTodos';
import { useAuthContext } from '@/lib/providers/AuthProvider';
import { CreateTodoModal } from '@/components/todos/CreateTodoModal';
import { TaskDetailModal } from '@/components/todos/TaskDetailModal';
import { EditTodoModal } from '@/components/todos/EditTodoModal';
import { TaskCard } from '@/components/todos/TaskCard';
import { ProgressIndicator } from '@/components/todos/ProgressIndicator';
import { SearchBar } from '@/components/todos/SearchBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { Todo } from '@/lib/types';

export function DashboardPage() {
  const { user, signOut } = useAuthContext();
  const { data: todos, isLoading, error } = useTodos();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter todos based on search query
  const filteredTodos = useMemo(() => {
    if (!todos) return [];
    if (!searchQuery.trim()) return todos;

    const query = searchQuery.toLowerCase();
    return todos.filter(
      (todo) =>
        todo.title.toLowerCase().includes(query) ||
        todo.description?.toLowerCase().includes(query)
    );
  }, [todos, searchQuery]);

  // Separate active and completed todos
  const activeTodos = useMemo(
    () => filteredTodos.filter((todo) => !todo.completed),
    [filteredTodos]
  );

  const completedTodos = useMemo(
    () => filteredTodos.filter((todo) => todo.completed),
    [filteredTodos]
  );

  // Calculate progress statistics
  const stats = useMemo(() => {
    if (!todos) return { notStarted: 0, inProgress: 0, completed: 0 };

    return {
      notStarted: todos.filter((t) => t.status === 'not_started').length,
      inProgress: todos.filter((t) => t.status === 'in_progress').length,
      completed: todos.filter((t) => t.completed).length,
    };
  }, [todos]);

  // Handlers
  const handleTaskClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsDetailModalOpen(true);
  };

  const handleEditClick = (todo: Todo) => {
    setSelectedTodo(todo);
    setIsEditModalOpen(true);
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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
            Failed to load dashboard
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Tasks</h1>
              {user && (
                <div className="mt-1 text-sm text-gray-600">
                  <span className="font-medium">{user.email.split('@')[0]}</span>
                  <span className="mx-2">•</span>
                  <span>{user.email}</span>
                </div>
              )}
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant="primary"
              size="md"
              className="flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add New Task
            </Button>
          </div>

          {/* Search Bar */}
          <div className="mt-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Progress Indicator */}
        <div className="mb-8">
          <ProgressIndicator stats={stats} totalTasks={todos?.length || 0} />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Tasks Column */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Active Tasks
              </h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                {activeTodos.length}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {activeTodos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                  <p className="text-sm">No active tasks</p>
                  <p className="text-xs mt-1">Create a new task to get started</p>
                </div>
              ) : (
                activeTodos.map((todo) => (
                  <TaskCard
                    key={todo.id}
                    todo={todo}
                    onClick={() => handleTaskClick(todo)}
                    onEdit={() => handleEditClick(todo)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Completed Tasks Column */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Completed Tasks
              </h2>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                {completedTodos.length}
              </span>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {completedTodos.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <p className="text-sm">No completed tasks yet</p>
                  <p className="text-xs mt-1">Complete tasks to see them here</p>
                </div>
              ) : (
                completedTodos.map((todo) => (
                  <TaskCard
                    key={todo.id}
                    todo={todo}
                    onClick={() => handleTaskClick(todo)}
                    onEdit={() => handleEditClick(todo)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer with Logout */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Logout
          </Button>
        </div>
      </footer>

      {/* Modals */}
      {isCreateModalOpen && (
        <CreateTodoModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

      {isDetailModalOpen && selectedTodo && (
        <TaskDetailModal
          isOpen={isDetailModalOpen}
          todo={selectedTodo}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedTodo(null);
          }}
          onEdit={() => {
            setIsDetailModalOpen(false);
            setIsEditModalOpen(true);
          }}
        />
      )}

      {isEditModalOpen && selectedTodo && (
        <EditTodoModal
          isOpen={isEditModalOpen}
          todo={selectedTodo}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedTodo(null);
          }}
        />
      )}
    </div>
  );
}

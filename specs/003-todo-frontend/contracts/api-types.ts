/**
 * API Client Type Definitions
 *
 * This file contains TypeScript interfaces for all backend API endpoints.
 * These types ensure type-safe API calls throughout the frontend application.
 *
 * Backend APIs:
 * - Authentication: specs/002-user-auth (POST /api/auth/signup, /signin, /logout, GET /api/auth/me)
 * - Todos: specs/001-todo-backend-api (GET /api/todos, POST /api/todos, PATCH /api/todos/{id}, DELETE /api/todos/{id})
 */

// ============================================================================
// Authentication API Types (Backend: specs/002-user-auth)
// ============================================================================

/**
 * POST /api/auth/signup
 * Register a new user account
 */
export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignUpResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;        // Seconds until expiration (86400 = 24 hours)
  user: {
    id: string;              // UUID
    email: string;
    created_at: string;      // ISO 8601 timestamp
    last_login_at: string;   // ISO 8601 timestamp
  };
}

/**
 * POST /api/auth/signin
 * Authenticate user and obtain JWT token
 */
export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;
  user: {
    id: string;
    email: string;
    created_at: string;
    last_login_at: string;
  };
}

/**
 * GET /api/auth/me
 * Get current authenticated user information
 */
export interface GetCurrentUserResponse {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string;
}

/**
 * POST /api/auth/logout
 * Logout user (client-side token invalidation)
 */
export interface LogoutResponse {
  message: string;           // "Logout successful"
}

// ============================================================================
// Todos API Types (Backend: specs/001-todo-backend-api)
// ============================================================================

/**
 * Todo entity structure
 */
export interface Todo {
  id: string;                // UUID
  title: string;             // 1-200 characters
  description: string | null; // Optional, max 1000 characters
  completed: boolean;
  user_id: string;           // Owner's user ID (UUID)
  created_at: string;        // ISO 8601 timestamp
  updated_at: string;        // ISO 8601 timestamp
}

/**
 * GET /api/todos
 * Retrieve all todos for authenticated user
 */
export interface GetTodosResponse {
  todos: Todo[];
}

/**
 * POST /api/todos
 * Create a new todo
 */
export interface CreateTodoRequest {
  title: string;             // Required, 1-200 characters
  description?: string;      // Optional, max 1000 characters
}

export interface CreateTodoResponse {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * PATCH /api/todos/{id}
 * Update an existing todo (partial update)
 */
export interface UpdateTodoRequest {
  title?: string;            // Optional, 1-200 characters
  description?: string;      // Optional, max 1000 characters
  completed?: boolean;       // Optional
}

export interface UpdateTodoResponse {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * DELETE /api/todos/{id}
 * Delete a todo permanently
 */
export interface DeleteTodoResponse {
  message: string;           // "Todo deleted successfully"
}

// ============================================================================
// Error Response Types
// ============================================================================

/**
 * Standard error response from backend APIs
 */
export interface ApiErrorResponse {
  error: string;             // Error type (e.g., "Validation Error", "Unauthorized")
  detail: string;            // Human-readable error message
  validation_errors?: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}

// ============================================================================
// API Client Configuration
// ============================================================================

/**
 * API client configuration options
 */
export interface ApiClientConfig {
  baseUrl: string;           // Backend API base URL (e.g., "http://localhost:8000")
  timeout?: number;          // Request timeout in milliseconds (default: 30000)
  headers?: Record<string, string>; // Additional headers
}

/**
 * API client request options
 */
export interface ApiRequestOptions {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  endpoint: string;          // API endpoint path (e.g., "/api/todos")
  body?: any;                // Request body (will be JSON stringified)
  headers?: Record<string, string>; // Additional headers
  requiresAuth?: boolean;    // Whether to include JWT token (default: true)
}

/**
 * API client response wrapper
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if response is an error
 */
export function isApiError(response: any): response is ApiErrorResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "error" in response &&
    "detail" in response
  );
}

/**
 * Type guard to check if error has validation errors
 */
export function hasValidationErrors(error: ApiErrorResponse): boolean {
  return Array.isArray(error.validation_errors) && error.validation_errors.length > 0;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Extract error message from API error response
 */
export function getErrorMessage(error: unknown): string {
  if (isApiError(error)) {
    return error.detail;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "An unexpected error occurred";
}

/**
 * Extract validation errors as field-message map
 */
export function getValidationErrors(error: ApiErrorResponse): Record<string, string> {
  if (!hasValidationErrors(error)) {
    return {};
  }

  const errors: Record<string, string> = {};
  error.validation_errors?.forEach((validationError) => {
    const field = validationError.loc[validationError.loc.length - 1];
    errors[String(field)] = validationError.msg;
  });

  return errors;
}

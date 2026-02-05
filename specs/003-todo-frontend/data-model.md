# Data Model: Todo Web Application Frontend

**Date**: 2026-02-05
**Feature**: 003-todo-frontend
**Purpose**: Define frontend state models and TypeScript interfaces for the todo application

## Overview

This document defines the data models used in the frontend application. These models represent client-side state, form data, and API response/request structures. All models use TypeScript for type safety and are designed to integrate with the existing backend APIs (specs/001-todo-backend-api and specs/002-user-auth).

## State Models

### 1. User Session State

**Purpose**: Represents the authenticated user's session state in the frontend application.

**TypeScript Interface**:

```typescript
interface UserSession {
  user: {
    id: string;              // UUID from backend
    email: string;           // User's email address
    createdAt: string;       // ISO 8601 timestamp
    lastLoginAt: string;     // ISO 8601 timestamp
  };
  token: string;             // JWT access token
  expiresAt: number;         // Token expiration timestamp (Unix epoch)
  isAuthenticated: boolean;  // Computed: true if token is valid and not expired
}

interface AuthState {
  session: UserSession | null;
  isLoading: boolean;        // True during authentication operations
  error: string | null;      // Error message if authentication fails
}
```

**Usage**:
- Managed by Better Auth and exposed via `useAuth()` hook
- Persisted across page refreshes via httpOnly cookies
- Cleared on logout or token expiration

**Validation Rules**:
- `id`: Must be valid UUID format
- `email`: Must be valid email format
- `token`: Must be non-empty JWT string
- `expiresAt`: Must be future timestamp

---

### 2. Todo Item State

**Purpose**: Represents a single todo item in the frontend application.

**TypeScript Interface**:

```typescript
interface Todo {
  id: string;                // UUID from backend
  title: string;             // Todo title (1-200 characters)
  description: string | null; // Optional description (0-1000 characters)
  completed: boolean;        // Completion status
  userId: string;            // Owner's user ID (UUID)
  createdAt: string;         // ISO 8601 timestamp
  updatedAt: string;         // ISO 8601 timestamp
}

interface TodosState {
  todos: Todo[];             // Array of all user's todos
  isLoading: boolean;        // True during fetch operations
  error: string | null;      // Error message if fetch fails
  lastFetched: number | null; // Timestamp of last successful fetch
}
```

**Usage**:
- Fetched from backend API on todos page load
- Updated optimistically on create/update/delete operations
- Filtered and sorted in the UI layer

**Validation Rules**:
- `id`: Must be valid UUID format
- `title`: Required, 1-200 characters
- `description`: Optional, max 1000 characters
- `completed`: Boolean (true/false)
- `userId`: Must match authenticated user's ID

---

### 3. Form State Models

**Purpose**: Represents form input state and validation errors.

**TypeScript Interfaces**:

```typescript
// Sign Up Form
interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;   // Client-side only, not sent to backend
}

interface SignUpFormState {
  data: SignUpFormData;
  errors: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;        // General form error (e.g., "Email already exists")
  };
  isSubmitting: boolean;
  isValid: boolean;          // Computed: true if no validation errors
}

// Sign In Form
interface SignInFormData {
  email: string;
  password: string;
}

interface SignInFormState {
  data: SignInFormData;
  errors: {
    email?: string;
    password?: string;
    general?: string;        // General form error (e.g., "Invalid credentials")
  };
  isSubmitting: boolean;
  isValid: boolean;
}

// Create Todo Form
interface CreateTodoFormData {
  title: string;
  description: string;
}

interface CreateTodoFormState {
  data: CreateTodoFormData;
  errors: {
    title?: string;
    description?: string;
    general?: string;
  };
  isSubmitting: boolean;
  isValid: boolean;
}

// Edit Todo Form
interface EditTodoFormData {
  id: string;                // Todo ID being edited
  title: string;
  description: string;
}

interface EditTodoFormState {
  data: EditTodoFormData;
  errors: {
    title?: string;
    description?: string;
    general?: string;
  };
  isSubmitting: boolean;
  isValid: boolean;
}
```

**Usage**:
- Managed by React Hook Form or custom form hooks
- Validated on blur and on submit
- Errors displayed inline next to form fields

**Validation Rules**:
- **Email**: Must match RFC 5322 email format
- **Password**: 8+ characters, must contain uppercase, lowercase, number, special character
- **Confirm Password**: Must match password field
- **Title**: Required, 1-200 characters, no leading/trailing whitespace
- **Description**: Optional, max 1000 characters

---

## API Request/Response Models

### Authentication API (Backend: specs/002-user-auth)

```typescript
// POST /api/auth/signup
interface SignUpRequest {
  email: string;
  password: string;
}

interface SignUpResponse {
  access_token: string;
  token_type: "bearer";
  expires_in: number;        // Seconds until expiration (86400 = 24 hours)
  user: {
    id: string;
    email: string;
    created_at: string;
    last_login_at: string;
  };
}

// POST /api/auth/signin
interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
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

// GET /api/auth/me
interface GetCurrentUserResponse {
  id: string;
  email: string;
  created_at: string;
  last_login_at: string;
}

// POST /api/auth/logout
interface LogoutResponse {
  message: string;           // "Logout successful"
}
```

---

### Todos API (Backend: specs/001-todo-backend-api)

```typescript
// GET /api/todos
interface GetTodosResponse {
  todos: Todo[];             // Array of user's todos
}

// POST /api/todos
interface CreateTodoRequest {
  title: string;
  description?: string;
}

interface CreateTodoResponse {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// PATCH /api/todos/{id}
interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

interface UpdateTodoResponse {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// DELETE /api/todos/{id}
interface DeleteTodoResponse {
  message: string;           // "Todo deleted successfully"
}
```

---

### Error Response Model

```typescript
interface ApiErrorResponse {
  error: string;             // Error type (e.g., "Validation Error", "Unauthorized")
  detail: string;            // Human-readable error message
  validation_errors?: Array<{
    loc: (string | number)[];
    msg: string;
    type: string;
  }>;
}
```

---

## UI State Models

### Loading States

```typescript
interface LoadingState {
  isLoading: boolean;
  message?: string;          // Optional loading message (e.g., "Signing in...")
}

interface PageLoadingState {
  todos: boolean;            // True while fetching todos
  auth: boolean;             // True during authentication
  submit: boolean;           // True during form submission
}
```

---

### Dialog/Modal State

```typescript
interface DialogState {
  isOpen: boolean;
  type: "delete" | "edit" | "error" | null;
  data?: any;                // Context-specific data (e.g., todo ID for delete)
}

interface DeleteTodoDialogState {
  isOpen: boolean;
  todoId: string | null;
  todoTitle: string | null;
  isDeleting: boolean;
}
```

---

## State Management Strategy

### Server State (React Query)

**Managed by React Query** for data fetched from backend APIs:
- Todos list
- Current user information
- Automatic caching and revalidation
- Optimistic updates for mutations

```typescript
// Example: useTodos hook
interface UseTodosResult {
  todos: Todo[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  createTodo: (data: CreateTodoRequest) => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}
```

### Client State (React Context)

**Managed by React Context** for authentication state:
- User session
- Authentication status
- Token management

```typescript
// Example: useAuth hook
interface UseAuthResult {
  session: UserSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

### Local Component State (useState)

**Managed by React useState** for UI-only state:
- Form input values
- Dialog open/close state
- Loading indicators
- Validation errors

---

## Data Flow

### Authentication Flow

```
1. User submits SignInForm
   ↓
2. Form validates input (client-side)
   ↓
3. API client calls POST /api/auth/signin
   ↓
4. Backend validates credentials and returns JWT token
   ↓
5. Better Auth stores token in httpOnly cookie
   ↓
6. AuthContext updates session state
   ↓
7. User redirected to /todos page
   ↓
8. Middleware verifies token before rendering
```

### Todo CRUD Flow

```
1. User loads /todos page
   ↓
2. React Query fetches GET /api/todos
   ↓
3. API client includes JWT token in Authorization header
   ↓
4. Backend validates token and returns user's todos
   ↓
5. React Query caches response
   ↓
6. TodoList component renders todos
   ↓
7. User creates/updates/deletes todo
   ↓
8. React Query performs optimistic update (UI updates immediately)
   ↓
9. API client calls backend endpoint
   ↓
10. On success: cache updated, UI reflects server state
11. On error: optimistic update rolled back, error displayed
```

---

## Type Safety

All models are defined in `src/lib/types.ts` and exported for use throughout the application:

```typescript
// src/lib/types.ts
export type {
  // Session
  UserSession,
  AuthState,

  // Todos
  Todo,
  TodosState,

  // Forms
  SignUpFormData,
  SignUpFormState,
  SignInFormData,
  SignInFormState,
  CreateTodoFormData,
  CreateTodoFormState,
  EditTodoFormData,
  EditTodoFormState,

  // API
  SignUpRequest,
  SignUpResponse,
  SignInRequest,
  SignInResponse,
  GetCurrentUserResponse,
  LogoutResponse,
  GetTodosResponse,
  CreateTodoRequest,
  CreateTodoResponse,
  UpdateTodoRequest,
  UpdateTodoResponse,
  DeleteTodoResponse,
  ApiErrorResponse,

  // UI
  LoadingState,
  PageLoadingState,
  DialogState,
  DeleteTodoDialogState,
};
```

---

## Summary

The frontend data model is designed for:
- **Type Safety**: All data structures defined with TypeScript interfaces
- **API Integration**: Request/response models match backend API contracts
- **State Management**: Clear separation between server state (React Query) and client state (Context/useState)
- **Validation**: Client-side validation rules match backend requirements
- **User Experience**: Optimistic updates and loading states for responsive UI

**Next Steps**: Implement TypeScript interfaces in `src/lib/types.ts` and create API client in `src/lib/api-client.ts`

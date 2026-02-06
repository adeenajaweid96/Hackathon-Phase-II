# Frontend Architecture Research

**Feature**: Todo Web Application Frontend (003-todo-frontend)
**Date**: 2026-02-05
**Purpose**: Research and document frontend architecture decisions for Next.js 16+ App Router implementation

---

## 1. Next.js 16+ App Router Architecture

### Decision Made

**Server Components by Default, Client Components Only When Necessary**

- Use Server Components as the default for all pages and layouts
- Use Client Components only for interactive features requiring browser APIs, event handlers, or React hooks
- Implement a clear separation: Server Components for data fetching and static content, Client Components for forms, buttons, and interactive UI elements
- Organize routes using the App Router file-based routing with proper layout nesting

**File Structure:**
```
app/
├── layout.tsx                 # Root layout (Server Component)
├── page.tsx                   # Landing/redirect page (Server Component)
├── (auth)/                    # Route group for auth pages
│   ├── signin/
│   │   └── page.tsx          # Sign in page (Server Component wrapper)
│   └── signup/
│       └── page.tsx          # Sign up page (Server Component wrapper)
├── (protected)/              # Route group for authenticated routes
│   ├── layout.tsx            # Protected layout with auth check
│   └── todos/
│       └── page.tsx          # Todos page (Server Component wrapper)
├── components/
│   ├── auth/
│   │   ├── SignInForm.tsx   # Client Component
│   │   └── SignUpForm.tsx   # Client Component
│   └── todos/
│       ├── TodoList.tsx     # Server Component
│       ├── TodoItem.tsx     # Client Component
│       ├── CreateTodoForm.tsx # Client Component
│       └── EditTodoForm.tsx # Client Component
└── middleware.ts             # Route protection middleware
```

### Rationale

1. **Performance**: Server Components reduce JavaScript bundle size by rendering on the server and sending only HTML to the client
2. **SEO**: Server-side rendering improves initial page load and search engine indexing
3. **Security**: Sensitive operations (token validation, API calls with secrets) happen on the server
4. **Data Fetching**: Server Components can directly fetch data without exposing API endpoints to the client
5. **Simplicity**: Default to Server Components keeps the architecture simple; only opt into client-side complexity when needed

### Alternatives Considered

**Option A: Client Components Everywhere (Pages Router Pattern)**
- Rejected: Increases bundle size, slower initial load, loses Server Component benefits
- Would work but goes against Next.js 16+ App Router design philosophy

**Option B: Server Actions for All Mutations**
- Partially adopted: Will use Server Actions for form submissions where appropriate
- However, some client-side API calls are needed for optimistic updates and real-time feedback

**Option C: Full Static Generation**
- Rejected: Todo app requires authentication and user-specific data, making static generation impractical
- Dynamic routes and user-specific content require server-side rendering or client-side fetching

### Implementation Notes

1. **Component Boundaries**: Mark Client Components with `'use client'` directive at the top of the file
2. **Data Flow**: Pass data from Server Components to Client Components via props (serializable data only)
3. **Middleware**: Use Next.js middleware for route protection before page rendering
4. **Layouts**: Nest layouts to avoid re-rendering shared UI (auth layout, protected layout)
5. **Loading States**: Use `loading.tsx` files for automatic loading UI during navigation
6. **Error Handling**: Use `error.tsx` files for error boundaries at route segment level

---

## 2. Better Auth Integration

### Decision Made

**Better Auth with JWT Tokens Stored in httpOnly Cookies**

- Configure Better Auth to issue JWT tokens upon successful authentication
- Store tokens in httpOnly, secure, sameSite cookies (managed by Better Auth)
- Use Better Auth React hooks for authentication state in Client Components
- Implement middleware to verify tokens and protect routes before rendering
- Create an authentication context provider for client-side auth state

**Authentication Flow:**
1. User submits credentials via Client Component form
2. Form calls Better Auth API route (Server Component or API route)
3. Better Auth validates credentials and issues JWT token in httpOnly cookie
4. Client receives success response and redirects to protected route
5. Middleware intercepts protected route requests and verifies JWT token
6. Server Components can access user session via Better Auth server utilities
7. Client Components access auth state via Better Auth React hooks

### Rationale

1. **Security**: httpOnly cookies prevent XSS attacks from stealing tokens
2. **Automatic Token Management**: Better Auth handles token refresh and expiration
3. **Server-Side Verification**: Middleware verifies tokens before rendering, preventing unauthorized access
4. **Seamless Integration**: Better Auth is designed for Next.js App Router with built-in support
5. **Session Persistence**: Cookies persist across page refreshes and browser sessions

### Alternatives Considered

**Option A: localStorage for Token Storage**
- Rejected: Vulnerable to XSS attacks; tokens accessible to JavaScript
- Not recommended for production applications with sensitive data

**Option B: Custom JWT Implementation**
- Rejected: Reinventing the wheel; Better Auth provides battle-tested implementation
- Would require significant development time and security auditing

**Option C: Session-Based Authentication (Server-Side Sessions)**
- Rejected: Requires session store (Redis, database), adds infrastructure complexity
- JWT tokens are stateless and align with existing backend implementation

### Implementation Notes

1. **Better Auth Configuration**: Create `auth.ts` config file with JWT settings, cookie options, and providers
2. **API Routes**: Create Better Auth API routes at `/api/auth/[...all]/route.ts`
3. **Middleware**: Implement `middleware.ts` to verify tokens and redirect unauthenticated users
4. **Auth Context**: Create `AuthProvider` component to wrap the app and provide auth state
5. **Protected Routes**: Use middleware matcher to specify which routes require authentication
6. **Token Verification**: Backend API must verify JWT tokens on every request (already implemented per spec)
7. **Error Handling**: Handle token expiration gracefully with redirect to signin page

**Environment Variables Required:**
```
BETTER_AUTH_SECRET=<secret-key>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 3. API Client Architecture

### Decision Made

**Native Fetch API with Custom Wrapper for Type Safety and Token Injection**

- Use native `fetch` API (built into Next.js and modern browsers)
- Create a custom API client wrapper that handles:
  - Base URL configuration
  - JWT token injection from cookies
  - Error handling and response parsing
  - TypeScript type safety for requests and responses
- Implement separate functions for each API endpoint with proper typing

**API Client Structure:**
```typescript
// lib/api/client.ts
export async function apiClient<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    credentials: 'include', // Include cookies
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}

// lib/api/todos.ts
export const todosApi = {
  getAll: () => apiClient<Todo[]>('/api/todos'),
  create: (data: CreateTodoInput) => apiClient<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  update: (id: string, data: UpdateTodoInput) => apiClient<Todo>(`/api/todos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  delete: (id: string) => apiClient<void>(`/api/todos/${id}`, {
    method: 'DELETE',
  }),
};
```

### Rationale

1. **Native Fetch**: No additional dependencies, smaller bundle size, built-in to Next.js
2. **Type Safety**: TypeScript generics ensure type-safe API calls and responses
3. **Automatic Token Injection**: `credentials: 'include'` automatically sends httpOnly cookies
4. **Centralized Error Handling**: Custom wrapper handles errors consistently across all API calls
5. **Simplicity**: Straightforward implementation without learning curve of external libraries

### Alternatives Considered

**Option A: Axios Library**
- Rejected: Adds 13KB to bundle size, provides features we don't need (interceptors, request cancellation)
- Native fetch is sufficient for our use case

**Option B: React Query / TanStack Query**
- Partially adopted: Will use for caching and state management (see State Management section)
- React Query works well with fetch-based API clients

**Option C: Next.js Server Actions for All API Calls**
- Rejected: Server Actions are great for mutations but not ideal for data fetching in Client Components
- Would require more complex state management and lose optimistic update capabilities

### Implementation Notes

1. **Error Handling**: Create custom `ApiError` class with status code and error message
2. **Type Definitions**: Define TypeScript interfaces for all API request/response types
3. **Environment Variables**: Use `NEXT_PUBLIC_API_URL` for client-side API calls
4. **CORS**: Backend must allow credentials and set appropriate CORS headers
5. **Retry Logic**: Implement retry for network errors (optional, can add later)
6. **Request Cancellation**: Use AbortController for cancellable requests (optional)

---

## 4. State Management

### Decision Made

**React Query (TanStack Query) for Server State + React Context for Auth State**

- Use React Query for managing server state (todos data, caching, refetching)
- Use React Context for authentication state (user info, session status)
- Use local component state (useState) for UI state (form inputs, modals, loading)
- Avoid global state libraries (Redux, Zustand) for this simple application

**State Architecture:**
```typescript
// Server State (React Query)
- Todo list data
- Individual todo data
- Automatic caching and refetching
- Optimistic updates for mutations

// Auth State (React Context)
- Current user information
- Authentication status
- Session management

// Local Component State (useState)
- Form input values
- Modal open/closed state
- Loading indicators
- Validation errors
```

### Rationale

1. **React Query Benefits**: Automatic caching, background refetching, optimistic updates, loading/error states
2. **Separation of Concerns**: Server state (todos) separate from auth state separate from UI state
3. **Simplicity**: No need for complex global state management for a simple todo app
4. **Performance**: React Query prevents unnecessary API calls with intelligent caching
5. **Developer Experience**: React Query DevTools provide excellent debugging capabilities

### Alternatives Considered

**Option A: Redux Toolkit**
- Rejected: Overkill for this application; adds complexity and boilerplate
- React Query handles server state better than Redux

**Option B: Zustand for Global State**
- Rejected: Not needed for this simple application; React Context is sufficient for auth state
- Would add unnecessary dependency

**Option C: useState + useEffect Everywhere**
- Rejected: Leads to repetitive code, no caching, manual loading/error state management
- React Query provides these features out of the box

**Option D: Server Components Only (No Client State)**
- Rejected: Loses optimistic updates, real-time feedback, and interactive UI capabilities
- Todo app requires client-side interactivity

### Implementation Notes

1. **React Query Setup**: Create `QueryClientProvider` wrapper in root layout
2. **Query Keys**: Define consistent query key structure (`['todos']`, `['todos', id]`)
3. **Mutations**: Use `useMutation` for create, update, delete operations
4. **Optimistic Updates**: Implement optimistic updates for better UX (update UI before API response)
5. **Cache Invalidation**: Invalidate queries after mutations to refetch fresh data
6. **Auth Context**: Create `AuthContext` and `useAuth` hook for accessing auth state
7. **Persistence**: React Query can persist cache to localStorage (optional)

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      cacheTime: 1000 * 60 * 10, // 10 minutes
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});
```

---

## 5. Form Handling and Validation

### Decision Made

**Controlled Components with React Hook Form + Zod for Validation**

- Use React Hook Form for form state management and submission
- Use Zod for schema-based validation (client-side)
- Implement controlled components for all form inputs
- Display validation errors inline below each input field
- Show loading state during form submission
- Handle API errors and display them to users

**Form Pattern:**
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

type TodoFormData = z.infer<typeof todoSchema>;

function CreateTodoForm() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<TodoFormData>({
    resolver: zodResolver(todoSchema),
  });

  const onSubmit = async (data: TodoFormData) => {
    // API call
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      {errors.title && <span>{errors.title.message}</span>}
      <button disabled={isSubmitting}>Create</button>
    </form>
  );
}
```

### Rationale

1. **React Hook Form**: Reduces re-renders, excellent performance, minimal boilerplate
2. **Zod Validation**: Type-safe schema validation, reusable schemas, clear error messages
3. **Controlled Components**: Predictable state management, easier testing, better UX
4. **Client-Side Validation**: Immediate feedback before API call, reduces server load
5. **Type Safety**: Zod schemas generate TypeScript types automatically

### Alternatives Considered

**Option A: Uncontrolled Components with FormData**
- Rejected: Less control over form state, harder to implement real-time validation
- Controlled components provide better UX for this application

**Option B: Formik for Form Management**
- Rejected: React Hook Form has better performance and smaller bundle size
- React Hook Form is more modern and actively maintained

**Option C: Manual Validation with useState**
- Rejected: Repetitive code, error-prone, no schema reusability
- Zod provides declarative validation with type safety

**Option D: Server-Side Validation Only**
- Rejected: Poor UX (requires round trip to server for validation feedback)
- Client-side validation provides immediate feedback; server-side is still needed for security

### Implementation Notes

1. **Validation Schemas**: Define Zod schemas matching backend validation rules
2. **Error Display**: Show validation errors inline below each input field with red text
3. **Loading States**: Disable submit button and show loading indicator during submission
4. **API Error Handling**: Display API errors (400, 401, 500) in a toast or alert component
5. **Form Reset**: Reset form after successful submission
6. **Accessibility**: Use proper ARIA labels and error announcements for screen readers
7. **Password Validation**: For signup form, show password requirements and validate in real-time

**Password Validation Schema:**
```typescript
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');
```

---

## 6. Error Handling

### Decision Made

**Multi-Layer Error Handling Strategy**

1. **Route-Level Error Boundaries**: Use Next.js `error.tsx` files for catching rendering errors
2. **API Error Handling**: Custom error classes with status codes and user-friendly messages
3. **Form Validation Errors**: Display inline below form fields
4. **Network Errors**: Show retry button and error message
5. **Session Expiration**: Redirect to signin page with message
6. **Toast Notifications**: Use toast library for non-blocking error messages

**Error Handling Layers:**
```typescript
// 1. API Client Error Handling
class ApiError extends Error {
  constructor(public status: number, public data: any) {
    super(`API Error: ${status}`);
  }
}

// 2. React Query Error Handling
const { data, error, isError } = useQuery({
  queryKey: ['todos'],
  queryFn: todosApi.getAll,
  onError: (error) => {
    if (error instanceof ApiError && error.status === 401) {
      // Redirect to signin
    }
  },
});

// 3. Error Boundary (error.tsx)
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}

// 4. Form Error Handling
const onSubmit = async (data) => {
  try {
    await todosApi.create(data);
    toast.success('Todo created!');
  } catch (error) {
    if (error instanceof ApiError) {
      toast.error(error.data.message || 'Failed to create todo');
    }
  }
};
```

### Rationale

1. **User-Friendly Messages**: Convert technical errors to understandable messages
2. **Graceful Degradation**: App remains functional even when errors occur
3. **Recovery Options**: Provide retry buttons and clear next steps
4. **Security**: Don't expose sensitive error details to users
5. **Debugging**: Log detailed errors to console for development

### Alternatives Considered

**Option A: Global Error Handler Only**
- Rejected: Too coarse-grained; different errors need different handling strategies
- Route-level and component-level errors need specific handling

**Option B: Alert() for All Errors**
- Rejected: Poor UX; blocks user interaction; not modern
- Toast notifications are non-blocking and more user-friendly

**Option C: Silent Error Handling**
- Rejected: Users need to know when something goes wrong
- Transparency builds trust and helps users understand what happened

### Implementation Notes

1. **Error Boundaries**: Create `error.tsx` files at route segment level for catching rendering errors
2. **API Error Classes**: Define custom error classes with status codes and messages
3. **Toast Library**: Use `react-hot-toast` or `sonner` for toast notifications
4. **Error Messages**: Map API error codes to user-friendly messages
5. **Retry Logic**: Implement retry buttons for network errors
6. **Session Expiration**: Detect 401 errors and redirect to signin with message
7. **Logging**: Log errors to console in development, send to monitoring service in production

**Error Message Mapping:**
```typescript
const errorMessages: Record<number, string> = {
  400: 'Invalid request. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  500: 'Server error. Please try again later.',
};

function getErrorMessage(status: number): string {
  return errorMessages[status] || 'An unexpected error occurred.';
}
```

**Session Expiration Handling:**
```typescript
// In API client or React Query error handler
if (error instanceof ApiError && error.status === 401) {
  // Clear auth state
  await signOut();
  // Redirect to signin with message
  router.push('/signin?error=session_expired');
}
```

---

## Summary of Decisions

| Area | Decision | Key Benefit |
|------|----------|-------------|
| **App Router Architecture** | Server Components by default, Client Components for interactivity | Reduced bundle size, better performance, improved SEO |
| **Better Auth Integration** | JWT tokens in httpOnly cookies with Better Auth | Secure token storage, automatic session management |
| **API Client** | Native fetch with custom wrapper | No dependencies, type-safe, automatic token injection |
| **State Management** | React Query for server state + Context for auth | Automatic caching, optimistic updates, simple architecture |
| **Form Handling** | React Hook Form + Zod validation | Performance, type safety, declarative validation |
| **Error Handling** | Multi-layer strategy with error boundaries and toasts | User-friendly messages, graceful degradation, recovery options |

---

## Implementation Priorities

### Phase 1: Foundation (P1)
1. Set up Next.js 16+ App Router project structure
2. Configure Better Auth with JWT tokens
3. Implement authentication pages (signin, signup)
4. Create API client wrapper with fetch
5. Set up middleware for route protection

### Phase 2: Core Features (P2)
1. Implement todo list display (Server Component + Client Component)
2. Create todo creation form with validation
3. Set up React Query for todo data management
4. Implement error boundaries and error handling

### Phase 3: Enhanced UX (P3)
1. Add optimistic updates for todo mutations
2. Implement toast notifications for feedback
3. Add loading states and skeletons
4. Handle session expiration gracefully

### Phase 4: Polish (P4)
1. Add form validation with real-time feedback
2. Implement retry logic for failed requests
3. Add accessibility improvements
4. Optimize performance and bundle size

---

## Technical Constraints and Considerations

### Constitutional Compliance
- **Stack Requirement**: Must use Next.js 16+ App Router (no Pages Router)
- **Authentication**: Must use Better Auth with JWT tokens
- **Agent Assignment**: Frontend work must be done by `nextjs-performance-architect` agent
- **No Manual Coding**: All implementation via spec-driven workflow

### Security Requirements
- JWT tokens must be stored in httpOnly cookies (not localStorage)
- All API calls must include credentials for automatic token injection
- Backend must verify tokens on every request
- No sensitive data in client-side code

### Performance Requirements
- Initial page load under 3 seconds
- Form submissions provide feedback within 3 seconds
- Loading states visible for operations over 500ms
- Responsive design for mobile (320px) to desktop (1920px)

### Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge - last 2 versions)
- No IE11 support required
- Native fetch API available in all target browsers

---

## Next Steps

1. **Review and Approve**: Review this research document and approve architectural decisions
2. **Create Plan**: Generate detailed implementation plan using `/sp.plan`
3. **Break into Tasks**: Generate actionable tasks using `/sp.tasks`
4. **Implement**: Execute tasks using `nextjs-performance-architect` agent via `/sp.implement`

---

## References

- **Specifications**:
  - `specs/003-todo-frontend/spec.md` - Frontend feature specification
  - `specs/002-user-auth/spec.md` - Authentication specification
  - `specs/001-todo-backend-api/spec.md` - Backend API specification
- **Constitution**: `.specify/memory/constitution.md` - Project principles and requirements
- **Technology Stack**: Next.js 16+, Better Auth, React Query, React Hook Form, Zod

---

**Document Status**: Complete
**Ready for Planning**: Yes
**Architectural Decisions**: 6 major decisions documented
**Next Phase**: Generate implementation plan

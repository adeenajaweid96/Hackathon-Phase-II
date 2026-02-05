---

description: "Task list for Todo Web Application Frontend implementation"
---

# Tasks: Todo Web Application Frontend

**Input**: Design documents from `/specs/003-todo-frontend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted. Focus is on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4, US5)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `frontend/src/`, `frontend/tests/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for the Next.js frontend application

- [x] T001 Create Next.js 16+ application with TypeScript and App Router in frontend/ directory using create-next-app
- [x] T002 Install core dependencies in frontend/package.json (better-auth, @better-auth/react, @tanstack/react-query, react-hook-form, zod, @hookform/resolvers, sonner)
- [x] T003 [P] Configure Tailwind CSS in frontend/tailwind.config.js with custom theme settings
- [x] T004 [P] Create environment variable template in frontend/.env.local.example (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, JWT_SECRET)
- [x] T005 [P] Configure Next.js in frontend/next.config.js with API rewrites and environment settings
- [x] T006 [P] Create TypeScript configuration in frontend/tsconfig.json with strict mode and path aliases

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Create TypeScript type definitions in frontend/lib/types.ts (UserSession, AuthState, Todo, TodosState, all form states, API request/response types)
- [x] T008 Create API client wrapper in frontend/lib/api-client.ts (fetch wrapper with base URL, JWT token injection, error handling, type-safe methods)
- [x] T009 [P] Configure Better Auth in frontend/lib/auth.ts (JWT-only mode, credentials provider, httpOnly cookies, 24-hour expiration)
- [x] T010 [P] Create Better Auth API route in frontend/app/api/auth/[...betterauth]/route.ts (handle Better Auth callbacks)
- [x] T011 Create authentication context provider in frontend/lib/providers/AuthProvider.tsx (wrap Better Auth, expose useAuth hook)
- [x] T012 Create useAuth hook in frontend/lib/hooks/useAuth.ts (manage auth state, provide signin/signup/logout methods)
- [x] T013 Create route protection middleware in frontend/middleware.ts (verify JWT token, redirect unauthenticated users, protect /todos routes)
- [x] T014 [P] Create reusable UI components in frontend/components/ui/ (Button.tsx, Input.tsx, Checkbox.tsx, Dialog.tsx, LoadingSpinner.tsx)
- [x] T015 Create root layout in frontend/app/layout.tsx (wrap app with AuthProvider, include global styles, metadata)
- [x] T016 Create global styles in frontend/styles/globals.css (Tailwind imports, custom CSS variables, base styles)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Authentication (Priority: P1) 🎯 MVP

**Goal**: Enable users to sign up, sign in, and log out with proper authentication flow and session management

**Independent Test**: Create a new account via signup page, verify redirect to todos page, logout, sign in with same credentials, verify authentication persists across page refresh

### Implementation for User Story 1

- [x] T017 [P] [US1] Create signup page in frontend/app/signup/page.tsx (Server Component wrapper with SignUpForm)
- [x] T018 [P] [US1] Create signin page in frontend/app/signin/page.tsx (Server Component wrapper with SignInForm)
- [x] T019 [US1] Create SignUpForm component in frontend/components/auth/SignUpForm.tsx (Client Component with email/password fields, validation, API integration)
- [x] T020 [US1] Create SignInForm component in frontend/components/auth/SignInForm.tsx (Client Component with email/password fields, validation, API integration)
- [x] T021 [US1] Implement form validation schemas in frontend/lib/validation/auth-schemas.ts (Zod schemas for signup and signin with password complexity rules)
- [x] T022 [US1] Create LogoutButton component in frontend/components/auth/LogoutButton.tsx (Client Component that calls logout API and clears session)
- [x] T023 [US1] Create home page with redirect logic in frontend/app/page.tsx (redirect authenticated users to /todos, unauthenticated to /signin)
- [x] T024 [US1] Add authentication error handling in frontend/lib/utils/error-handlers.ts (parse API errors, display user-friendly messages)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - View Todo List (Priority: P2)

**Goal**: Display all todos belonging to the authenticated user with loading states and empty state handling

**Independent Test**: Sign in as a user with existing todos, verify only their todos are displayed with correct status indicators, verify loading state appears during fetch

### Implementation for User Story 2

- [x] T025 [US2] Create todos page in frontend/app/todos/page.tsx (Server Component wrapper that fetches and displays todos)
- [x] T026 [US2] Create useTodos hook in frontend/lib/hooks/useTodos.ts (React Query hook for fetching todos, caching, and mutations)
- [x] T027 [US2] Create TodoList component in frontend/components/todos/TodoList.tsx (Server Component that renders list of todos)
- [x] T028 [US2] Create TodoItem component in frontend/components/todos/TodoItem.tsx (Client Component for individual todo with completion checkbox, edit/delete buttons)
- [x] T029 [US2] Create EmptyState component in frontend/components/todos/EmptyState.tsx (display when user has no todos)
- [x] T030 [US2] Add loading state UI in frontend/app/todos/loading.tsx (loading spinner for todos page)
- [x] T031 [US2] Add error boundary in frontend/app/todos/error.tsx (handle and display errors gracefully)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (MVP complete)

---

## Phase 5: User Story 3 - Create New Todo (Priority: P3)

**Goal**: Enable users to create new todos with title and optional description

**Independent Test**: Sign in, click "Add Todo" button, fill in form with title and description, submit, verify new todo appears in list immediately

### Implementation for User Story 3

- [x] T032 [US3] Create CreateTodoForm component in frontend/components/todos/CreateTodoForm.tsx (Client Component with title/description fields, validation, optimistic update)
- [x] T033 [US3] Implement form validation schema in frontend/lib/validation/todo-schemas.ts (Zod schema for create todo with title required, description optional)
- [x] T034 [US3] Add create todo mutation to useTodos hook in frontend/lib/hooks/useTodos.ts (React Query mutation with optimistic update)
- [x] T035 [US3] Integrate CreateTodoForm into todos page in frontend/app/todos/page.tsx (add "Add Todo" button and form modal/section)

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - Update and Complete Todos (Priority: P4)

**Goal**: Enable users to edit todo title/description and toggle completion status

**Independent Test**: Edit an existing todo's title, save changes, verify update reflected in list, toggle completion checkbox, verify visual change

### Implementation for User Story 4

- [x] T036 [US4] Create EditTodoForm component in frontend/components/todos/EditTodoForm.tsx (Client Component with pre-filled title/description, validation, optimistic update)
- [x] T037 [US4] Add update todo mutation to useTodos hook in frontend/lib/hooks/useTodos.ts (React Query mutation with optimistic update)
- [x] T038 [US4] Add toggle completion mutation to useTodos hook in frontend/lib/hooks/useTodos.ts (React Query mutation for PATCH /api/todos/{id} with completed field)
- [x] T039 [US4] Integrate edit functionality into TodoItem component in frontend/components/todos/TodoItem.tsx (add edit button, show EditTodoForm in modal/inline)
- [x] T040 [US4] Add completion toggle to TodoItem component in frontend/components/todos/TodoItem.tsx (checkbox that calls toggle mutation)
- [x] T041 [US4] Add visual distinction for completed todos in frontend/components/todos/TodoItem.tsx (strikethrough text, different background color)

**Checkpoint**: All user stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - Delete Todos (Priority: P5)

**Goal**: Enable users to permanently delete todos with confirmation dialog to prevent accidental deletion

**Independent Test**: Click delete button on a todo, verify confirmation dialog appears, confirm deletion, verify todo is removed from list

### Implementation for User Story 5

- [x] T042 [US5] Create DeleteTodoDialog component in frontend/components/todos/DeleteTodoDialog.tsx (Client Component with confirmation message, cancel/confirm buttons)
- [x] T043 [US5] Add delete todo mutation to useTodos hook in frontend/lib/hooks/useTodos.ts (React Query mutation with optimistic update)
- [x] T044 [US5] Integrate delete functionality into TodoItem component in frontend/components/todos/TodoItem.tsx (add delete button, show DeleteTodoDialog)
- [x] T045 [US5] Add error handling for failed deletion in frontend/components/todos/DeleteTodoDialog.tsx (display error message, keep todo in list on failure)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final touches

- [x] T046 [P] Add toast notifications using sonner in frontend/lib/providers/ToastProvider.tsx (success/error messages for all operations)
- [x] T047 [P] Integrate toast notifications into all mutations in frontend/lib/hooks/useTodos.ts (show success/error toasts)
- [x] T048 [P] Add responsive design improvements in frontend/styles/globals.css (ensure mobile-first design, test 320px to 1920px)
- [x] T049 [P] Add loading states to all form submissions (disable buttons, show spinners during API calls)
- [x] T050 [P] Add session expiration handling in frontend/middleware.ts (detect expired tokens, redirect to signin with message)
- [x] T051 [P] Create frontend README in frontend/README.md (setup instructions, development workflow, testing guide)
- [x] T052 [P] Add API error handling improvements in frontend/lib/api-client.ts (handle network errors, timeout errors, parse validation errors)
- [x] T053 Verify all forms have proper validation and error display (inline errors, clear messages)
- [x] T054 Verify responsive design on mobile devices (test on 320px, 375px, 768px, 1024px, 1920px widths)
- [x] T055 Run quickstart.md validation (verify setup instructions work, test all user flows manually)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4 → P5)
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories (requires US1 for authentication but independently testable)
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires US2 for display but independently testable
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires US2 for display but independently testable
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Requires US2 for display but independently testable

### Within Each User Story

- Forms before integration with pages
- Validation schemas before forms
- Hooks before components that use them
- UI components before page integration
- Core implementation before error handling
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- All Polish tasks marked [P] can run in parallel

---

## Parallel Example: Foundational Phase

```bash
# Launch foundational tasks in parallel:
Task: "Configure Better Auth in frontend/src/lib/auth.ts"
Task: "Create Better Auth API route in frontend/src/app/api/auth/[...betterauth]/route.ts"
Task: "Create reusable UI components in frontend/src/components/ui/"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Authentication)
4. Complete Phase 4: User Story 2 (View Todos)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready (MVP complete!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Authentication)
   - Developer B: User Story 2 (View Todos) - can start in parallel
   - Developer C: User Story 3 (Create Todo) - can start in parallel
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Agent Assignment

**All implementation tasks** will be executed by the `nextjs-performance-architect` agent per constitutional requirements (Principle III: Stack-Specific Agent Assignment).

**Rationale**: Frontend development with Next.js 16+ App Router requires specialized expertise in:
- Server Components vs Client Components strategy
- App Router file-based routing and layouts
- React Query for server state management
- Better Auth integration with Next.js
- Responsive design and performance optimization
- TypeScript type safety throughout the application

---

## Task Summary

**Total Tasks**: 55
**Setup Phase**: 6 tasks
**Foundational Phase**: 10 tasks (BLOCKING)
**User Story 1 (P1)**: 8 tasks
**User Story 2 (P2)**: 7 tasks
**User Story 3 (P3)**: 4 tasks
**User Story 4 (P4)**: 6 tasks
**User Story 5 (P5)**: 4 tasks
**Polish Phase**: 10 tasks

**Parallel Opportunities**: 15 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phases 1-4 (Setup + Foundational + US1 + US2) = 31 tasks

**Independent Test Criteria**:
- US1: Sign up creates account, sign in authenticates user, logout clears session, authentication persists across refresh
- US2: Todos page displays only authenticated user's todos with loading states and empty state handling
- US3: Create todo form adds new todo to list immediately with optimistic update
- US4: Edit todo updates title/description, toggle completion changes status with visual feedback
- US5: Delete todo shows confirmation dialog, removes todo from list on confirmation

**Critical Path**: Setup → Foundational → User Stories (can parallelize) → Polish

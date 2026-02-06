---

description: "Task list for User Authentication implementation"
---

# Tasks: User Authentication

**Input**: Design documents from `/specs/002-user-auth/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted. Focus is on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Backend**: `backend/src/`, `backend/tests/`
- **Frontend**: `frontend/src/`, `frontend/tests/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for both backend and frontend

- [ ] T001 Update backend requirements.txt with authentication dependencies (bcrypt, passlib[bcrypt], slowapi)
- [ ] T002 [P] Update backend/.env.example with authentication environment variables (BETTER_AUTH_SECRET, RATE_LIMIT_ENABLED)
- [ ] T003 [P] Create frontend directory structure using create-next-app with TypeScript and App Router
- [ ] T004 [P] Install frontend dependencies (better-auth, @better-auth/react) in frontend/package.json
- [ ] T005 [P] Create frontend/.env.local.example with environment variable template (NEXT_PUBLIC_API_URL, BETTER_AUTH_SECRET, JWT_SECRET)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 Create User SQLModel entity in backend/src/models/user.py (id, email, password_hash, created_at, last_login_at, is_active, failed_login_attempts, locked_until)
- [ ] T007 Create Pydantic request/response models in backend/src/models/user.py (UserSignUp, UserSignIn, UserResponse, AuthTokenResponse)
- [ ] T008 [P] Create Alembic migration for users table in backend/alembic/versions/002_create_users_table.py
- [ ] T009 [P] Extend backend/src/config.py with authentication configuration (BETTER_AUTH_SECRET, RATE_LIMIT_ENABLED, RATE_LIMIT_PER_MINUTE)
- [ ] T010 Create authentication service in backend/src/services/auth_service.py (password hashing, verification, user creation, user lookup)
- [ ] T011 [P] Create rate limiting service in backend/src/services/rate_limit.py (track failed attempts, check lockout status, reset attempts)
- [ ] T012 Update backend/src/models/__init__.py to export User model

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - User Sign In (Priority: P1) 🎯 MVP

**Goal**: Enable registered users to authenticate and access protected resources

**Independent Test**: Create test user in database, attempt signin with correct credentials, verify JWT token returned and can access protected endpoints

### Implementation for User Story 1

- [ ] T013 [US1] Implement signin service method in backend/src/services/auth_service.py (verify email exists, check account lockout, verify password, update last_login_at, reset failed attempts)
- [ ] T014 [US1] Implement POST /api/auth/signin endpoint in backend/src/api/auth.py (validate request, call auth service, generate JWT token, return AuthTokenResponse)
- [ ] T015 [US1] Implement rate limiting middleware for signin endpoint in backend/src/api/auth.py (track failed attempts by email, enforce 5 attempts per 15 minutes, return 429 on lockout)
- [ ] T016 [US1] Implement generic error messages for failed authentication in backend/src/api/auth.py (return same message for incorrect password and non-existent email)
- [ ] T017 [US1] Register auth router in backend/src/main.py (include /api/auth routes)
- [ ] T018 [US1] Create signin page in frontend/src/app/signin/page.tsx (form with email and password fields)
- [ ] T019 [US1] Create SignInForm component in frontend/src/components/auth/SignInForm.tsx (form validation, API call, error handling, redirect on success)
- [ ] T020 [US1] Implement API client with JWT token handling in frontend/src/lib/api-client.ts (add Authorization header, handle 401 errors)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - User Sign Up (Priority: P2)

**Goal**: Enable new users to create accounts and start using the application

**Independent Test**: Submit new user registration data, verify account created in database with hashed password, confirm user can immediately signin

### Implementation for User Story 2

- [ ] T021 [US2] Implement signup service method in backend/src/services/auth_service.py (validate email uniqueness, hash password with bcrypt cost 12, create user, return user object)
- [ ] T022 [US2] Implement POST /api/auth/signup endpoint in backend/src/api/auth.py (validate request, call auth service, generate JWT token, return AuthTokenResponse)
- [ ] T023 [US2] Add password complexity validation in backend/src/models/user.py UserSignUp model (8+ chars, uppercase, lowercase, number, special char)
- [ ] T024 [US2] Add email normalization in backend/src/models/user.py UserSignUp model (convert to lowercase, trim whitespace)
- [ ] T025 [US2] Implement duplicate email error handling in backend/src/api/auth.py (return 409 Conflict with appropriate message)
- [ ] T026 [US2] Create signup page in frontend/src/app/signup/page.tsx (form with email and password fields)
- [ ] T027 [US2] Create SignUpForm component in frontend/src/components/auth/SignUpForm.tsx (form validation, password strength indicator, API call, redirect on success)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (MVP complete)

---

## Phase 5: User Story 3 - Session Persistence (Priority: P3)

**Goal**: Maintain authentication state across page refreshes and browser sessions

**Independent Test**: Sign in, close browser, reopen, verify user remains authenticated within token validity period

### Implementation for User Story 3

- [ ] T028 [US3] Configure Better Auth in frontend/src/lib/auth.ts (JWT-only mode, credentials provider, 24-hour token expiration, httpOnly cookies)
- [ ] T029 [US3] Create Better Auth API route in frontend/src/app/api/auth/[...betterauth]/route.ts (handle Better Auth callbacks)
- [ ] T030 [US3] Create useAuth hook in frontend/src/lib/hooks/useAuth.ts (manage authentication state, provide signin/signup/logout methods, handle token refresh)
- [ ] T031 [US3] Create root layout with auth provider in frontend/src/app/layout.tsx (wrap app with Better Auth provider, handle authentication state)
- [ ] T032 [US3] Implement route protection middleware in frontend/src/middleware.ts (check authentication status, redirect unauthenticated users to signin)
- [ ] T033 [US3] Implement GET /api/auth/me endpoint in backend/src/api/auth.py (extract user from JWT token, return UserResponse)
- [ ] T034 [US3] Add token expiration handling in frontend/src/lib/api-client.ts (detect 401 errors, clear auth state, redirect to signin)

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - User Logout (Priority: P4)

**Goal**: Enable users to explicitly terminate their session for security

**Independent Test**: Sign in, click logout, verify token cleared and subsequent protected requests rejected

### Implementation for User Story 4

- [ ] T035 [US4] Implement POST /api/auth/logout endpoint in backend/src/api/auth.py (return success message, client handles token clearing)
- [ ] T036 [US4] Create LogoutButton component in frontend/src/components/auth/LogoutButton.tsx (call logout endpoint, clear auth state, redirect to signin)
- [ ] T037 [US4] Add logout functionality to useAuth hook in frontend/src/lib/hooks/useAuth.ts (clear token from storage, reset auth state)
- [ ] T038 [US4] Implement logout in root layout navigation in frontend/src/app/layout.tsx (add logout button to header/nav)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T039 [P] Add authentication event logging in backend/src/services/auth_service.py (log signup, signin, failed_login, logout events)
- [ ] T040 [P] Update backend/README.md with authentication setup instructions
- [ ] T041 [P] Create frontend/README.md with setup and development instructions
- [ ] T042 [P] Add API documentation examples in backend/src/api/auth.py (OpenAPI examples for each endpoint)
- [ ] T043 Verify all authentication endpoints enforce security requirements (rate limiting, generic errors, password hashing)
- [ ] T044 Create protected todos page in frontend/src/app/todos/page.tsx (fetch todos from backend API, display list, require authentication)
- [ ] T045 Implement home page redirect logic in frontend/src/app/page.tsx (redirect authenticated users to /todos, unauthenticated to /signin)
- [ ] T046 Run quickstart.md validation (verify setup instructions work, test all authentication flows with manual testing)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3 → P4)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Requires signin/signup to be functional for testing
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Requires signin to be functional for testing

### Within Each User Story

- Backend services before endpoints (endpoints depend on services)
- Backend endpoints before frontend pages (frontend calls backend APIs)
- Validation models before endpoints (endpoints use models for request validation)
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
Task: "Create Alembic migration for users table in backend/alembic/versions/002_create_users_table.py"
Task: "Extend backend/src/config.py with authentication configuration"
Task: "Create rate limiting service in backend/src/services/rate_limit.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Sign In)
4. Complete Phase 4: User Story 2 (Sign Up)
5. **STOP and VALIDATE**: Test US1 + US2 independently
6. Deploy/demo if ready (MVP complete!)

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo
3. Add User Story 2 → Test independently → Deploy/Demo (MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Backend + Frontend)
   - Developer B: User Story 2 (Backend + Frontend)
   - Developer C: User Story 3 (Backend + Frontend)
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

**All implementation tasks** will be executed by the `secure-auth-advisor` agent per constitutional requirements (Principle III: Stack-Specific Agent Assignment).

**Rationale**: Authentication and security implementation must be handled by the specialized authentication agent with expertise in:
- Better Auth configuration and integration
- JWT token generation and verification
- Password hashing and security best practices
- Rate limiting and brute force protection
- Session management and token storage
- Multi-user data isolation enforcement

---

## Task Summary

**Total Tasks**: 46
**Setup Phase**: 5 tasks
**Foundational Phase**: 7 tasks (BLOCKING)
**User Story 1 (P1)**: 8 tasks
**User Story 2 (P2)**: 7 tasks
**User Story 3 (P3)**: 7 tasks
**User Story 4 (P4)**: 4 tasks
**Polish Phase**: 8 tasks

**Parallel Opportunities**: 11 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phases 1-4 (Setup + Foundational + US1 + US2) = 27 tasks

**Independent Test Criteria**:
- US1: Sign in with valid credentials returns JWT token and grants access to protected resources
- US2: Sign up creates account with hashed password, user can immediately sign in
- US3: Authentication state persists across page refreshes and browser restarts (within token validity)
- US4: Logout clears token and subsequent protected requests are rejected

**Critical Path**: Setup → Foundational → User Stories (can parallelize) → Polish

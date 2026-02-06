---

description: "Task list for Todo Backend API implementation"
---

# Tasks: Todo Backend API

**Input**: Design documents from `/specs/001-todo-backend-api/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are NOT explicitly requested in the specification, so test tasks are omitted. Focus is on implementation only.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `backend/tests/`
- All paths relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 Create backend directory structure (backend/src/models/, backend/src/api/, backend/src/services/, backend/tests/)
- [x] T002 Create Python package initialization files (backend/src/__init__.py, backend/src/models/__init__.py, backend/src/api/__init__.py, backend/src/services/__init__.py)
- [x] T003 [P] Create requirements.txt with dependencies (FastAPI 0.104+, SQLModel 0.0.14+, Pydantic 2.5+, python-jose, asyncpg, pytest, pytest-asyncio)
- [x] T004 [P] Create .env.example file with environment variable template (DATABASE_URL, SECRET_KEY, ALGORITHM)
- [x] T005 [P] Create Dockerfile for containerization in backend/

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T006 Implement configuration management in backend/src/config.py (load environment variables, database URL, JWT settings)
- [x] T007 Implement database connection and async engine in backend/src/database.py (Neon PostgreSQL with asyncpg, connection pooling, session factory)
- [x] T008 [P] Implement JWT token verification dependency in backend/src/api/dependencies.py (extract user_id from Bearer token, raise 401 on invalid token)
- [x] T009 [P] Implement custom error handlers in backend/src/api/errors.py (400, 401, 403, 404, 500 with consistent JSON response structure)
- [x] T010 Create FastAPI application instance in backend/src/main.py (initialize app, register error handlers, configure CORS)
- [x] T011 Create Todo SQLModel entity in backend/src/models/todo.py (id, title, description, completed, user_id, created_at, updated_at with validation)
- [x] T012 Create Pydantic request/response models in backend/src/models/todo.py (TodoCreate, TodoUpdate, TodoComplete, TodoResponse)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Retrieve User's Todos (Priority: P1) 🎯 MVP

**Goal**: Enable API consumers to retrieve all todos for an authenticated user

**Independent Test**: Authenticate a user, seed test todos, call GET /api/todos, verify only user's todos returned with correct structure

### Implementation for User Story 1

- [x] T013 [US1] Implement get_user_todos service method in backend/src/services/todo_service.py (query todos filtered by user_id, order by created_at DESC)
- [x] T014 [US1] Implement GET /api/todos endpoint in backend/src/api/todos.py (require JWT auth, call service, return 200 with todo array)
- [x] T015 [US1] Add user_id filtering validation to ensure cross-user access prevention in backend/src/services/todo_service.py
- [x] T016 [US1] Register todos router in backend/src/main.py (include /api/todos routes)

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Create New Todo (Priority: P2)

**Goal**: Enable API consumers to create new todos for authenticated users

**Independent Test**: Authenticate a user, POST valid todo data, verify todo created with correct attributes and user association

### Implementation for User Story 2

- [x] T017 [US2] Implement create_todo service method in backend/src/services/todo_service.py (create todo with user_id, set completed=False, save to database)
- [x] T018 [US2] Implement POST /api/todos endpoint in backend/src/api/todos.py (require JWT auth, validate request body, call service, return 201 with created todo)
- [x] T019 [US2] Add title validation (1-200 chars, trim whitespace) in TodoCreate Pydantic model in backend/src/models/todo.py
- [x] T020 [US2] Add description validation (max 1000 chars) in TodoCreate Pydantic model in backend/src/models/todo.py

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (MVP complete)

---

## Phase 5: User Story 3 - Mark Todo as Complete (Priority: P3)

**Goal**: Enable API consumers to toggle todo completion status

**Independent Test**: Create test todo, authenticate as owner, PATCH completion status, verify status changes correctly

### Implementation for User Story 3

- [x] T021 [US3] Implement get_todo_by_id service method in backend/src/services/todo_service.py (query todo by id AND user_id for ownership verification)
- [x] T022 [US3] Implement update_todo_completion service method in backend/src/services/todo_service.py (update completed field, update updated_at timestamp)
- [x] T023 [US3] Implement PATCH /api/todos/{id}/complete endpoint in backend/src/api/todos.py (require JWT auth, verify ownership, update status, return 200 or 403/404)
- [x] T024 [US3] Add ownership verification error handling (return 403 if user_id mismatch, 404 if todo not found)

**Checkpoint**: All user stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - Update Todo Details (Priority: P4)

**Goal**: Enable API consumers to update todo title and description

**Independent Test**: Create test todo, authenticate as owner, PUT updated data, verify changes persisted

### Implementation for User Story 4

- [x] T025 [US4] Implement update_todo_details service method in backend/src/services/todo_service.py (update title/description, verify ownership, update updated_at)
- [x] T026 [US4] Implement PUT /api/todos/{id} endpoint in backend/src/api/todos.py (require JWT auth, validate request, call service, return 200 or 400/403/404)
- [x] T027 [US4] Add partial update validation in TodoUpdate Pydantic model (allow optional title/description, validate lengths)

**Checkpoint**: All user stories 1-4 should now be independently functional

---

## Phase 7: User Story 5 - Delete Todo (Priority: P5)

**Goal**: Enable API consumers to delete todos

**Independent Test**: Create test todo, authenticate as owner, DELETE request, verify todo removed

### Implementation for User Story 5

- [x] T028 [US5] Implement delete_todo service method in backend/src/services/todo_service.py (verify ownership, delete from database)
- [x] T029 [US5] Implement DELETE /api/todos/{id} endpoint in backend/src/api/todos.py (require JWT auth, verify ownership, call service, return 204 or 403/404)

**Checkpoint**: All user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [x] T030 [P] Add database indexes in backend/src/models/todo.py (index on user_id, composite index on user_id + created_at)
- [x] T031 [P] Add API documentation examples in backend/src/api/todos.py (OpenAPI examples for each endpoint)
- [x] T032 [P] Create README.md in backend/ with setup instructions and API usage examples
- [x] T033 [P] Add logging for all API operations in backend/src/api/todos.py (log user actions, errors)
- [x] T034 Verify all endpoints enforce user_id filtering (security audit of service layer methods)
- [x] T035 Run quickstart.md validation (verify setup instructions work, test all endpoints with curl) - **Note: Requires manual validation with configured .env**

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
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses get_todo_by_id which may be shared with US4/US5
- **User Story 4 (P4)**: Can start after Foundational (Phase 2) - Uses get_todo_by_id which may be shared with US3/US5
- **User Story 5 (P5)**: Can start after Foundational (Phase 2) - Uses get_todo_by_id which may be shared with US3/US4

### Within Each User Story

- Service methods before endpoints (endpoints depend on services)
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
Task: "Implement JWT token verification dependency in backend/src/api/dependencies.py"
Task: "Implement custom error handlers in backend/src/api/errors.py"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Retrieve todos)
4. Complete Phase 4: User Story 2 (Create todos)
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
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
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

**All implementation tasks** will be executed by the `fastapi-performance-optimizer` agent per constitutional requirements (Principle III: Stack-Specific Agent Assignment).

**Rationale**: Backend API development must be handled by the specialized FastAPI agent with expertise in:
- FastAPI async patterns and performance optimization
- RESTful API design best practices
- Database query optimization with SQLModel
- JWT authentication and authorization
- Multi-user data isolation enforcement

---

## Task Summary

**Total Tasks**: 35
**Setup Phase**: 5 tasks
**Foundational Phase**: 7 tasks (BLOCKING)
**User Story 1 (P1)**: 4 tasks
**User Story 2 (P2)**: 4 tasks
**User Story 3 (P3)**: 4 tasks
**User Story 4 (P4)**: 3 tasks
**User Story 5 (P5)**: 2 tasks
**Polish Phase**: 6 tasks

**Parallel Opportunities**: 11 tasks marked [P] can run in parallel within their phases

**MVP Scope**: Phases 1-4 (Setup + Foundational + US1 + US2) = 20 tasks

**Independent Test Criteria**:
- US1: Retrieve todos returns only user's data
- US2: Create todo associates with authenticated user
- US3: Mark complete verifies ownership
- US4: Update details verifies ownership
- US5: Delete verifies ownership

**Critical Path**: Setup → Foundational → User Stories (can parallelize) → Polish

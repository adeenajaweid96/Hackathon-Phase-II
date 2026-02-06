# Implementation Plan: Todo Backend API

**Branch**: `001-todo-backend-api` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-todo-backend-api/spec.md`

**Note**: This plan focuses exclusively on backend API implementation. Frontend and authentication system implementation are out of scope.

## Summary

Implement a RESTful backend API for a multi-user todo application using Python FastAPI. The API will expose 5 core endpoints (retrieve, create, update, mark complete, delete) with strict user data isolation enforced through JWT token verification. All endpoints require authentication and return JSON responses. The system must prevent cross-user data access and enforce validation rules on todo items (title max 200 chars, description max 1000 chars). Performance targets: <500ms for retrieval, <300ms for mutations. Implementation will be handled by the `fastapi-performance-optimizer` agent per constitutional requirements.

## Technical Context

**Language/Version**: Python 3.11+
**Primary Dependencies**: FastAPI 0.104+, SQLModel 0.0.14+, Pydantic 2.5+, python-jose (JWT), passlib (if needed for future auth)
**Storage**: Neon Serverless PostgreSQL via SQLModel ORM
**Testing**: pytest with pytest-asyncio for async endpoint testing
**Target Platform**: Linux server (Docker containerized)
**Project Type**: Web application (backend API only)
**Performance Goals**: GET /api/todos <500ms, POST/PUT/PATCH/DELETE <300ms, support 100 concurrent requests
**Constraints**: Multi-user data isolation (every query filtered by user_id), JWT token verification on all endpoints, no raw SQL queries (SQLModel only), async/await patterns required
**Scale/Scope**: Initial support for 100 concurrent users, 100 todos per user without pagination

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Specification Gate ✅
- [x] All user actions explicitly defined (5 user stories: retrieve, create, mark complete, update, delete)
- [x] All API endpoints documented with request/response schemas (5 endpoints with full contracts)
- [x] All data models defined with validation rules (Todo entity with field constraints)
- [x] Authentication and authorization requirements specified (JWT token verification, user data isolation)
- [x] Multi-user data isolation requirements documented (user_id filtering on all queries)

### Planning Gate (Current Phase)
- [x] Plan references specification sections (references to FR-001 through FR-020, user stories P1-P5)
- [x] Specialized agents assigned to appropriate work (`fastapi-performance-optimizer` for backend API)
- [ ] Architectural decisions documented in ADRs (to be created if significant decisions arise)
- [x] Technology stack compliance verified (Python FastAPI, SQLModel, Neon PostgreSQL per constitution)
- [x] Security considerations addressed (JWT verification, user data isolation, error handling)

### Constitutional Compliance
- [x] **Principle I - Spec-Driven Development**: Plan explicitly references spec sections (FR-001 to FR-020, US1-US5)
- [x] **Principle II - Agent-Only Implementation**: Implementation assigned to `fastapi-performance-optimizer` agent
- [x] **Principle III - Stack-Specific Agent Assignment**: Backend API work assigned to `fastapi-performance-optimizer`
- [x] **Principle IV - Security-First Authentication**: JWT token verification required on all endpoints (FR-007, FR-011)
- [x] **Principle V - Multi-User Data Isolation**: User ID filtering enforced on all queries (FR-008, FR-009, SC-006, SC-010)
- [x] **Principle VI - Technology Stack Compliance**: Python FastAPI, SQLModel, Neon PostgreSQL as mandated

**Gate Status**: ✅ PASSED - All constitutional requirements met, ready to proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/001-todo-backend-api/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (technology decisions and patterns)
├── data-model.md        # Phase 1 output (Todo entity schema)
├── quickstart.md        # Phase 1 output (setup and testing guide)
├── contracts/           # Phase 1 output (OpenAPI schemas)
│   ├── openapi.yaml     # Complete API specification
│   └── schemas/         # Request/response JSON schemas
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── todo.py          # Todo SQLModel entity
│   │   └── user.py          # User reference model (if needed)
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py  # JWT verification, user extraction
│   │   ├── todos.py         # Todo CRUD endpoints
│   │   └── errors.py        # Error handlers and responses
│   ├── services/
│   │   ├── __init__.py
│   │   └── todo_service.py  # Business logic for todo operations
│   ├── database.py          # Database connection and session management
│   ├── config.py            # Environment-based configuration
│   └── main.py              # FastAPI application entry point
├── tests/
│   ├── conftest.py          # Pytest fixtures (test DB, auth tokens)
│   ├── test_todos_api.py    # API endpoint tests
│   └── test_authorization.py # Cross-user access prevention tests
├── alembic/                 # Database migrations (if using Alembic)
│   └── versions/
├── .env.example             # Environment variable template
├── requirements.txt         # Python dependencies
├── Dockerfile               # Container definition
└── README.md                # Backend setup instructions
```

**Structure Decision**: Using web application structure with backend-only implementation. Frontend is explicitly out of scope per specification. The backend/ directory contains all API implementation with clear separation between models (data), api (endpoints), and services (business logic). This structure supports the fastapi-performance-optimizer agent's patterns and enables independent testing of each layer.

## Complexity Tracking

> **No violations detected** - All constitutional requirements are met without exceptions.

## Phase 0: Research & Technology Decisions

**Objective**: Resolve all technical unknowns and establish implementation patterns for FastAPI + SQLModel + Neon PostgreSQL integration.

### Research Tasks

1. **JWT Token Verification in FastAPI**
   - Research: FastAPI dependency injection for JWT verification
   - Research: python-jose vs PyJWT library comparison
   - Research: Extracting user_id from JWT claims
   - Output: Recommended JWT verification pattern for dependencies.py

2. **SQLModel with Neon PostgreSQL**
   - Research: SQLModel async engine configuration for Neon
   - Research: Connection string format for Neon Serverless PostgreSQL
   - Research: Connection pooling best practices for serverless databases
   - Output: Database connection pattern for database.py

3. **Multi-User Data Isolation Patterns**
   - Research: SQLModel query filtering by user_id
   - Research: Preventing N+1 queries with user filtering
   - Research: Testing strategies for cross-user access prevention
   - Output: Query patterns that enforce user_id filtering

4. **FastAPI Error Handling**
   - Research: Custom exception handlers for 400, 401, 403, 404, 500
   - Research: Pydantic validation error formatting
   - Research: Consistent error response structure
   - Output: Error handling patterns for errors.py

5. **Async/Await Patterns**
   - Research: FastAPI async endpoint best practices
   - Research: SQLModel async session management
   - Research: When to use async vs sync in FastAPI
   - Output: Async patterns for endpoint and service layers

6. **Testing Strategy**
   - Research: pytest-asyncio for async endpoint testing
   - Research: Test database setup (in-memory vs separate test DB)
   - Research: Mocking JWT authentication in tests
   - Output: Testing patterns for conftest.py

### Research Output Location

All research findings will be documented in `specs/001-todo-backend-api/research.md` with the following structure:
- Decision made
- Rationale
- Alternatives considered
- Code pattern examples
- References to official documentation

## Phase 1: Design & Contracts

**Prerequisites**: research.md completed with all patterns resolved

### 1. Data Model Design (`data-model.md`)

**Source**: Specification Key Entities section, FR-017, FR-018, FR-019

**Todo Entity**:
- `id`: UUID or Integer (primary key, auto-generated)
- `title`: String (required, max 200 chars, non-empty after trim)
- `description`: String (optional, max 1000 chars)
- `completed`: Boolean (default False)
- `user_id`: String or UUID (foreign key to User, indexed for query performance)
- `created_at`: DateTime (auto-generated, UTC, ISO 8601)
- `updated_at`: DateTime (auto-updated on modification, UTC, ISO 8601)

**Validation Rules**:
- Title: Required, 1-200 characters after trimming whitespace
- Description: Optional, 0-1000 characters if provided
- Completed: Boolean only (true/false)
- User ID: Must match authenticated user from JWT token
- Timestamps: Automatically managed by SQLModel

**Relationships**:
- Todo belongs to User (many-to-one via user_id)
- User has many Todos (one-to-many)

**Indexes**:
- Primary index on `id`
- Index on `user_id` for efficient user-specific queries
- Composite index on `(user_id, created_at)` for ordered retrieval

### 2. API Contracts (`contracts/openapi.yaml`)

**Source**: Specification API Contract Requirements, FR-001 through FR-020

Generate OpenAPI 3.0 specification with:

**Endpoint 1: GET /api/todos**
- Summary: Retrieve all todos for authenticated user
- Security: Bearer JWT token required
- Responses:
  - 200: Array of Todo objects (spec: SC-001, FR-001)
  - 401: Unauthorized (missing/invalid token)
- Performance: <500ms target

**Endpoint 2: POST /api/todos**
- Summary: Create new todo for authenticated user
- Security: Bearer JWT token required
- Request Body: `{ title: string, description?: string }`
- Responses:
  - 201: Created Todo object (spec: FR-002, FR-019)
  - 400: Validation errors (spec: FR-013, FR-016)
  - 401: Unauthorized
- Performance: <300ms target

**Endpoint 3: PATCH /api/todos/{id}/complete**
- Summary: Toggle todo completion status
- Security: Bearer JWT token required
- Path Parameter: `id` (todo identifier)
- Request Body: `{ completed: boolean }`
- Responses:
  - 200: Updated Todo object (spec: FR-003, FR-020)
  - 401: Unauthorized
  - 403: Forbidden (not owner, spec: FR-009, FR-012)
  - 404: Not found (spec: FR-014)
- Performance: <300ms target

**Endpoint 4: PUT /api/todos/{id}**
- Summary: Update todo title and/or description
- Security: Bearer JWT token required
- Path Parameter: `id` (todo identifier)
- Request Body: `{ title?: string, description?: string }`
- Responses:
  - 200: Updated Todo object (spec: FR-004, FR-010)
  - 400: Validation errors (spec: FR-013, FR-017)
  - 401: Unauthorized
  - 403: Forbidden (not owner)
  - 404: Not found
- Performance: <300ms target

**Endpoint 5: DELETE /api/todos/{id}**
- Summary: Delete todo
- Security: Bearer JWT token required
- Path Parameter: `id` (todo identifier)
- Responses:
  - 204: No Content (spec: FR-005)
  - 401: Unauthorized
  - 403: Forbidden (not owner)
  - 404: Not found
- Performance: <200ms target

**Common Response Schemas**:
- TodoResponse: `{ id, title, description, completed, user_id, created_at, updated_at }`
- ErrorResponse: `{ error: string, detail?: string, validation_errors?: array }`

### 3. Quickstart Guide (`quickstart.md`)

**Content**:
1. Prerequisites (Python 3.11+, Neon PostgreSQL account)
2. Environment setup (.env configuration)
3. Dependency installation (pip install -r requirements.txt)
4. Database connection verification
5. Running the development server
6. Testing with curl/Postman (example requests with JWT tokens)
7. Running automated tests (pytest)
8. Common troubleshooting scenarios

### 4. Agent Context Update

Run `.specify/scripts/powershell/update-agent-context.ps1 -AgentType claude` to update agent-specific context with:
- FastAPI + SQLModel + Neon PostgreSQL stack
- JWT token verification patterns
- Multi-user data isolation requirements
- Performance targets (<500ms retrieval, <300ms mutations)

## Phase 2: Implementation Assignment

**Agent Assignment**: `fastapi-performance-optimizer`

**Rationale**: Per Constitution Principle III, backend API development must be handled by the fastapi-performance-optimizer agent. This agent has specialized knowledge of:
- FastAPI async patterns and performance optimization
- RESTful API design best practices
- Database query optimization
- Request/response handling
- Background job processing (if needed)

**Implementation Scope**:
- All 5 API endpoints (GET, POST, PATCH, PUT, DELETE)
- JWT token verification middleware
- SQLModel entity definitions
- Database connection management
- Error handling and validation
- User data isolation enforcement
- Automated tests for all endpoints

**Out of Scope for This Feature**:
- Frontend implementation (separate feature)
- Authentication system implementation (Better Auth setup is separate)
- Database schema for User entity (assumed to exist from auth system)
- Deployment configuration (separate DevOps concern)

## Implementation Phases (for /sp.tasks)

The following phases will be broken into tasks by `/sp.tasks`:

### Phase 1: Foundation
- Project structure setup
- Environment configuration
- Database connection with Neon PostgreSQL
- JWT verification dependency

### Phase 2: Data Layer
- Todo SQLModel entity
- Database session management
- Migration setup (if using Alembic)

### Phase 3: API Endpoints (User Story Priority Order)
- **P1**: GET /api/todos (retrieve user's todos)
- **P2**: POST /api/todos (create new todo)
- **P3**: PATCH /api/todos/{id}/complete (mark complete)
- **P4**: PUT /api/todos/{id} (update details)
- **P5**: DELETE /api/todos/{id} (delete todo)

### Phase 4: Security & Validation
- User data isolation enforcement
- Input validation
- Error handling
- Cross-user access prevention

### Phase 5: Testing
- Endpoint tests for all 5 operations
- Authorization tests (cross-user access prevention)
- Validation tests (field constraints)
- Performance tests (response time targets)

## Success Criteria Mapping

Each success criterion from the specification maps to implementation requirements:

- **SC-001** (retrieval <500ms): Implement efficient SQLModel queries with user_id filtering and indexing
- **SC-002** (creation <300ms): Use async database operations, minimize validation overhead
- **SC-003** (update <300ms): Optimize update queries, use partial updates
- **SC-004** (deletion <200ms): Simple delete operation with user verification
- **SC-005** (100% unauthorized rejection): JWT verification on all endpoints via FastAPI dependencies
- **SC-006** (100% cross-user blocking): User ID filtering on all database queries
- **SC-007** (descriptive errors): Custom exception handlers with detailed messages
- **SC-008** (99.9% uptime): Proper error handling, database connection pooling
- **SC-009** (<1s under load): Async patterns, connection pooling, query optimization
- **SC-010** (zero data leakage): Automated tests for cross-user access attempts
- **SC-011** (schema conformance): Pydantic models for request/response validation
- **SC-012** (95% success rate): Comprehensive error handling, graceful degradation

## Risk Analysis

### High Priority Risks

1. **Cross-User Data Leakage**
   - Risk: Forgetting user_id filter in a query exposes all users' data
   - Mitigation: Automated tests for every endpoint attempting cross-user access
   - Mitigation: Code review checklist requiring user_id filtering verification

2. **JWT Token Verification Bypass**
   - Risk: Endpoint accidentally skips authentication dependency
   - Mitigation: FastAPI dependency injection ensures all endpoints require auth
   - Mitigation: Integration tests verify 401 responses for unauthenticated requests

3. **Performance Degradation**
   - Risk: N+1 queries or missing indexes cause slow responses
   - Mitigation: Database indexes on user_id and created_at
   - Mitigation: Performance tests verify response time targets

### Medium Priority Risks

4. **Validation Bypass**
   - Risk: Invalid data reaches database (e.g., title >200 chars)
   - Mitigation: Pydantic models enforce validation at API boundary
   - Mitigation: SQLModel constraints provide database-level validation

5. **Database Connection Issues**
   - Risk: Neon serverless connection limits or timeouts
   - Mitigation: Connection pooling configuration
   - Mitigation: Retry logic for transient failures

## Next Steps

1. ✅ Complete Phase 0: Generate research.md with all technology decisions
2. ✅ Complete Phase 1: Generate data-model.md, contracts/, quickstart.md
3. ⏭️ Run `/sp.tasks` to break this plan into actionable tasks
4. ⏭️ Run `/sp.implement` to execute tasks via fastapi-performance-optimizer agent
5. ⏭️ Validate implementation against specification success criteria

**Current Status**: Plan complete, ready for Phase 0 research

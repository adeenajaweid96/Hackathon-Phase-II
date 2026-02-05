# Implementation Plan: User Authentication

**Branch**: `002-user-auth` | **Date**: 2026-02-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-user-auth/spec.md`

**Note**: This plan focuses on implementing user authentication (signup, signin, session management, logout) using Better Auth with JWT tokens. The plan integrates with the existing FastAPI backend (specs/001-todo-backend-api) which already has JWT token verification infrastructure.

## Summary

Implement user authentication for the multi-user todo application using Better Auth library with JWT token-based authentication. The system will provide user signup and signin capabilities, persist authentication state across sessions, and enable secure logout. Authentication endpoints will be added to the existing FastAPI backend, and a Next.js frontend will be created to provide the user interface. All authentication logic will enforce strict security requirements including password hashing (bcrypt), rate limiting, and generic error messages to prevent information leakage. The implementation will be handled by the `secure-auth-advisor` agent per constitutional requirements.

## Technical Context

**Language/Version**: Python 3.11+ (backend), TypeScript/JavaScript with Next.js 16+ (frontend)
**Primary Dependencies**: Better Auth (authentication), FastAPI 0.104+ (backend API), Next.js 16+ (frontend), SQLModel 0.0.14+ (ORM), bcrypt (password hashing), python-jose (JWT), React 18+ (UI)
**Storage**: Neon Serverless PostgreSQL via SQLModel ORM (User table with email, password_hash, user_id, timestamps)
**Testing**: pytest with pytest-asyncio (backend), Jest/React Testing Library (frontend), Playwright (E2E)
**Target Platform**: Web application (Linux server for backend, browser for frontend)
**Project Type**: Web application (backend + frontend)
**Performance Goals**: Signup <1 minute, Signin <10 seconds, 1000 concurrent auth requests, 99.9% auth success rate
**Constraints**: JWT tokens expire after 24 hours, rate limiting (5 failed attempts per 15 minutes), bcrypt cost factor 12, HTTPS required in production, no OAuth/social login
**Scale/Scope**: Support 1000+ concurrent users, handle 10,000 authentication requests per day, maintain <200ms authentication endpoint latency

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Specification Gate ✅
- [x] All user actions explicitly defined (signup, signin, session persistence, logout - 4 user stories)
- [x] All API endpoints documented with request/response schemas (signup, signin, logout endpoints specified in FR-002, FR-003, FR-013)
- [x] All data models defined with validation rules (User entity with email, password_hash, user_id, timestamps)
- [x] Authentication and authorization requirements specified (32 functional requirements covering auth, authz, security, session management)
- [x] Multi-user data isolation requirements documented (FR-014 to FR-019 specify JWT token validation and user data filtering)

### Planning Gate (Current Phase)
- [x] Plan references specification sections (references to FR-001 through FR-032, user stories P1-P4)
- [x] Specialized agents assigned to appropriate work (`secure-auth-advisor` for authentication implementation)
- [ ] Architectural decisions documented in ADRs (to be created if significant decisions arise during implementation)
- [x] Technology stack compliance verified (Better Auth, FastAPI, Next.js 16+, Neon PostgreSQL per constitution)
- [x] Security considerations addressed (password hashing, rate limiting, token security, generic error messages)

### Constitutional Compliance
- [x] **Principle I - Spec-Driven Development**: Plan explicitly references spec sections (FR-001 to FR-032, US1-US4)
- [x] **Principle II - Agent-Only Implementation**: Implementation assigned to `secure-auth-advisor` agent
- [x] **Principle III - Stack-Specific Agent Assignment**: Authentication work assigned to `secure-auth-advisor`
- [x] **Principle IV - Security-First Authentication**: Better Auth with JWT tokens, password hashing, rate limiting specified
- [x] **Principle V - Multi-User Data Isolation**: User ID filtering enforced via JWT token validation (FR-014 to FR-019)
- [x] **Principle VI - Technology Stack Compliance**: Better Auth, FastAPI, Next.js 16+, SQLModel, Neon PostgreSQL

**Gate Status**: ✅ PASSED - All constitutional requirements met, ready to proceed to Phase 0 research

## Project Structure

### Documentation (this feature)

```text
specs/002-user-auth/
├── spec.md              # Feature specification (completed)
├── plan.md              # This file (/sp.plan command output)
├── research.md          # Phase 0 output (technology decisions and patterns)
├── data-model.md        # Phase 1 output (User entity schema)
├── quickstart.md        # Phase 1 output (setup and testing guide)
├── contracts/           # Phase 1 output (API schemas)
│   ├── openapi.yaml     # Authentication API specification
│   └── schemas/         # Request/response JSON schemas
└── tasks.md             # Phase 2 output (/sp.tasks command - NOT created by /sp.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/
│   │   ├── __init__.py
│   │   ├── todo.py          # Existing Todo model
│   │   └── user.py          # NEW: User SQLModel entity
│   ├── api/
│   │   ├── __init__.py
│   │   ├── dependencies.py  # Existing JWT verification
│   │   ├── todos.py         # Existing todo endpoints
│   │   ├── auth.py          # NEW: Authentication endpoints (signup, signin, logout)
│   │   └── errors.py        # Existing error handlers
│   ├── services/
│   │   ├── __init__.py
│   │   ├── todo_service.py  # Existing todo service
│   │   ├── auth_service.py  # NEW: Authentication business logic
│   │   └── rate_limit.py    # NEW: Rate limiting service
│   ├── database.py          # Existing database connection
│   ├── config.py            # Existing configuration (extend for auth)
│   └── main.py              # Existing FastAPI app (register auth routes)
├── tests/
│   ├── conftest.py          # Existing test fixtures
│   ├── test_todos_api.py    # Existing todo tests
│   ├── test_auth_api.py     # NEW: Authentication endpoint tests
│   ├── test_auth_service.py # NEW: Authentication service tests
│   └── test_rate_limit.py   # NEW: Rate limiting tests
├── alembic/                 # Database migrations
│   └── versions/
│       └── 002_create_users_table.py  # NEW: User table migration
├── .env.example             # Existing (extend for auth secrets)
├── requirements.txt         # Existing (add Better Auth, bcrypt)
└── README.md                # Existing (update with auth setup)

frontend/                    # NEW: Next.js 16+ App Router application
├── src/
│   ├── app/
│   │   ├── layout.tsx       # Root layout with auth provider
│   │   ├── page.tsx         # Home page (redirect to signin if not authenticated)
│   │   ├── signin/
│   │   │   └── page.tsx     # Sign in page
│   │   ├── signup/
│   │   │   └── page.tsx     # Sign up page
│   │   ├── todos/
│   │   │   └── page.tsx     # Todo list page (protected)
│   │   └── api/
│   │       └── auth/
│   │           └── [...betterauth]/route.ts  # Better Auth API routes
│   ├── components/
│   │   ├── auth/
│   │   │   ├── SignInForm.tsx
│   │   │   ├── SignUpForm.tsx
│   │   │   └── LogoutButton.tsx
│   │   └── ui/              # Reusable UI components
│   ├── lib/
│   │   ├── auth.ts          # Better Auth configuration
│   │   ├── api-client.ts    # API client with JWT token handling
│   │   └── hooks/
│   │       └── useAuth.ts   # Authentication state hook
│   └── middleware.ts        # Route protection middleware
├── tests/
│   ├── unit/
│   │   └── auth.test.ts     # Auth utility tests
│   └── e2e/
│       └── auth.spec.ts     # E2E authentication flow tests
├── .env.local.example       # Environment variables template
├── next.config.js           # Next.js configuration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # Frontend setup instructions
```

**Structure Decision**: Web application structure with separate backend and frontend directories. Backend extends existing FastAPI application (specs/001-todo-backend-api) with authentication endpoints. Frontend is a new Next.js 16+ App Router application that provides the user interface and integrates with Better Auth for authentication state management.

## Complexity Tracking

> **No violations - all constitutional requirements met**

This feature complies with all constitutional principles:
- Uses Better Auth as mandated
- Assigns work to `secure-auth-advisor` agent
- Integrates with existing FastAPI backend
- Follows spec-driven development workflow
- Enforces multi-user data isolation via JWT tokens
- Uses mandated technology stack (FastAPI, Next.js 16+, SQLModel, Neon PostgreSQL)

No complexity justifications required.

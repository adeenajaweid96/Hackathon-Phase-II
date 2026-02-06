---
id: 001
title: Multi-User Todo Web App Constitution
stage: constitution
date: 2026-02-05
surface: agent
model: claude-sonnet-4-5-20250929
feature: none
branch: master
user: hp
command: /sp.constitution
labels: ["constitution", "spec-driven-development", "multi-user", "web-application", "technology-stack"]
links:
  spec: null
  ticket: null
  adr: null
  pr: null
files:
  - .specify/memory/constitution.md
tests:
  - none
---

## Prompt

/sp.constitution Objective:
Transform an existing in-memory console Todo application into a modern, multi-user, full-stack web application with persistent storage. The system must support authenticated users, RESTful APIs, and a responsive frontend interface.

The project must be developed strictly using Spec-Kit Plus and Claude Code following an agentic, spec-driven workflow. No manual coding is permitted.

Development Workflow:
Write spec → Generate plan → Break into tasks → Implement via Claude Code → Review iterations

Core Principles:
- Spec-first development (no implementation before spec approval)
- Deterministic and reproducible outputs from specifications
- Clear separation of frontend, backend, authentication, and database concerns
- Security-first design for authentication and data access
- Maintainability and scalability over shortcuts
- Zero manual code edits (all code must be agent-generated)

Key Standards:
- All application features must be explicitly defined in the specification
- Each API endpoint must correspond to a documented user action
- Frontend behavior must match backend capabilities exactly
- Authentication and authorization rules must be consistently enforced
- Database schema changes must be managed via migrations

Functional Requirements:
- Implement all 5 Basic Level Todo features:
  - Add todo
  - View todos
  - Update todo
  - Delete todo
  - Mark todo as complete
- Support multiple users with strict data isolation
- Provide RESTful API endpoints for all features
- Persist data using a relational database

Authentication Requirements:
- Implement user signup and signin using Better Auth
- Protect all todo-related routes behind authentication
- Ensure users can only access their own todos
- Secure handling of sessions or tokens

Technology Stack Constraints:
- Frontend: Next.js 16+ (App Router)
- Backend: Python FastAPI
- ORM: SQLModel
- Database: Neon Serverless PostgreSQL
- Authentication: Better Auth
- Spec System: Spec-Kit Plus

Non-Functional Constraints:
- Responsive, mobile-first frontend UI
- Clean and consistent JSON API responses
- Environment-based configuration for secrets and credentials
- No hardcoded secrets or credentials
- No unused endpoints or dead code

Quality Gates:
- Specification must be complete before planning begins
- Planning output must reference specification sections
- Tasks must map one-to-one with plan items
- Implementation must match task definitions exactly

Validation Rules:
- All features must be testable via both UI and API
- Unauthenticated access to protected routes must be rejected
- Each user must only see and modify their own todos
- Database schema must safely support multi-user data

Success Criteria:
- All 5 Todo features function correctly in the web application
- Users can successfully sign up and sign in
- Todo data persists across sessions using Neon PostgreSQL
- Frontend, backend, auth, and database are fully integrated
- Clear traceability exists from spec → plan → tasks → implementation
- Project can be reviewed and evaluated using spec-driven artifacts

## Response snapshot

Created comprehensive project constitution (v1.0.0) with 6 core principles:

1. **Spec-Driven Development (NON-NEGOTIABLE)**: Enforces spec → plan → tasks → implement workflow with no implementation before specification approval
2. **Agent-Only Implementation (NON-NEGOTIABLE)**: Zero manual code edits permitted; all code must be agent-generated
3. **Stack-Specific Agent Assignment (MANDATORY)**: Assigns specialized agents to technology layers:
   - secure-auth-advisor → Authentication & Security
   - nextjs-performance-architect → Frontend Development
   - neon-db-optimizer → Database Operations
   - fastapi-performance-optimizer → Backend API Development
4. **Security-First Authentication (NON-NEGOTIABLE)**: Better Auth with JWT tokens, strict token verification, no cross-user data leakage
5. **Multi-User Data Isolation (NON-NEGOTIABLE)**: Database and API enforce strict user data separation with user ID filtering
6. **Technology Stack Compliance (MANDATORY)**: Next.js 16+ App Router, Python FastAPI, SQLModel, Neon PostgreSQL, Better Auth

Additional sections created:
- Technology Stack Requirements (detailed layer specifications)
- Development Workflow (5-phase process: Specification → Planning → Task Breakdown → Implementation → Validation)
- Quality Gates (5 gates with checkboxes for each phase)
- Governance (amendment process, compliance review, version control)

Constitution includes Sync Impact Report documenting version change, added sections, and template verification status.

## Outcome

- ✅ Impact: Created foundational governance document establishing spec-driven development principles, agent assignments, security requirements, and quality gates for multi-user todo web application project
- 🧪 Tests: No tests (constitution is documentation)
- 📁 Files: Created/updated .specify/memory/constitution.md (v1.0.0)
- 🔁 Next prompts: /sp.specify to create feature specification for multi-user todo application following constitutional principles
- 🧠 Reflection: Constitution successfully establishes clear boundaries between technology layers and assigns specialized agents to each, ensuring security-first approach with mandatory data isolation and authentication requirements

## Evaluation notes (flywheel)

- Failure modes observed: None
- Graders run and results (PASS/FAIL): Manual review - PASS (all placeholders filled, principles clear and testable, quality gates defined)
- Prompt variant (if applicable): N/A (initial constitution)
- Next experiment (smallest change to try): Monitor whether specialized agent assignments are followed during implementation phase; may need to add enforcement mechanisms if violations occur

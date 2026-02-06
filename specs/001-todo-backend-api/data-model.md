# Data Model: Todo Backend API

**Date**: 2026-02-05
**Feature**: 001-todo-backend-api
**Purpose**: Define database schema and entity models for the Todo application

## Overview

This document defines the data model for the Todo application backend. The model supports multi-user data isolation with strict user ownership enforcement. All entities use SQLModel for ORM mapping to Neon PostgreSQL.

## Entities

### Todo Entity

**Purpose**: Represents a single todo item belonging to a user.

**Table Name**: `todos`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier for the todo |
| `title` | String(200) | NOT NULL, Length: 1-200 chars | Todo title (required) |
| `description` | String(1000) | NULL, Length: 0-1000 chars | Optional detailed description |
| `completed` | Boolean | NOT NULL, Default: False | Completion status |
| `user_id` | String(255) | NOT NULL, Indexed, Foreign Key | Owner's user ID from JWT token |
| `created_at` | DateTime | NOT NULL, Default: UTC now | Creation timestamp (ISO 8601) |
| `updated_at` | DateTime | NOT NULL, Default: UTC now, Auto-update | Last modification timestamp (ISO 8601) |

**Indexes**:
- Primary index on `id` (automatic)
- Index on `user_id` for efficient user-specific queries
- Composite index on `(user_id, created_at DESC)` for ordered retrieval

**Validation Rules**:
- `title`: Required, trimmed of whitespace, 1-200 characters after trim
- `description`: Optional, 0-1000 characters if provided
- `completed`: Boolean only (true/false)
- `user_id`: Must match authenticated user from JWT token
- Timestamps: Automatically managed by SQLModel

**SQLModel Definition**:

```python
from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Todo(SQLModel, table=True):
    """Todo entity for database storage."""
    __tablename__ = "todos"

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    user_id: str = Field(max_length=255, index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        schema_extra = {
            "example": {
                "id": 1,
                "title": "Complete project documentation",
                "description": "Write comprehensive docs for the API",
                "completed": False,
                "user_id": "user123",
                "created_at": "2026-02-05T10:30:00Z",
                "updated_at": "2026-02-05T10:30:00Z"
            }
        }
```

**Pydantic Models for API**:

```python
from pydantic import BaseModel, Field, validator
from datetime import datetime
from typing import Optional

class TodoCreate(BaseModel):
    """Request model for creating a todo."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        return v.strip()

    @validator('description')
    def description_trim(cls, v):
        return v.strip() if v else None

class TodoUpdate(BaseModel):
    """Request model for updating todo details."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)

    @validator('title')
    def title_must_not_be_empty(cls, v):
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        return v.strip() if v else None

class TodoComplete(BaseModel):
    """Request model for toggling completion status."""
    completed: bool

class TodoResponse(BaseModel):
    """Response model for todo operations."""
    id: int
    title: str
    description: Optional[str]
    completed: bool
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
```

### User Entity (Reference Only)

**Purpose**: Represents a user in the system. This entity is managed by the authentication system (Better Auth) and is referenced by todos.

**Note**: The User entity schema is defined by the authentication system and is out of scope for this feature. The Todo entity only references `user_id` as a string field.

**Assumed Fields**:
- `id`: String or UUID (primary key)
- `email`: String (unique)
- `password_hash`: String (hashed)
- Other authentication-related fields

**Relationship**: User has many Todos (one-to-many via `user_id`)

## Relationships

```
User (1) ----< (many) Todo
         user_id
```

- One User can have many Todos
- Each Todo belongs to exactly one User
- Relationship enforced via `user_id` foreign key
- Cascade behavior: TBD by authentication system (likely CASCADE on delete)

## Database Migrations

**Migration Strategy**: Use Alembic for schema migrations

**Initial Migration** (create todos table):

```sql
-- Migration: create_todos_table
-- Revision: 001

CREATE TABLE todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Indexes for performance
CREATE INDEX idx_todos_user_id ON todos(user_id);
CREATE INDEX idx_todos_user_created ON todos(user_id, created_at DESC);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_todos_updated_at BEFORE UPDATE ON todos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Data Isolation Strategy

**Principle**: Every query MUST filter by `user_id` to prevent cross-user data access.

**Query Patterns**:

```python
# ✅ CORRECT: Always filter by user_id
todos = await session.execute(
    select(Todo).where(Todo.user_id == current_user_id)
)

# ✅ CORRECT: Verify ownership before operations
todo = await session.execute(
    select(Todo).where(
        Todo.id == todo_id,
        Todo.user_id == current_user_id
    )
)

# ❌ INCORRECT: Missing user_id filter (data leakage risk!)
todos = await session.execute(select(Todo))  # NEVER DO THIS
```

**Enforcement**:
- All database queries go through service layer methods
- Service layer methods require `user_id` parameter
- Automated tests verify cross-user access prevention
- Code review checklist includes user_id filtering verification

## Performance Considerations

**Indexes**:
- `user_id` index: Enables fast filtering by user (most common query)
- `(user_id, created_at DESC)` composite index: Optimizes ordered retrieval without separate sort

**Query Optimization**:
- Use `select()` with explicit column selection when full entity not needed
- Limit result sets (pagination) for large todo lists (future enhancement)
- Connection pooling configured for Neon Serverless (5-10 connections)

**Expected Query Performance**:
- Retrieve user's todos: <100ms for 100 items
- Create todo: <50ms
- Update todo: <50ms
- Delete todo: <30ms

## Data Validation

**Application-Level Validation** (Pydantic):
- Title: 1-200 characters, trimmed, non-empty
- Description: 0-1000 characters if provided
- Completed: Boolean only

**Database-Level Constraints**:
- Title: NOT NULL, VARCHAR(200)
- Description: VARCHAR(1000)
- Completed: NOT NULL, BOOLEAN
- User ID: NOT NULL, VARCHAR(255)

**Validation Flow**:
1. Request received → Pydantic validates request body
2. If invalid → Return 400 with validation errors
3. If valid → Pass to service layer
4. Service layer creates/updates entity
5. SQLModel validates against database constraints
6. If constraint violation → Return 500 (should not happen if Pydantic correct)

## Edge Cases

**Empty Description**:
- Allowed (optional field)
- Stored as NULL in database
- Returned as null in JSON responses

**Whitespace-Only Title**:
- Rejected by Pydantic validator
- Returns 400 with error message

**Title/Description Exceeding Max Length**:
- Rejected by Pydantic validator before database
- Returns 400 with specific field error

**Concurrent Updates**:
- Last write wins (no optimistic locking in MVP)
- Future enhancement: Add version field for optimistic locking

**Deleted User's Todos**:
- Behavior depends on authentication system's cascade rules
- Recommended: CASCADE delete (remove todos when user deleted)
- Alternative: Set user_id to NULL and mark as orphaned

## Testing Strategy

**Unit Tests**:
- Pydantic model validation (title length, required fields)
- SQLModel entity creation and field constraints

**Integration Tests**:
- Create todo and verify database persistence
- Retrieve todos filtered by user_id
- Update todo and verify updated_at changes
- Delete todo and verify removal

**Authorization Tests**:
- User A cannot retrieve User B's todos
- User A cannot update User B's todos
- User A cannot delete User B's todos

**Performance Tests**:
- Measure query time for 100 todos
- Verify index usage with EXPLAIN ANALYZE

## Summary

The Todo data model is designed for:
- **Security**: Strict user data isolation via user_id filtering
- **Performance**: Indexed queries for fast retrieval
- **Validation**: Multi-layer validation (Pydantic + database constraints)
- **Simplicity**: Single entity with clear relationships
- **Scalability**: Indexed for efficient queries up to 100 todos per user

**Next Steps**: Implement SQLModel entities and Pydantic models in `backend/src/models/todo.py`

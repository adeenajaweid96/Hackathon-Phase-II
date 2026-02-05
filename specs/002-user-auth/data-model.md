# Data Model: User Authentication

**Date**: 2026-02-05
**Feature**: 002-user-auth
**Purpose**: Define database schema and entity models for user authentication

## Overview

This document defines the data model for user authentication in the multi-user todo application. The model supports secure user signup and signin with bcrypt password hashing, JWT token-based authentication, and rate limiting for brute force protection. All entities use SQLModel for ORM mapping to Neon PostgreSQL.

## Entities

### User Entity

**Purpose**: Represents a registered user account with authentication credentials.

**Table Name**: `users`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Unique identifier for the user |
| `email` | String(255) | NOT NULL, UNIQUE, Indexed | User's email address (normalized to lowercase) |
| `password_hash` | String(255) | NOT NULL | Bcrypt hashed password (cost factor 12) |
| `created_at` | DateTime | NOT NULL, Default: UTC now | Account creation timestamp (ISO 8601) |
| `last_login_at` | DateTime | NULL | Last successful login timestamp (ISO 8601) |
| `is_active` | Boolean | NOT NULL, Default: True | Account active status (for soft deletion) |
| `failed_login_attempts` | Integer | NOT NULL, Default: 0 | Count of consecutive failed login attempts |
| `locked_until` | DateTime | NULL | Account lockout expiration timestamp |

**Indexes**:
- Primary index on `id` (automatic)
- Unique index on `email` for fast lookup and uniqueness enforcement
- Index on `email, is_active` for active user queries

**Validation Rules**:
- `email`: Required, RFC 5322 compliant, normalized to lowercase, 1-255 characters
- `password_hash`: Required, bcrypt hash format (60 characters)
- `failed_login_attempts`: Non-negative integer, reset to 0 on successful login
- `locked_until`: NULL or future timestamp, cleared after expiration

**SQLModel Definition**:

```python
from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String, Index
from datetime import datetime
from typing import Optional
import uuid

class User(SQLModel, table=True):
    """User entity for authentication."""
    __tablename__ = "users"
    __table_args__ = (
        Index("idx_users_email_active", "email", "is_active"),
    )

    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False, index=True))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login_at: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)
    failed_login_attempts: int = Field(default=0)
    locked_until: Optional[datetime] = Field(default=None)

    class Config:
        schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "email": "user@example.com",
                "password_hash": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7fXnCKzXeC",
                "created_at": "2026-02-05T10:30:00Z",
                "last_login_at": "2026-02-05T14:20:00Z",
                "is_active": True,
                "failed_login_attempts": 0,
                "locked_until": None
            }
        }
```

**Pydantic Models for API**:

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from typing import Optional
import uuid
import re

class UserSignUp(BaseModel):
    """Request model for user registration."""
    email: EmailStr = Field(description="User's email address")
    password: str = Field(min_length=8, max_length=128, description="User's password")

    @field_validator('email')
    @classmethod
    def email_to_lowercase(cls, v: str) -> str:
        """Normalize email to lowercase."""
        return v.lower().strip()

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets complexity requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not re.search(r'[0-9]', v):
            raise ValueError('Password must contain at least one number')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        return v

class UserSignIn(BaseModel):
    """Request model for user authentication."""
    email: EmailStr = Field(description="User's email address")
    password: str = Field(description="User's password")

    @field_validator('email')
    @classmethod
    def email_to_lowercase(cls, v: str) -> str:
        """Normalize email to lowercase."""
        return v.lower().strip()

class UserResponse(BaseModel):
    """Response model for user data (excludes password_hash)."""
    id: uuid.UUID
    email: str
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True

class AuthTokenResponse(BaseModel):
    """Response model for authentication with JWT token."""
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(description="Authenticated user information")
    expires_in: int = Field(default=86400, description="Token expiration in seconds (24 hours)")
```

### Authentication Event Entity (Optional - for audit logging)

**Purpose**: Represents security audit log entries for authentication events.

**Table Name**: `auth_events`

**Fields**:

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | Integer | Primary Key, Auto-increment | Unique identifier for the event |
| `user_id` | UUID | NULL, Foreign Key (users.id) | User ID (NULL for failed attempts with non-existent email) |
| `email` | String(255) | NOT NULL | Email address used in authentication attempt |
| `event_type` | String(50) | NOT NULL | Event type: signup, signin, failed_login, logout, account_locked |
| `ip_address` | String(45) | NULL | Client IP address (IPv4 or IPv6) |
| `user_agent` | String(500) | NULL | Client user agent string |
| `created_at` | DateTime | NOT NULL, Default: UTC now | Event timestamp (ISO 8601) |
| `metadata` | JSON | NULL | Additional event-specific data |

**Indexes**:
- Primary index on `id` (automatic)
- Index on `user_id` for user-specific event queries
- Index on `email, created_at` for rate limiting queries
- Index on `created_at` for time-based queries

**Note**: This entity is optional for MVP but recommended for security monitoring and debugging.

## Relationships

```
User (1) ----< (many) Todo
         user_id

User (1) ----< (many) AuthEvent
         user_id
```

- One User can have many Todos (existing relationship from specs/001-todo-backend-api)
- One User can have many AuthEvents (audit trail)
- Relationship enforced via `user_id` foreign key
- Cascade behavior: CASCADE on user deletion (remove all related todos and auth events)

## Database Migrations

**Migration Strategy**: Use Alembic for schema migrations

**Initial Migration** (create users table):

```sql
-- Migration: create_users_table
-- Revision: 002

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    last_login_at TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_active ON users(email, is_active);

-- Optional: Auth events table for audit logging
CREATE TABLE auth_events (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    metadata JSONB
);

CREATE INDEX idx_auth_events_user_id ON auth_events(user_id);
CREATE INDEX idx_auth_events_email_created ON auth_events(email, created_at);
CREATE INDEX idx_auth_events_created_at ON auth_events(created_at);
```

## Data Isolation Strategy

**Principle**: User authentication data is inherently isolated by design (each user has unique credentials).

**Query Patterns**:

```python
# ✅ CORRECT: Lookup user by email (for signin)
user = await session.execute(
    select(User).where(
        User.email == email.lower(),
        User.is_active == True
    )
)

# ✅ CORRECT: Check account lockout status
user = await session.execute(
    select(User).where(
        User.email == email.lower(),
        User.locked_until > datetime.utcnow()
    )
)

# ✅ CORRECT: Update last login timestamp
user.last_login_at = datetime.utcnow()
user.failed_login_attempts = 0
user.locked_until = None
await session.commit()

# ❌ INCORRECT: Never expose password_hash in responses
# Always exclude password_hash when returning user data
```

**Enforcement**:
- All authentication queries go through service layer methods
- Password hashes never returned in API responses (use UserResponse model)
- Email normalization (lowercase) enforced at validation layer
- Account lockout checked before password verification

## Performance Considerations

**Indexes**:
- `email` unique index: Enables fast user lookup during signin (most common query)
- `(email, is_active)` composite index: Optimizes active user queries
- `user_id` index on auth_events: Fast audit log retrieval per user

**Query Optimization**:
- Use `select()` with explicit column selection when full entity not needed
- Bcrypt hashing is intentionally slow (~250-350ms) for security
- Rate limiting queries use time-based indexes for efficiency

**Expected Query Performance**:
- User lookup by email: <10ms
- Password verification (bcrypt): 250-350ms (intentional for security)
- Account lockout check: <5ms
- Failed attempt increment: <10ms

## Data Validation

**Application-Level Validation** (Pydantic):
- Email: RFC 5322 compliant, normalized to lowercase, 1-255 characters
- Password: 8-128 characters, complexity requirements (uppercase, lowercase, number, special char)
- Password hash: Bcrypt format validation

**Database-Level Constraints**:
- Email: NOT NULL, UNIQUE, VARCHAR(255)
- Password hash: NOT NULL, VARCHAR(255)
- Failed login attempts: NOT NULL, INTEGER, DEFAULT 0
- Is active: NOT NULL, BOOLEAN, DEFAULT TRUE

**Validation Flow**:
1. Request received → Pydantic validates request body
2. If invalid → Return 400 with validation errors
3. If valid → Pass to service layer
4. Service layer hashes password (signup) or verifies hash (signin)
5. SQLModel validates against database constraints
6. If constraint violation → Return appropriate error (409 for duplicate email)

## Edge Cases

**Duplicate Email Registration**:
- Database unique constraint prevents duplicates
- Returns 409 Conflict with message "Email already registered"

**Account Lockout**:
- After 5 failed attempts, `locked_until` set to 15 minutes in future
- Signin attempts during lockout return 429 Too Many Requests
- Lockout automatically expires after 15 minutes

**Concurrent Login Attempts**:
- Multiple concurrent logins allowed (stateless JWT tokens)
- Each login generates independent JWT token
- No session limit enforced

**Password Hash Migration**:
- If bcrypt cost factor needs increase in future, rehash on next successful login
- Old hashes remain valid until user logs in again

**Soft Deletion**:
- `is_active` flag allows soft deletion without losing audit trail
- Inactive users cannot sign in
- Related todos remain in database for data retention

## Testing Strategy

**Unit Tests**:
- Pydantic model validation (email format, password complexity)
- SQLModel entity creation and field constraints
- Password hashing and verification

**Integration Tests**:
- User signup with valid/invalid data
- User signin with correct/incorrect credentials
- Account lockout after failed attempts
- Lockout expiration and recovery

**Security Tests**:
- Password hash never exposed in responses
- Generic error messages for failed authentication
- Rate limiting enforcement
- SQL injection prevention (parameterized queries)

**Performance Tests**:
- Measure bcrypt hashing time (should be 250-350ms)
- Verify email lookup performance (<10ms)
- Test concurrent authentication requests (1000 concurrent)

## Summary

The User data model is designed for:
- **Security**: Bcrypt password hashing, account lockout, rate limiting
- **Performance**: Indexed queries for fast user lookup
- **Validation**: Multi-layer validation (Pydantic + database constraints)
- **Simplicity**: Single primary entity (User) with optional audit logging
- **Scalability**: UUID primary keys, indexed for efficient queries

**Next Steps**: Implement SQLModel entities and Pydantic models in `backend/src/models/user.py`

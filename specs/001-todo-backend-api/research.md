# Research & Technology Decisions: Todo Backend API

**Date**: 2026-02-05
**Feature**: 001-todo-backend-api
**Purpose**: Document technology choices, patterns, and best practices for FastAPI + SQLModel + Neon PostgreSQL implementation

## 1. JWT Token Verification in FastAPI

### Decision
Use **python-jose** library with FastAPI dependency injection for JWT token verification.

### Rationale
- python-jose is the recommended library in FastAPI documentation
- Provides comprehensive JWT support (encoding, decoding, verification)
- Integrates seamlessly with FastAPI's dependency injection system
- Supports multiple algorithms (RS256, HS256)
- Well-maintained and widely used in production

### Alternatives Considered
- **PyJWT**: More lightweight but requires additional wrapper code for FastAPI integration
- **authlib**: More comprehensive but heavier dependency for simple JWT verification
- **Custom implementation**: Rejected due to security risks and maintenance burden

### Implementation Pattern

```python
# dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional

security = HTTPBearer()

async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and verify JWT token, return user_id.
    Raises 401 if token is invalid or missing.
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(
            token,
            SECRET_KEY,  # From environment config
            algorithms=["HS256"]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
```

### References
- [FastAPI Security Documentation](https://fastapi.tiangolo.com/tutorial/security/)
- [python-jose Documentation](https://python-jose.readthedocs.io/)

---

## 2. SQLModel with Neon PostgreSQL

### Decision
Use **SQLModel with async engine** and **asyncpg** driver for Neon Serverless PostgreSQL.

### Rationale
- SQLModel provides Pydantic integration for validation
- Async engine supports FastAPI's async patterns
- asyncpg is the fastest PostgreSQL driver for Python
- Neon Serverless PostgreSQL is fully compatible with standard PostgreSQL drivers
- Connection pooling built into SQLAlchemy async engine

### Alternatives Considered
- **Sync SQLModel**: Rejected due to blocking I/O in async FastAPI context
- **Raw SQLAlchemy Core**: Rejected per constitutional requirement (SQLModel only)
- **psycopg3**: Slower than asyncpg for async operations

### Implementation Pattern

```python
# database.py
from sqlmodel import SQLModel, create_engine
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

# Neon connection string format
DATABASE_URL = "postgresql+asyncpg://user:password@host.neon.tech/dbname?sslmode=require"

# Async engine with connection pooling
engine = create_async_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL logging in development
    pool_size=5,  # Neon recommends smaller pools for serverless
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600  # Recycle connections after 1 hour
)

# Async session factory
async_session = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def get_session() -> AsyncSession:
    """Dependency for FastAPI endpoints to get database session."""
    async with async_session() as session:
        yield session
```

### Connection Pooling Best Practices
- **Pool Size**: 5-10 connections for Neon Serverless (serverless databases have connection limits)
- **Pool Pre-Ping**: Enabled to detect stale connections
- **Pool Recycle**: 1 hour to prevent long-lived connection issues
- **SSL Mode**: Required for Neon connections

### References
- [SQLModel Documentation](https://sqlmodel.tiangolo.com/)
- [Neon PostgreSQL Connection Guide](https://neon.tech/docs/connect/connect-from-any-app)
- [asyncpg Documentation](https://magicstack.github.io/asyncpg/)

---

## 3. Multi-User Data Isolation Patterns

### Decision
Implement **user_id filtering at the query level** with automated enforcement through service layer methods.

### Rationale
- Every database query must include user_id filter to prevent data leakage
- Service layer encapsulates filtering logic to avoid repetition
- SQLModel's query API makes filtering straightforward
- Automated tests verify cross-user access prevention

### Alternatives Considered
- **Database-level row security**: Requires PostgreSQL RLS setup, adds complexity
- **Middleware filtering**: Too late in request cycle, doesn't prevent query execution
- **Manual filtering in endpoints**: Error-prone, easy to forget

### Implementation Pattern

```python
# services/todo_service.py
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional

class TodoService:
    @staticmethod
    async def get_user_todos(session: AsyncSession, user_id: str) -> List[Todo]:
        """Retrieve all todos for a specific user."""
        statement = select(Todo).where(
            Todo.user_id == user_id
        ).order_by(Todo.created_at.desc())
        result = await session.execute(statement)
        return result.scalars().all()

    @staticmethod
    async def get_todo_by_id(
        session: AsyncSession,
        todo_id: int,
        user_id: str
    ) -> Optional[Todo]:
        """Get a specific todo, verifying ownership."""
        statement = select(Todo).where(
            Todo.id == todo_id,
            Todo.user_id == user_id  # CRITICAL: Always filter by user_id
        )
        result = await session.execute(statement)
        return result.scalar_one_or_none()
```

### Testing Strategy for Data Isolation

```python
# tests/test_authorization.py
async def test_user_cannot_access_other_user_todos(client, user1_token, user2_token):
    """Verify cross-user data access is prevented."""
    # User 1 creates a todo
    response = client.post(
        "/api/todos",
        json={"title": "User 1 Todo"},
        headers={"Authorization": f"Bearer {user1_token}"}
    )
    todo_id = response.json()["id"]

    # User 2 attempts to access User 1's todo
    response = client.get(
        f"/api/todos/{todo_id}",
        headers={"Authorization": f"Bearer {user2_token}"}
    )
    assert response.status_code == 403  # Forbidden
```

### References
- [SQLModel Query Documentation](https://sqlmodel.tiangolo.com/tutorial/select/)
- [PostgreSQL Row-Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

---

## 4. FastAPI Error Handling

### Decision
Implement **custom exception handlers** with consistent error response structure across all endpoints.

### Rationale
- Consistent error format improves API usability
- Custom handlers provide detailed validation errors
- Separates error handling logic from endpoint code
- Supports specification requirements (FR-013, FR-015)

### Alternatives Considered
- **Default FastAPI error responses**: Less consistent, minimal detail
- **Manual try-catch in endpoints**: Repetitive, error-prone
- **Middleware-based handling**: Less granular control

### Implementation Pattern

```python
# api/errors.py
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel

class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    validation_errors: Optional[List[dict]] = None

def register_error_handlers(app: FastAPI):
    """Register custom exception handlers."""

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors (400)."""
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Validation Error",
                "detail": "Invalid request data",
                "validation_errors": exc.errors()
            }
        )

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc):
        """Handle 404 Not Found."""
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": "Not Found",
                "detail": "The requested resource does not exist"
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected errors (500)."""
        # Log the error for debugging
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred"
            }
        )
```

### References
- [FastAPI Exception Handling](https://fastapi.tiangolo.com/tutorial/handling-errors/)

---

## 5. Async/Await Patterns

### Decision
Use **async endpoints with async database operations** throughout the application.

### Rationale
- FastAPI is built for async operations
- Async I/O prevents blocking during database queries
- Better performance under concurrent load
- Neon PostgreSQL supports async connections via asyncpg

### Alternatives Considered
- **Sync endpoints**: Simpler but blocks event loop, poor performance
- **Mixed sync/async**: Confusing, requires run_in_executor for sync code
- **Threading**: More complex, doesn't leverage FastAPI's async capabilities

### Implementation Pattern

```python
# api/todos.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/todos", tags=["todos"])

@router.get("/", response_model=List[TodoResponse])
async def get_todos(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Retrieve all todos for authenticated user."""
    todos = await TodoService.get_user_todos(session, user_id)
    return todos

@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_data: TodoCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new todo for authenticated user."""
    todo = await TodoService.create_todo(session, todo_data, user_id)
    await session.commit()
    await session.refresh(todo)
    return todo
```

### When to Use Async vs Sync
- **Use async**: Database operations, external API calls, file I/O
- **Use sync**: Pure computation, in-memory operations
- **Rule**: If it involves I/O, make it async

### References
- [FastAPI Async Documentation](https://fastapi.tiangolo.com/async/)
- [SQLAlchemy Async Documentation](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

---

## 6. Testing Strategy

### Decision
Use **pytest with pytest-asyncio** for async endpoint testing with separate test database.

### Rationale
- pytest is the standard Python testing framework
- pytest-asyncio enables testing async functions
- Separate test database prevents data pollution
- FastAPI TestClient supports both sync and async tests

### Alternatives Considered
- **unittest**: Less feature-rich than pytest
- **In-memory SQLite**: Incompatible with PostgreSQL-specific features
- **Mocking database**: Doesn't test actual database interactions

### Implementation Pattern

```python
# tests/conftest.py
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost/test_todos"

@pytest.fixture(scope="session")
async def test_engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)
    yield engine
    await engine.dispose()

@pytest.fixture
async def test_session(test_engine):
    """Create test database session."""
    async_session = sessionmaker(
        test_engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
def client(test_session):
    """Create test client with overridden dependencies."""
    app.dependency_overrides[get_session] = lambda: test_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture
def user1_token():
    """Generate JWT token for test user 1."""
    return create_test_token(user_id="user1")

@pytest.fixture
def user2_token():
    """Generate JWT token for test user 2."""
    return create_test_token(user_id="user2")
```

### Test Categories
1. **Endpoint Tests**: Verify API contract (status codes, response format)
2. **Authorization Tests**: Verify cross-user access prevention
3. **Validation Tests**: Verify field constraints (max length, required fields)
4. **Performance Tests**: Verify response time targets

### References
- [pytest Documentation](https://docs.pytest.org/)
- [pytest-asyncio Documentation](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

## Summary of Key Decisions

| Area | Technology | Rationale |
|------|------------|-----------|
| JWT Verification | python-jose + FastAPI dependencies | Official recommendation, seamless integration |
| Database Driver | asyncpg | Fastest async PostgreSQL driver |
| ORM | SQLModel (async) | Pydantic integration, constitutional requirement |
| Connection Pooling | SQLAlchemy async engine | Built-in, optimized for Neon Serverless |
| Data Isolation | Service layer filtering | Centralized, testable, prevents leakage |
| Error Handling | Custom exception handlers | Consistent responses, detailed errors |
| Async Pattern | Async endpoints + async DB | Non-blocking I/O, better performance |
| Testing | pytest + pytest-asyncio | Standard framework, async support |

---

## Implementation Checklist

- [ ] Install dependencies: fastapi, sqlmodel, asyncpg, python-jose, pytest, pytest-asyncio
- [ ] Configure Neon PostgreSQL connection string in .env
- [ ] Implement JWT verification dependency (dependencies.py)
- [ ] Set up async database engine and session (database.py)
- [ ] Create Todo SQLModel entity (models/todo.py)
- [ ] Implement service layer with user_id filtering (services/todo_service.py)
- [ ] Create API endpoints with async patterns (api/todos.py)
- [ ] Register custom error handlers (api/errors.py)
- [ ] Set up test fixtures and test database (tests/conftest.py)
- [ ] Write authorization tests for cross-user access prevention
- [ ] Write endpoint tests for all 5 operations
- [ ] Write validation tests for field constraints
- [ ] Verify performance targets with load testing

---

**Status**: Research complete, all technology decisions documented, ready for Phase 1 design artifacts.

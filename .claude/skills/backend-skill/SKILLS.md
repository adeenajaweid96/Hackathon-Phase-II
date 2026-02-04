# Backend Core Skill - FastAPI Routes, Requests & Database

## Overview
Generate efficient FastAPI routes, handle requests/responses properly, and establish database connections with optimal performance.

## 1. Route Structure

**Basic Route Setup**
- RESTful endpoint design
- Proper HTTP methods (GET, POST, PUT, DELETE)
- Path parameters and query strings
- Request/response models with Pydantic

**Router Organization**
- Group related routes
- Prefix and tags for clarity
- Dependency injection
- Middleware integration

## 2. Request/Response Handling

**Request Processing**
- Body validation with Pydantic
- Query parameters
- Path parameters
- Headers and cookies
- File uploads

**Response Formatting**
- Status codes (200, 201, 400, 404, 500)
- Response models
- Error responses
- JSON serialization

## 3. Database Connection

**Setup Connection**
- Async database driver (asyncpg for PostgreSQL)
- Connection pooling
- Session management
- Environment configuration

**Query Execution**
- Async queries
- Transaction handling
- Error handling
- Connection cleanup

## Best Practices

- Use async/await for all database operations
- Validate input with Pydantic models
- Return proper HTTP status codes
- Implement dependency injection for database sessions
- Use environment variables for config
- Handle errors gracefully with try/except
- Close connections properly
- Keep routes thin, business logic in services

## Example Structure

### 1. Database Configuration
```python
# app/core/database.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
import os

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

AsyncSessionLocal = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

# Dependency for routes
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
```

### 2. Pydantic Models (Schemas)
```python
# app/schemas/user.py
from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    
    class Config:
        from_attributes = True
```

### 3. Database Models
```python
# app/models/user.py
from sqlalchemy import Column, Integer, String
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
```

### 4. Route Definition
```python
# app/api/routes/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.schemas.user import UserCreate, UserResponse
from app.models.user import User
from typing import List

router = APIRouter(
    prefix="/api/users",
    tags=["users"]
)

# GET - List users
@router.get("/", response_model=List[UserResponse])
async def get_users(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).offset(skip).limit(limit)
    )
    users = result.scalars().all()
    return users

# GET - Single user
@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

# POST - Create user
@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    # Check if user exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hash_password(user_data.password)  # Use proper hashing
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

# PUT - Update user
@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user.email = user_data.email
    user.name = user_data.name
    
    await db.commit()
    await db.refresh(user)
    
    return user

# DELETE - Remove user
@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await db.delete(user)
    await db.commit()
    
    return None
```

### 5. Main Application Setup
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import users
from app.core.database import engine, Base

app = FastAPI(
    title="My API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(users.router)

# Create tables on startup
@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
```

## Common Patterns

### Error Handling
```python
from fastapi import HTTPException, status

# Not found
raise HTTPException(
    status_code=status.HTTP_404_NOT_FOUND,
    detail="Resource not found"
)

# Bad request
raise HTTPException(
    status_code=status.HTTP_400_BAD_REQUEST,
    detail="Invalid input data"
)

# Unauthorized
raise HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)
```

### Query Parameters
```python
@router.get("/search")
async def search_users(
    q: str,
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(User)
        .where(User.name.ilike(f"%{q}%"))
        .offset(skip)
        .limit(limit)
    )
    return result.scalars().all()
```

### Request Body with Multiple Fields
```python
from typing import Optional

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

@router.patch("/{user_id}")
async def partial_update(
    user_id: int,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    # Update only provided fields
    pass
```

## Project Structure
```
app/
├── main.py                 # FastAPI app initialization
├── core/
│   ├── database.py        # Database connection & session
│   └── config.py          # Environment config
├── api/
│   └── routes/
│       ├── users.py       # User routes
│       ├── posts.py       # Post routes
│       └── auth.py        # Auth routes
├── models/
│   ├── user.py            # SQLAlchemy models
│   └── post.py
├── schemas/
│   ├── user.py            # Pydantic schemas
│   └── post.py
└── services/
    ├── user_service.py    # Business logic
    └── auth_service.py
```

## Environment Setup
```bash
# .env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/dbname
SECRET_KEY=your-secret-key
DEBUG=True
```

## Dependencies
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sqlalchemy==2.0.23
asyncpg==0.29.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0
```

## Quick Start Checklist
- [ ] Install dependencies
- [ ] Set up .env file with DATABASE_URL
- [ ] Create database models (SQLAlchemy)
- [ ] Create Pydantic schemas
- [ ] Set up database connection with pooling
- [ ] Create route files with APIRouter
- [ ] Implement CRUD operations
- [ ] Add error handling
- [ ] Test endpoints with `/docs`
- [ ] Add CORS middleware
- [ ] Implement dependency injection for DB session

---
**Performance Tips**: Always use async/await, implement connection pooling, validate with Pydantic, and keep routes thin with business logic in services.
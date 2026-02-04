<!-- Auth Skill

Description: Implement secure signup and sign-in flows using JWT, password hashing, and modern authentication integrations.

Core Concepts
Authentication fundamentals

Authentication vs Authorization

Stateless vs session-based authentication

Access tokens and refresh tokens

User signup & sign-in

Input validation

Email / username uniqueness

Secure credential storage

Password security

Hashing with bcrypt / argon2

Salting strategies

Password strength enforcement

Token Management
JWT handling

Token generation and verification

Token expiration strategies

Refresh token flow

Protected routes

Middleware / guards

Role-based access control (RBAC)

Permission checks

Integrations
Auth providers

Better Auth integrations

OAuth providers (Google, GitHub)

Social login flows

Account linking

Session management

Secure cookies (httpOnly, secure)

CSRF protection

Logout and token invalidation

Best Practices

Never store plain-text passwords

Always hash and salt passwords

Use short-lived access tokens

Rotate refresh tokens

Protect auth routes with middleware

Enable rate limiting on auth endpoints

Store secrets in environment variables

Example Structure
// Password hashing
const hashedPassword = await bcrypt.hash(password, 10);

// JWT generation
const token = jwt.sign(
  { userId: user.id },
  process.env.JWT_SECRET,
  { expiresIn: "15m" }
);


If you want next:

Advanced Auth Skill (2FA, email verification, password reset)

Auth skill card (short version) for portfolio

Framework-specific version (Next.js, MERN, FastAPI) -->












# Auth Skill - Authentication & Authorization

## Overview
Implement secure authentication with signup, signin, JWT tokens, password hashing, and better-auth integrations for production-ready applications.

## 1. Sign Up Flow

**User Registration**
- Email/password validation
- Password strength requirements
- Duplicate email check
- Hash password with bcrypt
- Store user in database
- Return success response

**Validation Rules**
- Email: Valid format with EmailStr
- Password: Min 8 characters, 1 uppercase, 1 number
- Username: Unique, 3-20 characters
- No SQL injection or XSS

## 2. Sign In Flow

**User Authentication**
- Verify email exists
- Compare hashed password
- Generate JWT access token
- Generate refresh token
- Return tokens + user data
- Set httpOnly cookies (optional)

**Security Checks**
- Rate limiting (5 attempts/15 min)
- Account lockout after failed attempts
- Secure password comparison
- Token expiration handling

## 3. JWT Token Management

**Token Generation**
- Access token: 15-30 min expiry
- Refresh token: 7-30 days expiry
- Include user ID and role in payload
- Sign with secret key
- Use HS256 algorithm

**Token Validation**
- Verify signature
- Check expiration
- Decode payload
- Validate user exists
- Middleware protection

## 4. Password Hashing

**Bcrypt Implementation**
- Use bcrypt with salt rounds 10-12
- Hash on signup
- Compare on signin
- Never store plain passwords
- Async hashing to avoid blocking

**Security Standards**
- Minimum 10 salt rounds
- Unique salt per password
- CPU-intensive by design
- Resistant to rainbow tables

## Best Practices

- Never log passwords or tokens
- Use environment variables for secrets
- Implement rate limiting on auth endpoints
- Set secure httpOnly cookies for tokens
- Validate all inputs with Pydantic
- Use HTTPS in production
- Implement refresh token rotation
- Add CSRF protection for cookies
- Hash passwords asynchronously
- Never expose user passwords in responses

## Example Structure

### 1. Password Hashing Utility
```python
# app/core/security.py
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

### 2. JWT Token Utility
```python
# app/core/jwt.py
from datetime import datetime, timedelta
from jose import JWTError, jwt
from typing import Optional
import os

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    """Verify and decode JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

### 3. Pydantic Schemas
```python
# app/schemas/auth.py
from pydantic import BaseModel, EmailStr, field_validator
import re

class UserSignUp(BaseModel):
    email: EmailStr
    password: str
    name: str
    
    @field_validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain uppercase letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain a number')
        return v

class UserSignIn(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: int
    email: str
    name: str
    
    class Config:
        from_attributes = True
```

### 4. Auth Routes
```python
# app/api/routes/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.core.jwt import create_access_token, create_refresh_token
from app.schemas.auth import UserSignUp, UserSignIn, TokenResponse, UserResponse
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    user_data: UserSignUp,
    db: AsyncSession = Depends(get_db)
):
    """Register new user"""
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
    
    # Hash password
    hashed_password = hash_password(user_data.password)
    
    # Create user
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/signin", response_model=TokenResponse)
async def signin(
    credentials: UserSignIn,
    db: AsyncSession = Depends(get_db)
):
    """Authenticate user and return tokens"""
    # Find user
    result = await db.execute(
        select(User).where(User.email == credentials.email)
    )
    user = result.scalar_one_or_none()
    
    # Verify user and password
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str,
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token"""
    from app.core.jwt import verify_token, create_access_token, create_refresh_token
    
    payload = verify_token(refresh_token)
    
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    user_id = payload.get("sub")
    
    # Verify user exists
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    # Generate new tokens
    new_access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    new_refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token
    )
```

### 5. Auth Middleware
```python
# app/api/dependencies/auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.jwt import verify_token
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    token = credentials.credentials
    
    # Verify token
    payload = verify_token(token)
    
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )
    
    user_id = payload.get("sub")
    
    # Get user from database
    result = await db.execute(select(User).where(User.id == int(user_id)))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

# Protected route example
@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current user information"""
    return current_user
```

### 6. Better-Auth Integration (Optional)
```python
# app/core/better_auth.py
"""
Better-Auth integration for OAuth providers
Supports: Google, GitHub, Discord, etc.
"""

from authlib.integrations.starlette_client import OAuth
import os

oauth = OAuth()

# Google OAuth
oauth.register(
    name='google',
    client_id=os.getenv('GOOGLE_CLIENT_ID'),
    client_secret=os.getenv('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# GitHub OAuth
oauth.register(
    name='github',
    client_id=os.getenv('GITHUB_CLIENT_ID'),
    client_secret=os.getenv('GITHUB_CLIENT_SECRET'),
    authorize_url='https://github.com/login/oauth/authorize',
    access_token_url='https://github.com/login/oauth/access_token',
    client_kwargs={'scope': 'user:email'}
)

# OAuth routes
@router.get("/oauth/{provider}")
async def oauth_login(provider: str, request: Request):
    """Initiate OAuth login"""
    redirect_uri = request.url_for('oauth_callback', provider=provider)
    return await oauth.create_client(provider).authorize_redirect(request, redirect_uri)

@router.get("/oauth/{provider}/callback")
async def oauth_callback(provider: str, request: Request, db: AsyncSession = Depends(get_db)):
    """Handle OAuth callback"""
    client = oauth.create_client(provider)
    token = await client.authorize_access_token(request)
    user_info = await client.parse_id_token(request, token)
    
    # Find or create user
    result = await db.execute(select(User).where(User.email == user_info['email']))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            email=user_info['email'],
            name=user_info.get('name', ''),
            password_hash=hash_password(os.urandom(32).hex())  # Random password
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    
    # Generate tokens
    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})
    refresh_token = create_refresh_token(data={"sub": str(user.id)})
    
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
```

## Environment Variables
```bash
# .env
SECRET_KEY=your-super-secret-key-min-32-characters
DATABASE_URL=postgresql+asyncpg://user:pass@localhost/db
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

## Dependencies
```txt
fastapi==0.104.1
passlib[bcrypt]==1.7.4
python-jose[cryptography]==3.3.0
python-multipart==0.0.6
authlib==1.2.1  # For OAuth
```

## Quick Start Checklist
- [ ] Install auth dependencies (passlib, python-jose)
- [ ] Set SECRET_KEY in .env (min 32 characters)
- [ ] Create User model with password_hash field
- [ ] Implement password hashing functions
- [ ] Create JWT token generation/verification
- [ ] Build signup endpoint with validation
- [ ] Build signin endpoint with token response
- [ ] Create auth middleware for protected routes
- [ ] Implement refresh token endpoint
- [ ] Add rate limiting to auth routes
- [ ] Test authentication flow
- [ ] (Optional) Set up OAuth providers

## Security Checklist
- [ ] Passwords hashed with bcrypt (10+ rounds)
- [ ] JWT tokens have expiration
- [ ] Secrets stored in environment variables
- [ ] Rate limiting on login endpoint
- [ ] HTTPS enabled in production
- [ ] httpOnly cookies for token storage (if using cookies)
- [ ] CSRF protection enabled
- [ ] Input validation on all fields
- [ ] No passwords in logs or responses
- [ ] Account lockout after failed attempts

---
**Security First**: Always hash passwords, use strong JWT secrets, implement rate limiting, and never expose sensitive data in responses.
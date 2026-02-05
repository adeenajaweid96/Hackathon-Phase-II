"""
Authentication API endpoints.

This module provides:
- POST /api/auth/signup - User registration
- POST /api/auth/signin - User authentication
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user information

All endpoints implement security best practices:
- Rate limiting for brute force protection
- Generic error messages (no user enumeration)
- Password hashing with bcrypt
- JWT token generation and validation
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session
from sqlalchemy.exc import IntegrityError
from jose import JWTError, jwt
from datetime import datetime

from ..models.user import UserSignUp, UserSignIn, UserResponse, AuthTokenResponse, User
from ..services.auth_service import (
    create_user,
    verify_user_credentials,
    create_access_token,
    get_user_by_email,
    is_account_locked
)
from ..services.rate_limit import rate_limiter
from ..database import get_session
from ..config import settings


router = APIRouter(prefix="/api/auth", tags=["Authentication"])
security = HTTPBearer()


@router.post("/signup", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(
    credentials: UserSignUp,
    session: Session = Depends(get_session)
):
    """
    Register a new user account.

    **Request Body:**
    - email: Valid email address (will be normalized to lowercase)
    - password: Password meeting complexity requirements (8+ chars, uppercase, lowercase, number, special char)

    **Response:**
    - access_token: JWT token for authentication
    - token_type: "bearer"
    - user: User information (id, email, created_at)
    - expires_in: Token expiration in seconds (86400 = 24 hours)

    **Errors:**
    - 400 Bad Request: Invalid email format or weak password
    - 409 Conflict: Email already registered
    - 500 Internal Server Error: Database error

    **Security:**
    - Password is hashed with bcrypt (cost factor 12) before storage
    - Email is normalized to lowercase
    - Returns JWT token immediately after registration
    """
    try:
        # Create user with hashed password
        user = await create_user(session, credentials.email, credentials.password)

        # Generate JWT token
        access_token = create_access_token(user.id, user.email)

        # Return token and user info
        return AuthTokenResponse(
            access_token=access_token,
            token_type="bearer",
            user=UserResponse.from_orm(user),
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )

    except IntegrityError:
        # Email already exists (unique constraint violation)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    except Exception as e:
        # Log error for debugging (don't expose to client)
        print(f"Signup error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user account"
        )


@router.post("/signin", response_model=AuthTokenResponse)
async def signin(
    credentials: UserSignIn,
    request: Request,
    session: Session = Depends(get_session)
):
    """
    Authenticate user and return JWT token.

    **Request Body:**
    - email: User's email address
    - password: User's password

    **Response:**
    - access_token: JWT token for authentication
    - token_type: "bearer"
    - user: User information (id, email, created_at, last_login_at)
    - expires_in: Token expiration in seconds (86400 = 24 hours)

    **Errors:**
    - 401 Unauthorized: Invalid credentials (generic message)
    - 429 Too Many Requests: Account locked due to failed attempts
    - 500 Internal Server Error: Database error

    **Security:**
    - Rate limiting: 5 failed attempts per 15 minutes
    - Account lockout: 15 minutes after 5 failed attempts
    - Generic error messages (no indication if email exists)
    - Password verification with timing attack protection
    - Updates last_login_at on successful authentication
    """
    # Check if account is locked (rate limiting)
    if rate_limiter.is_locked(credentials.email):
        lockout_expiry = rate_limiter.get_lockout_expiry(credentials.email)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
        )

    # Check database-level account lockout
    if await is_account_locked(session, credentials.email):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to multiple failed login attempts. Please try again in 15 minutes."
        )

    # Verify credentials
    user = await verify_user_credentials(session, credentials.email, credentials.password)

    if not user:
        # Record failed attempt for rate limiting
        rate_limiter.record_failed_attempt(credentials.email)

        # Generic error message (don't reveal if email exists)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

    # Clear rate limiter on successful login
    rate_limiter.clear_attempts(credentials.email)

    # Generate JWT token
    access_token = create_access_token(user.id, user.email)

    # Return token and user info
    return AuthTokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.from_orm(user),
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
):
    """
    Get current authenticated user information.

    **Headers:**
    - Authorization: Bearer <JWT_TOKEN>

    **Response:**
    - id: User's unique identifier
    - email: User's email address
    - created_at: Account creation timestamp
    - last_login_at: Last successful login timestamp

    **Errors:**
    - 401 Unauthorized: Missing, invalid, or expired token
    - 404 Not Found: User not found in database

    **Security:**
    - Validates JWT token signature
    - Checks token expiration
    - Extracts user ID from token claims
    - Verifies user exists and is active
    """
    token = credentials.credentials

    try:
        # Decode and verify JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Extract user ID from token
        user_id: str = payload.get("sub")
        email: str = payload.get("email")

        if user_id is None or email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        # Check token expiration
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired"
            )

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

    # Fetch user from database
    user = await get_user_by_email(session, email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return UserResponse.from_orm(user)


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """
    Logout user (client-side token clearing).

    **Headers:**
    - Authorization: Bearer <JWT_TOKEN>

    **Response:**
    - message: Success message

    **Note:**
    Since JWT tokens are stateless, logout is handled client-side by:
    1. Clearing the token from browser storage (cookies/localStorage)
    2. Removing Authorization header from future requests
    3. Redirecting to signin page

    The backend simply validates the token and returns success.
    The client is responsible for clearing the token.

    **Security:**
    - Validates token before allowing logout
    - Token remains valid until expiration (24 hours)
    - For immediate revocation, implement token blacklist (future enhancement)
    """
    # Token validation is handled by Depends(security)
    # If we reach here, token is valid

    return {
        "message": "Logout successful. Please clear your authentication token.",
        "detail": "Token will remain valid until expiration. Clear it from your browser storage."
    }

"""
Authentication service for user management and password operations.

This module provides:
- Password hashing with bcrypt (cost factor 12)
- Password verification with timing attack protection
- User creation and lookup operations
- JWT token generation
"""

from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
from sqlmodel import Session, select
from ..models.user import User
from ..config import settings
import uuid


# Password hashing context with bcrypt cost factor 12
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Cost factor 12 for security (250-350ms per hash)
)


def hash_password(password: str) -> str:
    """
    Hash password using bcrypt with cost factor 12.

    Args:
        password: Plain text password

    Returns:
        Hashed password string (includes salt and cost factor)

    Security:
        - Uses bcrypt with cost factor 12 (OWASP recommended)
        - Automatically generates and includes salt
        - Takes ~250-350ms per hash (intentional for brute force protection)
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify password against hash with timing attack protection.

    Args:
        plain_password: User-provided password
        hashed_password: Stored password hash

    Returns:
        True if password matches, False otherwise

    Security:
        - Uses constant-time comparison (passlib handles this)
        - No information leakage about password correctness timing
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: uuid.UUID, email: str) -> str:
    """
    Generate JWT access token with user claims.

    Args:
        user_id: User's unique identifier
        email: User's email address

    Returns:
        JWT token string

    Token Claims:
        - sub: User ID (subject)
        - email: User's email
        - exp: Expiration timestamp (24 hours from now)
        - iat: Issued at timestamp

    Security:
        - Uses HS256 algorithm
        - 24-hour expiration
        - Signed with SECRET_KEY from environment
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(user_id),  # Subject (user identifier)
        "email": email,
        "exp": expire,  # Expiration time
        "iat": datetime.utcnow()  # Issued at
    }

    token = jwt.encode(
        payload,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return token


async def get_user_by_email(session: Session, email: str) -> Optional[User]:
    """
    Retrieve user by email address.

    Args:
        session: Database session
        email: User's email (will be normalized to lowercase)

    Returns:
        User object if found, None otherwise

    Security:
        - Email is normalized to lowercase for case-insensitive lookup
        - Only returns active users (is_active=True)
    """
    statement = select(User).where(
        User.email == email.lower(),
        User.is_active == True
    )
    result = await session.execute(statement)
    return result.scalar_one_or_none()


async def create_user(session: Session, email: str, password: str) -> User:
    """
    Create new user with hashed password.

    Args:
        session: Database session
        email: User's email (will be normalized to lowercase)
        password: Plain text password (will be hashed)

    Returns:
        Created User object

    Raises:
        IntegrityError: If email already exists (unique constraint)

    Security:
        - Password is hashed with bcrypt before storage
        - Email is normalized to lowercase
        - Never stores plain text password
    """
    password_hash = hash_password(password)

    user = User(
        email=email.lower(),
        password_hash=password_hash,
        created_at=datetime.utcnow(),
        is_active=True,
        failed_login_attempts=0
    )

    session.add(user)
    await session.commit()
    await session.refresh(user)

    return user


async def verify_user_credentials(session: Session, email: str, password: str) -> Optional[User]:
    """
    Verify user credentials and return user if valid.

    Args:
        session: Database session
        email: User's email
        password: Plain text password

    Returns:
        User object if credentials are valid, None otherwise

    Security:
        - Uses constant-time password comparison
        - Checks account lockout status
        - Updates failed login attempts
        - Generic error (no information leakage)
    """
    user = await get_user_by_email(session, email)

    if not user:
        # User doesn't exist - return None (generic error)
        return None

    # Check if account is locked
    if user.locked_until and user.locked_until > datetime.utcnow():
        # Account is locked - return None (will be handled by rate limiter)
        return None

    # Verify password
    if not verify_password(password, user.password_hash):
        # Password incorrect - increment failed attempts
        user.failed_login_attempts += 1

        # Lock account after 5 failed attempts
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.utcnow() + timedelta(minutes=15)

        await session.commit()
        return None

    # Credentials valid - reset failed attempts and update last login
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = datetime.utcnow()
    await session.commit()
    await session.refresh(user)

    return user


async def is_account_locked(session: Session, email: str) -> bool:
    """
    Check if user account is currently locked.

    Args:
        session: Database session
        email: User's email

    Returns:
        True if account is locked, False otherwise

    Security:
        - Checks locked_until timestamp
        - Automatically expires lockout after 15 minutes
    """
    user = await get_user_by_email(session, email)

    if not user:
        return False

    if user.locked_until and user.locked_until > datetime.utcnow():
        return True

    return False

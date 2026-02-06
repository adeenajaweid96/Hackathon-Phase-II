"""
User model and Pydantic schemas for authentication.

This module defines:
- User SQLModel entity for database storage
- Pydantic request/response models for API validation
- Password validation and email normalization
"""

from sqlmodel import SQLModel, Field, Column
from sqlalchemy import String, Index
from pydantic import BaseModel, EmailStr, field_validator
from datetime import datetime
from typing import Optional
import uuid
import re


class User(SQLModel, table=True):
    """
    User entity for authentication.

    Stores user credentials and authentication metadata.
    Password is stored as bcrypt hash (never plain text).
    """
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


class UserSignUp(BaseModel):
    """
    Request model for user registration.

    Validates email format and password complexity requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    """
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
        """
        Validate password meets complexity requirements.

        Requirements:
        - Minimum 8 characters
        - At least one uppercase letter (A-Z)
        - At least one lowercase letter (a-z)
        - At least one number (0-9)
        - At least one special character
        """
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
    """
    Request model for user authentication.

    Simple email/password credentials for signin.
    """
    email: EmailStr = Field(description="User's email address")
    password: str = Field(description="User's password")

    @field_validator('email')
    @classmethod
    def email_to_lowercase(cls, v: str) -> str:
        """Normalize email to lowercase."""
        return v.lower().strip()


class UserResponse(BaseModel):
    """
    Response model for user data.

    Excludes sensitive fields like password_hash.
    Used in API responses to return user information.
    """
    id: uuid.UUID
    email: str
    created_at: datetime
    last_login_at: Optional[datetime]

    class Config:
        from_attributes = True


class AuthTokenResponse(BaseModel):
    """
    Response model for authentication with JWT token.

    Returned after successful signup or signin.
    Includes JWT token and user information.
    """
    access_token: str = Field(description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    user: UserResponse = Field(description="Authenticated user information")
    expires_in: int = Field(default=86400, description="Token expiration in seconds (24 hours)")

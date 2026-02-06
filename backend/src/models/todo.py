"""
Todo data models for database and API.
Includes SQLModel entity and Pydantic request/response models.
"""
from sqlmodel import SQLModel, Field, Index
from pydantic import BaseModel, field_validator
from datetime import datetime, timezone
from typing import Optional
from enum import Enum


class Priority(str, Enum):
    """Task priority levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class Status(str, Enum):
    """Task status."""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"


# SQLModel Entity for Database
class Todo(SQLModel, table=True):
    """
    Todo entity for database storage.

    Represents a task item with title, description, completion status,
    and user ownership. Includes automatic timestamps.
    """
    __tablename__ = "todos"
    __table_args__ = (
        Index("idx_todos_user_id", "user_id"),
        Index("idx_todos_user_created", "user_id", "created_at"),
    )

    id: Optional[int] = Field(default=None, primary_key=True)
    title: str = Field(max_length=200, min_length=1)
    description: Optional[str] = Field(default=None, max_length=1000)
    completed: bool = Field(default=False)
    priority: str = Field(default="medium", max_length=20)
    status: str = Field(default="not_started", max_length=20)
    user_id: str = Field(max_length=255, index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Pydantic Models for API

class TodoCreate(BaseModel):
    """Request model for creating a todo."""
    title: str = Field(min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: Optional[str] = Field(default="medium")
    status: Optional[str] = Field(default="not_started")

    @field_validator('title')
    @classmethod
    def title_must_not_be_empty(cls, v: str) -> str:
        """Validate title is not empty or whitespace only."""
        if not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        return v.strip()

    @field_validator('description')
    @classmethod
    def description_trim(cls, v: Optional[str]) -> Optional[str]:
        """Trim description whitespace."""
        return v.strip() if v else None

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> str:
        """Validate priority is one of the allowed values."""
        if v and v not in ["low", "medium", "high"]:
            raise ValueError('Priority must be low, medium, or high')
        return v or "medium"

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> str:
        """Validate status is one of the allowed values."""
        if v and v not in ["not_started", "in_progress", "completed"]:
            raise ValueError('Status must be not_started, in_progress, or completed')
        return v or "not_started"


class TodoUpdate(BaseModel):
    """Request model for updating todo details."""
    title: Optional[str] = Field(default=None, min_length=1, max_length=200)
    description: Optional[str] = Field(default=None, max_length=1000)
    priority: Optional[str] = Field(default=None)
    status: Optional[str] = Field(default=None)

    @field_validator('title')
    @classmethod
    def title_must_not_be_empty(cls, v: Optional[str]) -> Optional[str]:
        """Validate title is not empty or whitespace only if provided."""
        if v is not None and not v.strip():
            raise ValueError('Title cannot be empty or whitespace only')
        return v.strip() if v else None

    @field_validator('description')
    @classmethod
    def description_trim(cls, v: Optional[str]) -> Optional[str]:
        """Trim description whitespace."""
        return v.strip() if v else None

    @field_validator('priority')
    @classmethod
    def validate_priority(cls, v: Optional[str]) -> Optional[str]:
        """Validate priority is one of the allowed values."""
        if v and v not in ["low", "medium", "high"]:
            raise ValueError('Priority must be low, medium, or high')
        return v

    @field_validator('status')
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        """Validate status is one of the allowed values."""
        if v and v not in ["not_started", "in_progress", "completed"]:
            raise ValueError('Status must be not_started, in_progress, or completed')
        return v


class TodoComplete(BaseModel):
    """Request model for toggling completion status."""
    completed: bool


class TodoResponse(BaseModel):
    """Response model for todo operations."""
    id: int
    title: str
    description: Optional[str]
    completed: bool
    priority: str
    status: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True  # Pydantic v2 (was orm_mode in v1)

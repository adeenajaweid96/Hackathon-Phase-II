"""
Todo service layer for business logic.
Handles database operations with user_id filtering for data isolation.
"""
from sqlmodel import select
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from datetime import datetime, timezone

from src.models.todo import Todo, TodoCreate, TodoUpdate


class TodoService:
    """Service class for todo operations with strict user data isolation."""

    @staticmethod
    async def get_user_todos(session: AsyncSession, user_id: str) -> List[Todo]:
        """
        Retrieve all todos for a specific user.

        Args:
            session: Database session
            user_id: User ID from JWT token

        Returns:
            List of Todo objects ordered by creation date (newest first)

        Note:
            CRITICAL: Always filters by user_id to prevent cross-user data access
        """
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
        """
        Get a specific todo, verifying ownership.

        Args:
            session: Database session
            todo_id: Todo ID
            user_id: User ID from JWT token

        Returns:
            Todo object if found and owned by user, None otherwise

        Note:
            CRITICAL: Always filters by both todo_id AND user_id
            This prevents users from accessing other users' todos
        """
        statement = select(Todo).where(
            Todo.id == todo_id,
            Todo.user_id == user_id  # CRITICAL: Ownership verification
        )
        result = await session.execute(statement)
        return result.scalar_one_or_none()

    @staticmethod
    async def create_todo(
        session: AsyncSession,
        todo_data: TodoCreate,
        user_id: str
    ) -> Todo:
        """
        Create a new todo for the authenticated user.

        Args:
            session: Database session
            todo_data: Todo creation data
            user_id: User ID from JWT token

        Returns:
            Created Todo object
        """
        todo = Todo(
            title=todo_data.title,
            description=todo_data.description,
            completed=False,  # New todos are always incomplete
            priority=todo_data.priority or "medium",
            status=todo_data.status or "not_started",
            user_id=user_id,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        session.add(todo)
        await session.commit()
        await session.refresh(todo)
        return todo

    @staticmethod
    async def update_todo_completion(
        session: AsyncSession,
        todo_id: int,
        user_id: str,
        completed: bool
    ) -> Optional[Todo]:
        """
        Update todo completion status.

        Args:
            session: Database session
            todo_id: Todo ID
            user_id: User ID from JWT token
            completed: New completion status

        Returns:
            Updated Todo object if found and owned by user, None otherwise
        """
        todo = await TodoService.get_todo_by_id(session, todo_id, user_id)
        if not todo:
            return None

        todo.completed = completed
        todo.updated_at = datetime.now(timezone.utc)
        session.add(todo)
        await session.commit()
        await session.refresh(todo)
        return todo

    @staticmethod
    async def update_todo_details(
        session: AsyncSession,
        todo_id: int,
        user_id: str,
        todo_data: TodoUpdate
    ) -> Optional[Todo]:
        """
        Update todo title and/or description.

        Args:
            session: Database session
            todo_id: Todo ID
            user_id: User ID from JWT token
            todo_data: Update data (title and/or description)

        Returns:
            Updated Todo object if found and owned by user, None otherwise
        """
        todo = await TodoService.get_todo_by_id(session, todo_id, user_id)
        if not todo:
            return None

        # Update only provided fields
        if todo_data.title is not None:
            todo.title = todo_data.title
        if todo_data.description is not None:
            todo.description = todo_data.description
        if todo_data.priority is not None:
            todo.priority = todo_data.priority
        if todo_data.status is not None:
            todo.status = todo_data.status

        todo.updated_at = datetime.now(timezone.utc)
        session.add(todo)
        await session.commit()
        await session.refresh(todo)
        return todo

    @staticmethod
    async def delete_todo(
        session: AsyncSession,
        todo_id: int,
        user_id: str
    ) -> bool:
        """
        Delete a todo.

        Args:
            session: Database session
            todo_id: Todo ID
            user_id: User ID from JWT token

        Returns:
            True if todo was deleted, False if not found or not owned by user
        """
        todo = await TodoService.get_todo_by_id(session, todo_id, user_id)
        if not todo:
            return False

        await session.delete(todo)
        await session.commit()
        return True

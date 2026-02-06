"""
Todo API endpoints.
Handles all CRUD operations for todos with JWT authentication.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
import logging

from src.database import get_session
from src.api.dependencies import get_current_user_id
from src.models.todo import TodoCreate, TodoUpdate, TodoComplete, TodoResponse
from src.services.todo_service import TodoService


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/todos",
    tags=["todos"]
)


@router.get("/", response_model=List[TodoResponse])
async def get_todos(
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Retrieve all todos for the authenticated user.

    Returns todos ordered by creation date (newest first).
    Performance target: <500ms for up to 100 items.

    Args:
        session: Database session (injected)
        user_id: Authenticated user ID from JWT token (injected)

    Returns:
        List of TodoResponse objects

    Raises:
        401: If authentication token is invalid or missing
    """
    logger.info(f"User {user_id} retrieving todos")
    todos = await TodoService.get_user_todos(session, user_id)
    logger.info(f"User {user_id} retrieved {len(todos)} todos")
    return todos


@router.post("/", response_model=TodoResponse, status_code=status.HTTP_201_CREATED)
async def create_todo(
    todo_data: TodoCreate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Create a new todo for the authenticated user.

    The todo is automatically associated with the authenticated user.
    Performance target: <300ms.

    Args:
        todo_data: Todo creation data (title, description)
        session: Database session (injected)
        user_id: Authenticated user ID from JWT token (injected)

    Returns:
        Created TodoResponse object

    Raises:
        400: If validation fails (title too long, etc.)
        401: If authentication token is invalid or missing
    """
    logger.info(f"User {user_id} creating todo: {todo_data.title}")
    todo = await TodoService.create_todo(session, todo_data, user_id)
    logger.info(f"User {user_id} created todo {todo.id}")
    return todo


@router.patch("/{todo_id}/complete", response_model=TodoResponse)
async def complete_todo(
    todo_id: int,
    completion_data: TodoComplete,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Toggle todo completion status.

    User must be the owner of the todo.
    Performance target: <300ms.

    Args:
        todo_id: Todo ID
        completion_data: Completion status (completed: bool)
        session: Database session (injected)
        user_id: Authenticated user ID from JWT token (injected)

    Returns:
        Updated TodoResponse object

    Raises:
        401: If authentication token is invalid or missing
        403: If user does not own the todo
        404: If todo does not exist
    """
    logger.info(f"User {user_id} updating completion status for todo {todo_id} to {completion_data.completed}")
    todo = await TodoService.update_todo_completion(
        session,
        todo_id,
        user_id,
        completion_data.completed
    )

    if not todo:
        logger.warning(f"User {user_id} attempted to access todo {todo_id} - not found or forbidden")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or you do not have permission to access it"
        )

    logger.info(f"User {user_id} updated todo {todo_id} completion status")
    return todo


@router.put("/{todo_id}", response_model=TodoResponse)
async def update_todo(
    todo_id: int,
    todo_data: TodoUpdate,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Update todo title and/or description.

    User must be the owner of the todo.
    Performance target: <300ms.

    Args:
        todo_id: Todo ID
        todo_data: Update data (title and/or description)
        session: Database session (injected)
        user_id: Authenticated user ID from JWT token (injected)

    Returns:
        Updated TodoResponse object

    Raises:
        400: If validation fails
        401: If authentication token is invalid or missing
        403: If user does not own the todo
        404: If todo does not exist
    """
    logger.info(f"User {user_id} updating todo {todo_id}")
    todo = await TodoService.update_todo_details(
        session,
        todo_id,
        user_id,
        todo_data
    )

    if not todo:
        logger.warning(f"User {user_id} attempted to update todo {todo_id} - not found or forbidden")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or you do not have permission to access it"
        )

    logger.info(f"User {user_id} updated todo {todo_id}")
    return todo


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(
    todo_id: int,
    session: AsyncSession = Depends(get_session),
    user_id: str = Depends(get_current_user_id)
):
    """
    Delete a todo.

    User must be the owner of the todo.
    Performance target: <200ms.

    Args:
        todo_id: Todo ID
        session: Database session (injected)
        user_id: Authenticated user ID from JWT token (injected)

    Returns:
        204 No Content on success

    Raises:
        401: If authentication token is invalid or missing
        403: If user does not own the todo
        404: If todo does not exist
    """
    logger.info(f"User {user_id} deleting todo {todo_id}")
    deleted = await TodoService.delete_todo(session, todo_id, user_id)

    if not deleted:
        logger.warning(f"User {user_id} attempted to delete todo {todo_id} - not found or forbidden")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found or you do not have permission to access it"
        )

    logger.info(f"User {user_id} deleted todo {todo_id}")
    return None

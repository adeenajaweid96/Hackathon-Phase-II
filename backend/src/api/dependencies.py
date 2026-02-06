"""
FastAPI dependencies for authentication and authorization.
Handles JWT token verification and user extraction.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Optional

from src.config import settings


# HTTP Bearer token security scheme
security = HTTPBearer()


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    """
    Extract and verify JWT token, return user_id.

    This dependency is used on all protected endpoints to:
    1. Verify the JWT token is valid
    2. Extract the user_id from the token claims
    3. Raise 401 Unauthorized if token is invalid or missing

    Args:
        credentials: HTTP Bearer token from Authorization header

    Returns:
        str: The user_id extracted from the JWT token

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing user_id

    Usage:
        @app.get("/protected")
        async def protected_route(user_id: str = Depends(get_current_user_id)):
            # user_id is now available and verified
            ...
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials

        # Decode and verify JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )

        # Extract user_id from token claims (stored in 'sub' field)
        user_id: Optional[str] = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        return user_id

    except JWTError:
        raise credentials_exception

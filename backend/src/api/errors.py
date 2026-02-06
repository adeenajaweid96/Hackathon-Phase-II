"""
Custom error handlers for consistent API error responses.
Handles validation errors, HTTP exceptions, and unexpected errors.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ErrorResponse(BaseModel):
    """Standard error response structure."""
    error: str
    detail: Optional[str] = None
    validation_errors: Optional[List[Dict[str, Any]]] = None


def register_error_handlers(app: FastAPI) -> None:
    """
    Register custom exception handlers with the FastAPI application.

    Args:
        app: FastAPI application instance
    """

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request,
        exc: RequestValidationError
    ) -> JSONResponse:
        """
        Handle Pydantic validation errors (400 Bad Request).

        Returns detailed validation errors to help clients fix their requests.
        """
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": "Validation Error",
                "detail": "Invalid request data",
                "validation_errors": exc.errors()
            }
        )

    @app.exception_handler(404)
    async def not_found_handler(request: Request, exc: Exception) -> JSONResponse:
        """Handle 404 Not Found errors."""
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "error": "Not Found",
                "detail": "The requested resource does not exist"
            }
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(
        request: Request,
        exc: Exception
    ) -> JSONResponse:
        """
        Handle unexpected errors (500 Internal Server Error).

        Logs the full error for debugging but returns a generic message to clients.
        """
        # Log the full error with traceback for debugging
        logger.error(
            f"Unhandled exception: {exc}",
            exc_info=True,
            extra={
                "path": request.url.path,
                "method": request.method
            }
        )

        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": "Internal Server Error",
                "detail": "An unexpected error occurred"
            }
        )

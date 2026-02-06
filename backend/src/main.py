"""
FastAPI application entry point for Todo Backend API.
Initializes the application, registers error handlers, and configures CORS.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config import settings
from src.database import create_db_and_tables, close_db_connection
from src.api.errors import register_error_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup: Create database tables
    await create_db_and_tables()
    yield
    # Shutdown: Close database connections
    await close_db_connection()


# Create FastAPI application instance
app = FastAPI(
    title=settings.APP_NAME,
    description="RESTful API for multi-user todo application with JWT authentication",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register custom error handlers
register_error_handlers(app)


@app.get("/", tags=["health"])
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": "1.0.0"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "app": settings.APP_NAME
    }


# Register authentication routes
from src.api.auth import router as auth_router
app.include_router(auth_router)

# Register todo routes
from src.api.todos import router as todos_router
app.include_router(todos_router)

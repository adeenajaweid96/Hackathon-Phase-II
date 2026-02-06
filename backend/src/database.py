"""
Database connection and session management for Neon PostgreSQL.
Uses SQLModel with async engine and asyncpg driver.
"""
from sqlmodel import SQLModel
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from typing import AsyncGenerator

from src.config import settings

# Import all models to ensure they're registered with SQLModel metadata
from src.models.user import User
from src.models.todo import Todo


# Create async engine with connection pooling optimized for Neon Serverless
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,  # SQL logging in debug mode
    pool_size=5,  # Neon recommends smaller pools for serverless
    max_overflow=10,
    pool_pre_ping=True,  # Verify connections before use
    pool_recycle=3600,  # Recycle connections after 1 hour
    connect_args={
        "ssl": "require",  # Neon requires SSL
        "server_settings": {
            "application_name": "todo_backend"
        }
    }
)

# Async session factory
async_session_maker = sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for FastAPI endpoints to get database session.

    Usage:
        @app.get("/items")
        async def get_items(session: AsyncSession = Depends(get_session)):
            ...
    """
    async with async_session_maker() as session:
        yield session


async def create_db_and_tables():
    """
    Create database tables.
    Should be called on application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)


async def close_db_connection():
    """
    Close database connection pool.
    Should be called on application shutdown.
    """
    await engine.dispose()

"""
Add priority and status columns to todos table.
Run this once to migrate existing database.
"""
import asyncio
from sqlalchemy import text
from src.database import engine


async def add_columns():
    """Add priority and status columns to todos table."""
    async with engine.begin() as conn:
        # Check if columns exist
        check_priority = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='todos' AND column_name='priority'
        """))

        check_status = await conn.execute(text("""
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='todos' AND column_name='status'
        """))

        priority_exists = check_priority.fetchone() is not None
        status_exists = check_status.fetchone() is not None

        # Add priority column if it doesn't exist
        if not priority_exists:
            await conn.execute(text("""
                ALTER TABLE todos
                ADD COLUMN priority VARCHAR(20) DEFAULT 'medium' NOT NULL
            """))
            print("Added priority column")
        else:
            print("Priority column already exists")

        # Add status column if it doesn't exist
        if not status_exists:
            await conn.execute(text("""
                ALTER TABLE todos
                ADD COLUMN status VARCHAR(20) DEFAULT 'not_started' NOT NULL
            """))
            print("Added status column")
        else:
            print("Status column already exists")

        print("\nMigration completed successfully!")


if __name__ == "__main__":
    asyncio.run(add_columns())

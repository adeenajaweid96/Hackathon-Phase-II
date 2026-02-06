"""
Simple script to create database tables without full dependency installation.
Uses psycopg2 (pure Python) to connect to Neon PostgreSQL.
"""
import os
import sys

# Try to use system Python's psycopg2 or install psycopg2-binary
try:
    import psycopg2
except ImportError:
    print("Installing psycopg2-binary...")
    os.system(f"{sys.executable} -m pip install psycopg2-binary")
    import psycopg2

# Database connection string (from .env)
DATABASE_URL = "postgresql://neondb_owner:npg_zZPVpqsuFA34@ep-quiet-field-aiu14ig8-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"

# SQL to create todos table
CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS todos (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(1000),
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_todos_user_id ON todos(user_id);
CREATE INDEX IF NOT EXISTS idx_todos_user_created ON todos(user_id, created_at DESC);

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW() AT TIME ZONE 'UTC';
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_todos_updated_at ON todos;
CREATE TRIGGER update_todos_updated_at
    BEFORE UPDATE ON todos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
"""

def create_tables():
    """Connect to database and create tables."""
    try:
        print("Connecting to Neon PostgreSQL...")
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()

        print("Creating todos table and indexes...")
        cursor.execute(CREATE_TABLE_SQL)
        conn.commit()

        print("[SUCCESS] Database tables created successfully!")

        # Verify table exists
        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'todos'")
        count = cursor.fetchone()[0]

        if count > 0:
            print("[SUCCESS] Verified: 'todos' table exists in database")

            # Show table structure
            cursor.execute("""
                SELECT column_name, data_type, character_maximum_length, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'todos'
                ORDER BY ordinal_position
            """)
            print("\nTable structure:")
            for row in cursor.fetchall():
                print(f"  - {row[0]}: {row[1]}" + (f"({row[2]})" if row[2] else "") + f" {'NULL' if row[3] == 'YES' else 'NOT NULL'}")

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"[ERROR] Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_tables()

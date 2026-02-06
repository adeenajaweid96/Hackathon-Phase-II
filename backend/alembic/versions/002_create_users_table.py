"""Create users table

Revision ID: 002
Revises: 001
Create Date: 2026-02-05 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import uuid

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """
    Create users table with authentication fields.

    Table includes:
    - id: UUID primary key
    - email: Unique email address (indexed)
    - password_hash: Bcrypt hashed password
    - created_at: Account creation timestamp
    - last_login_at: Last successful login timestamp
    - is_active: Account active status
    - failed_login_attempts: Failed login counter for rate limiting
    - locked_until: Account lockout expiration timestamp
    """
    # Enable UUID extension if not already enabled
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('uuid_generate_v4()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False,
                  server_default=sa.text("(NOW() AT TIME ZONE 'UTC')")),
        sa.Column('last_login_at', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
    )

    # Create indexes for performance
    op.create_index('idx_users_email', 'users', ['email'], unique=True)
    op.create_index('idx_users_email_active', 'users', ['email', 'is_active'], unique=False)


def downgrade() -> None:
    """
    Drop users table and indexes.
    """
    op.drop_index('idx_users_email_active', table_name='users')
    op.drop_index('idx_users_email', table_name='users')
    op.drop_table('users')

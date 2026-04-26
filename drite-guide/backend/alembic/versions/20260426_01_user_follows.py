"""add user follows

Revision ID: 20260426_01
Revises: 20260423_01
Create Date: 2026-04-26 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260426_01"
down_revision = "20260423_01"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_follows",
        sa.Column("follower_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("followed_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["followed_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["follower_user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("follower_user_id", "followed_user_id"),
        sa.UniqueConstraint("follower_user_id", "followed_user_id", name="uq_user_follow_pair"),
    )


def downgrade() -> None:
    op.drop_table("user_follows")

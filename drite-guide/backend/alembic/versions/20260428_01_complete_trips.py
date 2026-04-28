"""complete trips feature schema

Revision ID: 20260428_01
Revises: 20260426_01
Create Date: 2026-04-28 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260428_01"
down_revision = "20260426_01"
branch_labels = None
depends_on = None


UUID_TYPE = postgresql.UUID(as_uuid=True)


def _table_names(inspector):
    return set(inspector.get_table_names())


def _columns(inspector, table_name: str) -> set[str]:
    return {column["name"] for column in inspector.get_columns(table_name)}


def _unique_constraints(inspector, table_name: str) -> set[str]:
    return {
        constraint["name"]
        for constraint in inspector.get_unique_constraints(table_name)
        if constraint.get("name")
    }


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = _table_names(inspector)

    if bind.dialect.name == "postgresql":
        has_trip_member_status = bind.execute(
            sa.text("SELECT 1 FROM pg_type WHERE typname = 'trip_member_status'")
        ).scalar()
        with op.get_context().autocommit_block():
            if has_trip_member_status:
                op.execute("ALTER TYPE trip_member_status ADD VALUE IF NOT EXISTS 'invited'")
        sa.Enum("owner", "member", name="trip_member_role").create(bind, checkfirst=True)

    if "user_follows" in tables:
        columns = _columns(inspector, "user_follows")
        if "follower_user_id" in columns and "follower_id" not in columns:
            op.alter_column("user_follows", "follower_user_id", new_column_name="follower_id")
        if "followed_user_id" in columns and "following_id" not in columns:
            op.alter_column("user_follows", "followed_user_id", new_column_name="following_id")
    else:
        op.create_table(
            "user_follows",
            sa.Column("follower_id", UUID_TYPE, nullable=False),
            sa.Column("following_id", UUID_TYPE, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["follower_id"], ["users.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["following_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("follower_id", "following_id"),
            sa.UniqueConstraint("follower_id", "following_id", name="uq_user_follow_pair"),
        )

    inspector = sa.inspect(bind)

    if "trips" in tables:
        columns = _columns(inspector, "trips")
        if "owner_user_id" in columns and "owner_id" not in columns:
            op.alter_column("trips", "owner_user_id", new_column_name="owner_id")
        elif "owner_id" not in columns:
            op.add_column("trips", sa.Column("owner_id", UUID_TYPE, nullable=True))

        if "shared_note" not in columns:
            op.add_column("trips", sa.Column("shared_note", sa.Text(), nullable=True))

        if "description" in columns:
            op.alter_column("trips", "description", existing_type=sa.Text(), nullable=True)

    if "trip_members" in tables:
        columns = _columns(inspector, "trip_members")
        if "role" not in columns:
            role_type = sa.Enum("owner", "member", name="trip_member_role")
            op.add_column(
                "trip_members",
                sa.Column("role", role_type, server_default="member", nullable=False),
            )
        if "updated_at" not in columns:
            op.add_column(
                "trip_members",
                sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            )
        if "invited_by_user_id" in columns:
            op.alter_column("trip_members", "invited_by_user_id", existing_type=UUID_TYPE, nullable=True)
        if "status" in columns and bind.dialect.name == "postgresql":
            has_pending_status = bind.execute(
                sa.text(
                    """
                    SELECT 1
                    FROM pg_enum
                    JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
                    WHERE pg_type.typname = 'trip_member_status'
                      AND pg_enum.enumlabel = 'pending'
                    """
                )
            ).scalar()
            if has_pending_status:
                op.execute("UPDATE trip_members SET status = 'invited' WHERE status = 'pending'")
        elif "status" in columns:
            op.execute("UPDATE trip_members SET status = 'invited' WHERE status = 'pending'")

    if "trip_places" in tables:
        columns = _columns(inspector, "trip_places")
        if "day_date" in columns and "visit_date" not in columns:
            op.alter_column("trip_places", "day_date", new_column_name="visit_date")
        if "visit_order" in columns and "order_index" not in columns:
            op.alter_column("trip_places", "visit_order", new_column_name="order_index")
        elif "order_index" not in columns:
            op.add_column("trip_places", sa.Column("order_index", sa.Integer(), server_default="0", nullable=False))

        if "visit_start_time" not in columns:
            op.add_column("trip_places", sa.Column("visit_start_time", sa.Time(), nullable=True))
        if "visit_end_time" not in columns:
            op.add_column("trip_places", sa.Column("visit_end_time", sa.Time(), nullable=True))
        if "added_at" in columns and "created_at" not in columns:
            op.alter_column("trip_places", "added_at", new_column_name="created_at")
        if "updated_at" not in columns:
            op.add_column(
                "trip_places",
                sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            )

        constraints = _unique_constraints(sa.inspect(bind), "trip_places")
        if "uq_trip_place_trip_order" in constraints:
            op.drop_constraint("uq_trip_place_trip_order", "trip_places", type_="unique")
        if "uq_trip_place_trip_place" not in constraints:
            op.create_unique_constraint("uq_trip_place_trip_place", "trip_places", ["trip_id", "place_id"])


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    tables = _table_names(inspector)

    if "trip_places" in tables:
        constraints = _unique_constraints(inspector, "trip_places")
        if "uq_trip_place_trip_place" in constraints:
            op.drop_constraint("uq_trip_place_trip_place", "trip_places", type_="unique")
        columns = _columns(inspector, "trip_places")
        for column_name in ("visit_start_time", "visit_end_time", "updated_at"):
            if column_name in columns:
                op.drop_column("trip_places", column_name)

    if "trip_members" in tables:
        columns = _columns(inspector, "trip_members")
        if "role" in columns:
            op.drop_column("trip_members", "role")
        if "updated_at" in columns:
            op.drop_column("trip_members", "updated_at")

    if "trips" in tables and "shared_note" in _columns(inspector, "trips"):
        op.drop_column("trips", "shared_note")

    if bind.dialect.name == "postgresql":
        sa.Enum("owner", "member", name="trip_member_role").drop(bind, checkfirst=True)

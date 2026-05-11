"""repair trip schema for deployed databases

Revision ID: 20260504_01
Revises: 20260428_01
Create Date: 2026-05-04 00:00:00
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260504_01"
down_revision = "20260428_01"
branch_labels = None
depends_on = None


UUID_TYPE = postgresql.UUID(as_uuid=True)


def _table_names(inspector):
    return set(inspector.get_table_names())


def _columns(inspector, table_name: str) -> set[str]:
    if table_name not in _table_names(inspector):
        return set()
    return {column["name"] for column in inspector.get_columns(table_name)}


def _indexes(inspector, table_name: str) -> set[str]:
    if table_name not in _table_names(inspector):
        return set()
    return {index["name"] for index in inspector.get_indexes(table_name) if index.get("name")}


def _unique_constraints(inspector, table_name: str) -> set[str]:
    if table_name not in _table_names(inspector):
        return set()
    return {
        constraint["name"]
        for constraint in inspector.get_unique_constraints(table_name)
        if constraint.get("name")
    }


def _enum_type(name: str, *values: str):
    return postgresql.ENUM(*values, name=name, create_type=False)


def _ensure_postgres_enum(bind, name: str, values: tuple[str, ...]) -> None:
    if bind.dialect.name != "postgresql":
        return

    exists = bind.execute(sa.text("SELECT 1 FROM pg_type WHERE typname = :name"), {"name": name}).scalar()
    if not exists:
        postgresql.ENUM(*values, name=name).create(bind, checkfirst=True)
        return

    with op.get_context().autocommit_block():
        for value in values:
            op.execute(f"ALTER TYPE {name} ADD VALUE IF NOT EXISTS '{value}'")


def _postgres_enum_has_value(bind, name: str, value: str) -> bool:
    if bind.dialect.name != "postgresql":
        return True

    return bool(
        bind.execute(
            sa.text(
                """
                SELECT 1
                FROM pg_enum
                JOIN pg_type ON pg_type.oid = pg_enum.enumtypid
                WHERE pg_type.typname = :name
                  AND pg_enum.enumlabel = :value
                """
            ),
            {"name": name, "value": value},
        ).scalar()
    )


def _add_column_if_missing(inspector, table_name: str, column_name: str, column) -> None:
    if column_name not in _columns(inspector, table_name):
        op.add_column(table_name, column)


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)

    _ensure_postgres_enum(bind, "trip_member_role", ("owner", "member"))
    _ensure_postgres_enum(bind, "trip_member_status", ("invited", "accepted"))

    role_type = _enum_type("trip_member_role", "owner", "member")
    status_type = _enum_type("trip_member_status", "invited", "accepted")

    tables = _table_names(inspector)

    if "trips" not in tables:
        op.create_table(
            "trips",
            sa.Column("id", UUID_TYPE, nullable=False),
            sa.Column("owner_id", UUID_TYPE, nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("start_date", sa.Date(), nullable=False),
            sa.Column("end_date", sa.Date(), nullable=False),
            sa.Column("shared_note", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["owner_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_trips_owner_id", "trips", ["owner_id"])
    else:
        columns = _columns(inspector, "trips")
        if "owner_user_id" in columns and "owner_id" not in columns:
            op.alter_column("trips", "owner_user_id", new_column_name="owner_id")
            inspector = sa.inspect(bind)

        _add_column_if_missing(inspector, "trips", "owner_id", sa.Column("owner_id", UUID_TYPE, nullable=True))
        _add_column_if_missing(inspector, "trips", "title", sa.Column("title", sa.String(length=255), nullable=True))
        _add_column_if_missing(inspector, "trips", "description", sa.Column("description", sa.Text(), nullable=True))
        _add_column_if_missing(inspector, "trips", "start_date", sa.Column("start_date", sa.Date(), nullable=True))
        _add_column_if_missing(inspector, "trips", "end_date", sa.Column("end_date", sa.Date(), nullable=True))
        _add_column_if_missing(inspector, "trips", "shared_note", sa.Column("shared_note", sa.Text(), nullable=True))
        _add_column_if_missing(
            inspector,
            "trips",
            "created_at",
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        _add_column_if_missing(
            inspector,
            "trips",
            "updated_at",
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        inspector = sa.inspect(bind)
        if "ix_trips_owner_id" not in _indexes(inspector, "trips"):
            op.create_index("ix_trips_owner_id", "trips", ["owner_id"])

    inspector = sa.inspect(bind)
    tables = _table_names(inspector)

    if "trip_members" not in tables:
        op.create_table(
            "trip_members",
            sa.Column("id", UUID_TYPE, nullable=False),
            sa.Column("trip_id", UUID_TYPE, nullable=False),
            sa.Column("user_id", UUID_TYPE, nullable=False),
            sa.Column("role", role_type, server_default="member", nullable=False),
            sa.Column("status", status_type, server_default="invited", nullable=False),
            sa.Column("invited_by_user_id", UUID_TYPE, nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["invited_by_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("trip_id", "user_id", name="uq_trip_member_trip_user"),
        )
    else:
        columns = _columns(inspector, "trip_members")
        _add_column_if_missing(inspector, "trip_members", "role", sa.Column("role", role_type, server_default="member", nullable=False))
        _add_column_if_missing(inspector, "trip_members", "status", sa.Column("status", status_type, server_default="invited", nullable=False))
        _add_column_if_missing(inspector, "trip_members", "invited_by_user_id", sa.Column("invited_by_user_id", UUID_TYPE, nullable=True))
        _add_column_if_missing(
            inspector,
            "trip_members",
            "created_at",
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        _add_column_if_missing(
            inspector,
            "trip_members",
            "updated_at",
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )
        if "status" in columns and _postgres_enum_has_value(bind, "trip_member_status", "pending"):
            op.execute("UPDATE trip_members SET status = 'invited' WHERE status = 'pending'")

        inspector = sa.inspect(bind)
        constraints = _unique_constraints(inspector, "trip_members")
        if "uq_trip_member_trip_user" not in constraints:
            op.create_unique_constraint("uq_trip_member_trip_user", "trip_members", ["trip_id", "user_id"])

    inspector = sa.inspect(bind)
    tables = _table_names(inspector)

    if "trip_places" not in tables:
        op.create_table(
            "trip_places",
            sa.Column("id", UUID_TYPE, nullable=False),
            sa.Column("trip_id", UUID_TYPE, nullable=False),
            sa.Column("place_id", UUID_TYPE, nullable=False),
            sa.Column("visit_date", sa.Date(), nullable=True),
            sa.Column("visit_start_time", sa.Time(), nullable=True),
            sa.Column("visit_end_time", sa.Time(), nullable=True),
            sa.Column("note", sa.Text(), nullable=True),
            sa.Column("order_index", sa.Integer(), server_default="0", nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["trip_id"], ["trips.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("trip_id", "place_id", name="uq_trip_place_trip_place"),
        )
    else:
        columns = _columns(inspector, "trip_places")
        if "day_date" in columns and "visit_date" not in columns:
            op.alter_column("trip_places", "day_date", new_column_name="visit_date")
        if "visit_order" in columns and "order_index" not in columns:
            op.alter_column("trip_places", "visit_order", new_column_name="order_index")
        if "added_at" in columns and "created_at" not in columns:
            op.alter_column("trip_places", "added_at", new_column_name="created_at")

        inspector = sa.inspect(bind)
        _add_column_if_missing(inspector, "trip_places", "visit_start_time", sa.Column("visit_start_time", sa.Time(), nullable=True))
        _add_column_if_missing(inspector, "trip_places", "visit_end_time", sa.Column("visit_end_time", sa.Time(), nullable=True))
        _add_column_if_missing(inspector, "trip_places", "order_index", sa.Column("order_index", sa.Integer(), server_default="0", nullable=False))
        _add_column_if_missing(
            inspector,
            "trip_places",
            "updated_at",
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

        inspector = sa.inspect(bind)
        constraints = _unique_constraints(inspector, "trip_places")
        if "uq_trip_place_trip_order" in constraints:
            op.drop_constraint("uq_trip_place_trip_order", "trip_places", type_="unique")
        if "uq_trip_place_trip_place" not in constraints:
            op.create_unique_constraint("uq_trip_place_trip_place", "trip_places", ["trip_id", "place_id"])


def downgrade() -> None:
    pass

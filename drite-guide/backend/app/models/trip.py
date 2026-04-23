import enum
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class TripMemberStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    declined = "declined"


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "trips"

    owner_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    is_private: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    owner = relationship("User", back_populates="owned_trips")
    members = relationship("TripMember", back_populates="trip", cascade="all, delete-orphan")
    places = relationship("TripPlace", back_populates="trip", cascade="all, delete-orphan")


class TripMember(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "trip_members"
    __table_args__ = (UniqueConstraint("trip_id", "user_id", name="uq_trip_member_trip_user"),)

    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_by_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False)
    status: Mapped[TripMemberStatus] = mapped_column(
        Enum(TripMemberStatus, name="trip_member_status"),
        nullable=False,
        default=TripMemberStatus.pending,
        server_default=TripMemberStatus.pending.value,
    )
    joined_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="trip_memberships", foreign_keys=[user_id])
    invited_by = relationship("User", back_populates="trip_invites_sent", foreign_keys=[invited_by_user_id])


class TripPlace(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "trip_places"
    __table_args__ = (UniqueConstraint("trip_id", "visit_order", name="uq_trip_place_trip_order"),)

    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    place_id: Mapped[str] = mapped_column(ForeignKey("places.id"), nullable=False)
    day_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    visit_order: Mapped[int] = mapped_column(Integer, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    added_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    trip = relationship("Trip", back_populates="places")
    place = relationship("Place", back_populates="trip_places")

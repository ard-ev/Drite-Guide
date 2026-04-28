import enum
from datetime import date, time

from sqlalchemy import Date, Enum, ForeignKey, Integer, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPrimaryKeyMixin


class TripMemberRole(str, enum.Enum):
    owner = "owner"
    member = "member"


class TripMemberStatus(str, enum.Enum):
    invited = "invited"
    accepted = "accepted"


class Trip(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trips"

    owner_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date] = mapped_column(Date, nullable=False)
    shared_note: Mapped[str | None] = mapped_column(Text, nullable=True)

    owner = relationship("User", back_populates="owned_trips")
    members = relationship(
        "TripMember",
        back_populates="trip",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
    places = relationship(
        "TripPlace",
        back_populates="trip",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class TripMember(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_members"
    __table_args__ = (UniqueConstraint("trip_id", "user_id", name="uq_trip_member_trip_user"),)

    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[TripMemberRole] = mapped_column(
        Enum(TripMemberRole, name="trip_member_role"),
        nullable=False,
        default=TripMemberRole.member,
        server_default=TripMemberRole.member.value,
    )
    status: Mapped[TripMemberStatus] = mapped_column(
        Enum(TripMemberStatus, name="trip_member_status"),
        nullable=False,
        default=TripMemberStatus.invited,
        server_default=TripMemberStatus.invited.value,
    )
    invited_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    trip = relationship("Trip", back_populates="members")
    user = relationship("User", back_populates="trip_memberships", foreign_keys=[user_id])
    invited_by = relationship("User", back_populates="trip_invites_sent", foreign_keys=[invited_by_user_id])


class TripPlace(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "trip_places"
    __table_args__ = (UniqueConstraint("trip_id", "place_id", name="uq_trip_place_trip_place"),)

    trip_id: Mapped[str] = mapped_column(ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    place_id: Mapped[str] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    visit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    visit_start_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    visit_end_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")

    trip = relationship("Trip", back_populates="places")
    place = relationship("Place", back_populates="trip_places")

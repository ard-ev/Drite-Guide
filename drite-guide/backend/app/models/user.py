import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.config import settings
from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    admin = "admin"
    user = "user"


class User(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "users"

    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)
    username: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    profile_picture_path: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
        default=settings.DEFAULT_PROFILE_PICTURE,
        server_default=settings.DEFAULT_PROFILE_PICTURE,
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
        default=UserRole.user,
        server_default=UserRole.user.value,
    )
    preferred_language: Mapped[str] = mapped_column(
        ForeignKey("languages.code"),
        nullable=False,
        default=settings.DEFAULT_LANGUAGE,
        server_default=settings.DEFAULT_LANGUAGE,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    email_verification_token: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    email_verification_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    refresh_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    preferred_language_rel = relationship("Language", back_populates="users")
    saved_places = relationship("SavedPlace", back_populates="user")
    owned_trips = relationship("Trip", back_populates="owner")
    trip_memberships = relationship("TripMember", back_populates="user", foreign_keys="TripMember.user_id")
    trip_invites_sent = relationship(
        "TripMember", back_populates="invited_by", foreign_keys="TripMember.invited_by_user_id"
    )
    reviews = relationship("Review", back_populates="user")
    created_places = relationship("Place", back_populates="created_by_user")
    search_history = relationship("SearchHistory", back_populates="user")

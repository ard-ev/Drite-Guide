from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class UserFollow(TimestampMixin, Base):
    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_id", "following_id", name="uq_user_follow_pair"),
    )

    follower_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    following_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    follower = relationship(
        "User",
        back_populates="following_relationships",
        foreign_keys=[follower_id],
    )
    following = relationship(
        "User",
        back_populates="follower_relationships",
        foreign_keys=[following_id],
    )

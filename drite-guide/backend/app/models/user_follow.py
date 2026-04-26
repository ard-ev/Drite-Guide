from sqlalchemy import ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class UserFollow(TimestampMixin, Base):
    __tablename__ = "user_follows"
    __table_args__ = (
        UniqueConstraint("follower_user_id", "followed_user_id", name="uq_user_follow_pair"),
    )

    follower_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    followed_user_id: Mapped[str] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )

    follower = relationship(
        "User",
        back_populates="following_relationships",
        foreign_keys=[follower_user_id],
    )
    followed = relationship(
        "User",
        back_populates="follower_relationships",
        foreign_keys=[followed_user_id],
    )

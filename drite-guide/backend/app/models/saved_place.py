from sqlalchemy import Boolean, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class SavedPlace(TimestampMixin, Base):
    __tablename__ = "saved_places"
    __table_args__ = (UniqueConstraint("user_id", "place_id", name="uq_saved_place_user_place"),)

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    place_id: Mapped[str] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), primary_key=True)
    priority: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    user = relationship("User", back_populates="saved_places")
    place = relationship("Place", back_populates="saved_places")


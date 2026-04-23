from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, UUIDPrimaryKeyMixin


class SearchHistory(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "search_history"

    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    city_id: Mapped[str | None] = mapped_column(ForeignKey("cities.id"), nullable=True)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    searched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    user = relationship("User", back_populates="search_history")
    city = relationship("City")
    category = relationship("Category")

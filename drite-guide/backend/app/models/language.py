from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin


class Language(TimestampMixin, Base):
    __tablename__ = "languages"

    code: Mapped[str] = mapped_column(String(10), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default="true")

    category_translations = relationship("CategoryTranslation", back_populates="language")
    city_translations = relationship("CityTranslation", back_populates="language")
    place_translations = relationship("PlaceTranslation", back_populates="language")
    users = relationship("User", back_populates="preferred_language_rel")


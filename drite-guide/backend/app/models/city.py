from sqlalchemy import Boolean, Float, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class City(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "cities"

    city_name: Mapped[str] = mapped_column(String(150), nullable=False, index=True)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    hero_image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    location_text: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")

    translations = relationship("CityTranslation", back_populates="city", cascade="all, delete-orphan")
    places = relationship("Place", back_populates="city")


class CityTranslation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "city_translations"
    __table_args__ = (UniqueConstraint("city_id", "language_code", name="uq_city_language"),)

    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    language_code: Mapped[str] = mapped_column(ForeignKey("languages.code"), nullable=False)
    city_name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    city = relationship("City", back_populates="translations")
    language = relationship("Language", back_populates="city_translations")


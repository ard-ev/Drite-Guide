from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, JSON, Numeric, String, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Place(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "places"
    __table_args__ = (
        UniqueConstraint("city_id", "name", "address", name="uq_place_city_name_address"),
    )

    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    city_id: Mapped[str] = mapped_column(ForeignKey("cities.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    address: Mapped[str] = mapped_column(Text, nullable=False)
    google_maps_link: Mapped[str] = mapped_column(Text, nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    main_image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    opening_hours: Mapped[dict | list | str | None] = mapped_column(JSON, nullable=True)
    rating_average: Mapped[float] = mapped_column(Numeric(3, 2), nullable=False, default=0, server_default="0")
    ratings_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, server_default="false")
    created_by_user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    category = relationship("Category", back_populates="places")
    city = relationship("City", back_populates="places")
    created_by_user = relationship("User", back_populates="created_places")
    translations = relationship("PlaceTranslation", back_populates="place", cascade="all, delete-orphan")
    images = relationship("PlaceImage", back_populates="place", cascade="all, delete-orphan")
    saved_places = relationship("SavedPlace", back_populates="place")
    reviews = relationship("Review", back_populates="place")
    trip_places = relationship("TripPlace", back_populates="place")


class PlaceTranslation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "place_translations"
    __table_args__ = (UniqueConstraint("place_id", "language_code", name="uq_place_language"),)

    place_id: Mapped[str] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), nullable=False)
    language_code: Mapped[str] = mapped_column(ForeignKey("languages.code"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    place = relationship("Place", back_populates="translations")
    language = relationship("Language", back_populates="place_translations")


class PlaceImage(UUIDPrimaryKeyMixin, Base):
    __tablename__ = "place_images"

    place_id: Mapped[str] = mapped_column(ForeignKey("places.id", ondelete="CASCADE"), nullable=False, index=True)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, nullable=False, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    place = relationship("Place", back_populates="images")

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Category(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(150), nullable=False)
    image_path: Mapped[str] = mapped_column(String(500), nullable=False)

    translations = relationship("CategoryTranslation", back_populates="category", cascade="all, delete-orphan")
    places = relationship("Place", back_populates="category")


class CategoryTranslation(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "category_translations"
    __table_args__ = (UniqueConstraint("category_id", "language_code", name="uq_category_language"),)

    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id", ondelete="CASCADE"), nullable=False)
    language_code: Mapped[str] = mapped_column(ForeignKey("languages.code"), nullable=False)
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    category = relationship("Category", back_populates="translations")
    language = relationship("Language", back_populates="category_translations")


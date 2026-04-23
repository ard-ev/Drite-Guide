from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TranslationPayload


class CategoryBase(BaseModel):
    name: str = Field(min_length=1, max_length=150)


class CategoryCreate(CategoryBase):
    image_path: str
    translations: list[TranslationPayload] = Field(default_factory=list)


class CategoryUpdate(BaseModel):
    name: str | None = None
    image_path: str | None = None
    translations: list[TranslationPayload] | None = None


class CategoryRead(ORMModel):
    id: UUID
    name: str
    image_path: str
    created_at: datetime
    updated_at: datetime

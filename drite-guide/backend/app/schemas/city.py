from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TranslationPayload


class CityCreate(BaseModel):
    city_name: str = Field(min_length=1, max_length=150)
    image_path: str
    hero_image_path: str
    location_text: str
    latitude: float
    longitude: float
    description: str
    is_featured: bool = False
    translations: list[TranslationPayload] = Field(default_factory=list)


class CityUpdate(BaseModel):
    city_name: str | None = None
    image_path: str | None = None
    hero_image_path: str | None = None
    location_text: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    description: str | None = None
    is_featured: bool | None = None
    translations: list[TranslationPayload] | None = None


class CityRead(ORMModel):
    id: UUID
    city_name: str
    image_path: str
    hero_image_path: str
    location_text: str
    latitude: float
    longitude: float
    description: str
    is_featured: bool
    created_at: datetime
    updated_at: datetime

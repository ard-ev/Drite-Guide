from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel, TranslationPayload


class PlaceImageRead(ORMModel):
    id: UUID
    image_path: str
    sort_order: int


class PlaceCreate(BaseModel):
    category_id: UUID
    city_id: UUID
    name: str = Field(min_length=1, max_length=255)
    description: str
    address: str
    google_maps_link: str
    latitude: float
    longitude: float
    main_image_path: str
    phone: str | None = None
    website: str | None = None
    opening_hours: dict | list | str | None = None
    is_featured: bool = False
    translations: list[TranslationPayload] = Field(default_factory=list)


class PlaceUpdate(BaseModel):
    category_id: UUID | None = None
    city_id: UUID | None = None
    name: str | None = None
    description: str | None = None
    address: str | None = None
    google_maps_link: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    main_image_path: str | None = None
    phone: str | None = None
    website: str | None = None
    opening_hours: dict | list | str | None = None
    is_featured: bool | None = None
    translations: list[TranslationPayload] | None = None


class PlaceRead(ORMModel):
    id: UUID
    category_id: UUID
    city_id: UUID
    name: str
    description: str
    address: str
    google_maps_link: str
    latitude: float
    longitude: float
    main_image_path: str
    phone: str | None
    website: str | None
    opening_hours: dict | list | str | None
    rating_average: float
    ratings_count: int
    is_featured: bool
    images: list[PlaceImageRead]
    created_at: datetime
    updated_at: datetime


class SavedPlaceRead(ORMModel):
    place: PlaceRead
    priority: int | None
    is_favorite: bool
    saved_at: datetime


class SavedPlaceUpdate(BaseModel):
    priority: int | None = None
    is_favorite: bool | None = None


class TripPlaceCreate(BaseModel):
    place_id: UUID
    visit_date: date | None = None
    visit_start_time: time | None = None
    visit_end_time: time | None = None
    note: str | None = None
    order_index: int | None = None


class TripPlaceUpdate(BaseModel):
    visit_date: date | None = None
    visit_start_time: time | None = None
    visit_end_time: time | None = None
    note: str | None = None
    order_index: int | None = None


class TripPlaceReorderItem(BaseModel):
    trip_place_id: UUID
    order_index: int


class TripPlaceReorderRequest(BaseModel):
    items: list[TripPlaceReorderItem]

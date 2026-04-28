from datetime import date, datetime, time
from uuid import UUID

from pydantic import BaseModel, Field, model_validator

from app.models.trip import TripMemberRole, TripMemberStatus
from app.schemas.common import ORMModel
from app.schemas.place import PlaceRead


class TripDateRangeMixin(BaseModel):
    start_date: date | None = None
    end_date: date | None = None

    @model_validator(mode="after")
    def validate_date_range(self):
        if self.start_date and self.end_date and self.end_date < self.start_date:
            raise ValueError("End date must be after or equal to start date.")
        return self


class TripCreate(TripDateRangeMixin):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = None
    start_date: date
    end_date: date
    shared_note: str | None = None


class TripUpdate(TripDateRangeMixin):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    shared_note: str | None = None


class TripUserRead(ORMModel):
    id: UUID
    first_name: str
    last_name: str
    username: str
    profile_picture_path: str


class TripMemberInviteRequest(BaseModel):
    username: str = Field(min_length=1, max_length=100)


class TripMemberRead(ORMModel):
    id: UUID
    trip_id: UUID
    user_id: UUID
    role: TripMemberRole
    status: TripMemberStatus
    invited_by_user_id: UUID | None
    created_at: datetime
    updated_at: datetime
    user: TripUserRead | None = None


class TripPlaceCreate(BaseModel):
    place_id: UUID
    visit_date: date | None = None
    visit_start_time: time | None = None
    visit_end_time: time | None = None
    note: str | None = None
    order_index: int | None = None

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.visit_start_time and self.visit_end_time and self.visit_end_time < self.visit_start_time:
            raise ValueError("Visit end time must be after or equal to visit start time.")
        return self


class TripPlaceUpdate(BaseModel):
    visit_date: date | None = None
    visit_start_time: time | None = None
    visit_end_time: time | None = None
    note: str | None = None
    order_index: int | None = None

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.visit_start_time and self.visit_end_time and self.visit_end_time < self.visit_start_time:
            raise ValueError("Visit end time must be after or equal to visit start time.")
        return self


class TripPlaceRead(ORMModel):
    id: UUID
    trip_id: UUID
    place_id: UUID
    visit_date: date | None
    visit_start_time: time | None
    visit_end_time: time | None
    note: str | None
    order_index: int
    created_at: datetime
    updated_at: datetime
    place: PlaceRead | None = None


class TripRead(ORMModel):
    id: UUID
    owner_id: UUID
    title: str
    description: str | None
    start_date: date
    end_date: date
    shared_note: str | None
    created_at: datetime
    updated_at: datetime
    places_count: int = 0
    invited_users_count: int = 0
    role: TripMemberRole | None = None


class TripDetailRead(TripRead):
    members: list[TripMemberRead] = Field(default_factory=list)
    places: list[TripPlaceRead] = Field(default_factory=list)

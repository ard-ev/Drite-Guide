from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.trip import TripMemberStatus
from app.schemas.common import ORMModel
from app.schemas.place import PlaceRead


class TripCreate(BaseModel):
    title: str
    description: str
    start_date: date
    end_date: date
    is_private: bool = True


class TripUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_private: bool | None = None


class TripRead(ORMModel):
    id: UUID
    owner_user_id: UUID
    title: str
    description: str
    start_date: date
    end_date: date
    is_private: bool
    created_at: datetime
    updated_at: datetime


class TripMemberInviteRequest(BaseModel):
    username: str


class TripMemberUpdateRequest(BaseModel):
    status: TripMemberStatus


class TripMemberRead(ORMModel):
    id: UUID
    trip_id: UUID
    user_id: UUID
    invited_by_user_id: UUID
    status: TripMemberStatus
    joined_at: datetime | None
    created_at: datetime


class TripPlaceRead(ORMModel):
    id: UUID
    trip_id: UUID
    place_id: UUID
    day_date: date | None
    visit_order: int
    note: str | None
    added_at: datetime
    place: PlaceRead | None = None

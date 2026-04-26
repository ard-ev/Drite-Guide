from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.models.user import UserRole
from app.schemas.common import ORMModel


class UserRead(ORMModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    username: str
    profile_picture_path: str
    role: UserRole
    preferred_language: str
    is_active: bool
    email_verified: bool
    created_at: datetime
    updated_at: datetime


class PublicUserProfileRead(ORMModel):
    id: UUID
    first_name: str
    last_name: str
    email: str
    username: str
    profile_picture_path: str
    saved_places_count: int
    trips_count: int
    followers_count: int = 0
    following_count: int = 0
    is_following: bool = False


class UserUpdateRequest(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    profile_picture_path: str | None = None


class UserLanguageUpdateRequest(BaseModel):
    preferred_language: str

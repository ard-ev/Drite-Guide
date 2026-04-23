from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import ORMModel


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    review_text: str | None = None


class ReviewUpdate(BaseModel):
    rating: int | None = Field(default=None, ge=1, le=5)
    review_text: str | None = None


class ReviewRead(ORMModel):
    id: UUID
    user_id: UUID
    place_id: UUID
    rating: int
    review_text: str | None
    created_at: datetime
    updated_at: datetime

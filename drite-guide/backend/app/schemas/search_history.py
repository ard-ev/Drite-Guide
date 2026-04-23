from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.schemas.common import ORMModel


class SearchHistoryCreate(BaseModel):
    query_text: str
    city_id: UUID | None = None
    category_id: UUID | None = None


class SearchHistoryRead(ORMModel):
    id: UUID
    user_id: UUID
    query_text: str
    city_id: UUID | None
    category_id: UUID | None
    searched_at: datetime

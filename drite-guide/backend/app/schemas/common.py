from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TranslationPayload(BaseModel):
    language_code: str
    name: str | None = None
    city_name: str | None = None
    description: str | None = None


class MessageResponse(BaseModel):
    message: str


class FileUploadResponse(BaseModel):
    file_path: str


class UUIDResponse(ORMModel):
    id: UUID


class DateRangeBase(BaseModel):
    start_date: date
    end_date: date


class AuditFields(ORMModel):
    created_at: datetime
    updated_at: datetime | None = None


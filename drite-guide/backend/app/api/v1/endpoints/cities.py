from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_request_language, require_admin
from app.core.config import settings
from app.models.city import City, CityTranslation
from app.schemas.city import CityCreate, CityRead, CityUpdate
from app.services.files import file_service
from app.services.serializers import serialize_city
from app.services.translations import sync_translations


router = APIRouter()


@router.get("", response_model=list[CityRead])
async def list_cities(db: DBSession, language_code: str = Depends(get_request_language)) -> list[CityRead]:
    result = await db.scalars(
        select(City).where(City.deleted_at.is_(None)).options(selectinload(City.translations)).order_by(City.city_name.asc())
    )
    return [serialize_city(city, language_code) for city in result.all()]


@router.get("/{city_id}", response_model=CityRead)
async def get_city(city_id: UUID, db: DBSession, language_code: str = Depends(get_request_language)) -> CityRead:
    city = await db.scalar(select(City).where(City.id == city_id, City.deleted_at.is_(None)).options(selectinload(City.translations)))
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
    return serialize_city(city, language_code)


@router.post("", response_model=CityRead, status_code=status.HTTP_201_CREATED)
async def create_city(payload: CityCreate, db: DBSession, _: object = Depends(require_admin)) -> CityRead:
    city = City(**payload.model_dump(exclude={"translations"}))
    sync_translations(city, CityTranslation, payload.translations, ["city_name", "description"])
    db.add(city)
    await db.commit()
    await db.refresh(city)
    return serialize_city(city, settings.DEFAULT_LANGUAGE)


@router.patch("/{city_id}", response_model=CityRead)
async def update_city(city_id: UUID, payload: CityUpdate, db: DBSession, _: object = Depends(require_admin)) -> CityRead:
    city = await db.scalar(select(City).where(City.id == city_id, City.deleted_at.is_(None)).options(selectinload(City.translations)))
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
    updates = payload.model_dump(exclude_unset=True, exclude={"translations"})
    for field, value in updates.items():
        setattr(city, field, value)
    if payload.translations is not None:
        sync_translations(city, CityTranslation, payload.translations, ["city_name", "description"])
    await db.commit()
    await db.refresh(city)
    return serialize_city(city, settings.DEFAULT_LANGUAGE)


@router.delete("/{city_id}", response_model=CityRead)
async def delete_city(city_id: UUID, db: DBSession, _: object = Depends(require_admin)) -> CityRead:
    city = await db.scalar(select(City).where(City.id == city_id, City.deleted_at.is_(None)).options(selectinload(City.translations)))
    if not city:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="City not found.")
    city.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(city)
    return serialize_city(city, settings.DEFAULT_LANGUAGE)


@router.post("/admin/upload-image", response_model=dict[str, str])
async def upload_city_image(file: UploadFile, _: object = Depends(require_admin)) -> dict[str, str]:
    path = await file_service.save_upload(file, settings.CITY_UPLOADS_DIR)
    return {"file_path": path}

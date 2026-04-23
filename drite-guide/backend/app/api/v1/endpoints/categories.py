from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_request_language, require_admin
from app.core.config import settings
from app.models.category import Category, CategoryTranslation
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.files import file_service
from app.services.serializers import serialize_category
from app.services.translations import sync_translations


router = APIRouter()


@router.get("", response_model=list[CategoryRead])
async def list_categories(db: DBSession, language_code: str = Depends(get_request_language)) -> list[CategoryRead]:
    result = await db.scalars(
        select(Category)
        .where(Category.deleted_at.is_(None))
        .options(selectinload(Category.translations))
        .order_by(Category.name.asc())
    )
    return [serialize_category(category, language_code) for category in result.all()]


@router.get("/{category_id}", response_model=CategoryRead)
async def get_category(category_id: UUID, db: DBSession, language_code: str = Depends(get_request_language)) -> CategoryRead:
    category = await db.scalar(
        select(Category).where(Category.id == category_id, Category.deleted_at.is_(None)).options(selectinload(Category.translations))
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    return serialize_category(category, language_code)


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
async def create_category(payload: CategoryCreate, db: DBSession, _: object = Depends(require_admin)) -> CategoryRead:
    category = Category(name=payload.name, image_path=payload.image_path)
    sync_translations(category, CategoryTranslation, payload.translations, ["name"])
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return serialize_category(category, settings.DEFAULT_LANGUAGE)


@router.patch("/{category_id}", response_model=CategoryRead)
async def update_category(category_id: UUID, payload: CategoryUpdate, db: DBSession, _: object = Depends(require_admin)) -> CategoryRead:
    category = await db.scalar(select(Category).where(Category.id == category_id, Category.deleted_at.is_(None)).options(selectinload(Category.translations)))
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    updates = payload.model_dump(exclude_unset=True, exclude={"translations"})
    for field, value in updates.items():
        setattr(category, field, value)
    if payload.translations is not None:
        sync_translations(category, CategoryTranslation, payload.translations, ["name"])
    await db.commit()
    await db.refresh(category)
    return serialize_category(category, settings.DEFAULT_LANGUAGE)


@router.delete("/{category_id}", response_model=CategoryRead)
async def delete_category(category_id: UUID, db: DBSession, _: object = Depends(require_admin)) -> CategoryRead:
    category = await db.scalar(select(Category).where(Category.id == category_id, Category.deleted_at.is_(None)).options(selectinload(Category.translations)))
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")
    from datetime import datetime, timezone

    category.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(category)
    return serialize_category(category, settings.DEFAULT_LANGUAGE)


@router.post("/admin/upload-image", response_model=dict[str, str])
async def upload_category_image(file: UploadFile, _: object = Depends(require_admin)) -> dict[str, str]:
    path = await file_service.save_upload(file, settings.CATEGORY_UPLOADS_DIR)
    return {"file_path": path}

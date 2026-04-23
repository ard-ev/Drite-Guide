from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_current_user, get_request_language, require_admin
from app.core.config import settings
from app.models.place import Place, PlaceImage, PlaceTranslation
from app.models.review import Review
from app.models.user import User
from app.schemas.place import PlaceCreate, PlaceImageRead, PlaceRead, PlaceUpdate
from app.schemas.review import ReviewCreate, ReviewRead
from app.services.files import file_service
from app.services.reviews import refresh_place_rating
from app.services.serializers import serialize_place
from app.services.translations import sync_translations


router = APIRouter()


@router.get("", response_model=list[PlaceRead])
async def list_places(
    db: DBSession,
    language_code: str = Depends(get_request_language),
    city_id: UUID | None = Query(default=None),
    category_id: UUID | None = Query(default=None),
    featured: bool | None = Query(default=None),
    search: str | None = Query(default=None),
) -> list[PlaceRead]:
    statement = (
        select(Place)
        .where(Place.deleted_at.is_(None))
        .options(selectinload(Place.translations), selectinload(Place.images))
    )
    if city_id:
        statement = statement.where(Place.city_id == city_id)
    if category_id:
        statement = statement.where(Place.category_id == category_id)
    if featured is not None:
        statement = statement.where(Place.is_featured.is_(featured))
    if search:
        search_term = f"%{search.lower()}%"
        statement = statement.where(
            or_(
                cast(Place.name, String).ilike(search_term),
                cast(Place.description, String).ilike(search_term),
                cast(Place.address, String).ilike(search_term),
                Place.translations.any(PlaceTranslation.name.ilike(search_term)),
                Place.translations.any(PlaceTranslation.description.ilike(search_term)),
            )
        )
    result = await db.scalars(statement.order_by(Place.created_at.desc()))
    return [serialize_place(place, language_code) for place in result.unique().all()]


@router.get("/{place_id}", response_model=PlaceRead)
async def get_place(place_id: UUID, db: DBSession, language_code: str = Depends(get_request_language)) -> PlaceRead:
    place = await db.scalar(
        select(Place)
        .where(Place.id == place_id, Place.deleted_at.is_(None))
        .options(selectinload(Place.translations), selectinload(Place.images))
    )
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    return serialize_place(place, language_code)


@router.post("", response_model=PlaceRead, status_code=status.HTTP_201_CREATED)
async def create_place(
    payload: PlaceCreate,
    db: DBSession,
    admin_user: User = Depends(require_admin),
) -> PlaceRead:
    place = Place(**payload.model_dump(exclude={"translations"}), created_by_user_id=admin_user.id)
    sync_translations(place, PlaceTranslation, payload.translations, ["name", "description"])
    db.add(place)
    await db.commit()
    await db.refresh(place)
    return serialize_place(place, settings.DEFAULT_LANGUAGE)


@router.patch("/{place_id}", response_model=PlaceRead)
async def update_place(place_id: UUID, payload: PlaceUpdate, db: DBSession, _: object = Depends(require_admin)) -> PlaceRead:
    place = await db.scalar(
        select(Place)
        .where(Place.id == place_id, Place.deleted_at.is_(None))
        .options(selectinload(Place.translations), selectinload(Place.images))
    )
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    updates = payload.model_dump(exclude_unset=True, exclude={"translations"})
    for field, value in updates.items():
        setattr(place, field, value)
    if payload.translations is not None:
        sync_translations(place, PlaceTranslation, payload.translations, ["name", "description"])
    await db.commit()
    await db.refresh(place)
    return serialize_place(place, settings.DEFAULT_LANGUAGE)


@router.delete("/{place_id}", response_model=PlaceRead)
async def delete_place(place_id: UUID, db: DBSession, _: object = Depends(require_admin)) -> PlaceRead:
    place = await db.scalar(
        select(Place)
        .where(Place.id == place_id, Place.deleted_at.is_(None))
        .options(selectinload(Place.translations), selectinload(Place.images))
    )
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    place.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(place)
    return serialize_place(place, settings.DEFAULT_LANGUAGE)


@router.post("/admin/upload-image", response_model=dict[str, str])
async def upload_place_image(file: UploadFile, _: object = Depends(require_admin)) -> dict[str, str]:
    path = await file_service.save_upload(file, settings.PLACE_UPLOADS_DIR)
    return {"file_path": path}


@router.post("/{place_id}/images", response_model=PlaceImageRead, status_code=status.HTTP_201_CREATED)
async def create_place_image(place_id: UUID, file: UploadFile, db: DBSession, _: object = Depends(require_admin)) -> PlaceImageRead:
    place = await db.get(Place, place_id)
    if not place or place.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    sort_order = int(
        await db.scalar(select(func.coalesce(func.max(PlaceImage.sort_order), -1)).where(PlaceImage.place_id == place_id))
    ) + 1
    image = PlaceImage(place_id=place_id, image_path=await file_service.save_upload(file, settings.PLACE_UPLOADS_DIR), sort_order=sort_order)
    db.add(image)
    await db.commit()
    await db.refresh(image)
    return PlaceImageRead(id=image.id, image_path=image.image_path, sort_order=image.sort_order)


@router.delete("/{place_id}/images/{image_id}", response_model=dict[str, str])
async def delete_place_image(place_id: UUID, image_id: UUID, db: DBSession, _: object = Depends(require_admin)) -> dict[str, str]:
    image = await db.scalar(select(PlaceImage).where(PlaceImage.id == image_id, PlaceImage.place_id == place_id))
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place image not found.")
    await db.delete(image)
    await db.commit()
    return {"message": "Place image deleted."}


@router.get("/{place_id}/reviews", response_model=list[ReviewRead])
async def list_place_reviews(place_id: UUID, db: DBSession) -> list[ReviewRead]:
    result = await db.scalars(select(Review).where(Review.place_id == place_id, Review.deleted_at.is_(None)).order_by(Review.created_at.desc()))
    return [ReviewRead.model_validate(review) for review in result.all()]


@router.post("/{place_id}/reviews", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
async def create_place_review(
    place_id: UUID,
    payload: ReviewCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> ReviewRead:
    existing = await db.scalar(select(Review).where(Review.user_id == current_user.id, Review.place_id == place_id))
    if existing and existing.deleted_at is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Review already exists.")
    review = existing or Review(user_id=current_user.id, place_id=place_id)
    review.rating = payload.rating
    review.review_text = payload.review_text
    review.deleted_at = None
    db.add(review)
    await db.flush()
    await refresh_place_rating(db, place_id)
    await db.commit()
    await db.refresh(review)
    return ReviewRead.model_validate(review)

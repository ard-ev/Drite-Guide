from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_current_user, get_request_language
from app.models.place import Place
from app.models.saved_place import SavedPlace
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.place import SavedPlaceRead, SavedPlaceUpdate
from app.services.serializers import serialize_place


router = APIRouter()


@router.get("/me", response_model=list[SavedPlaceRead])
async def get_my_saved_places(
    db: DBSession,
    current_user: User = Depends(get_current_user),
    language_code: str = Depends(get_request_language),
) -> list[SavedPlaceRead]:
    result = await db.scalars(
        select(SavedPlace)
        .where(SavedPlace.user_id == current_user.id)
        .options(selectinload(SavedPlace.place).selectinload(Place.translations), selectinload(SavedPlace.place).selectinload(Place.images))
        .order_by(SavedPlace.created_at.desc())
    )
    return [
        SavedPlaceRead(
            place=serialize_place(item.place, language_code),
            priority=item.priority,
            is_favorite=item.is_favorite,
            saved_at=item.created_at,
        )
        for item in result.all()
        if item.place and item.place.deleted_at is None
    ]


@router.post("/{place_id}", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def save_place(place_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    place = await db.get(Place, place_id)
    if not place or place.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")
    saved = await db.get(SavedPlace, {"user_id": current_user.id, "place_id": place_id})
    if saved:
        return MessageResponse(message="Place already saved.")
    db.add(SavedPlace(user_id=current_user.id, place_id=place_id))
    await db.commit()
    return MessageResponse(message="Place saved.")


@router.patch("/{place_id}", response_model=MessageResponse)
async def update_saved_place(place_id: UUID, payload: SavedPlaceUpdate, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    saved = await db.get(SavedPlace, {"user_id": current_user.id, "place_id": place_id})
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved place not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(saved, field, value)
    await db.commit()
    return MessageResponse(message="Saved place updated.")


@router.delete("/{place_id}", response_model=MessageResponse)
async def delete_saved_place(place_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    saved = await db.get(SavedPlace, {"user_id": current_user.id, "place_id": place_id})
    if not saved:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Saved place not found.")
    await db.delete(saved)
    await db.commit()
    return MessageResponse(message="Saved place removed.")
from uuid import UUID


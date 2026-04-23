from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import func, or_, select

from app.api.deps import DBSession, get_current_user
from app.models.language import Language
from app.models.saved_place import SavedPlace
from app.models.trip import Trip
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.user import PublicUserProfileRead, UserLanguageUpdateRequest, UserRead, UserUpdateRequest
from app.services.files import file_service
from app.core.config import settings


router = APIRouter()


async def _build_public_profile(db: DBSession, user: User) -> PublicUserProfileRead:
    saved_places_count = await db.scalar(
        select(func.count()).select_from(SavedPlace).where(SavedPlace.user_id == user.id)
    )
    trips_count = await db.scalar(
        select(func.count()).select_from(Trip).where(Trip.owner_user_id == user.id, Trip.deleted_at.is_(None))
    )
    return PublicUserProfileRead(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        username=user.username,
        profile_picture_path=user.profile_picture_path,
        saved_places_count=saved_places_count or 0,
        trips_count=trips_count or 0,
        followers_count=0,
    )


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/search", response_model=list[PublicUserProfileRead])
async def search_users(
    db: DBSession,
    q: str = Query(..., min_length=1),
) -> list[PublicUserProfileRead]:
    normalized_query = q.strip().lower()
    result = await db.scalars(
        select(User)
        .where(
            User.deleted_at.is_(None),
            User.is_active.is_(True),
            or_(
                User.username.ilike(f"{normalized_query}%"),
                User.first_name.ilike(f"{normalized_query}%"),
                User.last_name.ilike(f"{normalized_query}%"),
                User.email.ilike(f"{normalized_query}%"),
            ),
        )
        .order_by(User.username.asc())
        .limit(10)
    )
    users = result.all()
    return [await _build_public_profile(db, user) for user in users]


@router.get("/{username}", response_model=PublicUserProfileRead)
async def get_public_profile(username: str, db: DBSession) -> PublicUserProfileRead:
    user = await db.scalar(
        select(User).where(
            User.username == username.lower(),
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        )
    )
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return await _build_public_profile(db, user)


@router.patch("/me", response_model=UserRead)
async def update_me(payload: UserUpdateRequest, db: DBSession, current_user: User = Depends(get_current_user)) -> UserRead:
    for field, value in payload.model_dump(exclude_unset=True).items():
        if field == "username" and value:
            setattr(current_user, field, value.lower())
        elif value is not None:
            setattr(current_user, field, value)
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.patch("/me/profile-picture", response_model=UserRead)
async def update_profile_picture(
    db: DBSession,
    file: UploadFile,
    current_user: User = Depends(get_current_user),
) -> UserRead:
    current_user.profile_picture_path = await file_service.save_upload(file, settings.PROFILE_PICTURES_DIR)
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)


@router.patch("/me/language", response_model=UserRead)
async def update_language(
    payload: UserLanguageUpdateRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> UserRead:
    language = await db.scalar(select(Language).where(Language.code == payload.preferred_language, Language.is_active.is_(True)))
    if not language:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Language not supported.")
    current_user.preferred_language = language.code
    await db.commit()
    await db.refresh(current_user)
    return UserRead.model_validate(current_user)

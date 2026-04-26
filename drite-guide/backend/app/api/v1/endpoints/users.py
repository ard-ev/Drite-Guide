from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import DBSession, get_current_user, get_optional_current_user
from app.models.language import Language
from app.models.saved_place import SavedPlace
from app.models.trip import Trip
from app.models.user import User
from app.models.user_follow import UserFollow
from app.schemas.common import MessageResponse
from app.schemas.user import PublicUserProfileRead, UserLanguageUpdateRequest, UserRead, UserUpdateRequest
from app.services.files import file_service
from app.core.config import settings


router = APIRouter()


OptionalCurrentUser = Annotated[User | None, Depends(get_optional_current_user)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _normalize_username(value: str) -> str:
    return value.strip().lstrip("@").lower()


async def _build_public_profile(
    db: DBSession,
    user: User,
    current_user: User | None = None,
) -> PublicUserProfileRead:
    saved_places_count = await db.scalar(
        select(func.count()).select_from(SavedPlace).where(SavedPlace.user_id == user.id)
    )
    trips_count = await db.scalar(
        select(func.count()).select_from(Trip).where(Trip.owner_user_id == user.id, Trip.deleted_at.is_(None))
    )
    followers_count = 0
    following_count = 0
    is_following = False

    try:
        followers_count = await db.scalar(
            select(func.count()).select_from(UserFollow).where(UserFollow.followed_user_id == user.id)
        )
        following_count = await db.scalar(
            select(func.count()).select_from(UserFollow).where(UserFollow.follower_user_id == user.id)
        )

        if current_user and current_user.id != user.id:
            is_following = bool(
                await db.scalar(
                    select(UserFollow).where(
                        UserFollow.follower_user_id == current_user.id,
                        UserFollow.followed_user_id == user.id,
                    )
                )
            )
    except SQLAlchemyError:
        await db.rollback()

    return PublicUserProfileRead(
        id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        username=user.username,
        profile_picture_path=user.profile_picture_path,
        saved_places_count=saved_places_count or 0,
        trips_count=trips_count or 0,
        followers_count=followers_count or 0,
        following_count=following_count or 0,
        is_following=is_following,
    )


async def _get_public_user_by_username(db: DBSession, username: str) -> User:
    normalized_username = _normalize_username(username)
    user = await db.scalar(
        select(User).where(
            User.username == normalized_username,
            User.deleted_at.is_(None),
            User.is_active.is_(True),
        )
    )

    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    return user


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/search", response_model=list[PublicUserProfileRead])
async def search_users(
    db: DBSession,
    current_user: OptionalCurrentUser,
    q: str = Query(..., min_length=1),
) -> list[PublicUserProfileRead]:
    normalized_query = _normalize_username(q)
    search_pattern = f"%{normalized_query}%"
    search_terms = [term for term in normalized_query.split() if term]
    term_filters = [
        and_(
            *[
                or_(
                    User.username.ilike(f"%{term}%"),
                    User.first_name.ilike(f"%{term}%"),
                    User.last_name.ilike(f"%{term}%"),
                    User.email.ilike(f"%{term}%"),
                )
                for term in search_terms
            ]
        )
    ] if len(search_terms) > 1 else []

    result = await db.scalars(
        select(User)
        .where(
            User.deleted_at.is_(None),
            User.is_active.is_(True),
            or_(
                User.username.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
                User.email.ilike(search_pattern),
                *term_filters,
            ),
        )
        .order_by(User.username.asc())
        .limit(10)
    )
    users = result.all()
    return [await _build_public_profile(db, user, current_user) for user in users]


@router.get("/{username}", response_model=PublicUserProfileRead)
async def get_public_profile(
    username: str,
    db: DBSession,
    current_user: OptionalCurrentUser,
) -> PublicUserProfileRead:
    user = await _get_public_user_by_username(db, username)
    return await _build_public_profile(db, user, current_user)


@router.post("/{username}/follow", response_model=PublicUserProfileRead)
async def follow_user(username: str, db: DBSession, current_user: CurrentUser) -> PublicUserProfileRead:
    user = await _get_public_user_by_username(db, username)

    if user.id == current_user.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot follow yourself.")

    try:
        existing_follow = await db.scalar(
            select(UserFollow).where(
                UserFollow.follower_user_id == current_user.id,
                UserFollow.followed_user_id == user.id,
            )
        )

        if not existing_follow:
            db.add(UserFollow(follower_user_id=current_user.id, followed_user_id=user.id))
            await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Follow storage is not ready. Please run the latest database migration.",
        ) from exc

    return await _build_public_profile(db, user, current_user)


@router.delete("/{username}/follow", response_model=PublicUserProfileRead)
async def unfollow_user(username: str, db: DBSession, current_user: CurrentUser) -> PublicUserProfileRead:
    user = await _get_public_user_by_username(db, username)

    try:
        existing_follow = await db.scalar(
            select(UserFollow).where(
                UserFollow.follower_user_id == current_user.id,
                UserFollow.followed_user_id == user.id,
            )
        )

        if existing_follow:
            await db.delete(existing_follow)
            await db.commit()
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Follow storage is not ready. Please run the latest database migration.",
        ) from exc

    return await _build_public_profile(db, user, current_user)


@router.get("/{username}/followers", response_model=list[PublicUserProfileRead])
async def get_followers(
    username: str,
    db: DBSession,
    current_user: OptionalCurrentUser,
) -> list[PublicUserProfileRead]:
    user = await _get_public_user_by_username(db, username)
    try:
        result = await db.scalars(
            select(User)
            .join(UserFollow, UserFollow.follower_user_id == User.id)
            .where(
                UserFollow.followed_user_id == user.id,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            .order_by(User.username.asc())
        )
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Follow storage is not ready. Please run the latest database migration.",
        ) from exc

    return [await _build_public_profile(db, follower, current_user) for follower in result.all()]


@router.get("/{username}/following", response_model=list[PublicUserProfileRead])
async def get_following(
    username: str,
    db: DBSession,
    current_user: OptionalCurrentUser,
) -> list[PublicUserProfileRead]:
    user = await _get_public_user_by_username(db, username)
    try:
        result = await db.scalars(
            select(User)
            .join(UserFollow, UserFollow.followed_user_id == User.id)
            .where(
                UserFollow.follower_user_id == user.id,
                User.deleted_at.is_(None),
                User.is_active.is_(True),
            )
            .order_by(User.username.asc())
        )
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Follow storage is not ready. Please run the latest database migration.",
        ) from exc

    return [await _build_public_profile(db, followed_user, current_user) for followed_user in result.all()]


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

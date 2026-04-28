from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_current_user
from app.models.place import Place
from app.models.trip import Trip, TripMember, TripMemberRole, TripMemberStatus, TripPlace
from app.models.user import User
from app.models.user_follow import UserFollow
from app.schemas.common import MessageResponse
from app.schemas.place import PlaceRead
from app.schemas.trip import (
    TripCreate,
    TripDetailRead,
    TripMemberInviteRequest,
    TripMemberRead,
    TripPlaceCreate,
    TripPlaceRead,
    TripPlaceUpdate,
    TripRead,
    TripUpdate,
    TripUserRead,
)


router = APIRouter()


TRIP_LOAD_OPTIONS = (
    selectinload(Trip.members).selectinload(TripMember.user),
    selectinload(Trip.places).selectinload(TripPlace.place).selectinload(Place.images),
)


def _serialize_trip_user(user: User | None) -> TripUserRead | None:
    if not user:
        return None
    return TripUserRead.model_validate(user)


def _serialize_trip_member(member: TripMember) -> TripMemberRead:
    return TripMemberRead(
        id=member.id,
        trip_id=member.trip_id,
        user_id=member.user_id,
        role=member.role,
        status=member.status,
        invited_by_user_id=member.invited_by_user_id,
        created_at=member.created_at,
        updated_at=member.updated_at,
        user=_serialize_trip_user(member.user),
    )


def _serialize_trip_place(trip_place: TripPlace) -> TripPlaceRead:
    return TripPlaceRead(
        id=trip_place.id,
        trip_id=trip_place.trip_id,
        place_id=trip_place.place_id,
        visit_date=trip_place.visit_date,
        visit_start_time=trip_place.visit_start_time,
        visit_end_time=trip_place.visit_end_time,
        note=trip_place.note,
        order_index=trip_place.order_index,
        created_at=trip_place.created_at,
        updated_at=trip_place.updated_at,
        place=PlaceRead.model_validate(trip_place.place) if trip_place.place else None,
    )


def _get_current_user_member(trip: Trip, current_user: User) -> TripMember | None:
    return next((member for member in trip.members if member.user_id == current_user.id), None)


def _user_can_access_trip(trip: Trip, current_user: User) -> bool:
    if trip.owner_id == current_user.id:
        return True

    member = _get_current_user_member(trip, current_user)
    return bool(member and member.status in {TripMemberStatus.invited, TripMemberStatus.accepted})


def _serialize_trip(trip: Trip, current_user: User, include_details: bool = False) -> TripRead | TripDetailRead:
    current_member = _get_current_user_member(trip, current_user)
    invited_users_count = len([member for member in trip.members if member.role != TripMemberRole.owner])
    base_payload = {
        "id": trip.id,
        "owner_id": trip.owner_id,
        "title": trip.title,
        "description": trip.description,
        "start_date": trip.start_date,
        "end_date": trip.end_date,
        "shared_note": trip.shared_note,
        "created_at": trip.created_at,
        "updated_at": trip.updated_at,
        "places_count": len(trip.places),
        "invited_users_count": invited_users_count,
        "role": current_member.role if current_member else (TripMemberRole.owner if trip.owner_id == current_user.id else None),
    }

    if not include_details:
        return TripRead(**base_payload)

    return TripDetailRead(
        **base_payload,
        members=[_serialize_trip_member(member) for member in trip.members],
        places=[
            _serialize_trip_place(trip_place)
            for trip_place in sorted(trip.places, key=lambda item: item.order_index)
        ],
    )


async def _get_trip_or_404(db: DBSession, trip_id: UUID, current_user: User) -> Trip:
    trip = await db.scalar(select(Trip).where(Trip.id == trip_id).options(*TRIP_LOAD_OPTIONS))
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if not _user_can_access_trip(trip, current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this trip.")
    return trip


def _require_owner(trip: Trip, current_user: User) -> None:
    if trip.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the trip owner can do this.")


def _validate_trip_dates(start_date, end_date) -> None:
    if end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="End date must be after or equal to start date.",
        )


@router.get("", response_model=list[TripRead])
async def list_trips(db: DBSession, current_user: User = Depends(get_current_user)) -> list[TripRead]:
    result = await db.scalars(
        select(Trip)
        .where(
            or_(
                Trip.owner_id == current_user.id,
                Trip.members.any(TripMember.user_id == current_user.id),
            )
        )
        .options(*TRIP_LOAD_OPTIONS)
        .order_by(Trip.start_date.asc(), Trip.created_at.desc())
    )
    trips = [trip for trip in result.unique().all() if _user_can_access_trip(trip, current_user)]
    return [_serialize_trip(trip, current_user) for trip in trips]


@router.get("/me", response_model=list[TripRead])
async def get_my_trips(db: DBSession, current_user: User = Depends(get_current_user)) -> list[TripRead]:
    return await list_trips(db, current_user)


@router.post("", response_model=TripDetailRead, status_code=status.HTTP_201_CREATED)
async def create_trip(
    payload: TripCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripDetailRead:
    title = payload.title.strip()
    if not title:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")

    _validate_trip_dates(payload.start_date, payload.end_date)

    trip = Trip(
        owner_id=current_user.id,
        title=title,
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
        shared_note=payload.shared_note,
    )
    db.add(trip)
    await db.flush()

    db.add(
        TripMember(
            trip_id=trip.id,
            user_id=current_user.id,
            role=TripMemberRole.owner,
            status=TripMemberStatus.accepted,
            invited_by_user_id=current_user.id,
        )
    )
    await db.commit()

    return await get_trip(trip.id, db, current_user)


@router.get("/{trip_id}", response_model=TripDetailRead)
async def get_trip(
    trip_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripDetailRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    return _serialize_trip(trip, current_user, include_details=True)


@router.put("/{trip_id}", response_model=TripDetailRead)
async def update_trip(
    trip_id: UUID,
    payload: TripUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripDetailRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    _require_owner(trip, current_user)

    next_start_date = payload.start_date or trip.start_date
    next_end_date = payload.end_date or trip.end_date
    _validate_trip_dates(next_start_date, next_end_date)

    updates = payload.model_dump(exclude_unset=True)
    if "title" in updates:
        updates["title"] = updates["title"].strip()
        if not updates["title"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required.")

    for field, value in updates.items():
        setattr(trip, field, value)

    await db.commit()
    return await get_trip(trip_id, db, current_user)


@router.patch("/{trip_id}", response_model=TripDetailRead)
async def patch_trip(
    trip_id: UUID,
    payload: TripUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripDetailRead:
    return await update_trip(trip_id, payload, db, current_user)


@router.delete("/{trip_id}", response_model=MessageResponse)
async def delete_trip(
    trip_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    _require_owner(trip, current_user)

    await db.delete(trip)
    await db.commit()
    return MessageResponse(message="Trip deleted.")


@router.post("/{trip_id}/places", response_model=TripPlaceRead, status_code=status.HTTP_201_CREATED)
async def add_trip_place(
    trip_id: UUID,
    payload: TripPlaceCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripPlaceRead:
    await _get_trip_or_404(db, trip_id, current_user)

    place = await db.get(Place, payload.place_id)
    if not place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Place not found.")

    existing = await db.scalar(
        select(TripPlace).where(TripPlace.trip_id == trip_id, TripPlace.place_id == payload.place_id)
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Place already exists in this trip.")

    order_index = payload.order_index
    if order_index is None:
        max_order_index = await db.scalar(
            select(func.max(TripPlace.order_index)).where(TripPlace.trip_id == trip_id)
        )
        order_index = (max_order_index or 0) + 1

    trip_place = TripPlace(
        trip_id=trip_id,
        place_id=payload.place_id,
        visit_date=payload.visit_date,
        visit_start_time=payload.visit_start_time,
        visit_end_time=payload.visit_end_time,
        note=payload.note,
        order_index=order_index,
    )
    db.add(trip_place)

    try:
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Place already exists in this trip.") from exc

    trip_place = await db.scalar(
        select(TripPlace)
        .where(TripPlace.id == trip_place.id)
        .options(selectinload(TripPlace.place).selectinload(Place.images))
    )
    return _serialize_trip_place(trip_place)


@router.put("/{trip_id}/places/{trip_place_id}", response_model=TripPlaceRead)
async def update_trip_place(
    trip_id: UUID,
    trip_place_id: UUID,
    payload: TripPlaceUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripPlaceRead:
    await _get_trip_or_404(db, trip_id, current_user)

    trip_place = await db.scalar(
        select(TripPlace)
        .where(TripPlace.id == trip_place_id, TripPlace.trip_id == trip_id)
        .options(selectinload(TripPlace.place).selectinload(Place.images))
    )
    if not trip_place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip place not found.")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip_place, field, value)

    await db.commit()
    await db.refresh(trip_place)
    return _serialize_trip_place(trip_place)


@router.patch("/{trip_id}/places/{trip_place_id}", response_model=TripPlaceRead)
async def patch_trip_place(
    trip_id: UUID,
    trip_place_id: UUID,
    payload: TripPlaceUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripPlaceRead:
    return await update_trip_place(trip_id, trip_place_id, payload, db, current_user)


@router.delete("/{trip_id}/places/{trip_place_id}", response_model=MessageResponse)
async def delete_trip_place(
    trip_id: UUID,
    trip_place_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    await _get_trip_or_404(db, trip_id, current_user)

    trip_place = await db.scalar(select(TripPlace).where(TripPlace.id == trip_place_id, TripPlace.trip_id == trip_id))
    if not trip_place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip place not found.")

    await db.delete(trip_place)
    await db.commit()
    return MessageResponse(message="Trip place deleted.")


@router.post("/{trip_id}/invite", response_model=TripMemberRead, status_code=status.HTTP_201_CREATED)
async def invite_trip_member(
    trip_id: UUID,
    payload: TripMemberInviteRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripMemberRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    _require_owner(trip, current_user)

    username = payload.username.strip().lstrip("@").lower()
    invited_user = await db.scalar(
        select(User).where(User.username == username, User.deleted_at.is_(None), User.is_active.is_(True))
    )
    if not invited_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    follows_user = await db.scalar(
        select(UserFollow).where(
            UserFollow.follower_id == current_user.id,
            UserFollow.following_id == invited_user.id,
        )
    )
    if not follows_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can only invite users you follow.")

    existing = await db.scalar(select(TripMember).where(TripMember.trip_id == trip_id, TripMember.user_id == invited_user.id))
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User is already invited to this trip.")

    member = TripMember(
        trip_id=trip_id,
        user_id=invited_user.id,
        role=TripMemberRole.member,
        status=TripMemberStatus.invited,
        invited_by_user_id=current_user.id,
    )
    db.add(member)
    await db.commit()

    member = await db.scalar(
        select(TripMember)
        .where(TripMember.id == member.id)
        .options(selectinload(TripMember.user))
    )
    return _serialize_trip_member(member)


@router.post("/{trip_id}/invite-by-username", response_model=TripMemberRead, status_code=status.HTTP_201_CREATED)
async def invite_trip_member_legacy(
    trip_id: UUID,
    payload: TripMemberInviteRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripMemberRead:
    return await invite_trip_member(trip_id, payload, db, current_user)


@router.delete("/{trip_id}/members/{user_id}", response_model=MessageResponse)
async def delete_trip_member(
    trip_id: UUID,
    user_id: UUID,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    trip = await _get_trip_or_404(db, trip_id, current_user)

    if trip.owner_id != current_user.id and user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the trip owner can remove members.")

    member = await db.scalar(select(TripMember).where(TripMember.trip_id == trip_id, TripMember.user_id == user_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip member not found.")
    if member.role == TripMemberRole.owner:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The trip owner cannot be removed.")

    await db.delete(member)
    await db.commit()
    return MessageResponse(message="Trip member removed.")

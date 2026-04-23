from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.api.deps import DBSession, get_current_user
from app.models.place import Place
from app.models.trip import Trip, TripMember, TripMemberStatus, TripPlace
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.place import TripPlaceCreate, TripPlaceReorderRequest, TripPlaceUpdate
from app.schemas.trip import TripCreate, TripMemberInviteRequest, TripMemberRead, TripMemberUpdateRequest, TripPlaceRead, TripRead, TripUpdate


router = APIRouter()


def _serialize_trip_place(trip_place: TripPlace) -> TripPlaceRead:
    return TripPlaceRead(
        id=trip_place.id,
        trip_id=trip_place.trip_id,
        place_id=trip_place.place_id,
        day_date=trip_place.day_date,
        visit_order=trip_place.visit_order,
        note=trip_place.note,
        added_at=trip_place.added_at,
        place=None,
    )


async def _get_trip_or_404(db: DBSession, trip_id: UUID, current_user: User) -> Trip:
    trip = await db.scalar(
        select(Trip)
        .where(Trip.id == trip_id, Trip.deleted_at.is_(None))
        .options(selectinload(Trip.members), selectinload(Trip.places))
    )
    if not trip:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    is_owner = trip.owner_user_id == current_user.id
    is_member = any(member.user_id == current_user.id and member.status == TripMemberStatus.accepted for member in trip.members)
    if not is_owner and not is_member:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to access this trip.")
    return trip


@router.get("/me", response_model=list[TripRead])
async def get_my_trips(db: DBSession, current_user: User = Depends(get_current_user)) -> list[TripRead]:
    result = await db.scalars(
        select(Trip)
        .where(
            Trip.deleted_at.is_(None),
            or_(
                Trip.owner_user_id == current_user.id,
                Trip.members.any(TripMember.user_id == current_user.id),
            ),
        )
        .order_by(Trip.created_at.desc())
    )
    return [TripRead.model_validate(trip) for trip in result.unique().all()]


@router.get("/{trip_id}", response_model=TripRead)
async def get_trip(trip_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> TripRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    return TripRead.model_validate(trip)


@router.post("", response_model=TripRead, status_code=status.HTTP_201_CREATED)
async def create_trip(payload: TripCreate, db: DBSession, current_user: User = Depends(get_current_user)) -> TripRead:
    trip = Trip(owner_user_id=current_user.id, **payload.model_dump())
    db.add(trip)
    await db.commit()
    await db.refresh(trip)
    return TripRead.model_validate(trip)


@router.patch("/{trip_id}", response_model=TripRead)
async def update_trip(trip_id: UUID, payload: TripUpdate, db: DBSession, current_user: User = Depends(get_current_user)) -> TripRead:
    trip = await db.get(Trip, trip_id)
    if not trip or trip.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can edit the trip.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip, field, value)
    await db.commit()
    await db.refresh(trip)
    return TripRead.model_validate(trip)


@router.delete("/{trip_id}", response_model=MessageResponse)
async def delete_trip(trip_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    trip = await db.get(Trip, trip_id)
    if not trip or trip.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can delete the trip.")
    trip.deleted_at = datetime.now(timezone.utc)
    await db.commit()
    return MessageResponse(message="Trip deleted.")


@router.post("/{trip_id}/invite-by-username", response_model=TripMemberRead, status_code=status.HTTP_201_CREATED)
async def invite_trip_member(
    trip_id: UUID,
    payload: TripMemberInviteRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripMemberRead:
    trip = await db.get(Trip, trip_id)
    if not trip or trip.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip not found.")
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can invite members.")
    invited_user = await db.scalar(select(User).where(User.username == payload.username.lower(), User.deleted_at.is_(None)))
    if not invited_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    existing = await db.scalar(select(TripMember).where(TripMember.trip_id == trip_id, TripMember.user_id == invited_user.id))
    if existing:
        return TripMemberRead.model_validate(existing)
    member = TripMember(trip_id=trip_id, user_id=invited_user.id, invited_by_user_id=current_user.id)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return TripMemberRead.model_validate(member)


@router.patch("/{trip_id}/members/{member_id}", response_model=TripMemberRead)
async def update_trip_member(
    trip_id: UUID,
    member_id: UUID,
    payload: TripMemberUpdateRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripMemberRead:
    member = await db.scalar(select(TripMember).where(TripMember.id == member_id, TripMember.trip_id == trip_id))
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip member not found.")
    trip = await db.get(Trip, trip_id)
    if current_user.id not in {trip.owner_user_id, member.user_id}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed to update this invitation.")
    member.status = payload.status
    member.joined_at = datetime.now(timezone.utc) if payload.status == TripMemberStatus.accepted else None
    await db.commit()
    await db.refresh(member)
    return TripMemberRead.model_validate(member)


@router.get("/{trip_id}/members", response_model=list[TripMemberRead])
async def list_trip_members(trip_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> list[TripMemberRead]:
    await _get_trip_or_404(db, trip_id, current_user)
    result = await db.scalars(select(TripMember).where(TripMember.trip_id == trip_id).order_by(TripMember.created_at.asc()))
    return [TripMemberRead.model_validate(member) for member in result.all()]


@router.post("/{trip_id}/places", response_model=TripPlaceRead, status_code=status.HTTP_201_CREATED)
async def add_trip_place(trip_id: UUID, payload: TripPlaceCreate, db: DBSession, current_user: User = Depends(get_current_user)) -> TripPlaceRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can manage trip places.")
    trip_place = TripPlace(trip_id=trip_id, **payload.model_dump())
    db.add(trip_place)
    await db.commit()
    await db.refresh(trip_place)
    return _serialize_trip_place(trip_place)


@router.patch("/{trip_id}/places/{trip_place_id}", response_model=TripPlaceRead)
async def update_trip_place(
    trip_id: UUID,
    trip_place_id: UUID,
    payload: TripPlaceUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> TripPlaceRead:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can manage trip places.")
    trip_place = await db.scalar(select(TripPlace).where(TripPlace.id == trip_place_id, TripPlace.trip_id == trip_id))
    if not trip_place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip place not found.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(trip_place, field, value)
    await db.commit()
    await db.refresh(trip_place)
    return _serialize_trip_place(trip_place)


@router.delete("/{trip_id}/places/{trip_place_id}", response_model=MessageResponse)
async def delete_trip_place(trip_id: UUID, trip_place_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can manage trip places.")
    trip_place = await db.scalar(select(TripPlace).where(TripPlace.id == trip_place_id, TripPlace.trip_id == trip_id))
    if not trip_place:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trip place not found.")
    await db.delete(trip_place)
    await db.commit()
    return MessageResponse(message="Trip place deleted.")


@router.patch("/{trip_id}/places/reorder", response_model=MessageResponse)
async def reorder_trip_places(
    trip_id: UUID,
    payload: TripPlaceReorderRequest,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    trip = await _get_trip_or_404(db, trip_id, current_user)
    if trip.owner_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the owner can reorder trip places.")
    items = {item.trip_place_id: item.visit_order for item in payload.items}
    result = await db.scalars(select(TripPlace).where(TripPlace.trip_id == trip_id, TripPlace.id.in_(items.keys())))
    for trip_place in result.all():
        trip_place.visit_order = items[trip_place.id]
    await db.commit()
    return MessageResponse(message="Trip places reordered.")

from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import DBSession, get_current_user
from app.models.review import Review
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.review import ReviewRead, ReviewUpdate
from app.services.reviews import refresh_place_rating


router = APIRouter()


@router.patch("/{review_id}", response_model=ReviewRead)
async def update_review(
    review_id: UUID,
    payload: ReviewUpdate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> ReviewRead:
    review = await db.scalar(select(Review).where(Review.id == review_id, Review.deleted_at.is_(None)))
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only edit your own review.")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    await db.flush()
    await refresh_place_rating(db, review.place_id)
    await db.commit()
    await db.refresh(review)
    return ReviewRead.model_validate(review)


@router.delete("/{review_id}", response_model=MessageResponse)
async def delete_review(review_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    review = await db.scalar(select(Review).where(Review.id == review_id, Review.deleted_at.is_(None)))
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")
    if review.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You can only delete your own review.")
    review.deleted_at = datetime.now(timezone.utc)
    await db.flush()
    await refresh_place_rating(db, review.place_id)
    await db.commit()
    return MessageResponse(message="Review deleted.")

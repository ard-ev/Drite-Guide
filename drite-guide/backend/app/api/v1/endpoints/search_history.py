from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from app.api.deps import DBSession, get_current_user
from app.models.search_history import SearchHistory
from app.models.user import User
from app.schemas.common import MessageResponse
from app.schemas.search_history import SearchHistoryCreate, SearchHistoryRead


router = APIRouter()


@router.get("/me", response_model=list[SearchHistoryRead])
async def get_my_search_history(db: DBSession, current_user: User = Depends(get_current_user)) -> list[SearchHistoryRead]:
    result = await db.scalars(
        select(SearchHistory).where(SearchHistory.user_id == current_user.id).order_by(SearchHistory.searched_at.desc())
    )
    return [SearchHistoryRead.model_validate(item) for item in result.all()]


@router.post("", response_model=SearchHistoryRead, status_code=status.HTTP_201_CREATED)
async def create_search_history(
    payload: SearchHistoryCreate,
    db: DBSession,
    current_user: User = Depends(get_current_user),
) -> SearchHistoryRead:
    item = SearchHistory(user_id=current_user.id, **payload.model_dump())
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return SearchHistoryRead.model_validate(item)


@router.delete("/{history_id}", response_model=MessageResponse)
async def delete_search_history(history_id: UUID, db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    item = await db.scalar(select(SearchHistory).where(SearchHistory.id == history_id, SearchHistory.user_id == current_user.id))
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Search history entry not found.")
    await db.delete(item)
    await db.commit()
    return MessageResponse(message="Search history deleted.")

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Review
from app.models.saved_place import SavedPlace
from app.models.search_history import SearchHistory


async def get_recommendation_signals(session: AsyncSession, user_id) -> dict[str, int]:
    saved_count = len((await session.scalars(select(SavedPlace).where(SavedPlace.user_id == user_id))).all())
    review_count = len((await session.scalars(select(Review).where(Review.user_id == user_id, Review.deleted_at.is_(None)))).all())
    search_count = len((await session.scalars(select(SearchHistory).where(SearchHistory.user_id == user_id))).all())
    return {
        "saved_places": saved_count,
        "reviews": review_count,
        "search_history_entries": search_count,
    }

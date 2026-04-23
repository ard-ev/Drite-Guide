from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.place import Place
from app.models.review import Review


async def refresh_place_rating(session: AsyncSession, place_id) -> None:
    stats = await session.execute(
        select(func.count(Review.id), func.coalesce(func.avg(Review.rating), 0))
        .where(Review.place_id == place_id, Review.deleted_at.is_(None))
    )
    count, average = stats.one()
    place = await session.get(Place, place_id)
    if place:
        place.ratings_count = int(count or 0)
        place.rating_average = float(average or 0)


from pathlib import Path

from app.core.config import settings
from app.db.base import Base
from sqlalchemy import create_engine


def ensure_upload_directories() -> None:
    base = Path(settings.UPLOAD_DIR)
    for folder in (
        base,
        base / settings.PROFILE_PICTURES_DIR,
        base / settings.PLACE_UPLOADS_DIR,
        base / settings.CITY_UPLOADS_DIR,
        base / settings.CATEGORY_UPLOADS_DIR,
    ):
        folder.mkdir(parents=True, exist_ok=True)


def init_db() -> None:
    ensure_upload_directories()
    engine = create_engine(settings.SYNC_DATABASE_URL, future=True, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)

from pathlib import Path
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.db.base import Base
from app.db.init_db import ensure_upload_directories
from app.db.session import engine

logger = logging.getLogger(__name__)


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.BACKEND_CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    ensure_upload_directories()

    uploads_dir = Path(settings.UPLOAD_DIR)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    async def ensure_database_tables() -> None:
        try:
            async with engine.begin() as connection:
                await connection.run_sync(Base.metadata.create_all)
        except Exception:
            logger.exception("Database startup preparation failed.")

    @app.get("/", tags=["health"])
    def root() -> dict[str, str]:
        return {"status": "ok", "service": settings.APP_NAME}

    @app.get("/health", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.get(f"{settings.API_V1_PREFIX}/health", tags=["health"])
    def api_healthcheck() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/health/db", tags=["health"])
    async def database_healthcheck() -> dict[str, str]:
        try:
            async with engine.begin() as connection:
                await connection.execute(text("SELECT 1"))
        except Exception as error:
            logger.exception("Database healthcheck failed.")
            return {"status": "error", "detail": str(error)}
        return {"status": "ok"}

    return app


app = create_application()

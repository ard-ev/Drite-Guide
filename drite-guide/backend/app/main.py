from pathlib import Path
import asyncio
import logging
from os import getenv

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.db.prepare_railway import main as prepare_database
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
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    ensure_upload_directories()

    uploads_dir = Path(settings.UPLOAD_DIR)
    app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    @app.on_event("startup")
    async def prepare_database_after_start() -> None:
        async def run_prepare_database() -> None:
            try:
                await asyncio.to_thread(prepare_database)
            except Exception:
                logger.exception("Background database preparation failed.")

        asyncio.create_task(run_prepare_database())

    @app.middleware("http")
    async def log_requests(request: Request, call_next):
        logger.warning("Incoming request: %s %s", request.method, request.url.path)
        response = await call_next(request)
        logger.warning(
            "Finished request: %s %s -> %s",
            request.method,
            request.url.path,
            response.status_code,
        )
        return response

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

    @app.get("/debug/runtime", tags=["health"])
    def runtime_debug() -> dict[str, str | None]:
        return {
            "status": "ok",
            "service": settings.APP_NAME,
            "api_prefix": settings.API_V1_PREFIX,
            "port": getenv("PORT"),
            "database_host": settings.DATABASE_URL.split("@")[-1].split("/")[0],
        }

    return app


app = create_application()

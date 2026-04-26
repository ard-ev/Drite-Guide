from functools import lru_cache
import logging
from os import getenv
from pathlib import Path
from urllib.parse import parse_qsl, quote, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]
logger = logging.getLogger(__name__)


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    APP_NAME: str = "Drite Guide API"
    APP_VERSION: str = "0.1.0"
    API_V1_PREFIX: str = "/api/v1"

    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/drite_guide"
    SYNC_DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/drite_guide"
    SECRET_KEY: str = "change-me"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 14
    EMAIL_VERIFICATION_EXPIRE_HOURS: int = 48
    ALGORITHM: str = "HS256"

    BACKEND_CORS_ORIGINS: list[str] = Field(default_factory=lambda: ["*"])

    DEFAULT_LANGUAGE: str = "en"
    DEFAULT_PROFILE_PICTURE: str = "uploads/profile_pictures/default-profile.svg"

    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024
    UPLOAD_DIR: str = str(BASE_DIR / "app" / "uploads")
    PROFILE_PICTURES_DIR: str = "profile_pictures"
    PLACE_UPLOADS_DIR: str = "places"
    CITY_UPLOADS_DIR: str = "cities"
    CATEGORY_UPLOADS_DIR: str = "categories"

    FRONTEND_BASE_URL: str = "http://localhost:8081"

    @model_validator(mode="after")
    def normalize_database_urls(self) -> "Settings":
        railway_database_url = (
            getenv("DATABASE_PRIVATE_URL")
            or getenv("DATABASE_PUBLIC_URL")
            or getenv("POSTGRES_URL")
            or build_database_url_from_pg_env()
            or getenv("DATABASE_URL")
        )
        if railway_database_url:
            self.DATABASE_URL = railway_database_url

        self.DATABASE_URL = normalize_database_url(self.DATABASE_URL, "async")

        if self.SYNC_DATABASE_URL == Settings.model_fields["SYNC_DATABASE_URL"].default:
            self.SYNC_DATABASE_URL = self.DATABASE_URL

        self.SYNC_DATABASE_URL = normalize_database_url(self.SYNC_DATABASE_URL, "sync")
        logger.warning("Database configured for host: %s", safe_database_host(self.DATABASE_URL))

        return self


def safe_database_host(url: str) -> str:
    split = urlsplit(url)
    return split.hostname or "unknown"


def normalize_database_url(url: str, mode: str) -> str:
    split = urlsplit(url)
    scheme = split.scheme
    if scheme in {"postgres", "postgresql"}:
        scheme = "postgresql+asyncpg" if mode == "async" else "postgresql+psycopg"
    elif mode == "async" and scheme == "postgresql+psycopg":
        scheme = "postgresql+asyncpg"
    elif mode == "sync" and scheme == "postgresql+asyncpg":
        scheme = "postgresql+psycopg"

    query_items = [
        (key, value)
        for key, value in parse_qsl(split.query, keep_blank_values=True)
        if key.lower() != "sslmode"
    ]
    query = urlencode(query_items)
    return urlunsplit((scheme, split.netloc, split.path, query, split.fragment))


def build_database_url_from_pg_env() -> str | None:
    host = getenv("PGHOST") or getenv("POSTGRES_HOST")
    password = getenv("PGPASSWORD") or getenv("POSTGRES_PASSWORD")
    if not host or not password:
        return None

    username = getenv("PGUSER") or getenv("POSTGRES_USER") or "postgres"
    port = getenv("PGPORT") or getenv("POSTGRES_PORT") or "5432"
    database = getenv("PGDATABASE") or getenv("POSTGRES_DB") or getenv("POSTGRES_DATABASE") or "railway"
    return (
        f"postgresql://{quote(username)}:{quote(password)}"
        f"@{host}:{port}/{quote(database)}"
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


BASE_DIR = Path(__file__).resolve().parents[2]


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


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

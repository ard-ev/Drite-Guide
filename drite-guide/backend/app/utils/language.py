from app.core.config import settings


def extract_language_code(raw_language: str | None) -> str:
    if not raw_language:
        return settings.DEFAULT_LANGUAGE
    primary = raw_language.split(",")[0].strip().split(";")[0].strip()
    if not primary:
        return settings.DEFAULT_LANGUAGE
    return primary.split("-")[0].lower()


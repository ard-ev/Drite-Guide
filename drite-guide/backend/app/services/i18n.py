from collections.abc import Iterable

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.language import Language
from app.utils.language import extract_language_code


async def resolve_language_code(
    session: AsyncSession,
    accept_language: str | None,
    user_language: str | None = None,
) -> str:
    requested_codes = [
        extract_language_code(accept_language),
        extract_language_code(user_language),
        settings.DEFAULT_LANGUAGE,
    ]
    for code in requested_codes:
        result = await session.scalar(select(Language.code).where(Language.code == code, Language.is_active.is_(True)))
        if result:
            return result
    return settings.DEFAULT_LANGUAGE


def translate_value(
    translations: Iterable,
    requested_language: str,
    field_name: str,
    fallback_value: str,
) -> str:
    translation_by_code = {translation.language_code: translation for translation in translations}
    if requested_language in translation_by_code:
        return getattr(translation_by_code[requested_language], field_name)
    if settings.DEFAULT_LANGUAGE in translation_by_code:
        return getattr(translation_by_code[settings.DEFAULT_LANGUAGE], field_name)
    return fallback_value


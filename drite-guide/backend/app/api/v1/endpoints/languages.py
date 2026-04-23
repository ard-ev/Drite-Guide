from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import DBSession
from app.models.language import Language
from app.schemas.language import LanguageRead


router = APIRouter()


@router.get("", response_model=list[LanguageRead])
async def list_languages(db: DBSession) -> list[LanguageRead]:
    result = await db.scalars(select(Language).where(Language.is_active.is_(True)).order_by(Language.name.asc()))
    return [LanguageRead.model_validate(language) for language in result.all()]


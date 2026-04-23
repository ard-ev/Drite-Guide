from app.schemas.common import ORMModel


class LanguageRead(ORMModel):
    code: str
    name: str
    is_active: bool


from uuid import UUID

from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.session import get_db_session
from app.models.user import User, UserRole
from app.services.i18n import resolve_language_code


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

DBSession = Annotated[AsyncSession, Depends(get_db_session)]


async def get_current_user(
    db: DBSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User:
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.")
    try:
        payload = decode_token(token)
        user_id = UUID(payload.get("sub"))
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.") from exc
    if payload.get("type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
    user = await db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")
    return user


async def get_optional_current_user(
    db: DBSession,
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> User | None:
    if not token:
        return None
    try:
        payload = decode_token(token)
        user_id = UUID(payload.get("sub"))
    except Exception:
        return None
    return await db.scalar(select(User).where(User.id == user_id, User.deleted_at.is_(None)))


async def require_admin(user: Annotated[User, Depends(get_current_user)]) -> User:
    if user.role != UserRole.admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin role required.")
    return user


async def get_request_language(
    db: DBSession,
    accept_language: Annotated[str | None, Header()] = None,
    user: Annotated[User | None, Depends(get_optional_current_user)] = None,
) -> str:
    return await resolve_language_code(db, accept_language, user.preferred_language if user else None)

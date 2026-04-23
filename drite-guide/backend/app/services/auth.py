from datetime import datetime, timezone
from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_email_verification_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.language import Language
from app.models.user import User, UserRole
from app.services.email import email_service
from app.utils.language import extract_language_code


async def _resolve_supported_language(session: AsyncSession, preferred_language: str | None) -> str:
    requested = extract_language_code(preferred_language)
    exists = await session.scalar(select(Language.code).where(Language.code == requested, Language.is_active.is_(True)))
    return exists or settings.DEFAULT_LANGUAGE


async def register_user(
    session: AsyncSession,
    *,
    first_name: str,
    last_name: str,
    email: str,
    username: str,
    password: str,
    preferred_language: str | None,
    profile_picture_path: str,
    role: UserRole = UserRole.user,
) -> User:
    existing_user = await session.scalar(
        select(User).where(or_(User.email == email.lower(), User.username == username.lower()))
    )
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or username already exists.")

    verification_token, verification_expires_at = create_email_verification_token()
    user = User(
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        email=email.strip().lower(),
        username=username.strip().lower(),
        password_hash=hash_password(password),
        profile_picture_path=profile_picture_path,
        preferred_language=await _resolve_supported_language(session, preferred_language),
        role=role,
        email_verification_token=verification_token,
        email_verification_expires_at=verification_expires_at,
    )
    session.add(user)
    await session.commit()
    await session.refresh(user)
    await email_service.send_verification_email(user.email, verification_token)
    return user


async def authenticate_user(session: AsyncSession, identifier: str, password: str) -> User:
    normalized = identifier.strip().lower()
    user = await session.scalar(select(User).where(or_(User.email == normalized, User.username == normalized)))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    if not user.is_active or user.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive.")
    return user


async def issue_tokens(session: AsyncSession, user: User) -> dict[str, str]:
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))
    user.refresh_token_hash = hash_password(refresh_token)
    await session.commit()
    return {"access_token": access_token, "refresh_token": refresh_token}


async def refresh_tokens(session: AsyncSession, refresh_token: str) -> dict[str, str]:
    try:
        payload = decode_token(refresh_token)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.") from exc
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token.")
    user = await session.get(User, UUID(payload.get("sub")))
    if not user or not user.refresh_token_hash or not verify_password(refresh_token, user.refresh_token_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token invalid.")
    return await issue_tokens(session, user)


async def logout_user(session: AsyncSession, user: User) -> None:
    user.refresh_token_hash = None
    await session.commit()


async def verify_email_token(session: AsyncSession, token: str) -> User:
    user = await session.scalar(select(User).where(User.email_verification_token == token))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Verification token not found.")
    if user.email_verification_expires_at and user.email_verification_expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired.")
    user.email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    await session.commit()
    await session.refresh(user)
    return user

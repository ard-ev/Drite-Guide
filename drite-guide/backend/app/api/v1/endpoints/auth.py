from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from app.api.deps import DBSession, get_current_user
from app.core.config import settings
from app.core.security import decode_token
from app.models.user import User
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, RegisterResponse, TokenResponse
from app.schemas.common import MessageResponse
from app.schemas.user import UserRead
from app.services.auth import (
    authenticate_user,
    issue_tokens,
    logout_user,
    refresh_tokens,
    register_user,
    verify_email_token,
)


router = APIRouter()


@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, db: DBSession) -> RegisterResponse:
    user = await register_user(
        db,
        first_name=payload.first_name,
        last_name=payload.last_name,
        email=payload.email,
        username=payload.username,
        password=payload.password,
        preferred_language=payload.preferred_language,
        profile_picture_path=settings.DEFAULT_PROFILE_PICTURE,
    )
    return RegisterResponse(
        user=UserRead.model_validate(user),
        role=user.role,
        message="Registration successful. Check backend logs for the verification link in development.",
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: DBSession) -> TokenResponse:
    user = await authenticate_user(db, payload.identifier, payload.password)
    tokens = await issue_tokens(db, user)
    await db.refresh(user)
    return TokenResponse(user=UserRead.model_validate(user), **tokens)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(payload: RefreshRequest, db: DBSession) -> TokenResponse:
    tokens = await refresh_tokens(db, payload.refresh_token)
    user_id = UUID(decode_token(tokens["access_token"]).get("sub"))
    user = await db.scalar(select(User).where(User.id == user_id))
    await db.refresh(user)
    return TokenResponse(user=UserRead.model_validate(user), **tokens)


@router.post("/logout", response_model=MessageResponse)
async def logout(db: DBSession, current_user: User = Depends(get_current_user)) -> MessageResponse:
    await logout_user(db, current_user)
    return MessageResponse(message="Logged out successfully.")


@router.get("/verify-email", response_model=MessageResponse)
async def verify_email(db: DBSession, token: str = Query(...)) -> MessageResponse:
    user = await verify_email_token(db, token)
    if not user.email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification failed.")
    return MessageResponse(message="Email verified successfully.")

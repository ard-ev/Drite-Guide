from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole
from app.schemas.user import UserRead


class RegisterRequest(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    username: str = Field(min_length=3, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    preferred_language: str | None = None


class LoginRequest(BaseModel):
    identifier: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserRead


class RegisterResponse(BaseModel):
    user: UserRead
    role: UserRole
    message: str


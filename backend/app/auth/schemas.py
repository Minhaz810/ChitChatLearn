from pydantic import BaseModel, EmailStr, Field, field_validator

from .models import UserRole


class UserBase(BaseModel):
    """Base user schema with common fields."""

    email: EmailStr
    username: str


class UserCreate(UserBase):
    """Schema for creating a new user."""

    password: str = Field(..., max_length=72)
    confirm_password: str = Field(..., max_length=72)
    
    @field_validator("confirm_password")
    @classmethod
    def validate_confirm_password(cls, v: str,info) -> str:
        if 'password' in info.data and v!= info.data['password']:
            raise ValueError("Passwords do not match")
        return v


class UserLogin(BaseModel):
    """Schema for user login credentials."""

    email: EmailStr
    password: str = Field(..., max_length=72)


class UserResponse(UserBase):
    """Schema for user response data."""

    id: int
    is_active: bool
    user_role: UserRole

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Schema for authentication token response."""

    access_token: str
    refresh_token: str
    token_type: str


class TokenRefresh(BaseModel):
    """Schema for refreshing authentication token."""

    refresh_token: str
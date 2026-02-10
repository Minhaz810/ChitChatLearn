from typing import Optional, List
from pydantic import BaseModel, EmailStr
from datetime import datetime

class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

class AdminUserResponse(BaseModel):
    id: int
    email: str
    username: str
    is_active: bool
    role_name: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AdminStatsResponse(BaseModel):
    total_users: int

class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

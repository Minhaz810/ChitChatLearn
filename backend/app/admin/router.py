from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from database import get_db
from .service import AdminService
from .schemas import (
    AdminLoginRequest, 
    AdminLoginResponse, 
    AdminStatsResponse, 
    AdminUserResponse
)
from .dependencies import get_current_admin
from app.auth.utils import create_access_token

router = APIRouter(prefix="/admin", tags=["admin"])

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    login_data: AdminLoginRequest, 
    db: AsyncSession = Depends(get_db)
):
    service = AdminService(db)
    user = await service.authenticate_admin(login_data)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.name.value}
    )
    # Reusing create_access_token for simplicity, though refresh token could be different
    refresh_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.name.value}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.get("/stats", response_model=AdminStatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_admin_stats()

@router.get("/users", response_model=List[AdminUserResponse])
async def get_users(
    db: AsyncSession = Depends(get_db),
    admin = Depends(get_current_admin)
):
    service = AdminService(db)
    return await service.get_all_users()

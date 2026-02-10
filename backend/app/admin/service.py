from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from sqlalchemy.orm import joinedload
from datetime import timedelta

from app.auth.models import User, Role, UserRole
from app.auth.utils import verify_password, create_access_token
from .schemas import AdminLoginRequest, AdminUserResponse, AdminStatsResponse

class AdminService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def authenticate_admin(self, login_data: AdminLoginRequest):
        result = await self.db.execute(
            select(User).options(joinedload(User.role)).filter(User.email == login_data.email)
        )
        user = result.scalars().first()

        if not user or not verify_password(login_data.password, user.hashed_password):
            return None
        
        if not user.role or user.role.name != UserRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have the permission"
            )
        
        return user

    async def get_admin_stats(self) -> AdminStatsResponse:
        result = await self.db.execute(select(func.count(User.id)))
        total_users = result.scalar()
        return AdminStatsResponse(total_users=total_users)

    async def get_all_users(self) -> list[AdminUserResponse]:
        result = await self.db.execute(
            select(User).options(joinedload(User.role)).order_by(User.id.desc())
        )
        users = result.scalars().all()
        
        return [
            AdminUserResponse(
                id=user.id,
                email=user.email,
                username=user.username,
                is_active=user.is_active,
                role_name=user.role.name.value if user.role else "N/A"
            )
            for user in users
        ]

from fastapi import HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from .models import User
from .schemas import UserCreate
from .utils import get_password_hash, verify_password


class AuthService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_user_by_email(self, email: str):
        try:
            result = await self.db.execute(select(User).filter(User.email == email))
            return result.scalars().first()
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while fetching user by email: {str(e)}",
            )

    async def get_user_by_username(self, username: str):
        try:
            result = await self.db.execute(
                select(User).filter(User.username == username)
            )
            return result.scalars().first()
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while fetching user by username: {str(e)}",
            )

    async def get_user_by_id(self, user_id: int):
        try:
            result = await self.db.execute(select(User).filter(User.id == user_id))
            return result.scalars().first()
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while fetching user by id: {str(e)}",
            )

    async def get_user_by_telegram_chat_id(self, chat_id: str):
        try:
            result = await self.db.execute(
                select(User).filter(User.telegram_chat_id == chat_id)
            )
            return result.scalars().first()
        except SQLAlchemyError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error while fetching user by telegram chat id: {str(e)}",
            )

    async def create_user(self, user_data: UserCreate):
        try:
            if await self.get_user_by_email(user_data.email):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
            if await self.get_user_by_username(user_data.username):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken",
                )
            hashed_password = get_password_hash(user_data.password)
            db_user = User(
                email=user_data.email,
                username=user_data.username,
                hashed_password=hashed_password,
            )
            self.db.add(db_user)
            await self.db.commit()
            await self.db.refresh(db_user)
            return db_user

        except HTTPException as e:
            raise e
        except SQLAlchemyError as e:
            await self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Database error during user creation: {str(e)}",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An unexpected error occurred during user creation: {str(e)}",
            )

    async def authenticate_user(self, email: str, password: str):
        try:
            user = await self.get_user_by_email(email)
            if not user or not verify_password(password, user.hashed_password):
                return None
            return user
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred during authentication: {str(e)}",
            )

    async def verify_refresh_token(self, token: str):
        try:
            from .utils import decode_token

            payload = decode_token(token)
            if not payload:
                return None

            user_id = payload.get("sub")
            if not user_id:
                return None

            return await self.get_user_by_id(int(user_id))
        except HTTPException as e:
            raise e
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"An error occurred during refresh token verification: {str(e)}",
            )
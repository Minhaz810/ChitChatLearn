from datetime import datetime

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings.models import SchedulerSettings
from app.settings.schemas import SchedulerSettingsSchema


class SettingsService:
    @staticmethod
    async def get_scheduler_settings(session: AsyncSession, user_id: int) -> SchedulerSettings:
        result = await session.execute(
            select(SchedulerSettings).where(SchedulerSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            settings = SchedulerSettings(user_id=user_id)
            session.add(settings)
            await session.commit()
            await session.refresh(settings)

        return settings

    @staticmethod
    async def update_scheduler_settings(
        session: AsyncSession, user_id: int, data: SchedulerSettingsSchema
    ) -> SchedulerSettings:
        try:
            datetime.strptime(data.start_time, "%H:%M")
            datetime.strptime(data.end_time, "%H:%M")
        except ValueError:
            raise HTTPException(
                status_code=400, detail="Invalid time format. Use HH:MM"
            )

        if data.interval_minutes < 20:
            raise HTTPException(
                status_code=400, detail="Interval must be at least 20 minutes"
            )

        result = await session.execute(
            select(SchedulerSettings).where(SchedulerSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            settings = SchedulerSettings(user_id=user_id)
            session.add(settings)

        settings.start_time = data.start_time
        settings.end_time = data.end_time
        settings.interval_minutes = data.interval_minutes
        settings.is_paused = data.is_paused

        await session.commit()
        await session.refresh(settings)

        return settings

    @staticmethod
    async def update_pause_status(
        session: AsyncSession, user_id: int, is_paused: bool
    ) -> dict:
        result = await session.execute(
            select(SchedulerSettings).where(SchedulerSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            settings = SchedulerSettings(user_id=user_id, is_paused=is_paused)
            session.add(settings)
        else:
            settings.is_paused = is_paused

        await session.commit()
        return {"status": "paused" if is_paused else "resumed"}


def get_settings_service() -> SettingsService:
    return SettingsService()
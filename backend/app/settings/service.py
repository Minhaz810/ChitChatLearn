from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.settings.models import SchedulerSettings
from app.settings.schemas import SchedulerSettingsSchema


class SettingsService:
    @staticmethod
    def convert_local_time_to_utc(local_time_str: str, timezone: str) -> time:
        hour, minute = map(int, local_time_str.split(":"))
        local_dt = datetime.now(ZoneInfo(timezone)).replace(
            hour=hour, minute=minute, second=0, microsecond=0
        )
        utc_dt = local_dt.astimezone(ZoneInfo("UTC"))
        return utc_dt.time()

    @staticmethod
    def convert_utc_time_to_local(utc_time: time, timezone: str) -> str:
        today = datetime.now(ZoneInfo("UTC")).date()
        utc_dt = datetime.combine(today, utc_time, tzinfo=ZoneInfo("UTC"))
        local_dt = utc_dt.astimezone(ZoneInfo(timezone))
        return local_dt.strftime("%H:%M")

    @staticmethod
    def calculate_next_execution_time(
        start_time_utc: time,
        end_time_utc: time,
        interval_minutes: int
    ) -> datetime:
        now_utc = datetime.now(ZoneInfo("UTC"))
        
        today_start = datetime.combine(now_utc.date(), start_time_utc, tzinfo=ZoneInfo("UTC"))
        today_end = datetime.combine(now_utc.date(), end_time_utc, tzinfo=ZoneInfo("UTC"))
        
        if end_time_utc < start_time_utc:
            if now_utc.time() >= start_time_utc:
                today_end = today_end + timedelta(days=1)
            else:
                today_start = today_start - timedelta(days=1)
        
        if today_start <= now_utc <= today_end:
            next_time = now_utc + timedelta(minutes=interval_minutes)
            
            if next_time > today_end:
                next_time = today_start + timedelta(days=1)
        else:
            if now_utc < today_start:
                next_time = today_start
            else:
                next_time = today_start + timedelta(days=1)
        
        return next_time.replace(tzinfo=None)

    @staticmethod
    async def get_scheduler_settings(session: AsyncSession, user_id: int) -> dict:
        result = await session.execute(
            select(SchedulerSettings).where(SchedulerSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            settings = SchedulerSettings(
                user_id=user_id,
                start_time_utc=time(2, 0),
                end_time_utc=time(16, 0),
                interval_minutes=20,
                timezone="UTC"
            )
            settings.next_execution_time = SettingsService.calculate_next_execution_time(
                settings.start_time_utc,
                settings.end_time_utc,
                20  # Explicitly use 20 for new settings
            )
            session.add(settings)
            await session.commit()
            await session.refresh(settings)

        return {
            "id": settings.id,
            "start_time": SettingsService.convert_utc_time_to_local(
                settings.start_time_utc, settings.timezone
            ),
            "end_time": SettingsService.convert_utc_time_to_local(
                settings.end_time_utc, settings.timezone
            ),
            "interval_minutes": settings.interval_minutes,
            "is_paused": settings.is_paused,
            "timezone": settings.timezone,
            "updated_at": settings.updated_at
        }

    @staticmethod
    async def update_scheduler_settings(
        session: AsyncSession, user_id: int, data: SchedulerSettingsSchema
    ) -> dict:
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

        start_time_utc = SettingsService.convert_local_time_to_utc(
            data.start_time, data.timezone
        )
        end_time_utc = SettingsService.convert_local_time_to_utc(
            data.end_time, data.timezone
        )

        settings.start_time_utc = start_time_utc
        settings.end_time_utc = end_time_utc
        settings.interval_minutes = data.interval_minutes
        settings.timezone = data.timezone
        settings.is_paused = data.is_paused
        
        settings.next_execution_time = SettingsService.calculate_next_execution_time(
            start_time_utc,
            end_time_utc,
            data.interval_minutes
        )

        await session.commit()
        await session.refresh(settings)

        return {
            "id": settings.id,
            "start_time": data.start_time,
            "end_time": data.end_time,
            "interval_minutes": settings.interval_minutes,
            "is_paused": settings.is_paused,
            "timezone": settings.timezone,
            "updated_at": settings.updated_at
        }

    @staticmethod
    async def update_pause_status(
        session: AsyncSession, user_id: int, is_paused: bool
    ) -> dict:
        result = await session.execute(
            select(SchedulerSettings).where(SchedulerSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if not settings:
            settings = SchedulerSettings(
                user_id=user_id,
                is_paused=is_paused,
                start_time_utc=time(2, 0),
                end_time_utc=time(16, 0),
                interval_minutes=20
            )
            settings.next_execution_time = SettingsService.calculate_next_execution_time(
                settings.start_time_utc,
                settings.end_time_utc,
                20  # Explicitly use 20 for new settings
            )
            session.add(settings)
        else:
            settings.is_paused = is_paused
            
            if not is_paused:
                settings.next_execution_time = SettingsService.calculate_next_execution_time(
                    settings.start_time_utc,
                    settings.end_time_utc,
                    settings.interval_minutes
                )

        await session.commit()
        return {"status": "paused" if is_paused else "resumed"}

    @staticmethod
    async def get_due_scheduler_settings(session: AsyncSession) -> list[SchedulerSettings]:
        now_utc = datetime.now(ZoneInfo("UTC")).replace(tzinfo=None)
        result = await session.execute(
            select(SchedulerSettings).where(
                SchedulerSettings.next_execution_time <= now_utc,
                SchedulerSettings.is_paused == False
            )
        )
        return result.scalars().all()
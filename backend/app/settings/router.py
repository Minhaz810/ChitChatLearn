from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from database import get_db

from .models import SchedulerSettings
from .schemas import SchedulerSettingsResponse, SchedulerSettingsSchema

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/scheduler", response_model=SchedulerSettingsResponse)
async def get_scheduler_settings(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SchedulerSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = SchedulerSettings()
        db.add(settings)
        await db.commit()
        await db.refresh(settings)

    return settings


@router.put("/scheduler", response_model=SchedulerSettingsResponse)
async def update_scheduler_settings(
    data: SchedulerSettingsSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        datetime.strptime(data.start_time, "%H:%M")
        datetime.strptime(data.end_time, "%H:%M")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid time format. Use HH:MM")

    result = await db.execute(select(SchedulerSettings).limit(1))
    settings = result.scalar_one_or_none()

    if not settings:
        settings = SchedulerSettings()
        db.add(settings)

    settings.start_time = data.start_time
    settings.end_time = data.end_time
    settings.interval_minutes = data.interval_minutes
    settings.is_paused = data.is_paused

    await db.commit()
    await db.refresh(settings)

    from .service import get_scheduler_service

    scheduler = get_scheduler_service()
    scheduler.update_settings(
        interval_minutes=data.interval_minutes,
        start_time=data.start_time,
        end_time=data.end_time,
        is_paused=data.is_paused,
    )

    return settings


@router.post("/scheduler/pause")
async def pause_scheduler(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SchedulerSettings).limit(1))
    settings = result.scalar_one_or_none()

    if settings:
        settings.is_paused = True
        await db.commit()

    from .service import get_scheduler_service

    get_scheduler_service().pause()
    return {"status": "paused"}


@router.post("/scheduler/resume")
async def resume_scheduler(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SchedulerSettings).limit(1))
    settings = result.scalar_one_or_none()

    if settings:
        settings.is_paused = False
        await db.commit()

    from services.scheduler_service import get_scheduler_service

    get_scheduler_service().resume()
    return {"status": "resumed"}
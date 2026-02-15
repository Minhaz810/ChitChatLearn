from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.dependencies import get_current_user
from app.auth.models import User
from database import get_db

from .schemas import (
    SchedulerSettingsResponse,
    SchedulerSettingsSchema,
    QuestionModeResponse,
    QuestionModeUpdate,
)
from .service import SettingsService

router = APIRouter(prefix="/settings", tags=["settings"])


@router.get("/question-mode", response_model=QuestionModeResponse)
async def get_question_mode(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return await SettingsService.get_user_question_mode(db, current_user.id)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error fetching question mode: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch question mode")


@router.patch("/question-mode", response_model=QuestionModeResponse)
async def update_question_mode(
    data: QuestionModeUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await SettingsService.update_user_question_mode(
            db, current_user.id, data
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating question mode: {e}")
        raise HTTPException(status_code=500, detail="Failed to update question mode")


@router.get("/scheduler", response_model=SchedulerSettingsResponse)
async def get_scheduler_settings(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return await SettingsService.get_scheduler_settings(db, current_user.id)
    except Exception as e:
        logger.error(f"Error fetching scheduler settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch scheduler settings")


@router.put("/scheduler", response_model=SchedulerSettingsResponse)
async def update_scheduler_settings(
    data: SchedulerSettingsSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return await SettingsService.update_scheduler_settings(
            db, current_user.id, data
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating scheduler settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to update scheduler settings")


@router.post("/scheduler/pause")
async def pause_scheduler(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return await SettingsService.update_pause_status(db, current_user.id, True)
    except Exception as e:
        logger.error(f"Error pausing scheduler: {e}")
        raise HTTPException(status_code=500, detail="Failed to pause scheduler")


@router.post("/scheduler/resume")
async def resume_scheduler(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        return await SettingsService.update_pause_status(db, current_user.id, False)
    except Exception as e:
        logger.error(f"Error resuming scheduler: {e}")
        raise HTTPException(status_code=500, detail="Failed to resume scheduler")
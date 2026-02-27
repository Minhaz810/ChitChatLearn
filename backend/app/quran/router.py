from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List

from app.auth.dependencies import get_current_user
from app.auth.models import User
from database import get_db
from app.quran.models import Quran
from app.quran.schemas import SurahResponse, UserQuranProgressResponse
from app.settings.models import UserQuranSettings
from app.quran.service import QuranService

router = APIRouter(prefix="/quran", tags=["quran"])

@router.get("/surahs", response_model=List[SurahResponse])
async def get_surahs(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        query = select(
            Quran.sura_no,
            Quran.sura_name,
            Quran.sura_type,
            func.count(Quran.id).label("total_verses")
        ).group_by(
            Quran.sura_no,
            Quran.sura_name,
            Quran.sura_type
        ).order_by(Quran.sura_no)
        
        result = await db.execute(query)
        surahs = result.all()
        
        return [
            SurahResponse(
                sura_no=row.sura_no,
                sura_name=row.sura_name,
                sura_type=row.sura_type,
                total_verses=row.total_verses
            )
            for row in surahs
        ]
    except Exception as e:
        logger.error(f"Error fetching surahs: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch surahs")

@router.get("/progress", response_model=UserQuranProgressResponse)
async def get_progress(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        # Get user's current surah setting
        stmt = select(UserQuranSettings).where(UserQuranSettings.user_id == current_user.id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if not settings:
            # Default to first surah if no settings found
            sura_no = 1
            sura_name = "Al-Fatihah"
        else:
            sura_no = settings.sura_no
            # Get surah name
            surah_stmt = select(Quran.sura_name).where(Quran.sura_no == sura_no).limit(1)
            surah_result = await db.execute(surah_stmt)
            sura_name = surah_result.scalar_one_or_none() or f"Surah {sura_no}"

        # Get progress
        progress = await QuranService.get_user_quran_progress(db, current_user.id, sura_no)
        
        # Get total verses
        total_verses = await QuranService.get_max_verse_no(db, sura_no)
        
        return UserQuranProgressResponse(
            sura_no=sura_no,
            sura_name=sura_name,
            last_verse_sent=progress.last_verse_sent,
            total_verses=total_verses
        )
    except Exception as e:
        logger.error(f"Error fetching Quran progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch Quran progress")

@router.post("/reset")
async def reset_progress(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    try:
        # Get user's current surah setting
        stmt = select(UserQuranSettings).where(UserQuranSettings.user_id == current_user.id)
        result = await db.execute(stmt)
        settings = result.scalar_one_or_none()
        
        if not settings:
            raise HTTPException(status_code=400, detail="No Quran settings found for user")
            
        await QuranService.update_user_quran_progress(db, current_user.id, settings.sura_no, 0)
        return {"status": "success", "message": "Progress reset successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error resetting Quran progress: {e}")
        raise HTTPException(status_code=500, detail="Failed to reset Quran progress")

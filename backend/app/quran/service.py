from typing import List, Optional
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.quran.models import Quran
from app.settings.models import UserQuranProgress

class QuranService:
    @staticmethod
    async def get_user_quran_progress(session: AsyncSession, user_id: int, sura_no: int) -> UserQuranProgress:
        result = await session.execute(
            select(UserQuranProgress)
            .where(UserQuranProgress.user_id == user_id, UserQuranProgress.sura_no == sura_no)
        )
        progress = result.scalar_one_or_none()
        
        if not progress:
            progress = UserQuranProgress(user_id=user_id, sura_no=sura_no, last_verse_sent=0)
            session.add(progress)
            await session.commit()
            await session.refresh(progress)
            
        return progress

    @staticmethod
    async def update_user_quran_progress(session: AsyncSession, user_id: int, sura_no: int, last_verse_sent: int) -> UserQuranProgress:
        progress = await QuranService.get_user_quran_progress(session, user_id, sura_no)
        progress.last_verse_sent = last_verse_sent
        await session.commit()
        await session.refresh(progress)
        return progress

    @staticmethod
    async def get_next_verses(session: AsyncSession, sura_no: int, last_verse_sent: int, limit: int) -> List[Quran]:
        result = await session.execute(
            select(Quran)
            .where(Quran.sura_no == sura_no, Quran.verse_no > last_verse_sent)
            .order_by(Quran.verse_no.asc())
            .limit(limit)
        )
        return list(result.scalars().all())

    @staticmethod
    async def get_max_verse_no(session: AsyncSession, sura_no: int) -> int:
        result = await session.execute(
            select(func.max(Quran.verse_no)).where(Quran.sura_no == sura_no)
        )
        max_verse = result.scalar_one_or_none()
        return max_verse or 0

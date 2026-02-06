from loguru import logger
from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from .models import GraspLevel, UserProgress, Word
from .schemas import OverallProgressResponse, ProgressResponse




class ProgressService:
    async def get_word_progress(
        self, db: AsyncSession, word_id: int, user_id: int
    ) -> Optional[ProgressResponse]:
        result = await db.execute(
            select(UserProgress)
            .options(selectinload(UserProgress.word))
            .where(UserProgress.word_id == word_id, UserProgress.user_id == user_id)
        )
        progress = result.scalar_one_or_none()

        if not progress:
            word_result = await db.execute(select(Word).where(Word.id == word_id))
            word = word_result.scalar_one_or_none()

            if word:
                return ProgressResponse(
                    word_id=word_id,
                    word=word.word,
                    bengali_translation=word.bengali_translation,
                    english_translation=word.english_translation,
                    correct_count=0,
                    grasp_level=GraspLevel.NEW,
                    last_asked=None,
                )

            return None

        return ProgressResponse(
            word_id=progress.word_id,
            word=progress.word.word,
            bengali_translation=progress.word.bengali_translation,
            english_translation=progress.word.english_translation,
            correct_count=progress.correct_count,
            grasp_level=progress.grasp_level,
            last_asked=progress.last_asked,
        )

    async def get_overall_progress(
        self, db: AsyncSession, user_id: int
    ) -> OverallProgressResponse:
        total_result = await db.execute(select(func.count(Word.id)))
        total_words = total_result.scalar() or 0

        level_counts = {level: 0 for level in GraspLevel}
        progress_result = await db.execute(
            select(UserProgress.grasp_level, func.count(UserProgress.id))
            .where(UserProgress.user_id == user_id)
            .group_by(UserProgress.grasp_level)
        )

        for level, count in progress_result.all():
            level_counts[level] = count

        tracked_words = sum(level_counts.values())
        new_words = total_words - tracked_words + level_counts.get(GraspLevel.NEW, 0)
        mastered = level_counts.get(GraspLevel.MASTERED, 0)
        familiar = level_counts.get(GraspLevel.FAMILIAR, 0)
        learning = level_counts.get(GraspLevel.LEARNING, 0)
        mastery_percentage = (mastered / total_words * 100) if total_words > 0 else 0

        return OverallProgressResponse(
            total_words=total_words,
            mastered=mastered,
            familiar=familiar,
            learning=learning,
            new=new_words,
            mastery_percentage=mastery_percentage,
        )

    async def get_next_word_to_quiz(
        self, db: AsyncSession, user_id: int
    ) -> Optional[Word]:
        # First, find words that the user hasn't started learning yet
        subquery = (
            select(UserProgress.word_id)
            .where(UserProgress.user_id == user_id)
            .scalar_subquery()
        )
        result = await db.execute(
            select(Word).where(Word.id.notin_(subquery)).limit(1)
        )
        word = result.scalar_one_or_none()
        if word:
            return word

        # If all words have progress, prioritize by grasp level
        grasp_order = [
            GraspLevel.NEW,
            GraspLevel.LEARNING,
            GraspLevel.FAMILIAR,
            GraspLevel.MASTERED,
        ]

        for level in grasp_order:
            result = await db.execute(
                select(Word)
                .join(UserProgress)
                .where(
                    UserProgress.user_id == user_id,
                    UserProgress.grasp_level == level,
                )
                .order_by(UserProgress.last_asked.asc().nullsfirst())
                .limit(1)
            )
            word = result.scalar_one_or_none()
            if word:
                return word

        result = await db.execute(select(Word).limit(1))
        return result.scalar_one_or_none()

    async def get_stats_dict(self, db: AsyncSession, user_id: int) -> dict:
        stats = await self.get_overall_progress(db, user_id)
        return {
            "total_words": stats.total_words,
            "mastered": stats.mastered,
            "familiar": stats.familiar,
            "learning": stats.learning,
            "new": stats.new,
            "mastery_percentage": stats.mastery_percentage,
        }


_progress_service = None


def get_progress_service() -> ProgressService:
    global _progress_service
    if _progress_service is None:
        _progress_service = ProgressService()
    return _progress_service
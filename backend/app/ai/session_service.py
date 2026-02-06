from loguru import logger
from datetime import datetime
from typing import Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.vocabulay_assistant.models import GraspLevel, UserProgress, Word
from database import AsyncSessionLocal

from .models import QuestionHistory, QuestionType, QuizSession, SessionState




class SessionService:
    async def get_active_session(
        self, db: AsyncSession, user_id: int
    ) -> Optional[QuizSession]:
        result = await db.execute(
            select(QuizSession)
            .options(selectinload(QuizSession.word))
            .where(QuizSession.is_active, QuizSession.user_id == user_id)
            .order_by(QuizSession.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def create_session(
        self, db: AsyncSession, word_id: int, user_id: int
    ) -> QuizSession:
        # Deactivate any existing active sessions for this user
        result = await db.execute(
            select(QuizSession).where(
                QuizSession.is_active, QuizSession.user_id == user_id
            )
        )
        for session in result.scalars().all():
            session.is_active = False

        session = QuizSession(
            user_id=user_id,
            word_id=word_id,
            current_state=SessionState.MEANING,
            waiting_for_response=True,
            is_active=True,
        )
        db.add(session)
        await db.flush()
        await db.refresh(session)
        return session

    async def get_session_with_word(
        self, db: AsyncSession, session_id: int, user_id: int
    ) -> Optional[Tuple[QuizSession, Word]]:
        result = await db.execute(
            select(QuizSession)
            .options(selectinload(QuizSession.word))
            .where(QuizSession.id == session_id, QuizSession.user_id == user_id)
        )
        session = result.scalar_one_or_none()
        if session:
            return session, session.word
        return None

    def get_question_type_for_state(self, state: SessionState) -> QuestionType:
        mapping = {
            SessionState.MEANING: QuestionType.MEANING,
            SessionState.EXAMPLE: QuestionType.EXAMPLE,
            SessionState.SYNONYM: QuestionType.SYNONYM,
        }
        return mapping.get(state)

    async def send_scheduled_question(self, user_id: int):
        """Send a scheduled question for a specific user."""
        async with AsyncSessionLocal() as db:
            try:
                from app.ai.question_service import get_question_service
                from app.telegram.service import get_telegram_service
                from app.vocabulay_assistant.service import get_progress_service

                progress_service = get_progress_service()
                question_service = get_question_service()
                telegram_service = get_telegram_service()

                active_session = await self.get_active_session(db, user_id)
                if active_session and active_session.waiting_for_response:
                    logger.info("Skipping scheduled question - waiting for response")
                    return

                word = await progress_service.get_next_word_to_quiz(db, user_id)
                if not word:
                    logger.info("No words available for quiz")
                    return

                session = await self.create_session(db, word.id, user_id)
                await db.commit()

                question_type = self.get_question_type_for_state(session.current_state)
                question_text = question_service.get_question_for_type(
                    word.word, question_type
                )

                await telegram_service.send_question(
                    word=word.word,
                    question_type=question_type.value,
                    question_text=question_text,
                )
                logger.info(f"Sent question for word: {word.word}")

            except Exception as e:
                logger.error(f"Error sending scheduled question: {e}")
                await db.rollback()

    async def process_answer(
        self,
        db: AsyncSession,
        session: QuizSession,
        score: int,
        feedback: str,
        user_answer: str,
    ) -> Tuple[SessionState, bool]:
        current_state = session.current_state
        is_correct = score >= 90
        question_type = self.get_question_type_for_state(current_state)

        history = QuestionHistory(
            user_id=session.user_id,
            word_id=session.word_id,
            question_type=question_type,
            question_text=f"Question for {current_state.value}",
            user_answer=user_answer,
            is_correct=is_correct,
            score=score,
            feedback=feedback,
        )
        db.add(history)

        if current_state == SessionState.MEANING:
            session.meaning_score = score
            if score >= 90:
                session.current_state = SessionState.EXAMPLE
                session.waiting_for_response = True
                return SessionState.EXAMPLE, False
            else:
                session.current_state = SessionState.COMPLETED
                session.is_active = False
                session.completed_at = datetime.utcnow()
                session.total_score = 0
                return SessionState.COMPLETED, True

        elif current_state == SessionState.EXAMPLE:
            session.example_score = score
            session.current_state = SessionState.SYNONYM
            session.waiting_for_response = True
            return SessionState.SYNONYM, False

        elif current_state == SessionState.SYNONYM:
            session.synonym_score = score
            session.current_state = SessionState.COMPLETED
            session.is_active = False
            session.completed_at = datetime.utcnow()
            session.total_score = (
                (session.meaning_score or 0)
                + (session.example_score or 0)
                + (session.synonym_score or 0)
            )
            await self._update_progress(db, session)
            return SessionState.COMPLETED, True

        return current_state, False

    async def _update_progress(self, db: AsyncSession, session: QuizSession):
        result = await db.execute(
            select(UserProgress).where(
                UserProgress.word_id == session.word_id,
                UserProgress.user_id == session.user_id,
            )
        )
        progress = result.scalar_one_or_none()

        if not progress:
            progress = UserProgress(user_id=session.user_id, word_id=session.word_id)
            db.add(progress)

        progress.last_asked = datetime.utcnow()

        all_correct = (
            (session.meaning_score or 0) >= 90
            and (session.example_score or 0) >= 90
            and (session.synonym_score or 0) >= 90
        )

        if all_correct:
            progress.correct_count += 1
            if progress.correct_count >= 3:
                progress.grasp_level = GraspLevel.MASTERED
            elif progress.correct_count >= 2:
                progress.grasp_level = GraspLevel.FAMILIAR
            else:
                progress.grasp_level = GraspLevel.LEARNING
        else:
            progress.correct_count = 0
            progress.grasp_level = GraspLevel.NEW


_session_service = None


def get_session_service() -> SessionService:
    global _session_service
    if _session_service is None:
        _session_service = SessionService()
    return _session_service
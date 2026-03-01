from loguru import logger
from datetime import datetime
from typing import Optional, Tuple

import random
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.vocabulay_assistant.models import GraspLevel, UserProgress, Word
from database import AsyncSessionLocal

from .models import QuestionHistory, QuestionType, QuizSession, SessionState
from .chat_service import ChatSessionService




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
        return result.scalars().first()

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
        session = result.scalars().first()
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

    async def send_scheduled_question(self, db: AsyncSession, user_id: int, chat_id: int = None):
        """Send a scheduled event based on active knowledge base."""
        from app.settings.service import SettingsService
        from app.settings.models import KnowledgeBaseEnum
        
        kb_setting = await SettingsService.get_user_knowledge_base(db, user_id)
        if kb_setting.active_module == KnowledgeBaseEnum.QURAN:
            await self.send_scheduled_quran_verses(db, user_id, chat_id)
        else:
            await self.send_scheduled_vocabulary(db, user_id, chat_id)

    async def send_scheduled_vocabulary(self, db: AsyncSession, user_id: int, chat_id: int = None):
        """Send a scheduled MCQ question for the vocabulary module."""
        from app.telegram.service import get_telegram_service
        
        telegram_service = get_telegram_service()

        try:
            # 1. Pick 4 random words
            result = await db.execute(
                select(Word).order_by(func.random()).limit(4)
            )
            words = result.scalars().all()

            if not words:
                logger.warning(f"No words found to create a scheduled question for user {user_id}")
                return

        
            target_word = words[0]
            
            from app.settings.service import SettingsService
            from app.settings.models import QuestionModeEnum
            import random

            mode_obj = await SettingsService.get_user_question_mode(db, user_id)
            question_mode = mode_obj.mode
            logger.info(f"User {user_id} question mode: {question_mode} (type: {type(question_mode)})")

            if str(question_mode) == str(QuestionModeEnum.PLAIN_TEXT) or question_mode == QuestionModeEnum.PLAIN_TEXT:
                # Start a Chat Session (Conversational)
                from app.ai.chat_service import ChatSessionService
                chat_service = ChatSessionService()
                
                # Deactivate any active Quiz Sessions
                existing_quiz = await self.get_active_session(db, user_id)
                if existing_quiz:
                    existing_quiz.is_active = False
                
                await chat_service.create_session(db, user_id, target_word.id)
                
                message = (
                    f"💬 <b>Chat Mode</b>\n\n"
                    f"Let's chat about the word '<b>{target_word.word}</b>'.\n"
                    f"It means: {target_word.bengali_translation} ({target_word.english_translation or 'N/A'})\n\n"
                    f"How would you use this word today?"
                )
                await telegram_service.send_message(chat_id=chat_id, text=message)
                return

            # Start a Quiz Session
            new_session = QuizSession(
                user_id=user_id,
                word_id=target_word.id,
                current_state=SessionState.MEANING,
                is_active=True,
                waiting_for_response=True,
                attempt=0
            )
            
            if str(question_mode) == str(QuestionModeEnum.MCQ) or question_mode == QuestionModeEnum.MCQ:
                # Generate 4 options: 1 correct (Bengali/English), 3 decoys
                # Let's use Bengali translations as options
                options = [w.bengali_translation for w in words]
                random.shuffle(options)
                new_session.mcq_options = options
                
                options_text = "\n".join([f"{chr(65+i)}. {opt}" for i, opt in enumerate(options)])
                message = (
                    f"✨ <b>Vocabulary Quiz (MCQ)</b>\n\n"
                    f"What is the meaning of '<b>{target_word.word}</b>'?\n\n"
                    f"{options_text}\n\n"
                    f"<i>Reply with the letter (A, B, C, D) or the full answer.</i>"
                )
            else:
                message = (
                    f"✨ <b>Vocabulary Quiz</b>\n\n"
                    f"Time to learn a new word! Can you tell the meaning of '<b>{target_word.word}</b>'?"
                )

            db.add(new_session)
            await db.commit()

            await telegram_service.send_message(chat_id=chat_id, text=message)
            logger.info(f"Sent scheduled vocabulary word '{target_word.word}' to chat_id: {chat_id}")
        except Exception as e:
            logger.error(f"Error sending scheduled MCQ question: {e}")

    async def send_scheduled_quran_verses(self, db: AsyncSession, user_id: int, chat_id: int = None):
        """Send a scheduled batch of Quranic verses for a specific user based on progress."""
        from app.telegram.service import get_telegram_service
        from app.settings.service import SettingsService
        from app.quran.service import QuranService
        telegram_service = get_telegram_service()

        try:
            quran_settings = await SettingsService.get_user_quran_settings(db, user_id)
            sura_no = quran_settings.sura_no
            interval = quran_settings.verse_interval

            progress = await QuranService.get_user_quran_progress(db, user_id, sura_no)
            last_verse_sent = progress.last_verse_sent

            verses = await QuranService.get_next_verses(db, sura_no, last_verse_sent, interval)
            max_verse_no = await QuranService.get_max_verse_no(db, sura_no)

            if not verses:
                logger.debug(f"User {user_id} has completed sura_no {sura_no}. Silence active.")
                return

            first_verse = verses[0]
            sura_name = first_verse.sura_name
            sura_type = first_verse.sura_type
            is_completed = verses[-1].verse_no == max_verse_no

            header = [
                "📖 <b>Quran Reading Time</b>",
                "━━━━━━━━━━━━━━━━━━━━",
                f"🕌 <b>{sura_name}</b>  |  <i>{sura_type}</i>",
                "━━━━━━━━━━━━━━━━━━━━",
            ]

            chunks = []
            current_message_lines = header.copy()
            
            MAX_LENGTH = 4000

            for i, v in enumerate(verses):
                verse_block = [
                    f"\n<b>({v.verse_no})</b>  {v.verse}",
                    f"<i>{v.bengali_translation}</i>"
                ]
                
                # Check if adding this block exceeds the limit
                block_text = "\n".join(verse_block)
                current_text = "\n".join(current_message_lines)
                
                if len(current_text) + len(block_text) + 1 > MAX_LENGTH:
                    # Finalize current chunk
                    current_message_lines.append("\n━━━━━━━━━━━━━━━━━━━━")
                    current_message_lines.append("<i>(Continued in next message...)</i>")
                    chunks.append("\n".join(current_message_lines))
                    
                    # Start new chunk with header
                    current_message_lines = header.copy()
                    current_message_lines.insert(1, "<i>(Continued)</i>")
                
                current_message_lines.extend(verse_block)

            # Add footer to the last chunk
            current_message_lines.append("\n━━━━━━━━━━━━━━━━━━━━")
            if is_completed:
                current_message_lines.append("🎉 <b>Alhamdulillah!</b> You have completed this Surah.")
            else:
                current_message_lines.append(f"📊 Progress: Surah {sura_no} | Verses {verses[0].verse_no}–{verses[-1].verse_no}")
            
            chunks.append("\n".join(current_message_lines))

            # Send all chunks
            for i, message in enumerate(chunks):
                await telegram_service.send_message(chat_id=chat_id, text=message)
                if len(chunks) > 1:
                    logger.info(f"Sent chunk {i+1}/{len(chunks)} for Surah {sura_no} to chat_id: {chat_id}")

            logger.info(f"Successfully sent {len(verses)} verses for Surah {sura_no} (in {len(chunks)} message(s)) to chat_id: {chat_id}")

            await QuranService.update_user_quran_progress(db, user_id, sura_no, verses[-1].verse_no)
        except Exception as e:
            logger.error(f"Error sending scheduled Quran verses: {e}")

    async def process_tutor_answer(
        self,
        db: AsyncSession,
        session: QuizSession,
        user_answer: str,
    ) -> Tuple[str, bool]:
        """Process an answer using the AI tutor logic."""
        from .service import get_ai_service
        ai_service = get_ai_service()
        
        word = session.word
        word_data = {
            "word": word.word,
            "bengali": word.bengali_translation,
            "english": word.english_translation or "N/A",
            "synonyms": word.synonyms or "N/A",
            "example": word.example or "N/A"
        }
        
        evaluation = await ai_service.evaluate_quiz_answer(
            word_data=word_data,
            session_state=session.current_state.value,
            attempt=session.attempt,
            user_answer=user_answer,
            mcq_options=getattr(session, "mcq_options", [])
        )
        
        reply_message = evaluation.get("reply_message", "Evaluation failed.")
        eval_result = evaluation.get("evaluation_result", "incorrect")
        next_state_str = evaluation.get("next_state", "meaning")
        phase_score = evaluation.get("phase_score", 0)
        grasp_level_str = evaluation.get("grasp_level")
        
        # Log history
        history = QuestionHistory(
            user_id=session.user_id,
            word_id=session.word_id,
            question_type=self.get_question_type_for_state(session.current_state),
            question_text=f"Tutor phase: {session.current_state.value}",
            user_answer=user_answer,
            is_correct=(eval_result == "correct"),
            score=phase_score,
            feedback=reply_message,
        )
        db.add(history)
        
        # Update session scores
        if session.current_state == SessionState.MEANING:
            session.meaning_score = phase_score
        elif session.current_state == SessionState.SYNONYM:
            session.synonym_score = phase_score
        elif session.current_state == SessionState.EXAMPLE:
            session.example_score = phase_score

        # Handle state transitions
        if next_state_str == "completed":
            session.current_state = SessionState.COMPLETED
            session.is_active = False
            session.completed_at = datetime.utcnow()
            session.total_score = (
                (session.meaning_score or 0)
                + (session.example_score or 0)
                + (session.synonym_score or 0)
            )
            await self._update_progress(db, session, grasp_level_str)
            return reply_message, True
        else:
            # Update state and attempt
            new_state = SessionState(next_state_str)
            if new_state != session.current_state:
                session.current_state = new_state
                session.attempt = 0
            else:
                session.attempt += 1
            
            return reply_message, False

    async def _update_progress(self, db: AsyncSession, session: QuizSession, tutor_grasp_level: str = None):
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

        if tutor_grasp_level:
            try:
                progress.grasp_level = GraspLevel(tutor_grasp_level)
            except ValueError:
                pass
        else:
            # Fallback legacy logic
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
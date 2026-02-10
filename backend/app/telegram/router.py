import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.question_service import get_question_service
from app.ai.schemas import AnswerSubmit, QuestionResponse, ValidationResponse
from app.ai.session_service import get_session_service
from app.ai.validation_service import get_validation_service
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.service import AuthService
from app.auth.utils import encrypt_data, decrypt_data
from database import get_db

from .schemas import ConnectionTokenResponse
from .service import get_telegram_service
from .models import TelegramUser
router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.get("/token", response_model=ConnectionTokenResponse)
async def get_connection_token(
    current_user: User = Depends(get_current_user)
):
    """Generate a short-lived opaque encrypted token for linking Telegram."""
    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    token_data = {
        "user_id": current_user.id,
        "exp": expires_at
    }
    token = encrypt_data(token_data)
    return {"connection_token": token}


async def get_user_by_chat_id(db: AsyncSession, chat_id: int) -> Optional[User]:
    """Look up user by their Telegram chat ID through the TelegramUser model."""
    result = await db.execute(
        select(User).join(TelegramUser).where(TelegramUser.chat_id == chat_id)
    )
    return result.scalars().first()


@router.post("/webhook")
async def telegram_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        data = await request.json()
        logger.info(f"Received Telegram update: {data}")

        message = data.get("message", {})
        text = message.get("text", "")
        chat_id = message.get("chat", {}).get("id")

        if not text or not chat_id:
            return {"status": "ok"}

        # Extract Telegram username
        from_user = message.get("from", {})
        tg_username = from_user.get("username")

        # Look up user by Telegram chat ID via TelegramUser model
        user = await get_user_by_chat_id(db, chat_id)

        if text.startswith("/"):
            return await handle_command(text, chat_id, tg_username, db, user)

        if not user:
            telegram_service = get_telegram_service()
            await telegram_service.send_message(
                "❌ Your Telegram is not linked to any account. Please link your account first.",
                chat_id=chat_id
            )
            return {"status": "ok", "message": "User not linked"}

        return await handle_answer(text, db, user)

    except Exception as e:
        logger.error(f"Error processing Telegram update: {e}")
        return {"status": "error", "message": str(e)}


async def handle_command(
    text: str, chat_id: int, tg_username: Optional[str], db: AsyncSession, user: Optional[User]
):
    telegram_service = get_telegram_service()

    if text.startswith("/start"):
        # Check for deep linking token
        parts = text.split(" ")
        token = parts[1] if len(parts) > 1 else None

        if token:
            # Decrypt the opaque token
            token_data = decrypt_data(token)
            
            if token_data:
                user_id = token_data.get("user_id")
                exp_str = token_data.get("exp")
                
                # Check expiration
                is_expired = False
                if exp_str:
                    exp_dt = datetime.fromisoformat(exp_str)
                    if datetime.utcnow() > exp_dt:
                        is_expired = True

                if not is_expired and user_id:
                    # Check if this chat_id is already linked to another user
                    existing_tg = await db.execute(
                        select(TelegramUser).where(TelegramUser.chat_id == chat_id)
                    )
                    tg_user = existing_tg.scalars().first()
                    
                    if tg_user:
                        # Update existing link
                        tg_user.user_id = user_id
                        tg_user.telegram_username = tg_username
                        await db.commit()
                        
                        # Refresh user
                        result = await db.execute(select(User).where(User.id == user_id))
                        user = result.scalars().first()
                        
                        if user:
                            await telegram_service.send_message(
                                f"✅ Hello {user.username}! welcome to ChitChatLearn!",
                                chat_id=chat_id
                            )
                    else:
                        # Create new link
                        new_tg_user = TelegramUser(
                            user_id=user_id, 
                            chat_id=chat_id,
                            telegram_username=tg_username
                        )
                        db.add(new_tg_user)
                        await db.commit()
                        
                        # Refresh user
                        result = await db.execute(select(User).where(User.id == user_id))
                        user = result.scalars().first()
                        
                        if user:
                            await telegram_service.send_message(
                                f"✅ Hello {user.username}! welcome to ChitChatLearn!",
                                chat_id=chat_id
                            )
                else:
                    await telegram_service.send_message(
                        "❌ Invalid or expired connection token. Please try again from the app.",
                        chat_id=chat_id
                    )
            else:
                await telegram_service.send_message(
                    "❌ Invalid or expired connection token. Please try again from the app.",
                    chat_id=chat_id
                )

        if user:
            await telegram_service.send_message(
                f"👋 Welcome back, {user.username}!\n\nCommands:\n/start - Show this message\n/stats - View your progress\n/next - Get next question now",
                chat_id=chat_id
            )
        else:
            await telegram_service.send_message(
                f"👋 Welcome to Vocabulary Assistant!\n\nYour Chat ID: <code>{chat_id}</code>\n\n⚠️ Your Telegram is not linked to any account yet.\nPlease link it in your account settings.\n\nCommands:\n/start - Show this message\n/stats - View your progress\n/next - Get next question now",
                chat_id=chat_id
            )
    elif text == "/stats":
        if not user:
            await telegram_service.send_message(
                "❌ Please link your Telegram account first to view your stats.",
                chat_id=chat_id
            )
            return {"status": "ok"}

        from app.vocabulay_assistant.service import get_progress_service

        progress_service = get_progress_service()
        stats = await progress_service.get_stats_dict(db, user.id)
        await telegram_service.send_stats(stats)
    elif text == "/next":
        if not user:
            await telegram_service.send_message(
                "❌ Please link your Telegram account first to get questions.",
                chat_id=chat_id
            )
            return {"status": "ok"}

        session_service = get_session_service()
        await session_service.send_scheduled_question(user.id)

    return {"status": "ok"}


async def handle_answer(text: str, db: AsyncSession, user: User):
    session_service = get_session_service()
    validation_service = get_validation_service()
    question_service = get_question_service()
    telegram_service = get_telegram_service()

    session = await session_service.get_active_session(db, user.id)
    if not session:
        await telegram_service.send_message(
            "❓ No active question. Use /next to get a new question."
        )
        return {"status": "ok", "message": "No active session"}

    if not session.waiting_for_response:
        await telegram_service.send_message(
            "⏳ Processing previous answer. Please wait..."
        )
        return {"status": "ok", "message": "Not waiting for response"}

    word = session.word
    question_type = session_service.get_question_type_for_state(session.current_state)

    score, feedback, is_correct, additional = await validation_service.validate_answer(
        word.word, word.bengali_translation, question_type, text
    )

    await telegram_service.send_feedback(
        score=score,
        is_correct=is_correct,
        feedback=feedback,
        correct_answer=additional if not is_correct else None,
    )

    next_state, completed = await session_service.process_answer(
        db, session, score, feedback, text
    )
    await db.commit()

    if completed:
        await telegram_service.send_session_complete(
            word=word.word,
            total_score=session.total_score or 0,
            mastered=session.total_score and session.total_score >= 270,
        )
    else:
        next_question_type = session_service.get_question_type_for_state(next_state)
        next_question_text = question_service.get_question_for_type(
            word.word, next_question_type
        )
        await telegram_service.send_question(
            word=word.word,
            question_type=next_question_type.value,
            question_text=next_question_text,
        )

    return {"status": "ok"}


@router.post("/answer", response_model=ValidationResponse)
async def submit_answer(
    answer: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_service = get_session_service()
    validation_service = get_validation_service()
    question_service = get_question_service()

    result = await session_service.get_session_with_word(
        db, answer.session_id, current_user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")

    session, word = result
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")
    if not session.waiting_for_response:
        raise HTTPException(status_code=400, detail="Not waiting for response")

    question_type = session_service.get_question_type_for_state(session.current_state)

    score, feedback, is_correct, additional = await validation_service.validate_answer(
        word.word, word.bengali_translation, question_type, answer.answer
    )

    next_state, completed = await session_service.process_answer(
        db, session, score, feedback, answer.answer
    )
    await db.commit()

    response = ValidationResponse(
        score=score,
        is_correct=is_correct,
        feedback=feedback,
        correct_answer=additional if not is_correct else None,
        session_completed=completed,
        total_score=session.total_score if completed else None,
    )

    if not completed:
        next_question_type = session_service.get_question_type_for_state(next_state)
        response.next_question = QuestionResponse(
            session_id=session.id,
            word_id=word.id,
            word=word.word,
            question_type=next_question_type,
            question_text=question_service.get_question_for_type(
                word.word, next_question_type
            ),
        )

    return response
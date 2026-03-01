import secrets
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.question_service import get_question_service
from app.ai.schemas import AnswerSubmit, QuestionResponse, ValidationResponse
from app.auth.dependencies import get_current_user
from app.auth.models import User
from app.auth.service import AuthService
from app.ai.session_service import get_session_service
from app.ai.chat_service import ChatSessionService
from app.auth.utils import encrypt_data, decrypt_data
from database import get_db

from .schemas import ConnectionTokenResponse
from .service import get_telegram_service
from .models import TelegramUser
from loguru import logger

router = APIRouter(prefix="/telegram", tags=["telegram"])


@router.get("/token", response_model=ConnectionTokenResponse)
async def get_connection_token(
    current_user: User = Depends(get_current_user)
):
    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    token_data = {
        "user_id": current_user.id,
        "exp": expires_at
    }
    token = encrypt_data(token_data)
    return {"connection_token": token}


async def get_user_by_chat_id(db: AsyncSession, chat_id: int) -> Optional[User]:
    result = await db.execute(
        select(User).join(TelegramUser).where(TelegramUser.chat_id == chat_id)
    )
    return result.scalars().first()


async def link_user_by_token(
    db: AsyncSession, chat_id: int, tg_username: Optional[str], token: str
) -> bool:
    telegram_service = get_telegram_service()
    try:
        token_data = decrypt_data(token)
        if not token_data:
            return False

        user_id = token_data.get("user_id")
        exp_str = token_data.get("exp")

        if not user_id or not exp_str:
            return False

        exp_dt = datetime.fromisoformat(exp_str)
        if datetime.utcnow() > exp_dt:
            await telegram_service.send_message(
                chat_id=chat_id,
                text="Connection token expired. Please generate a new one from the app."
            )
            return True # Handled the message

        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()

        if not user:
            return False

        await db.execute(
            delete(TelegramUser).where(
                (TelegramUser.user_id == user_id) | (TelegramUser.chat_id == chat_id)
            )
        )
        await db.flush()
        
        new_tg_user = TelegramUser(
            user_id=user_id,
            chat_id=chat_id,
            telegram_username=tg_username
        )
        db.add(new_tg_user)
        
        # Also update User model for redundancy
        user.telegram_chat_id = str(chat_id)
        
        await db.commit()

        await telegram_service.send_message(
            chat_id=chat_id,
            text=f"✅ Welcome {user.username}! Your account is now linked.\n\n"
            f"You will receive vocabulary questions here."
        )
        return True

    except Exception as e:
        logger.error(f"Error in link_user_by_token: {e}")
        await db.rollback()
        return False


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

        from_user = message.get("from", {})
        tg_username = from_user.get("username")

        user = await get_user_by_chat_id(db, chat_id)

        if text.startswith("/"):
            return await handle_command(text, chat_id, tg_username, db, user)

        if not user:
            # Try to link if it looks like an encrypted token
            linked = await link_user_by_token(db, chat_id, tg_username, text)
            if linked:
                return {"status": "ok", "message": "Account linked"}

            telegram_service = get_telegram_service()
            await telegram_service.send_message(
                chat_id=chat_id,
                text="Your Telegram is not linked to any account.\n\n"
                "To link your account:\n"
                "1. Go to the https://chitchatlearn.com/settings\n"
                "2. Click 'Connect Telegram'\n"
                "3. Copy the token and paste it here."
            )
            return {"status": "ok", "message": "User not linked"}

        return await handle_answer(text, db, user, chat_id)

    except Exception as e:
        logger.error(f"Error processing Telegram update: {e}")
        return {"status": "error", "message": str(e)}


async def handle_command(
    text: str, chat_id: int, tg_username: Optional[str], db: AsyncSession, user: Optional[User]
):
    telegram_service = get_telegram_service()
    if text.startswith("/start"):
        parts = text.split(" ")
        token = parts[1] if len(parts) > 1 else None

        if token:
            linked = await link_user_by_token(db, chat_id, tg_username, token)
            if linked:
                return {"status": "ok"}

        if user:
            await telegram_service.send_message(
                chat_id=chat_id,
                text=f"Welcome back, {user.username}!\n\nCommands:\n/start - Show this message\n/stats - View your progress\n/next - Get next question"
            )
        else:
            await telegram_service.send_message(
                chat_id=chat_id,
                text="Welcome to ChitChatLearn!\n\n"
                "Your Telegram is not linked yet.\n\n"
                "To link your account:\n"
                "1. Go to the https://chitchatlearn.com/settings, copy your token, and paste it here.\n\n"
            )
            
    elif text == "/stats":
        if not user:
            await telegram_service.send_message(
                chat_id=chat_id,
                text="Please link your Telegram account first to view your stats."
            )
            return {"status": "ok"}

        from app.vocabulay_assistant.service import get_progress_service

        progress_service = get_progress_service()
        stats = await progress_service.get_stats_dict(db, user.id)
        await telegram_service.send_stats(chat_id=chat_id, stats=stats)
        
    elif text == "/next":
        if not user:
            await telegram_service.send_message(
                chat_id=chat_id,
                text="Please link your Telegram account first to get questions."
            )
            return {"status": "ok"}

        session_service = get_session_service()
        await session_service.send_scheduled_question(db, user.id, chat_id)

    return {"status": "ok"}


async def handle_answer(text: str, db: AsyncSession, user: User, chat_id: int):
    session_service = get_session_service()
    telegram_service = get_telegram_service()
    chat_service = ChatSessionService()

    # Check for active ChatSession first (Conversational AI)
    active_chat = await chat_service.get_active_session(db, user.id)
    if active_chat:
        from app.ai.service import get_ai_service
        ai_service = get_ai_service()
        
        # Get response from Gemini
        response = await ai_service.chat_with_history(
            vocabulary=active_chat.word.word,
            history=active_chat.messages,
            user_message=text
        )
        
        # Update history in DB
        await chat_service.add_message(db, active_chat, "user", text)
        await chat_service.add_message(db, active_chat, "assistant", response)
        
        # Reply to user
        await telegram_service.send_message(chat_id=chat_id, text=response)
        return {"status": "ok"}

    # Fallback to QuizSession (Structured Tutor)
    session = await session_service.get_active_session(db, user.id)
    if not session:
        await telegram_service.send_message(
            chat_id=chat_id,
            text="❓ No active question. Use /next to get a new question."
        )
        return {"status": "ok", "message": "No active session"}

    # Use the new AI tutor system
    reply_message, completed = await session_service.process_tutor_answer(db, session, text)
    await db.commit()

    await telegram_service.send_message(chat_id=chat_id, text=reply_message)

    if completed:
        await telegram_service.send_session_complete(
            chat_id=chat_id,
            word=session.word.word,
            total_score=session.total_score or 0,
            mastered=(session.total_score or 0) >= 270,
        )

    return {"status": "ok"}


@router.post("/answer", response_model=ValidationResponse)
async def submit_answer(
    answer: AnswerSubmit,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    session_service = get_session_service()

    result = await session_service.get_session_with_word(
        db, answer.session_id, current_user.id
    )
    if not result:
        raise HTTPException(status_code=404, detail="Session not found")

    session, word = result
    if not session.is_active:
        raise HTTPException(status_code=400, detail="Session is not active")

    # Use the new AI tutor system
    reply_message, completed = await session_service.process_tutor_answer(db, session, answer.answer)
    await db.commit()

    response = ValidationResponse(
        score=session.total_score or 0, # Note: This is now updated by tutor
        is_correct=True, # AI handled the logic
        feedback=reply_message,
        correct_answer=None,
        session_completed=completed,
        total_score=session.total_score if completed else None,
    )

    if not completed:
        next_state = session.current_state
        next_question_type = session_service.get_question_type_for_state(next_state)
        response.next_question = QuestionResponse(
            session_id=session.id,
            word_id=word.id,
            word=word.word,
            question_type=next_question_type,
            question_text=reply_message, # Use AI's prompt
        )

    return response
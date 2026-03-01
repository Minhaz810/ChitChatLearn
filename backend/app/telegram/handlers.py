from loguru import logger

from telegram import Update
from telegram.ext import ContextTypes

from app.vocabulay_assistant.service import get_progress_service
from app.ai.session_service import get_session_service
from app.ai.chat_service import ChatSessionService
from app.ai.service import get_ai_service
from app.auth.service import AuthService
from database import AsyncSessionLocal




async def handle_telegram_start(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    await update.message.reply_html(
        f"👋 Welcome to Vocabulary Assistant!\n\nYour Chat ID: <code>{chat_id}</code>\n\nCommands:\n/start - Show this message\n/stats - View your progress\n/next - Get next question now"
    )


async def handle_telegram_stats(update: Update, context: ContextTypes.DEFAULT_TYPE):
    async with AsyncSessionLocal() as db:
        progress_service = get_progress_service()
        stats = await progress_service.get_stats_dict(db)

        message = (
            f"📈 <b>Your Progress</b>\n\n"
            f"Total words: {stats['total_words']}\n"
            f"✅ Mastered: {stats['mastered']}\n"
            f"📖 Familiar: {stats['familiar']}\n"
            f"📝 Learning: {stats['learning']}\n"
            f"🆕 New: {stats['new']}\n\n"
            f"Mastery: {stats['mastery_percentage']:.1f}%"
        )
        await update.message.reply_html(message)


async def handle_telegram_next(update: Update, context: ContextTypes.DEFAULT_TYPE):
    chat_id = update.effective_chat.id
    await update.message.reply_text("📚 Sending next question...")
    
    async with AsyncSessionLocal() as db:
        auth_service = AuthService(db)
        user = await auth_service.get_user_by_telegram_chat_id(str(chat_id))
        if not user:
            await update.message.reply_text("Please use /start to register first.")
            return

        session_service = get_session_service()
        await session_service.send_scheduled_question(db, user.id, chat_id)


async def handle_telegram_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text
    chat_id = update.effective_chat.id

    async with AsyncSessionLocal() as db:
        try:
            auth_service = AuthService(db)
            user = await auth_service.get_user_by_telegram_chat_id(str(chat_id))
            if not user:
                await update.message.reply_text("Please use /start to register first.")
                return

            chat_service = ChatSessionService()
            active_chat = await chat_service.get_active_session(db, user.id)

            if active_chat:
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
                await update.message.reply_html(response)
                return

            # Fallback to old quiz system if no active chat session
            session_service = get_session_service()
            
            session = await session_service.get_active_session(db, user.id)
            if not session:
                await update.message.reply_text(
                    "❓ No active question. Use /next to get a new question."
                )
                return

            # Use the new AI tutor system
            reply_message, completed = await session_service.process_tutor_answer(db, session, text)
            
            await update.message.reply_html(reply_message)
            await db.commit()

            if completed:
                await update.message.reply_html(f"📊 Session Complete for <b>{session.word.word}</b>!")
            else:
                # The tutor's reply_message already contains the next prompt
                pass

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await update.message.reply_text("❌ An error occurred.")
            await db.rollback()
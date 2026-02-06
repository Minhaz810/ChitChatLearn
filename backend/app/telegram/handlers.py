from loguru import logger

from telegram import Update
from telegram.ext import ContextTypes

from app.ai.question_service import get_question_service
from app.ai.session_service import get_session_service
from app.ai.validation_service import get_validation_service
from app.vocabulay_assistant.service import get_progress_service
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
    await update.message.reply_text("📚 Sending next question...")
    session_service = get_session_service()
    await session_service.send_scheduled_question()


async def handle_telegram_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = update.message.text

    async with AsyncSessionLocal() as db:
        try:
            session_service = get_session_service()
            validation_service = get_validation_service()
            question_service = get_question_service()

            session = await session_service.get_active_session(db)
            if not session:
                await update.message.reply_text(
                    "❓ No active question. Use /next to get a new question."
                )
                return

            if not session.waiting_for_response:
                await update.message.reply_text(
                    "⏳ Processing previous answer. Please wait..."
                )
                return

            word = session.word
            question_type = session_service.get_question_type_for_state(
                session.current_state
            )

            score, feedback, is_correct, additional = (
                await validation_service.validate_answer(word, question_type, text)
            )

            if is_correct:
                emoji = "✅"
                status = "Correct!"
            elif score >= 60:
                emoji = "🟡"
                status = "Partially Correct"
            else:
                emoji = "❌"
                status = "Incorrect"

            feedback_message = (
                f"{emoji} <b>{status}</b> (Score: {score}/100)\n\n{feedback}"
            )
            if not is_correct and additional:
                feedback_message += f"\n\n💡 <b>Hint:</b> {additional}"

            await update.message.reply_html(feedback_message)

            next_state, completed = await session_service.process_answer(
                db, session, score, feedback, text
            )
            await db.commit()

            if completed:
                total_score = session.total_score or 0
                mastered = total_score >= 270

                if mastered:
                    complete_msg = f"🎉 <b>Word Mastered!</b>\n\nYou've mastered '<b>{word.word}</b>'!\nTotal score: {total_score}/300"
                else:
                    complete_msg = f"📊 <b>Session Complete</b>\n\nWord: <b>{word.word}</b>\nTotal score: {total_score}/300\n\nKeep practicing! 💪"

                await update.message.reply_html(complete_msg)
            else:
                next_question_type = session_service.get_question_type_for_state(
                    next_state
                )
                next_question_text = question_service.get_question_for_type(
                    word.word, next_question_type
                )
                await update.message.reply_html(
                    f"📚 <b>Vocabulary Quiz</b>\n\n{next_question_text}"
                )

        except Exception as e:
            logger.error(f"Error handling message: {e}")
            await update.message.reply_text("❌ An error occurred. Please try again.")
            await db.rollback()
from loguru import logger

from telegram import Bot
from telegram.ext import Application, CommandHandler, MessageHandler, filters

from config import get_settings


settings = get_settings()


class TelegramService:
    def __init__(self):
        self.bot_token = settings.TELEGRAM_BOT_TOKEN
        self.chat_id = settings.TELEGRAM_CHAT_ID
        self.bot = Bot(token=self.bot_token) if self.bot_token else None
        self.application = None

    async def initialize_bot(self):
        """Initialize the Telegram bot (for webhook mode)."""
        if self.bot_token:
            logger.info("Telegram bot initialized")
        else:
            logger.warning("Telegram bot token not configured")

    async def shutdown_bot(self):
        """Shutdown the Telegram bot."""
        if self.application:
            await self.application.stop()
            await self.application.shutdown()
        logger.info("Telegram bot shut down")

    async def send_message(self, text: str, chat_id: int = None, parse_mode: str = "HTML") -> bool:
        target_chat_id = chat_id or self.chat_id
        if not self.bot or not target_chat_id:
            logger.warning("Telegram target chat not configured, skipping message")
            return False

        try:
            await self.bot.send_message(
                chat_id=target_chat_id, text=text, parse_mode=parse_mode
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send Telegram message to {target_chat_id}: {e}")
            return False

    async def send_question(
        self, word: str, question_type: str, question_text: str, chat_id: int = None
    ) -> bool:
        message = f"📚 <b>Vocabulary Quiz</b>\n\n{question_text}"
        return await self.send_message(message, chat_id=chat_id)

    async def send_feedback(
        self, score: int, is_correct: bool, feedback: str, correct_answer: str = None, chat_id: int = None
    ) -> bool:
        if is_correct:
            emoji = "✅"
            status = "Correct!"
        elif score >= 60:
            emoji = "🟡"
            status = "Partially Correct"
        else:
            emoji = "❌"
            status = "Incorrect"

        message = f"{emoji} <b>{status}</b> (Score: {score}/100)\n\n{feedback}"
        if correct_answer and not is_correct:
            message += f"\n\n💡 <b>Correct answer:</b> {correct_answer}"

        return await self.send_message(message, chat_id=chat_id)

    async def send_session_complete(
        self, word: str, total_score: int, mastered: bool, chat_id: int = None
    ) -> bool:
        if mastered:
            message = f"🎉 <b>Word Mastered!</b>\n\nYou've mastered '<b>{word}</b>'!\nTotal score: {total_score}/300"
        else:
            message = f"📊 <b>Session Complete</b>\n\nWord: <b>{word}</b>\nTotal score: {total_score}/300\n\nKeep practicing! 💪"

        return await self.send_message(message, chat_id=chat_id)

    async def send_stats(self, stats: dict, chat_id: int = None) -> bool:
        message = (
            f"📈 <b>Your Progress</b>\n\n"
            f"Total words: {stats['total_words']}\n"
            f"✅ Mastered: {stats['mastered']}\n"
            f"📖 Familiar: {stats['familiar']}\n"
            f"📝 Learning: {stats['learning']}\n"
            f"🆕 New: {stats['new']}\n\n"
            f"Mastery: {stats['mastery_percentage']:.1f}%"
        )
        return await self.send_message(message, chat_id=chat_id)


_telegram_service = None


def get_telegram_service() -> TelegramService:
    global _telegram_service
    if _telegram_service is None:
        _telegram_service = TelegramService()
    return _telegram_service
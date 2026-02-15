import asyncio
from loguru import logger
from celery_app import celery
from database import AsyncSessionLocal

# Import models to ensure they are registered with SQLAlchemy
from app.auth.models import User
from app.settings.models import SchedulerSettings
from app.telegram.models import TelegramUser 

from app.settings.service import SettingsService
from app.telegram.service import get_telegram_service
from app.ai.session_service import get_session_service

async def process_scheduled_messages():
    """Async function to process due scheduled messages."""
    settings_service = SettingsService()
    telegram_service = get_telegram_service()
    session_service = get_session_service()
    
    async with AsyncSessionLocal() as session:
        try:
            due_settings = await settings_service.get_due_scheduler_settings(session)
            
            if not due_settings:
                return
                
            logger.info(f"Found {len(due_settings)} users with due messages")
            
            for setting in due_settings:
                try:
                    # Get Telegram chat ID
                    tg_user = await telegram_service.get_telegram_user(session, setting.user_id)
                    if not tg_user or not tg_user.chat_id:
                        logger.warning(f"No Telegram linked for user {setting.user_id}, skipping")
                        continue
                        
                    # Send question
                    await session_service.send_scheduled_question(session, setting.user_id, tg_user.chat_id)
                    
                    # Update next execution time
                    setting.next_execution_time = settings_service.calculate_next_execution_time(
                        setting.start_time_utc,
                        setting.end_time_utc,
                        setting.interval_minutes
                    )
                    session.add(setting)
                    
                except Exception as e:
                    logger.error(f"Error processing schedule for user {setting.user_id}: {e}")
                    continue
            
            await session.commit()
            
        except Exception as e:
            logger.error(f"Error in process_scheduled_messages: {e}")
            await session.rollback()

@celery.task(name="app.tasks.send_telegram_message.send_telegram_message")
def send_telegram_message():
    """
    This task runs every 30 seconds via Celery Beat.
    Checks for users due to receive a question and sends it via Telegram.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    loop.run_until_complete(process_scheduled_messages())
    return {"status": "ok"}

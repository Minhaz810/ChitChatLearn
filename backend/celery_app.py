from celery import Celery
from celery.schedules import crontab

from config import get_settings

settings = get_settings()

celery = Celery(
    "chitchatlearn",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
)

import sys
import os
sys.path.append(os.getcwd())

from app.tasks.send_telegram_message import send_telegram_message

celery.conf.beat_schedule = {
    "run-every-30-seconds": {
        "task": "app.tasks.send_telegram_message.send_telegram_message",
        "schedule": 30.0,
    },
}

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

# Autodiscover tasks from the 'tasks' module
celery.autodiscover_tasks(["app"])

# Beat schedule — runs every 30 seconds
celery.conf.beat_schedule = {
    "run-every-30-seconds": {
        "task": "app.tasks.periodic_task",
        "schedule": 30.0,  # every 30 seconds
    },
}

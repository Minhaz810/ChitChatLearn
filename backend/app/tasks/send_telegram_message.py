from celery_app import celery


@celery.task(name="app.tasks.send_telegram_message.send_telegram_message")
def send_telegram_message():
    """
    This task runs every 30 seconds via Celery Beat.
    TODO: Replace with your actual logic.
    """
    print("⏰ Periodic task executed!")
    return {"status": "ok"}

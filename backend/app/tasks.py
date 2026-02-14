from celery_app import celery


@celery.task(name="app.tasks.periodic_task")
def periodic_task():
    """
    This task runs every 30 seconds via Celery Beat.
    TODO: Replace with your actual logic.
    """
    print("⏰ Periodic task executed!")
    return {"status": "ok"}

from loguru import logger
from datetime import datetime

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from config import get_settings


settings = get_settings()


class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self._send_question_callback = None
        self._start_time = "08:00"
        self._end_time = "22:00"
        self._interval_minutes = settings.QUESTION_INTERVAL_MINUTES
        self._is_paused = False

    def set_question_callback(self, callback):
        self._send_question_callback = callback

    def _is_within_active_hours(self) -> bool:
        now = datetime.now()
        current_time = now.strftime("%H:%M")
        if self._start_time <= self._end_time:
            return self._start_time <= current_time <= self._end_time
        else:
            return current_time >= self._start_time or current_time <= self._end_time

    async def send_scheduled_question(self):
        if not self._is_within_active_hours():
            logger.info(
                f"Outside active hours ({self._start_time} - {self._end_time}), skipping question"
            )
            return

        if self._send_question_callback:
            try:
                await self._send_question_callback()
            except Exception as e:
                logger.error(f"Error sending scheduled question: {e}")
        else:
            logger.warning("No question callback set for scheduler")

    def start(self, interval_minutes: int = None):
        if interval_minutes is None:
            interval_minutes = self._interval_minutes

        self._interval_minutes = interval_minutes
        self.scheduler.add_job(
            self.send_scheduled_question,
            trigger=IntervalTrigger(minutes=interval_minutes),
            id="send_question",
            replace_existing=True,
            next_run_time=datetime.now(),
        )
        self.scheduler.start()
        logger.info(f"Scheduler started with {interval_minutes} minute interval")

    def stop(self):
        if self.scheduler.running:
            self.scheduler.shutdown()
            logger.info("Scheduler stopped")

    def pause(self):
        self._is_paused = True
        self.scheduler.pause()
        logger.info("Scheduler paused")

    def resume(self):
        self._is_paused = False
        self.scheduler.resume()
        logger.info("Scheduler resumed")

    def trigger_now(self):
        job = self.scheduler.get_job("send_question")
        if job:
            job.modify(next_run_time=datetime.now())
            logger.info("Triggered immediate question")

    def update_settings(
        self,
        interval_minutes: int = None,
        start_time: str = None,
        end_time: str = None,
        is_paused: bool = None,
    ):
        if start_time is not None:
            self._start_time = start_time
            logger.info(f"Updated start time to {start_time}")

        if end_time is not None:
            self._end_time = end_time
            logger.info(f"Updated end time to {end_time}")

        if is_paused is not None:
            if is_paused and not self._is_paused:
                self.pause()
            elif not is_paused and self._is_paused:
                self.resume()

        if interval_minutes is not None and interval_minutes != self._interval_minutes:
            self._interval_minutes = interval_minutes
            job = self.scheduler.get_job("send_question")
            if job:
                job.reschedule(trigger=IntervalTrigger(minutes=interval_minutes))
                logger.info(f"Updated interval to {interval_minutes} minutes")

    def get_current_settings(self) -> dict:
        return {
            "start_time": self._start_time,
            "end_time": self._end_time,
            "interval_minutes": self._interval_minutes,
            "is_paused": self._is_paused,
        }


_scheduler_service = None


def get_scheduler_service() -> SchedulerService:
    global _scheduler_service
    if _scheduler_service is None:
        _scheduler_service = SchedulerService()
    return _scheduler_service
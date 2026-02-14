from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database import Base


class SchedulerSettings(Base):
    """Settings for quiz question scheduling."""

    __tablename__ = "scheduler_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    start_time = Column(String(5), default="08:00")
    end_time = Column(String(5), default="22:00")
    interval_minutes = Column(Integer, default=20)
    is_paused = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="scheduler_settings")
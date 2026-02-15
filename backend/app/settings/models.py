import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from database import Base


class QuestionModeEnum(str, enum.Enum):
    MCQ = "MCQ"
    QUESTION_ANSWER = "QUESTION_ANSWER"


class SchedulerSettings(Base):
    """User scheduler settings with all times stored in UTC for timezone-independent task execution."""

    __tablename__ = "scheduler_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    start_time_utc = Column(Time, nullable=False)
    end_time_utc = Column(Time, nullable=False)
    interval_minutes = Column(Integer, default=20)
    is_paused = Column(Boolean, default=False)
    timezone = Column(String(50), default="UTC")
    next_execution_time = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="scheduler_settings")


class UserQuestionMode(Base):
    __tablename__ = "user_question_modes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    mode = Column(Enum(QuestionModeEnum), default=QuestionModeEnum.QUESTION_ANSWER, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="question_mode")
import enum
from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Time
from sqlalchemy.orm import relationship

from database import Base
from sqlalchemy.schema import UniqueConstraint


class QuestionModeEnum(str, enum.Enum):
    MCQ = "MCQ"
    QUESTION_ANSWER = "QUESTION_ANSWER"
    PLAIN_TEXT = "PLAIN_TEXT"

class KnowledgeBaseEnum(str, enum.Enum):
    VOCABULARY = "VOCABULARY"
    QURAN = "QURAN"


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

class UserKnowledgeBase(Base):
    __tablename__ = "user_knowledge_base"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    active_module = Column(Enum(KnowledgeBaseEnum), default=KnowledgeBaseEnum.VOCABULARY, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="knowledge_base")

class UserQuranSettings(Base):
    __tablename__ = "user_quran_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    sura_no = Column(Integer, nullable=False)
    verse_interval = Column(Integer, default=5, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", backref="quran_settings")

class UserQuranProgress(Base):
    __tablename__ = "user_quran_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    sura_no = Column(Integer, nullable=False)
    last_verse_sent = Column(Integer, default=0, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (UniqueConstraint('user_id', 'sura_no', name='uq_user_sura_progress'),)

    user = relationship("User", backref="quran_progress")
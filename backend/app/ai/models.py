import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


class QuestionType(enum.Enum):
    MEANING = "meaning"
    EXAMPLE = "example"
    SYNONYM = "synonym"


class SessionState(enum.Enum):
    MEANING = "meaning"
    EXAMPLE = "example"
    SYNONYM = "synonym"
    COMPLETED = "completed"


class QuestionHistory(Base):
    __tablename__ = "question_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    question_text = Column(Text, nullable=False)
    user_answer = Column(Text, nullable=True)
    is_correct = Column(Boolean, nullable=True)
    score = Column(Integer, nullable=True)
    feedback = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="question_history")
    word = relationship("Word", back_populates="question_history")


class QuizSession(Base):
    __tablename__ = "quiz_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    current_state = Column(Enum(SessionState), default=SessionState.MEANING)
    waiting_for_response = Column(Boolean, default=True)
    is_active = Column(Boolean, default=True)
    meaning_score = Column(Integer, nullable=True)
    example_score = Column(Integer, nullable=True)
    synonym_score = Column(Integer, nullable=True)
    total_score = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="quiz_sessions")
    word = relationship("Word", back_populates="sessions")
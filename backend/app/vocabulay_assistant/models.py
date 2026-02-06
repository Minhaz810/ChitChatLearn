import enum
from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class VocabularyChunk(Base):
    """Represents a chunk of vocabulary words."""

    __tablename__ = "vocabulary_chunks"

    id = Column(Integer, primary_key=True, index=True)
    chunk_number = Column(Integer, unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    words = relationship("Word", back_populates="chunk", cascade="all, delete-orphan")


class Word(Base):
    """Represents a vocabulary word with translations and examples."""

    __tablename__ = "words"

    id = Column(Integer, primary_key=True, index=True)
    chunk_id = Column(Integer, ForeignKey("vocabulary_chunks.id"), nullable=False)
    word = Column(String(100), nullable=False, index=True)
    bengali_translation = Column(Text, nullable=False)
    english_translation = Column(Text, nullable=True)
    example = Column(Text, nullable=True)
    synonyms = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    chunk = relationship("VocabularyChunk", back_populates="words")
    progress = relationship("UserProgress", back_populates="word", uselist=False)
    question_history = relationship("QuestionHistory", back_populates="word")
    sessions = relationship("QuizSession", back_populates="word")


class GraspLevel(enum.Enum):
    """User's grasp level for a word."""

    NEW = "new"
    LEARNING = "learning"
    FAMILIAR = "familiar"
    MASTERED = "mastered"


class UserProgress(Base):
    """Tracks user's progress for each word."""

    __tablename__ = "user_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "word_id", name="uq_user_word_progress"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    word_id = Column(Integer, ForeignKey("words.id"), nullable=False)
    correct_count = Column(Integer, default=0)
    last_asked = Column(DateTime, nullable=True)
    grasp_level = Column(Enum(GraspLevel), default=GraspLevel.NEW)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="progress")
    word = relationship("Word", back_populates="progress")
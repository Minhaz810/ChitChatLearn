from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from .models import GraspLevel


class WordBase(BaseModel):
    """Base schema for word data."""

    word: str
    bengali_translation: str
    english_translation: Optional[str] = None
    example: Optional[str] = None
    synonyms: Optional[str] = None


class WordCreate(WordBase):
    """Schema for creating a word."""

    pass


class WordResponse(WordBase):
    """Schema for word response data."""

    id: int
    chunk_id: int
    grasp_level: Optional[GraspLevel] = None
    correct_count: Optional[int] = 0
    created_at: datetime

    class Config:
        from_attributes = True


class PaginatedWordResponse(BaseModel):
    """Schema for paginated word response."""

    items: List[WordResponse]
    total: int
    page: int
    size: int
    pages: int


class ChunkCreate(BaseModel):
    """Schema for creating a vocabulary chunk."""

    chunk_number: int
    words: List[WordCreate]


class ChunkResponse(BaseModel):
    """Schema for chunk response data."""

    id: int
    chunk_number: int
    word_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class VocabularyImport(BaseModel):
    """Schema for importing vocabulary chunks."""

    chunks: List[ChunkCreate]


class ImportResponse(BaseModel):
    """Schema for import operation response."""

    chunks_imported: int
    words_imported: int
    message: str


class ProgressResponse(BaseModel):
    """Schema for word progress data."""

    word_id: int
    word: str
    bengali_translation: str
    english_translation: Optional[str]
    correct_count: int
    grasp_level: GraspLevel
    last_asked: Optional[datetime]

    class Config:
        from_attributes = True


class OverallProgressResponse(BaseModel):
    """Schema for overall user progress."""

    total_words: int
    mastered: int
    familiar: int
    learning: int
    new: int
    mastery_percentage: float


class HistoryResponse(BaseModel):
    """Schema for question history data."""

    id: int
    word: str
    question_type: str
    question_text: str
    user_answer: Optional[str]
    is_correct: Optional[bool]
    score: Optional[int]
    feedback: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True
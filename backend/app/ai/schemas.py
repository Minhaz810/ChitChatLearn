from typing import Optional
from pydantic import BaseModel
from .models import QuestionType, SessionState


class QuestionResponse(BaseModel):
    session_id: int
    word_id: int
    word: str
    question_type: QuestionType
    question_text: str


class AnswerSubmit(BaseModel):
    session_id: int
    answer: str


class ValidationResponse(BaseModel):
    score: int
    is_correct: bool
    feedback: str
    correct_answer: Optional[str] = None
    next_question: Optional[QuestionResponse] = None
    session_completed: bool = False
    total_score: Optional[int] = None


class SessionResponse(BaseModel):
    id: int
    word_id: int
    word: str
    current_state: SessionState
    waiting_for_response: bool
    is_active: bool
    meaning_score: Optional[int]
    example_score: Optional[int]
    synonym_score: Optional[int]
    total_score: Optional[int]

    class Config:
        from_attributes = True
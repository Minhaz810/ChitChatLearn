from datetime import datetime

from pydantic import BaseModel, Field
from .models import QuestionModeEnum, KnowledgeBaseEnum


class SchedulerSettingsSchema(BaseModel):
    """Schema for updating scheduler settings."""

    start_time: str = Field(default="08:00", pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="22:00", pattern=r"^\d{2}:\d{2}$")
    interval_minutes: int = Field(default=20, ge=20, le=120)
    timezone: str = Field(default="UTC")
    is_paused: bool = False


class SchedulerSettingsResponse(BaseModel):
    """Schema for scheduler settings response."""

    id: int
    start_time: str
    end_time: str
    interval_minutes: int
    timezone: str
    is_paused: bool
    updated_at: datetime

    class Config:
        from_attributes = True


class QuestionModeUpdate(BaseModel):
    """Schema for updating question mode."""
    mode: QuestionModeEnum


class QuestionModeResponse(BaseModel):
    """Schema for question mode response."""
    user_id: int
    mode: QuestionModeEnum
    updated_at: datetime

    class Config:
        from_attributes = True

class KnowledgeBaseUpdate(BaseModel):
    active_module: KnowledgeBaseEnum

class KnowledgeBaseResponse(BaseModel):
    user_id: int
    active_module: KnowledgeBaseEnum
    updated_at: datetime

    class Config:
        from_attributes = True

class QuranSettingsUpdate(BaseModel):
    sura_no: int = Field(..., ge=1, le=114)
    verse_interval: int = Field(default=5, ge=1)

class QuranSettingsResponse(BaseModel):
    user_id: int
    sura_no: int
    verse_interval: int
    updated_at: datetime

    class Config:
        from_attributes = True
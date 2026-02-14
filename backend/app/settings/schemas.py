from datetime import datetime

from pydantic import BaseModel, Field


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
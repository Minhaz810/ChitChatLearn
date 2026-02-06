from datetime import datetime

from pydantic import BaseModel, Field


class SchedulerSettingsSchema(BaseModel):
    """Schema for updating scheduler settings."""

    start_time: str = Field(default="08:00", pattern=r"^\d{2}:\d{2}$")
    end_time: str = Field(default="22:00", pattern=r"^\d{2}:\d{2}$")
    interval_minutes: int = Field(default=20, ge=1, le=120)
    is_paused: bool = False


class SchedulerSettingsResponse(SchedulerSettingsSchema):
    """Schema for scheduler settings response."""

    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
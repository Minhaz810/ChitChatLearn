from pydantic import BaseModel

class SurahResponse(BaseModel):
    sura_no: int
    sura_name: str
    sura_type: str
    total_verses: int

    class Config:
        from_attributes = True

class UserQuranProgressResponse(BaseModel):
    sura_no: int
    sura_name: str
    last_verse_sent: int
    total_verses: int

    class Config:
        from_attributes = True

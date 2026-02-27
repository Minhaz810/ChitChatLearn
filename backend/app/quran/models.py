from sqlalchemy import Column, Integer, String, Text
from database import Base

class Quran(Base):
    """Represents a verse from the Quran with Bengali translation."""

    __tablename__ = "quran"

    id = Column(Integer, primary_key=True, index=True)
    sura_no = Column(Integer, nullable=False, index=True)
    sura_name = Column(String, nullable=False)
    sura_type = Column(String, nullable=False)
    verse_no = Column(Integer, nullable=False, index=True)
    verse = Column(String, nullable=False)
    bengali_translation = Column(Text, nullable=False)

    def __repr__(self):
        return f"<Quran Sura: {self.sura_no}, Verse: {self.verse_no}>"

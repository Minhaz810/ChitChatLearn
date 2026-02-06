import asyncio
import csv
import os
import re
import sys

# Add project root to path to allow importing from 'app' and 'database'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import select
from database import AsyncSessionLocal
from app.vocabulay_assistant.models import VocabularyChunk, Word

# Import all models to ensure relationships (like QuestionHistory) are resolved
from app.auth import models as auth_models
from app.vocabulay_assistant import models as vocabulary_models
from app.settings import models as settings_models
from app.ai import models as ai_models

def get_column(row, possible_names):
    for name in possible_names:
        if name in row:
            return row[name].strip()
    return ""

async def import_csv_data():
    # Root dir of the project where CSVs are located
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
    files = [
        f for f in os.listdir(root_dir) if f.startswith("chunk_") and f.endswith(".csv")
    ]
    
    if not files:
        print(f"❌ No CSV files found in {root_dir}")
        return

    files.sort(key=lambda x: int(re.search(r"chunk_(\d+)", x).group(1)))

    async with AsyncSessionLocal() as db:
        chunks_imported = 0
        words_imported = 0
        total_skipped = 0

        for filename in files:
            chunk_num = int(re.search(r"chunk_(\d+)", filename).group(1))
            file_path = os.path.join(root_dir, filename)
            
            # Check if chunk already exists
            result = await db.execute(
                select(VocabularyChunk).where(VocabularyChunk.chunk_number == chunk_num)
            )
            existing_chunk = result.scalar_one_or_none()
            
            if existing_chunk:
                print(f"⏭️ Skipping {filename} (Chunk {chunk_num} already exists)")
                continue

            chunk = VocabularyChunk(chunk_number=chunk_num)
            db.add(chunk)
            await db.flush() # Get the chunk ID

            current_chunk_words = 0
            with open(file_path, encoding="utf-8") as f:
                reader = csv.DictReader(f)
                for row in reader:
                    word_text = get_column(row, ["Word"])
                    if not word_text:
                        continue
                    
                    word = Word(
                        chunk_id=chunk.id,
                        word=word_text,
                        bengali_translation=get_column(row, ["B Tr", "BN Tr"]),
                        english_translation=get_column(row, ["E Tr", "EN Tr"]),
                        example=get_column(row, ["Example"]),
                        synonyms=get_column(row, ["Synonyms"]),
                    )
                    db.add(word)
                    words_imported += 1
                    current_chunk_words += 1

            chunks_imported += 1
            print(f"✅ Processed {current_chunk_words} words from {filename}")

        await db.commit()
        print("\n🏁 Import Final Summary:")
        print(f"   Chunks processed: {chunks_imported}")
        print(f"   Total words imported: {words_imported}")

if __name__ == "__main__":
    asyncio.run(import_csv_data())
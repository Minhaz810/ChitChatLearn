import asyncio
import json
import os
import sys

# Add the parent directory to sys.path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import AsyncSessionLocal
from app.quran.models import Quran
from sqlalchemy import select, delete
from loguru import logger

async def seed_quran():
    json_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'updated_quran.json')
    
    if not os.path.exists(json_path):
        logger.error(f"Could not find {json_path}")
        return

    logger.info("Loading updated_quran.json...")
    with open(json_path, 'r', encoding='utf-8') as f:
        quran_data = json.load(f)

    logger.info(f"Loaded {len(quran_data)} verses from JSON.")

    async with AsyncSessionLocal() as db:
        # Delete existing data to start fresh with new schema
        logger.info("Clearing existing data from the Quran table...")
        await db.execute(delete(Quran))
        await db.commit()

        logger.info("Seeding Quran data to database. This may take a moment...")
        
        batch_size = 1000
        batch = []
        
        for i, entry in enumerate(quran_data):
            verse = Quran(
                sura_no=entry.get("Sura No"),
                sura_name=entry.get("Sura Name"),
                sura_type=entry.get("Sura Type"),
                verse_no=entry.get("Verse No"),
                verse=entry.get("Verse"),
                bengali_translation=entry.get("Bengali Translation")
            )
            batch.append(verse)
            
            if len(batch) >= batch_size:
                db.add_all(batch)
                await db.commit()
                batch = []
                if i % 1000 == 0:
                    logger.info(f"Inserted {i} verses...")
        
        if batch:
            db.add_all(batch)
            await db.commit()
            
        logger.info(f"Successfully seeded {len(quran_data)} verses.")

if __name__ == "__main__":
    asyncio.run(seed_quran())

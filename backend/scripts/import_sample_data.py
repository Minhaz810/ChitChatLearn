import asyncio

import httpx

SAMPLE_VOCABULARY = {
    "chunks": [
        {
            "chunk_number": 1,
            "words": [
                {
                    "word": "aberration",
                    "bengali_translation": "বিপথগমন",
                    "english_translation": "a departure from what is normal, usual, or expected",
                    "example": "His outburst was an aberration from his usual calm behavior.",
                    "synonyms": "deviation, anomaly, departure",
                },
                {
                    "word": "abeyance",
                    "bengali_translation": "মুলতবি",
                    "english_translation": "a state of temporary disuse or suspension",
                    "example": "The project is being held in abeyance until the funding is secured.",
                    "synonyms": "suspension, dormancy, inactivity",
                },
                {
                    "word": "abjure",
                    "bengali_translation": "শপথপূর্বক বর্জন করা",
                    "english_translation": "to solemnly renounce a belief, cause, or claim",
                    "example": "He abjured his former religion to join the new sect.",
                    "synonyms": "renounce, relinquish, reject",
                },
            ],
        }
    ]
}


async def import_vocabulary(base_url: str = "http://localhost:8000"):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{base_url}/vocabulary/import", json=SAMPLE_VOCABULARY, timeout=30.0
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Import successful!")
            print(f"   Chunks imported: {result['chunks_imported']}")
            print(f"   Words imported: {result['words_imported']}")
        else:
            print(f"❌ Import failed: {response.status_code}")
            print(response.text)


async def check_progress(base_url: str = "http://localhost:8000"):
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/progress/overall")

        if response.status_code == 200:
            stats = response.json()
            print("\n📊 Progress Statistics:")
            print(f"   Total words: {stats['total_words']}")
            print(f"   Mastered: {stats['mastered']}")
            print(f"   Familiar: {stats['familiar']}")
            print(f"   Learning: {stats['learning']}")
            print(f"   New: {stats['new']}")
            print(f"   Mastery: {stats['mastery_percentage']:.1f}%")
        else:
            print(f"❌ Failed to get progress: {response.status_code}")


if __name__ == "__main__":
    print("📚 Vocabulary Assistant - Sample Data Import\n")

    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--check":
        asyncio.run(check_progress())
    else:
        asyncio.run(import_vocabulary())
        asyncio.run(check_progress())
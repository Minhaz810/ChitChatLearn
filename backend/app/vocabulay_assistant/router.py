from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.models import QuestionHistory
from app.auth.dependencies import get_current_user
from app.auth.models import User
from database import get_db

from .models import VocabularyChunk, Word
from .schemas import (
    ChunkResponse,
    HistoryResponse,
    ImportResponse,
    OverallProgressResponse,
    PaginatedWordResponse,
    ProgressResponse,
    VocabularyImport,
    WordResponse,
)
from .service import get_progress_service

router = APIRouter(prefix="/vocabulary", tags=["vocabulary_assistant"])


@router.post("/import", response_model=ImportResponse)
async def import_vocabulary(
    data: VocabularyImport,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    chunks_imported = 0
    words_imported = 0

    for chunk_data in data.chunks:
        result = await db.execute(
            select(VocabularyChunk).where(
                VocabularyChunk.chunk_number == chunk_data.chunk_number
            )
        )
        existing_chunk = result.scalar_one_or_none()
        if existing_chunk:
            continue

        chunk = VocabularyChunk(chunk_number=chunk_data.chunk_number)
        db.add(chunk)
        await db.flush()

        for word_data in chunk_data.words:
            word = Word(
                chunk_id=chunk.id,
                word=word_data.word,
                bengali_translation=word_data.bengali_translation,
                english_translation=word_data.english_translation,
                example=word_data.example,
                synonyms=word_data.synonyms,
            )
            db.add(word)
            words_imported += 1

        chunks_imported += 1

    await db.commit()
    return ImportResponse(
        chunks_imported=chunks_imported,
        words_imported=words_imported,
        message=f"Successfully imported {chunks_imported} chunks with {words_imported} words",
    )


@router.get("/chunks", response_model=List[ChunkResponse])
async def get_chunks(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(VocabularyChunk).order_by(VocabularyChunk.chunk_number)
    )
    chunks = result.scalars().all()
    responses = []

    for chunk in chunks:
        word_result = await db.execute(select(Word).where(Word.chunk_id == chunk.id))
        word_count = len(word_result.scalars().all())
        responses.append(
            ChunkResponse(
                id=chunk.id,
                chunk_number=chunk.chunk_number,
                word_count=word_count,
                created_at=chunk.created_at,
            )
        )

    return responses


@router.get("/words", response_model=PaginatedWordResponse)
async def get_words(
    chunk_id: Optional[int] = None,
    page: int = 1,
    size: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Optimized count query
    total_count_query = select(func.count(Word.id))
    if chunk_id:
        total_count_query = total_count_query.where(Word.chunk_id == chunk_id)
    total_count = (await db.execute(total_count_query)).scalar()

    # Query words with user progress
    from .models import UserProgress
    query = (
        select(Word, UserProgress.grasp_level, UserProgress.correct_count)
        .outerjoin(
            UserProgress, 
            (UserProgress.word_id == Word.id) & (UserProgress.user_id == current_user.id)
        )
    )
    if chunk_id:
        query = query.where(Word.chunk_id == chunk_id)

    skip = (page - 1) * size
    result = await db.execute(query.order_by(Word.id).offset(skip).limit(size))
    
    word_items = []
    for word, grasp_level, correct_count in result.all():
        word_resp = WordResponse.model_validate(word)
        word_resp.grasp_level = grasp_level
        word_resp.correct_count = correct_count or 0
        word_items.append(word_resp)
    
    import math
    return PaginatedWordResponse(
        items=word_items,
        total=total_count,
        page=page,
        size=size,
        pages=math.ceil(total_count / size) if total_count > 0 else 0
    )


@router.get("/words/{word_id}", response_model=WordResponse)
async def get_word(
    word_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Word).where(Word.id == word_id))
    word = result.scalar_one_or_none()
    if not word:
        raise HTTPException(status_code=404, detail="Word not found")
    return WordResponse.model_validate(word)


@router.get("/progress/overall", response_model=OverallProgressResponse)
async def get_overall_progress(
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)
):
    progress_service = get_progress_service()
    return await progress_service.get_overall_progress(db, current_user.id)


@router.get("/progress/{word_id}", response_model=ProgressResponse)
async def get_word_progress(
    word_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    progress_service = get_progress_service()
    progress = await progress_service.get_word_progress(db, word_id, current_user.id)
    if not progress:
        raise HTTPException(status_code=404, detail="Word not found")
    return progress


@router.get("/history/all", response_model=List[HistoryResponse])
async def get_question_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(QuestionHistory)
        .options(selectinload(QuestionHistory.word))
        .order_by(QuestionHistory.timestamp.desc())
        .limit(limit)
    )
    history = result.scalars().all()
    return [
        HistoryResponse(
            id=h.id,
            word=h.word.word,
            question_type=h.question_type,
            question_text=h.question_text,
            user_answer=h.user_answer,
            is_correct=h.is_correct,
            score=h.score,
            feedback=h.feedback,
            timestamp=h.timestamp,
        )
        for h in history
    ]


@router.get("/history/{word_id}", response_model=List[HistoryResponse])
async def get_word_history(
    word_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(QuestionHistory)
        .options(selectinload(QuestionHistory.word))
        .where(QuestionHistory.word_id == word_id)
        .order_by(QuestionHistory.timestamp.desc())
    )
    history = result.scalars().all()
    return [
        HistoryResponse(
            id=h.id,
            word=h.word.word,
            question_type=h.question_type,
            question_text=h.question_text,
            user_answer=h.user_answer,
            is_correct=h.is_correct,
            score=h.score,
            feedback=h.feedback,
            timestamp=h.timestamp,
        )
        for h in history
    ]
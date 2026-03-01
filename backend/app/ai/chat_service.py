from typing import List, Optional, Dict
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.ai.models import ChatSession

class ChatSessionService:
    @staticmethod
    async def create_session(db: AsyncSession, user_id: int, word_id: int) -> ChatSession:
        # Deactivate previous active sessions for this user
        existing_sessions = await db.execute(
            select(ChatSession).where(
                ChatSession.user_id == user_id, 
                ChatSession.is_active == True
            )
        )
        for s in existing_sessions.scalars().all():
            s.is_active = False
            
        new_session = ChatSession(
            user_id=user_id,
            word_id=word_id,
            messages=[],
            is_active=True
        )
        db.add(new_session)
        await db.commit()
        await db.refresh(new_session)
        return new_session

    @staticmethod
    async def get_active_session(db: AsyncSession, user_id: int) -> Optional[ChatSession]:
        result = await db.execute(
            select(ChatSession).where(
                ChatSession.user_id == user_id,
                ChatSession.is_active == True
            )
        )
        return result.scalars().first()

    @staticmethod
    async def add_message(db: AsyncSession, session: ChatSession, role: str, content: str):
        # SQLAlchemy JSON mutations need a bit of help sometimes, re-assigning the list
        messages = list(session.messages)
        messages.append({"role": role, "content": content})
        session.messages = messages
        db.add(session)
        await db.commit()

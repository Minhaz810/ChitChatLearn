import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from config import get_settings
from .prompts import VOCABULARY_TUTOR_PROMPT

settings = get_settings()

class AIService:
    def __init__(self):
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-flash-latest",
            google_api_key=settings.GEMINI_API_KEY
        )

    async def dummy_call(self, prompt: str):
        message = HumanMessage(content=prompt)
        response = await self.llm.ainvoke([message])
        return response.content

    async def chat_with_history(self, vocabulary: str, history: list, user_message: str) -> str:
        messages = [
            SystemMessage(content=f"You are helping the user understand the vocabulary word: '{vocabulary}'. Keep responses focused on that. Assist the user in learning its meaning, usage, and nuances through conversation.")
        ]
        
        for msg in history:
            if msg["role"] == "user":
                messages.append(HumanMessage(content=msg["content"]))
            else:
                messages.append(AIMessage(content=msg["content"]))
                
        messages.append(HumanMessage(content=user_message))
        
        response = await self.llm.ainvoke(messages)
        return response.content

    async def evaluate_quiz_answer(
        self,
        word_data: dict,
        session_state: str,
        attempt: int,
        user_answer: str,
        mcq_options: list[str] = None,
    ) -> dict:
        mcq_options_str = ", ".join(mcq_options) if mcq_options else "None"
        prompt = VOCABULARY_TUTOR_PROMPT.format(
            word=word_data["word"],
            bengali=word_data["bengali"],
            english=word_data["english"],
            synonyms=word_data["synonyms"],
            example=word_data["example"],
            session_state=session_state,
            attempt=attempt,
            mcq_options_str=mcq_options_str,
        )
        
        message = HumanMessage(content=f"User's answer: {user_answer}")
        response = await self.llm.ainvoke([SystemMessage(content=prompt), message])
        
        # Extract JSON from response
        response_text = response.content
        json_match = re.search(r"\{.*\}", response_text, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass
        
        # Fallback if parsing fails or no match
        try:
            return json.loads(response_text)
        except json.JSONDecodeError:
            return {
                "reply_message": "I'm sorry, I couldn't evaluate that properly. Let's try again.",
                "evaluation_result": "incorrect",
                "next_state": session_state,
                "phase_score": 0
            }

_ai_service = None

def get_ai_service() -> AIService:
    global _ai_service
    if _ai_service is None:
        _ai_service = AIService()
    return _ai_service

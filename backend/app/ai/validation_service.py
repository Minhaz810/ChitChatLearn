import json
from loguru import logger
import re

from anthropic import AsyncAnthropic

from config import get_settings

from .models import QuestionType


settings = get_settings()


class ValidationService:
    def __init__(self):
        self.client = (
            AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
            if settings.ANTHROPIC_API_KEY
            else None
        )

    async def validate_meaning(
        self, word: str, bengali: str, english: str, user_answer: str
    ) -> tuple[int, str, bool, str]:
        prompt = f"""You are evaluating a vocabulary quiz answer.

Word: "{word}"
Bengali Translation: "{bengali}"
English Translation: "{english}"
User's answer: "{user_answer}"

Evaluate if the user's answer correctly captures the meaning of the word in either Bengali or English.

Respond with a JSON object containing:
- "score": A number from 0-100 (90-100 for correct, 60-89 for partially correct, 0-59 for incorrect)
- "feedback": A brief, encouraging feedback message (1-2 sentences)
- "is_correct": true if score >= 90, false otherwise

Only output the JSON, nothing else."""
        return await self._get_validation(prompt, f"{bengali} / {english}")

    async def validate_example(
        self,
        word: str,
        bengali: str,
        english: str,
        correct_example: str,
        user_example: str,
    ) -> tuple[int, str, bool, str]:
        prompt = f"""You are evaluating a vocabulary quiz answer.

Word: "{word}"
Meaning: {bengali} ({english})
Reference Example: "{correct_example}"
User's example sentence: "{user_example}"

Evaluate if the user's example sentence correctly and appropriately uses the word "{word}".
Consider:
1. Is the word used correctly in context?
2. Does the sentence make grammatical sense?
3. Does the usage reflect the correct meaning?

Respond with a JSON object containing:
- "score": A number from 0-100
- "feedback": A brief, encouraging feedback message with a better example if needed
- "is_correct": true if score >= 90, false otherwise
- "better_example": A model example sentence using the word

Only output the JSON, nothing else."""
        fallback = (
            correct_example
            if correct_example
            else f"Example: The {word} was evident in..."
        )
        return await self._get_validation(prompt, fallback)

    async def validate_synonym(
        self,
        word: str,
        bengali: str,
        english: str,
        correct_synonyms: str,
        user_synonym: str,
    ) -> tuple[int, str, bool, str]:
        prompt = f"""You are evaluating a vocabulary quiz answer.

Word: "{word}"
Meaning: {bengali} ({english})
Reference Synonyms: "{correct_synonyms}"
User's suggested synonym: "{user_synonym}"

Evaluate if the user's answer is a valid synonym for "{word}".

Respond with a JSON object containing:
- "score": A number from 0-100
- "feedback": A brief, encouraging feedback message with correct synonyms if needed
- "is_correct": true if score >= 90, false otherwise
- "synonyms": A list of 2-3 good synonyms for the word

Only output the JSON, nothing else."""
        fallback = correct_synonyms if correct_synonyms else "Similar words"
        return await self._get_validation(prompt, fallback)

    async def _get_validation(
        self, prompt: str, fallback_answer: str
    ) -> tuple[int, str, bool, str]:
        if not self.client:
            logger.warning("Anthropic API not configured, using mock validation")
            return (
                75,
                "Answer recorded. (API not configured for validation)",
                False,
                fallback_answer,
            )

        try:
            message = await self.client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = message.content[0].text
            json_match = re.search(r"\{.*\}", response_text, re.DOTALL)

            if json_match:
                result = json.loads(json_match.group())
            else:
                result = json.loads(response_text)

            score = int(result.get("score", 50))
            feedback = result.get("feedback", "Answer evaluated.")
            is_correct = result.get("is_correct", score >= 90)
            additional = (
                result.get("better_example")
                or result.get("synonyms")
                or fallback_answer
            )
            return score, feedback, is_correct, str(additional)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Claude response: {e}")
            return 50, "Could not evaluate answer properly.", False, fallback_answer

        except Exception as e:
            logger.error(f"Claude API error: {e}")
            return 50, f"Evaluation error: {str(e)}", False, fallback_answer

    async def validate_answer(
        self, word_obj: any, question_type: QuestionType, user_answer: str
    ) -> tuple[int, str, bool, str]:
        word = word_obj.word
        bengali = word_obj.bengali_translation
        english = word_obj.english_translation or ""
        example = word_obj.example or ""
        synonyms = word_obj.synonyms or ""

        if question_type == QuestionType.MEANING:
            return await self.validate_meaning(word, bengali, english, user_answer)
        elif question_type == QuestionType.EXAMPLE:
            return await self.validate_example(
                word, bengali, english, example, user_answer
            )
        elif question_type == QuestionType.SYNONYM:
            return await self.validate_synonym(
                word, bengali, english, synonyms, user_answer
            )
        else:
            raise ValueError(f"Unknown question type: {question_type}")


_validation_service = None


def get_validation_service() -> ValidationService:
    global _validation_service
    if _validation_service is None:
        _validation_service = ValidationService()
    return _validation_service
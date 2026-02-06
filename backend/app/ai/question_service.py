from .models import QuestionType


class QuestionService:
    @staticmethod
    def generate_meaning_question(word: str) -> str:
        return f"What is the meaning of '<b>{word}</b>'?"

    @staticmethod
    def generate_example_question(word: str) -> str:
        return f"Give me an example sentence using '<b>{word}</b>'."

    @staticmethod
    def generate_synonym_question(word: str) -> str:
        return f"What is a synonym for '<b>{word}</b>'?"

    @staticmethod
    def get_question_for_type(word: str, question_type: QuestionType) -> str:
        if question_type == QuestionType.MEANING:
            return QuestionService.generate_meaning_question(word)
        elif question_type == QuestionType.EXAMPLE:
            return QuestionService.generate_example_question(word)
        elif question_type == QuestionType.SYNONYM:
            return QuestionService.generate_synonym_question(word)
        else:
            raise ValueError(f"Unknown question type: {question_type}")


_question_service = None


def get_question_service() -> QuestionService:
    global _question_service
    if _question_service is None:
        _question_service = QuestionService()
    return _question_service
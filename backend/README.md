# Vocabulary Assistant Backend

## Setup

1. Create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Copy `.env.example` to `.env` and fill in your credentials:
   ```bash
   cp .env.example .env
   ```

4. Run the server:
   ```bash
   python main.py
   # Or with uvicorn directly:
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

5. Import sample vocabulary:
   ```bash
   python scripts/import_sample_data.py
   ```

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /docs` - Swagger documentation

### Vocabulary
- `POST /vocabulary/import` - Import vocabulary chunks
- `GET /vocabulary/chunks` - List all chunks
- `GET /vocabulary/words` - List all words
- `GET /vocabulary/words/{word_id}` - Get specific word

### Progress
- `GET /progress/overall` - Overall statistics
- `GET /progress/{word_id}` - Word-specific progress
- `GET /progress/history/all` - Question history
- `GET /progress/history/{word_id}` - Word-specific history

### Webhook
- `POST /webhook/telegram` - Telegram webhook (for production)
- `POST /webhook/answer` - Submit answer via API

## Telegram Bot Commands

- `/start` - Welcome message and chat ID
- `/stats` - View progress statistics
- `/next` - Get next question immediately

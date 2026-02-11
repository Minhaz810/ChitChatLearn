import sys
import os
import asyncio
import json
from datetime import datetime, timedelta

# Add parent directory to sys.path to import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.auth.utils import encrypt_data
import httpx

async def run_test():
    # 1. Generate a token for user ID 1
    expires_at = (datetime.utcnow() + timedelta(minutes=5)).isoformat()
    token_data = {
        "user_id": 1,
        "exp": expires_at
    }
    token = encrypt_data(token_data)
    print(f"Generated token: {token}")

    # 2. Simulate Telegram Webhook call with the token as text
    webhook_url = "http://localhost:8000/telegram/webhook"
    
    payload = {
        "update_id": 12345,
        "message": {
            "message_id": 1,
            "from": {
                "id": 123,
                "is_bot": False,
                "first_name": "Test",
                "username": "testuser"
            },
            "chat": {
                "id": 123456789,
                "first_name": "Test",
                "type": "private"
            },
            "date": 1612345678,
            "text": token
        }
    }

    print(f"Sending request to {webhook_url}...")
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(webhook_url, json=payload)
            print(f"Response Status: {response.status_code}")
            print(f"Response Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")
        print("Make sure the backend is running at http://localhost:8000")

if __name__ == "__main__":
    asyncio.run(run_test())

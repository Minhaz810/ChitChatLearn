# manage.py
import asyncio
import sys
from getpass import getpass
from database import AsyncSessionLocal
from app.auth.models import User, Role, UserRole
from app.vocabulay_assistant.models import UserProgress
from app.ai.models import QuestionHistory, QuizSession
from app.auth.utils import get_password_hash 
from sqlalchemy import select

async def create_admin():
    username = input("Enter admin username: ")
    email = input("Enter admin email: ")
    password = getpass("Enter admin password: ")
    confirm_password = getpass("Confirm password: ")
    
    if password != confirm_password:
        print("❌ Passwords do not match!")
        return
    
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Role).filter(Role.name == UserRole.ADMIN)
        )
        admin_role = result.scalar_one_or_none()
        
        if not admin_role:
            print("❌ Admin role not found.")
            return
        
        admin = User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            role_id=admin_role.id
        )
        
        db.add(admin)
        await db.commit()
        print(f"✅ Admin '{username}' created!")

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "create-admin":
        asyncio.run(create_admin())
    else:
        print("Usage: python manage.py create-admin")
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.models import Role, UserRole
from loguru import logger

async def seed_roles(db: AsyncSession):
    """Seed default roles."""
    roles = [
        {"name": UserRole.ADMIN},
        {"name": UserRole.USER},
        {"name": UserRole.RIFAT_BHAI},
    ]
    
    for role_data in roles:
        result = await db.execute(
            select(Role).filter(Role.name == role_data["name"])
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            role = Role(**role_data)
            db.add(role)
            logger.info(f"Role {role_data['name']} created")
    
    await db.commit()
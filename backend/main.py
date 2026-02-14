from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.ai.session_service import get_session_service
from app.auth.router import router as auth_router
from app.settings.router import router as settings_router
from app.telegram.router import router as telegram_router
from app.telegram.service import get_telegram_service
from app.vocabulay_assistant.router import router as vocabulary_assistant_router
from config import get_settings
from database import init_db, AsyncSessionLocal
from seeders import seed_roles

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting ChitChatLearn...")
    await init_db()
    
    async with AsyncSessionLocal() as db:
        await seed_roles(db)

    telegram_service = get_telegram_service()

    await telegram_service.initialize_bot()

    yield

    logger.info("Shutting down...")
    await telegram_service.shutdown_bot()
    logger.info("Shutdown complete")


app = FastAPI(
    title="ChitChatLearn API",
    description="API for vocabulary learning with Telegram integration (ChitChatLearn)",
    version="1.0.0",
    openapi_version="3.1.0",
    docs_url="/docs",
    openapi_url="/openapi.json",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.admin.router import router as admin_router

app.include_router(vocabulary_assistant_router)
app.include_router(telegram_router)
app.include_router(settings_router)
app.include_router(auth_router)
app.include_router(admin_router)


@app.get("/")
async def root():
    return {"message": "ChitChatLearn API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.session import engine, Base
from app.routers import auth, contacts, deals, assistant

# Auto-create database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend REST API for AI Powered CRM Lite",
)

# Configure CORS for Vercel deployment and local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(assistant.router)


@app.get("/", include_in_schema=False)
def root():
    return {
        "message": "Welcome to AI Powered CRM Lite API",
        "docs": "http://127.0.0.1:8000/docs",
        "healthcheck": "http://127.0.0.1:8000/healthcheck"
    }


@app.get("/healthcheck", tags=["Health"])
def healthcheck():
    return {"status": "ok", "service": "backend"}

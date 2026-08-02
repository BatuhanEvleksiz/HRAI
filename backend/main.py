import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import get_database_status
from services.gemini_service import get_gemini_status
from services.nemo_service import get_nvidia_status

from routers import dashboard, cv, matching, interviews, reports, chatbot, settings, jobs

app = FastAPI(title="IKAI ATS API")

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv(
        "FRONTEND_ORIGINS",
        "https://hrai-frontend.onrender.com,http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dashboard.router, prefix="/api/dashboard")
app.include_router(cv.router, prefix="/api/candidates")
app.include_router(matching.router, prefix="/api/matching")
app.include_router(interviews.router, prefix="/api/interviews")
app.include_router(reports.router, prefix="/api/reports")
app.include_router(chatbot.router, prefix="/api/chatbot")
app.include_router(settings.router, prefix="/api/settings")
app.include_router(jobs.router, prefix="/api/jobs")

@app.get("/")
def read_root():
    return {"status": "IKAI ATS API is running"}

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "database": get_database_status(),
        "cv_analysis": {
            "nvidia": get_nvidia_status(),
            "gemini": get_gemini_status(),
        },
    }

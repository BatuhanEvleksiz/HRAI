from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import dashboard, cv, matching, interviews, reports, chatbot, settings

app = FastAPI(title="IKAI ATS API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

@app.get("/")
def read_root():
    return {"status": "IKAI ATS API is running"}

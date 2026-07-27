import asyncio
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from models import InterviewCreate, InterviewUpdate, InterviewAnalysisRequest, InterviewAnalysisCreate
from database import get_supabase
from services.gemini_service import analyze_interview
from services.interview_service import transcribe_audio
import uuid
from datetime import datetime
from uuid import UUID

router = APIRouter()

demo_interviews = [
    {
        "id": "int-1",
        "candidate_id": "demo-id-1",
        "candidate_name": "Ahmet Yılmaz",
        "interview_date": "2024-01-01",
        "interview_time": "10:00",
        "position": "Backend Developer",
        "notes": "demo notes",
        "status": "scheduled",
        "is_completed": False,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }
]

demo_analyses = []

def _is_uuid(value: str | None) -> bool:
    try:
        UUID(str(value))
        return True
    except (ValueError, TypeError, AttributeError):
        return False

@router.post("/assistant/analyze")
async def analyze_interview_transcript(request: InterviewAnalysisRequest):
    transcript = request.transcript.strip()
    if not transcript:
        raise HTTPException(status_code=400, detail="Analiz için konuşma metni gerekli.")
    if request.mode not in {"demo", "llm"}:
        raise HTTPException(status_code=400, detail="Analiz modu demo veya llm olmalı.")
    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(analyze_interview, transcript, request.mode),
            timeout=75,
        )
        return {**result, "analysis_mode": request.mode}
    except asyncio.TimeoutError:
        return {
            **analyze_interview(transcript, "demo"),
            "analysis_mode": "demo",
            "warning": "LLM yanıtı zaman aşımına uğradı; tokensız demo analiz döndürüldü.",
        }

@router.post("/assistant/transcribe")
async def transcribe_interview_audio(file: UploadFile = File(...)):
    try:
        transcript = await transcribe_audio(await file.read(), file.filename or "interview-audio")
        return {"transcript": transcript}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Ses transkripsiyonu başarısız: {exc}")

@router.post("/assistant/analyze-audio")
async def analyze_interview_audio(
    file: UploadFile = File(...),
    mode: str = Form("llm"),
    interview_id: str | None = Form(None),
    candidate_id: str | None = Form(None),
):
    if mode != "llm":
        raise HTTPException(status_code=400, detail="Sesli mülakat için LLM modu gerekli.")
    try:
        transcript = await asyncio.wait_for(
            transcribe_audio(await file.read(), file.filename or "interview-audio"),
            timeout=90,
        )
        result = await asyncio.wait_for(
            asyncio.to_thread(analyze_interview, transcript, "llm"),
            timeout=75,
        )
        return {**result, "transcript": transcript, "analysis_mode": "llm", "interview_id": interview_id, "candidate_id": candidate_id}
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Sesli mülakat LLM analizinde zaman aşımı oluştu.")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Sesli mülakat analiz edilemedi: {exc}")

@router.post("/assistant/save")
def save_interview_analysis(analysis: InterviewAnalysisCreate):
    payload = analysis.dict()
    supabase = get_supabase()
    # Demo cards use non-UUID ids and should remain usable without creating
    # invalid foreign-key rows in the real Supabase tables.
    if supabase and _is_uuid(analysis.candidate_id) and (not analysis.interview_id or _is_uuid(analysis.interview_id)):
        try:
            result = supabase.table("interview_transcripts").insert(payload).execute()
            if result.data:
                return result.data[0]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=str(exc))
    record = {**payload, "id": str(uuid.uuid4()), "created_at": datetime.now().isoformat()}
    demo_analyses.append(record)
    return record

@router.get("/assistant")
def list_interview_analyses(candidate_id: str = None, interview_id: str = None):
    supabase = get_supabase()
    if supabase:
        try:
            query = supabase.table("interview_transcripts").select("*").order("created_at", desc=True)
            if candidate_id:
                query = query.eq("candidate_id", candidate_id)
            if interview_id:
                query = query.eq("interview_id", interview_id)
            return query.execute().data
        except Exception:
            pass
    return [item for item in demo_analyses if
            (not candidate_id or item.get("candidate_id") == candidate_id) and
            (not interview_id or item.get("interview_id") == interview_id)]

@router.post("/")
def create_interview(interview: InterviewCreate):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("interviews").insert(interview.dict()).execute()
            return res.data[0]
        except Exception:
            pass
    return {**interview.dict(), "id": str(uuid.uuid4()), "status": "scheduled", "is_completed": False, "candidate_name": "Demo Name"}

@router.get("/")
def list_interviews():
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("interviews").select("*, candidates(full_name)").execute()
            return res.data
        except Exception:
            pass
    return demo_interviews

@router.put("/{id}")
def update_interview(id: str, interview: InterviewUpdate):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("interviews").update(interview.dict(exclude_unset=True)).eq("id", id).execute()
            return res.data[0] if res.data else None
        except Exception:
            pass
    return {"message": "Updated"}

@router.delete("/{id}")
def delete_interview(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("interviews").delete().eq("id", id).execute()
        except Exception:
            pass
    return {"message": "Deleted"}

@router.put("/{id}/status")
def update_interview_status(id: str, status: str):
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("interviews").update({"status": status}).eq("id", id).execute()
        except Exception:
            pass
    return {"message": "Status updated"}

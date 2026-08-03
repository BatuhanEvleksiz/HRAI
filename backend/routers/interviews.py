import asyncio
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from models import InterviewCreate, InterviewUpdate, InterviewStatusUpdate, InterviewAnalysisRequest, InterviewAnalysisCreate
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

def _signal_score(value):
    if isinstance(value, (int, float)):
        return max(0, min(10, float(value)))
    levels = {
        "low": 3, "düşük": 3,
        "medium": 6, "orta": 6,
        "high": 9, "yüksek": 9,
    }
    return levels.get(str(value or "").strip().lower())

def _sync_candidate_radar(supabase, candidate_id: str, signals: dict):
    try:
        communication = _signal_score(signals.get("expression_clarity"))
        technical_depth = _signal_score(signals.get("technical_depth"))
        if communication is None and technical_depth is None:
            return
        current = supabase.table("candidates").select("radar_scores").eq("id", candidate_id).execute()
        radar = (current.data[0].get("radar_scores") or {}) if current.data else {}
        if communication is not None:
            radar["communication_clarity"] = communication
        if technical_depth is not None:
            radar["technical_depth"] = technical_depth
        supabase.table("candidates").update({"radar_scores": radar}).eq("id", candidate_id).execute()
    except Exception:
        # Interview records remain valid even before the radar migration is run.
        return

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
                _sync_candidate_radar(supabase, analysis.candidate_id, analysis.communication_signals)
                return result.data[0]
        except Exception as exc:
            # Keep existing installations working until the optional metadata
            # migration is run in Supabase.
            legacy_payload = {
                key: value for key, value in payload.items()
                if key not in {"speaker_segments", "communication_signals"}
            }
            try:
                result = supabase.table("interview_transcripts").insert(legacy_payload).execute()
                if result.data:
                    _sync_candidate_radar(supabase, analysis.candidate_id, analysis.communication_signals)
                    return result.data[0]
            except Exception:
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
            payload = {**interview.dict(), "status": "pending", "is_completed": None}
            res = supabase.table("interviews").insert(payload).execute()
            if res.data:
                return _normalize_interview(res.data[0])
            raise HTTPException(status_code=502, detail="Mülakat veritabanına eklenemedi.")
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Mülakat kaydedilemedi: {exc}")
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; mülakat sahte olarak kaydedilmedi.")

def _normalize_interview(item):
    candidate = item.get("candidates") or {}
    return {**item, "candidate_name": item.get("candidate_name") or candidate.get("full_name") or ""}

@router.get("/")
def list_interviews():
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("interviews").select("*, candidates(full_name)").execute()
            return [_normalize_interview(item) for item in (res.data or [])]
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Mülakatlar alınamadı: {exc}")
    return demo_interviews

@router.put("/{id}")
def update_interview(id: str, interview: InterviewUpdate):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("interviews").update(interview.dict(exclude_unset=True)).eq("id", id).execute()
            return _normalize_interview(res.data[0]) if res.data else None
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Mülakat güncellenemedi: {exc}")
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; mülakat güncellenmedi.")

@router.delete("/{id}")
def delete_interview(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("interviews").delete().eq("id", id).execute()
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Mülakat silinemedi: {exc}")
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; mülakat silinmedi.")

@router.put("/{id}/status")
def update_interview_status(id: str, update: InterviewStatusUpdate):
    if update.status not in {"pending", "approved", "rejected"}:
        raise HTTPException(status_code=422, detail="Geçersiz mülakat durumu.")
    supabase = get_supabase()
    if supabase:
        try:
            result = supabase.table("interviews").update({"status": update.status}).eq("id", id).execute()
            if not result.data:
                raise HTTPException(status_code=404, detail="Mülakat bulunamadı.")
            return _normalize_interview(result.data[0])
        except HTTPException:
            raise
        except Exception as exc:
            raise HTTPException(status_code=502, detail=f"Mülakat durumu kaydedilemedi: {exc}")
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; mülakat durumu kaydedilmedi.")

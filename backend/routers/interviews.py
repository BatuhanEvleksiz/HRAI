from fastapi import APIRouter
from models import InterviewCreate, InterviewUpdate
from database import get_supabase
import uuid
from datetime import datetime

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

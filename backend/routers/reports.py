from fastapi import APIRouter, HTTPException
from models import ReportCreate, ReportUpdate
from database import get_supabase
import uuid
from datetime import datetime

router = APIRouter()

demo_reports = [
    {
        "id": "rep-1",
        "title": "Demo Report",
        "position": "Backend",
        "filter_criteria": {},
        "matched_candidates": [],
        "ai_summary": "Demo summary",
        "created_at": datetime.now().isoformat()
    }
]

@router.post("/")
def save_report(report: ReportCreate):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("reports").insert(report.dict()).execute()
            return res.data[0]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Rapor kaydedilemedi: {exc}")
    return {**report.dict(), "id": str(uuid.uuid4()), "created_at": datetime.now().isoformat()}

@router.get("/")
def list_reports():
    supabase = get_supabase()
    if supabase:
        try:
            return supabase.table("reports").select("*").execute().data
        except Exception:
            pass
    return demo_reports

@router.get("/{id}")
def get_report(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("reports").select("*").eq("id", id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    return demo_reports[0]

@router.put("/{id}")
def update_report(id: str, report: ReportUpdate):
    payload = report.dict(exclude_unset=True)
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("reports").update(payload).eq("id", id).execute()
            if res.data:
                return res.data[0]
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Rapor güncellenemedi: {exc}")
    for index, item in enumerate(demo_reports):
        if item.get("id") == id:
            demo_reports[index] = {**item, **payload}
            return demo_reports[index]
    return {"id": id, **payload}

@router.delete("/{id}")
def delete_report(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("reports").delete().eq("id", id).execute()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Rapor silinemedi: {exc}")
    return {"message": "Deleted"}

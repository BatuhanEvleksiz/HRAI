from fastapi import APIRouter, HTTPException, Query
from models import ScoringWeights
from database import SUPABASE_KEY, SUPABASE_URL, get_database_status, get_supabase
from services.gemini_service import get_gemini_status
from services.nemo_service import get_nvidia_status

router = APIRouter()

@router.get("/api-status")
def api_status(test: bool = Query(False)):
    """Return configuration state; network checks only run when explicitly requested."""
    return {
        "nvidia": get_nvidia_status(test=test),
        "gemini": get_gemini_status(test=test),
        "supabase": get_database_status() if test else {
            "configured": bool(SUPABASE_URL and SUPABASE_KEY),
            "connected": None,
            "checked": False,
            "state": "configured" if SUPABASE_URL and SUPABASE_KEY else "missing",
        },
    }

@router.get("/weights")
def get_weights():
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("settings").select("*").eq("key", "weights").execute()
            if res.data:
                return res.data[0]["value"]
        except Exception:
            pass
    return ScoringWeights().dict()

@router.put("/weights")
def update_weights(weights: ScoringWeights):
    w_dict = weights.dict()
    if sum(w_dict.values()) != 100:
        raise HTTPException(status_code=400, detail="Total weights must be 100")
        
    supabase = get_supabase()
    if supabase:
        try:
            # Upsert
            supabase.table("settings").upsert({"key": "weights", "value": w_dict}).execute()
        except Exception:
            pass
    return w_dict

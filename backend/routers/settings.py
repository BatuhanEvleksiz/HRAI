from fastapi import APIRouter, HTTPException
from models import ScoringWeights
from database import get_supabase

router = APIRouter()

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

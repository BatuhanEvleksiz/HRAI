from fastapi import APIRouter
from models import MatchRequest, ScoringWeights
from services.scoring_engine import calculate_scores
from database import get_supabase
from routers.cv import demo_candidate
import copy

router = APIRouter()

@router.post("/match")
def match_candidates(req: MatchRequest):
    supabase = get_supabase()
    candidates = []
    if supabase:
        try:
            candidates = supabase.table("candidates").select("*").execute().data
        except Exception:
            candidates = []
    
    if not candidates:
        candidates = [copy.deepcopy(demo_candidate) for _ in range(10)]
        for i, c in enumerate(candidates):
            c["id"] = f"demo-{i}"
            c["full_name"] = f"Demo Candidate {i}"
            if i % 2 == 0:
                c["skills"] = ["python", "java"]
            else:
                c["skills"] = ["javascript", "react"]
    
    weights_dict = ScoringWeights().dict()
    if supabase:
        try:
            w_res = supabase.table("settings").select("*").eq("key", "weights").execute()
            if w_res.data:
                weights_dict = w_res.data[0]["value"]
        except Exception:
            pass
            
    results = calculate_scores(candidates, req.dict(), weights_dict)
    return results

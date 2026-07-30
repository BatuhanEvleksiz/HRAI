from fastapi import APIRouter
from models import MatchRequest, ScoringWeights
from services.scoring_engine import calculate_scores
from database import get_supabase
from routers.cv import build_candidate_radar, demo_candidate
import copy

router = APIRouter()

def _normalized_score(value, maximum):
    if not maximum:
        return None
    return round(max(0, min(10, (float(value or 0) / float(maximum)) * 10)), 1)

def _persist_match_radars(supabase, results, requirements, weights):
    required_years = float(requirements.get("required_experience_years") or 0)
    for item in results:
        candidate = item.get("candidate") or {}
        breakdown = item.get("score_breakdown") or {}
        radar = {**build_candidate_radar(candidate), **(candidate.get("radar_scores") or {})}
        if requirements.get("required_skills"):
            radar["technical_skills"] = _normalized_score(breakdown.get("skills"), weights.get("skill_weight"))
        if requirements.get("required_projects"):
            radar["project_experience"] = _normalized_score(breakdown.get("projects"), weights.get("project_weight"))
        if requirements.get("required_languages"):
            radar["language_proficiency"] = _normalized_score(breakdown.get("languages"), weights.get("language_weight"))
        if required_years > 0:
            radar["experience_level"] = round(min(10, (float(candidate.get("experience_years") or 0) / required_years) * 10), 1)
        radar["matched_position"] = requirements.get("position") or ""
        candidate["radar_scores"] = radar
        try:
            supabase.table("candidates").update({"radar_scores": radar}).eq("id", candidate.get("id")).execute()
        except Exception:
            continue

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
            
    requirements = req.dict()
    results = calculate_scores(candidates, requirements, weights_dict)
    if supabase:
        _persist_match_radars(supabase, results, requirements, weights_dict)
    return results

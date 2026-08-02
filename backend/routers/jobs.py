from fastapi import APIRouter, HTTPException

from database import get_supabase
from models import JobMatchRequest, JobPostingCreate, JobPostingUpdate
from services.candidate_quality import calculate_candidate_quality
from services.job_matching_engine import SCORING_VERSION, rank_candidates


router = APIRouter()
VALID_STATUSES = {"draft", "published", "closed"}


def _database():
    client = get_supabase()
    if not client:
        raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; iş ilanı işlemi yapılamadı.")
    return client


def _validate_status(status: str | None):
    if status is not None and status not in VALID_STATUSES:
        raise HTTPException(status_code=422, detail="İlan durumu draft, published veya closed olmalıdır.")


@router.get("/")
def list_jobs(status: str | None = None):
    _validate_status(status)
    try:
        query = _database().table("job_postings").select("*").order("created_at", desc=True)
        if status:
            query = query.eq("status", status)
        return query.execute().data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İş ilanları okunamadı: {exc}") from exc


@router.post("/")
def create_job(job: JobPostingCreate):
    payload = job.dict()
    _validate_status(payload.get("status"))
    try:
        response = _database().table("job_postings").insert(payload).execute()
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İş ilanı kaydedilemedi: {exc}") from exc


@router.get("/{job_id}")
def get_job(job_id: str):
    try:
        response = _database().table("job_postings").select("*").eq("id", job_id).limit(1).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="İş ilanı bulunamadı.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İş ilanı okunamadı: {exc}") from exc


@router.put("/{job_id}")
def update_job(job_id: str, job: JobPostingUpdate):
    payload = job.dict(exclude_unset=True)
    _validate_status(payload.get("status"))
    if not payload:
        return get_job(job_id)
    try:
        response = _database().table("job_postings").update(payload).eq("id", job_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="İş ilanı bulunamadı.")
        return response.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İş ilanı güncellenemedi: {exc}") from exc


@router.delete("/{job_id}")
def delete_job(job_id: str):
    try:
        _database().table("job_postings").delete().eq("id", job_id).execute()
        return {"message": "İş ilanı silindi."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İş ilanı silinemedi: {exc}") from exc


@router.get("/{job_id}/matches")
def get_latest_matches(job_id: str):
    client = _database()
    try:
        run = (
            client.table("matching_runs")
            .select("*")
            .eq("job_id", job_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if not run.data:
            return {"run": None, "results": []}
        results = (
            client.table("job_candidate_matches")
            .select("*, candidates(*)")
            .eq("run_id", run.data[0]["id"])
            .order("rank")
            .execute()
        )
        return {"run": run.data[0], "results": results.data}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Eşleştirme sonuçları okunamadı: {exc}") from exc


@router.post("/{job_id}/match")
def match_job(job_id: str, request: JobMatchRequest):
    client = _database()
    try:
        job_response = client.table("job_postings").select("*").eq("id", job_id).limit(1).execute()
        if not job_response.data:
            raise HTTPException(status_code=404, detail="İş ilanı bulunamadı.")
        job = job_response.data[0]

        candidate_query = client.table("candidates").select("*")
        if request.candidate_ids:
            candidate_query = candidate_query.in_("id", request.candidate_ids)
        candidates = candidate_query.execute().data
        if not candidates:
            raise HTTPException(status_code=422, detail="Eşleştirilecek kayıtlı aday bulunamadı.")

        for candidate in candidates:
            if candidate.get("quality_score") is None:
                quality = calculate_candidate_quality(candidate)
                candidate["quality_score"] = quality["score"]
                candidate["quality_breakdown"] = {
                    **quality["breakdown"],
                    "version": quality["version"],
                    "meaning": quality["meaning"],
                }
                client.table("candidates").update({
                    "quality_score": candidate["quality_score"],
                    "quality_breakdown": candidate["quality_breakdown"],
                }).eq("id", candidate["id"]).execute()

        ranked = rank_candidates(job, candidates)
        top_names = ", ".join(item["candidate"].get("full_name", "") for item in ranked[:3])
        run_summary = (
            f"{job['title']} ilanı için {len(ranked)} aday değerlendirildi. "
            f"İlk üç aday: {top_names or 'yok'}. Sonuçlar açıklanabilir {SCORING_VERSION} ile üretildi."
        )
        run_response = client.table("matching_runs").insert({
            "job_id": job_id,
            "status": "completed",
            "total_candidates": len(ranked),
            "ai_summary": run_summary,
            "scoring_version": SCORING_VERSION,
        }).execute()
        run = run_response.data[0]

        match_rows = []
        for item in ranked:
            match_rows.append({
                "run_id": run["id"],
                "job_id": job_id,
                "candidate_id": item["candidate"]["id"],
                "rank": item["rank"],
                "match_score": item["match_score"],
                "quality_score": item["quality_score"],
                "hybrid_score": item["hybrid_score"],
                "score_breakdown": item["score_breakdown"],
                "matched_requirements": item["matched_requirements"],
                "missing_requirements": item["missing_requirements"],
                "evaluation_summary": item["evaluation_summary"],
            })
        stored_matches = client.table("job_candidate_matches").insert(match_rows).execute().data

        report_candidates = [
            {
                "candidate_id": item["candidate"]["id"],
                "candidate_name": item["candidate"].get("full_name"),
                "score": item["hybrid_score"],
                "match_score": item["match_score"],
                "quality_score": item["quality_score"],
                "breakdown": item["score_breakdown"],
                "radar_scores": item["candidate"].get("radar_scores") or {},
                "matched_requirements": item["matched_requirements"],
                "missing_requirements": item["missing_requirements"],
                "evaluation_summary": item["evaluation_summary"],
            }
            for item in ranked
        ]
        report = client.table("reports").insert({
            "title": f"{job['title']} - İlan Aday Eşleştirme Raporu",
            "position": job["title"],
            "filter_criteria": {"job_id": job_id, "job": job, "run_id": run["id"]},
            "matched_candidates": report_candidates,
            "ai_summary": run_summary,
        }).execute().data[0]

        return {
            "job": job,
            "run": run,
            "results": [
                {**item, "stored_match_id": stored_matches[index].get("id") if index < len(stored_matches) else None}
                for index, item in enumerate(ranked)
            ],
            "report": report,
        }
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"İlan-CV eşleştirmesi tamamlanamadı: {exc}") from exc

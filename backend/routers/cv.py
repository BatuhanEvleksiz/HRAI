import asyncio
import hashlib
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import CandidateCreate, CandidateUpdate, CandidateResponse
from services.nemo_service import extract_document_from_pdf
from services.gemini_service import analyze_cv
from services.candidate_quality import calculate_candidate_quality
from database import get_supabase
import uuid
from datetime import datetime

router = APIRouter()


def _normalize_phone(value: str | None) -> str:
    return re.sub(r"\D", "", value or "")


def _find_existing_candidate(supabase, candidate: dict) -> dict | None:
    checks = []
    email = str(candidate.get("email") or "").strip().lower()
    phone = _normalize_phone(candidate.get("phone"))
    linkedin = str(candidate.get("linkedin_url") or "").strip().rstrip("/").lower()
    fingerprint = candidate.get("source_fingerprint")
    if email:
        checks.append(("email", email))
    if phone:
        checks.append(("phone", phone))
    if linkedin:
        checks.append(("linkedin_url", linkedin))
    if fingerprint:
        checks.append(("source_fingerprint", fingerprint))

    for field, value in checks:
        response = supabase.table("candidates").select("*").eq(field, value).limit(1).execute()
        if response.data:
            return response.data[0]
    return None

def build_candidate_radar(candidate: dict) -> dict:
    """Build a position-independent CV profile radar; interview signals stay empty."""
    skills = candidate.get("skills") or []
    projects = candidate.get("projects") or []
    years = max(0, float(candidate.get("experience_years") or 0))
    language_levels = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6}
    language_values = [
        language_levels.get(str(language.get("level", "")).lower(), 0)
        for language in (candidate.get("languages") or [])
    ]

    technical_skills = min(10, round(len(skills) * 1.1, 1))
    project_experience = min(10, round(len(projects) * 2.5 + min(years, 5) * 0.6, 1))
    experience_level = min(10, round(years * 1.7, 1))
    language_proficiency = round(
        (sum(language_values) / len(language_values) / 6) * 10, 1
    ) if language_values else None
    technical_depth = round((technical_skills + project_experience) / 2, 1)

    return {
        "technical_skills": technical_skills,
        "project_experience": project_experience,
        "experience_level": experience_level,
        "language_proficiency": language_proficiency,
        "communication_clarity": None,
        "technical_depth": technical_depth,
    }

demo_candidate = {
    "id": str(uuid.uuid4()),
    "full_name": "ahmet yılmaz",
    "email": "ahmet@example.com",
    "phone": "05321234567",
    "profession": "backend developer",
    "department": "bilgisayar mühendisliği",
    "university": "odtü",
    "location": "ankara, türkiye",
    "experience_years": 4,
    "linkedin_url": "https://linkedin.com/in/ahmetyilmaz",
    "github_url": "https://github.com/ahmetyilmaz",
    "portfolio_url": "",
    "skills": ["python", "java", "fastapi", "docker", "postgresql", "git", "redis", "kubernetes"],
    "languages": [{"language": "türkçe", "level": "c2"}, {"language": "ingilizce", "level": "b2"}, {"language": "almanca", "level": "a2"}],
    "certifications": [{"name": "aws certified developer", "issuer": "aws", "year": "2025"}],
    "projects": [
        {"title": "e-commerce microservices", "description": "built with fastapi", "technologies": "python, docker"},
        {"title": "cloud monitoring", "description": "aws monitoring", "technologies": "python, aws"},
        {"title": "chat app", "description": "real-time chat", "technologies": "python, redis"}
    ],
    "ai_summary": "ahmet is a strong backend developer with solid experience.",
    "raw_cv_text": "demo text",
    "original_filename": "demo.pdf",
    "status": "pending",
    "created_at": datetime.now().isoformat(),
    "updated_at": datetime.now().isoformat()
}

@router.post("/upload")
async def upload_cv(file: UploadFile = File(...)):
    filename = file.filename
    file_bytes = await file.read()
    try:
        document = await asyncio.wait_for(
            asyncio.to_thread(extract_document_from_pdf, file_bytes, True),
            timeout=180,
        )
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="NVIDIA NeMo OCR 180 saniyede tamamlanamadı.")
    except Exception as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    text = document.get("text", "")
    if not text:
        raise HTTPException(status_code=422, detail="PDF'den okunabilir metin çıkarılamadı.")

    try:
        data = await asyncio.wait_for(asyncio.to_thread(analyze_cv, text), timeout=180)
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="Gemini CV analizi yeniden denemelere rağmen tamamlanamadı.")
    except Exception as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
    analysis_meta = {**document.get("metadata", {}), **data.get("analysis_meta", {})}
    analysis_meta["pipeline_status"] = "success"
    data["analysis_meta"] = analysis_meta
    data["raw_cv_text"] = text
    data["original_filename"] = filename
    return data

@router.post("/save")
def save_candidate(candidate: CandidateCreate):
    c_dict = candidate.dict()
    if c_dict.get("raw_cv_text"):
        c_dict["source_fingerprint"] = hashlib.sha256(
            c_dict["raw_cv_text"].strip().encode("utf-8")
        ).hexdigest()
    if not c_dict.get("radar_scores"):
        c_dict["radar_scores"] = build_candidate_radar(c_dict)
    # Keep JSONB fields in the shape expected by the Supabase trigger/schema.
    for project in c_dict.get("projects") or []:
        technologies = project.get("technologies", [])
        if isinstance(technologies, str):
            project["technologies"] = [
                item.strip() for item in technologies.split(",") if item.strip()
            ]
        elif technologies is None:
            project["technologies"] = []
    for key in ("full_name", "email", "profession", "department", "university", "location"):
        if isinstance(c_dict.get(key), str):
            c_dict[key] = c_dict[key].strip().lower()
    if c_dict.get("phone"):
        c_dict["phone"] = _normalize_phone(c_dict["phone"])
    if c_dict.get("linkedin_url"):
        c_dict["linkedin_url"] = c_dict["linkedin_url"].strip().rstrip("/").lower()
    c_dict["skills"] = [str(value).lower() for value in c_dict.get("skills") or []]
    c_dict["languages"] = [
        {
            **item,
            "language": str(item.get("language", "")).lower(),
            "level": str(item.get("level", "")).lower(),
        }
        for item in c_dict.get("languages") or []
    ]
    c_dict["projects"] = [
        {
            **item,
            "title": str(item.get("title", "")).lower(),
            "technologies": [str(value).lower() for value in item.get("technologies") or []],
        }
        for item in c_dict.get("projects") or []
    ]
    quality = calculate_candidate_quality(c_dict)
    c_dict["quality_score"] = quality["score"]
    c_dict["quality_breakdown"] = {
        **quality["breakdown"],
        "version": quality["version"],
        "meaning": quality["meaning"],
    }

    supabase = get_supabase()
    if supabase:
        try:
            existing = _find_existing_candidate(supabase, c_dict)
            if existing:
                res = supabase.table("candidates").update(c_dict).eq("id", existing["id"]).execute()
                saved = res.data[0] if res.data else {**existing, **c_dict}
                return {**saved, "save_action": "updated"}
            res = supabase.table("candidates").insert(c_dict).execute()
            return {**res.data[0], "save_action": "created"}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Aday kaydedilemedi: {e}")
    
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; CV sahte olarak kaydedilmedi.")

@router.get("/")
def list_candidates(status: str = None):
    supabase = get_supabase()
    if supabase:
        try:
            q = supabase.table("candidates").select("*")
            if status:
                q = q.eq("status", status)
            return q.execute().data
        except Exception:
            pass
    raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; adaylar okunamadı.")

@router.get("/{id}")
def get_candidate(id: str):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; aday okunamadı.")
    try:
        res = supabase.table("candidates").select("*").eq("id", id).execute()
        if res.data:
            return res.data[0]
        raise HTTPException(status_code=404, detail="Aday bulunamadı.")
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Aday okunamadı: {exc}") from exc

@router.put("/{id}")
def update_candidate(id: str, candidate: CandidateUpdate):
    supabase = get_supabase()
    update_data = {k: v for k, v in candidate.dict(exclude_unset=True).items()}
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; aday güncellenemedi.")
    try:
        current = supabase.table("candidates").select("*").eq("id", id).limit(1).execute()
        if not current.data:
            raise HTTPException(status_code=404, detail="Aday bulunamadı.")
        merged = {**current.data[0], **update_data}
        quality = calculate_candidate_quality(merged)
        update_data["quality_score"] = quality["score"]
        update_data["quality_breakdown"] = {
            **quality["breakdown"],
            "version": quality["version"],
            "meaning": quality["meaning"],
        }
        res = supabase.table("candidates").update(update_data).eq("id", id).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Aday güncellemesi veritabanı tarafından doğrulanamadı.")
        return res.data[0]
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Aday güncellenemedi: {exc}") from exc

@router.delete("/{id}")
def delete_candidate(id: str):
    supabase = get_supabase()
    if not supabase:
        raise HTTPException(status_code=503, detail="Supabase bağlantısı yok; aday silinemedi.")
    try:
        existing = supabase.table("candidates").select("id").eq("id", id).limit(1).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Aday bulunamadı.")
        supabase.table("candidates").delete().eq("id", id).execute()
        return {"message": "Aday silindi."}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Aday silinemedi: {exc}") from exc

@router.post("/demo-analyze")
def demo_analyze():
    return demo_candidate

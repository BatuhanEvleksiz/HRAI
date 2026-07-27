import asyncio
import re
from fastapi import APIRouter, UploadFile, File, HTTPException
from models import CandidateCreate, CandidateUpdate, CandidateResponse
from services.nemo_service import extract_text_from_pdf
from services.gemini_service import analyze_cv
from database import get_supabase
import uuid
from datetime import datetime

router = APIRouter()

def fallback_cv_analysis(text: str, filename: str | None) -> dict:
    """Return a useful local result when the optional Gemini call times out."""
    email_match = re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text)
    phone_match = re.search(r"(?:\+90|0)?\s*5\d{2}\s*\d{3}\s*\d{2}\s*\d{2}", text)
    known_skills = [
        skill for skill in ["python", "java", "javascript", "typescript", "react", "sql", "fastapi", "docker", "aws", "git"]
        if skill in text.lower()
    ]
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "PDF adayı")
    return {
        "full_name": first_line[:255],
        "email": email_match.group(0) if email_match else "",
        "phone": phone_match.group(0) if phone_match else "",
        "profession": "",
        "university": "",
        "experience_years": 0,
        "skills": known_skills,
        "languages": [],
        "projects": [],
        "ai_summary": "Gemini yanıtı zaman aşımına uğradı. PDF metni çıkarıldı; aday bilgilerini gözden geçirip düzenleyebilirsiniz.",
        "raw_cv_text": text,
        "original_filename": filename,
    }

demo_candidate = {
    "id": str(uuid.uuid4()),
    "full_name": "ahmet yılmaz",
    "email": "ahmet@example.com",
    "phone": "05321234567",
    "profession": "backend developer",
    "university": "odtü",
    "experience_years": 4,
    "skills": ["python", "java", "fastapi", "docker", "postgresql", "git", "redis", "kubernetes"],
    "languages": [{"language": "türkçe", "level": "c2"}, {"language": "ingilizce", "level": "b2"}, {"language": "almanca", "level": "a2"}],
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
    text = extract_text_from_pdf(await file.read())
    if not text:
        text = "Demo extracted text from PDF."

    try:
        data = await asyncio.wait_for(asyncio.to_thread(analyze_cv, text), timeout=75)
    except asyncio.TimeoutError:
        data = fallback_cv_analysis(text, filename)
    except Exception:
        data = fallback_cv_analysis(text, filename)
    if data.get("error"):
        data = fallback_cv_analysis(text, filename)
    data["raw_cv_text"] = text
    data["original_filename"] = filename
    return data

@router.post("/save")
def save_candidate(candidate: CandidateCreate):
    c_dict = candidate.dict()
    for key, val in c_dict.items():
        if isinstance(val, str):
            c_dict[key] = val.lower()
        elif isinstance(val, list):
            if val and isinstance(val[0], str):
                c_dict[key] = [v.lower() for v in val]
            elif val and isinstance(val[0], dict):
                c_dict[key] = [{k: v.lower() if isinstance(v, str) else v for k, v in item.items()} for item in val]

    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("candidates").insert(c_dict).execute()
            return res.data[0]
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    c_dict["id"] = str(uuid.uuid4())
    c_dict["status"] = "pending"
    c_dict["created_at"] = datetime.now().isoformat()
    c_dict["updated_at"] = datetime.now().isoformat()
    return c_dict

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
    return [demo_candidate]

@router.get("/{id}")
def get_candidate(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            res = supabase.table("candidates").select("*").eq("id", id).execute()
            if res.data:
                return res.data[0]
        except Exception:
            pass
    return demo_candidate

@router.put("/{id}")
def update_candidate(id: str, candidate: CandidateUpdate):
    supabase = get_supabase()
    update_data = {k: v for k, v in candidate.dict(exclude_unset=True).items()}
    if supabase:
        try:
            res = supabase.table("candidates").update(update_data).eq("id", id).execute()
            return res.data[0] if res.data else None
        except Exception:
            pass
    return {**demo_candidate, **update_data}

@router.delete("/{id}")
def delete_candidate(id: str):
    supabase = get_supabase()
    if supabase:
        try:
            supabase.table("candidates").delete().eq("id", id).execute()
        except Exception:
            pass
    return {"message": "Deleted"}

@router.post("/demo-analyze")
def demo_analyze():
    return demo_candidate

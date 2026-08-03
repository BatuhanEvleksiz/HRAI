import os
import google.generativeai as genai
import json
import re
from google.api_core import retry as api_retry
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_INPUT_LIMIT = int(os.getenv("GEMINI_CV_INPUT_LIMIT", "60000"))
GEMINI_REQUEST_TIMEOUT = float(os.getenv("GEMINI_REQUEST_TIMEOUT", "70"))
GEMINI_RETRY_TIMEOUT = float(os.getenv("GEMINI_RETRY_TIMEOUT", "150"))
api_key = os.getenv("GEMINI_API_KEY")
if api_key and "your_" not in api_key:
    genai.configure(api_key=api_key)

CV_RESPONSE_SCHEMA = {
    "type": "object",
    "properties": {
        "full_name": {"type": "string"},
        "email": {"type": "string"},
        "phone": {"type": "string"},
        "profession": {"type": "string"},
        "department": {"type": "string"},
        "university": {"type": "string"},
        "location": {"type": "string"},
        "experience_years": {"type": "integer"},
        "linkedin_url": {"type": "string"},
        "github_url": {"type": "string"},
        "portfolio_url": {"type": "string"},
        "skills": {"type": "array", "items": {"type": "string"}},
        "languages": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {"language": {"type": "string"}, "level": {"type": "string"}},
                "required": ["language", "level"],
            },
        },
        "certifications": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "issuer": {"type": "string"},
                    "year": {"type": "string"},
                },
                "required": ["name", "issuer", "year"],
            },
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "technologies": {"type": "array", "items": {"type": "string"}},
                },
                "required": ["title", "description", "technologies"],
            },
        },
        "ai_summary": {"type": "string"},
    },
    "required": [
        "full_name", "email", "phone", "profession", "department", "university",
        "location", "experience_years", "linkedin_url", "github_url", "portfolio_url",
        "skills", "languages", "certifications", "projects", "ai_summary",
    ],
}


def analyze_cv(text: str) -> dict:
    if not api_key or "your_" in api_key:
        raise RuntimeError("CV analizi için GEMINI_API_KEY gerekli.")
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        cv_text = text[:GEMINI_INPUT_LIMIT]
        prompt = (
            "Aşağıdaki CV OCR çıktısını yapılandırılmış aday profiline dönüştür. "
            "NVIDIA OCR ve PDF metin katmanında tekrar eden bilgileri tekilleştir. "
            "CV'de açıkça bulunmayan hiçbir isim, bağlantı, sertifika, dil seviyesi veya deneyim uydurma. "
            "department alanı adayın eğitim bölümü/uzmanlık alanıdır; profession mevcut veya hedef iş unvanıdır. "
            "experience_years toplam profesyonel deneyimin tam yıl karşılığıdır. "
            "LinkedIn, GitHub ve portföy bağlantılarını tam URL olarak koru. Eksik alanlarda boş string veya boş liste kullan.\n\n"
            f"{cv_text}"
        )
        res = model.generate_content(
            prompt,
            generation_config={
                "temperature": 0,
                "response_mime_type": "application/json",
                "response_schema": CV_RESPONSE_SCHEMA,
            },
            request_options={
                "timeout": GEMINI_REQUEST_TIMEOUT,
                "retry": api_retry.Retry(
                    predicate=api_retry.if_transient_error,
                    initial=1.0,
                    maximum=8.0,
                    multiplier=2.0,
                    timeout=GEMINI_RETRY_TIMEOUT,
                ),
            },
        )
        data = json.loads(res.text.strip())
        data["analysis_meta"] = {
            "llm_provider": "google",
            "llm_model": GEMINI_MODEL,
            "llm_status": "success",
            "llm_input_chars": len(cv_text),
            "llm_input_truncated": len(text) > len(cv_text),
        }
        return data
    except Exception as exc:
        raise RuntimeError(f"Gemini CV analizi çalışmadı: {type(exc).__name__}: {exc}") from exc


def get_gemini_status() -> dict:
    return {
        "configured": bool(api_key and "your_" not in api_key),
        "model": GEMINI_MODEL,
    }

def generate_match_comment(candidate: dict, requirements: dict, score: float) -> str:
    if not api_key or "your_" in api_key:
        return f"Candidate scored {score}."
        
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"Write a short comment on why this candidate (score: {score}) fits these requirements: {requirements}. Candidate skills: {candidate.get('skills')}."
        res = model.generate_content(prompt)
        return res.text
    except Exception:
        return f"Candidate scored {score}."

def chat_with_db(user_message: str, schema_info: str) -> dict:
    if not api_key or "your_" in api_key:
        return {"ai_response": "Demo response to: " + user_message, "generated_sql": None}
        
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"Schema: {schema_info}\nUser: {user_message}\nAnswer the user or generate SQL."
        res = model.generate_content(prompt)
        return {"ai_response": res.text, "generated_sql": None}
    except Exception:
        return {"ai_response": "Error generating response", "generated_sql": None}

def demo_interview_analysis(transcript: str) -> dict:
    """Generate useful interview notes without spending an LLM token."""
    clean = " ".join(transcript.split())
    lower = clean.lower()
    strengths = [
        label for keyword, label in [
            ("python", "Python deneyimi"),
            ("java", "Java deneyimi"),
            ("react", "React deneyimi"),
            ("lider", "liderlik deneyimi"),
            ("takım", "takım çalışması"),
            ("proje", "proje deneyimi"),
        ] if keyword in lower
    ]
    strength_text = ", ".join(strengths[:3]) if strengths else "Teknik ve davranışsal yanıtları ayrıca değerlendirilmelidir"
    summary = f"Demo analiz: Görüşme {len(clean.split())} kelimelik bir döküm içeriyor. Öne çıkan başlıklar: {strength_text}."
    evaluation = "Adayın verdiği yanıtlar görüşme kaydı üzerinden incelenmelidir. "
    evaluation += "Yanıtlar somut örnekler ve deneyimlerle destekleniyorsa olumlu değerlendirme yapılabilir."
    return {
        "summary": summary,
        "general_evaluation": evaluation,
        "speaker_segments": [],
        "communication_signals": {},
    }


def speaker_segments_from_transcript(transcript: str) -> list[dict]:
    """Convert explicit Gemini turn labels into safe UI-ready segments."""
    segments = []
    for raw_line in transcript.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        match = re.match(r"^\[(INTERVIEWER|CANDIDATE|SPEAKER\s*\d+)\]\s*:?[\s-]*(.*)$", line, re.I)
        if match:
            speaker = match.group(1).lower().replace(" ", "_")
            text = match.group(2).strip()
        else:
            speaker = "unknown"
            text = line
        if text:
            segments.append({"speaker": speaker, "text": text})
    return segments

def analyze_interview(transcript: str, mode: str = "demo") -> dict:
    if mode != "llm" or not api_key or "your_" in api_key:
        return demo_interview_analysis(transcript)

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = (
            "Analyze this Turkish job interview transcript. Return JSON only with these fields: "
            "summary, general_evaluation, communication_signals, speaker_segments. "
            "communication_signals must contain expression_clarity, technical_depth, response_specificity, "
            "overall_signal as Low, Medium, or High, plus a short evidence list. Do not infer personality, "
            "mental state, protected traits, or emotion from text. speaker_segments must preserve each turn "
            "with speaker and text. Use transcript labels when present. Do not make unsupported claims.\n\n"
            "TRANSCRIPT:\n" + transcript
        )
        result = model.generate_content(prompt)
        text = result.text
        if "```json" in text:
            text = text.split("```json", 1)[1].split("```", 1)[0]
        parsed = json.loads(text.strip())
        return {
            "summary": parsed.get("summary", ""),
            "general_evaluation": parsed.get("general_evaluation", ""),
            "speaker_segments": parsed.get("speaker_segments") or speaker_segments_from_transcript(transcript),
            "communication_signals": parsed.get("communication_signals") or {},
        }
    except Exception:
        return demo_interview_analysis(transcript)

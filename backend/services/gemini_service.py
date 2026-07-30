import os
import google.generativeai as genai
import json
import re
from dotenv import load_dotenv

load_dotenv()

GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
api_key = os.getenv("GEMINI_API_KEY")
if api_key and "your_" not in api_key:
    genai.configure(api_key=api_key)

def analyze_cv(text: str) -> dict:
    if not api_key or "your_" in api_key:
        return {
            "full_name": "Demo Name",
            "email": "demo@example.com",
            "phone": "1234567890",
            "profession": "Demo Profession",
            "skills": ["demo skill"],
            "languages": [{"language": "english", "level": "b2"}],
            "projects": [],
            "ai_summary": "Demo summary"
        }
    
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = f"Extract structured data from the following CV. Return JSON with full_name, email, phone, profession, university, experience_years, skills (list of str), languages (list of dict with language, level), projects (list of dict with title, description, technologies), ai_summary.\n\n{text}"
        res = model.generate_content(prompt)
        text_res = res.text
        if "```json" in text_res:
            text_res = text_res.split("```json")[1].split("```")[0]
        return json.loads(text_res.strip())
    except Exception:
        return {"error": "Failed to analyze CV"}

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

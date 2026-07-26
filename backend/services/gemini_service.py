import os
import google.generativeai as genai
import json

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
        model = genai.GenerativeModel("gemini-1.5-flash")
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
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Write a short comment on why this candidate (score: {score}) fits these requirements: {requirements}. Candidate skills: {candidate.get('skills')}."
        res = model.generate_content(prompt)
        return res.text
    except Exception:
        return f"Candidate scored {score}."

def chat_with_db(user_message: str, schema_info: str) -> dict:
    if not api_key or "your_" in api_key:
        return {"ai_response": "Demo response to: " + user_message, "generated_sql": None}
        
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"Schema: {schema_info}\nUser: {user_message}\nAnswer the user or generate SQL."
        res = model.generate_content(prompt)
        return {"ai_response": res.text, "generated_sql": None}
    except Exception:
        return {"ai_response": "Error generating response", "generated_sql": None}

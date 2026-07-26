from fastapi import APIRouter
from models import ChatMessage
from services.gemini_service import chat_with_db
from database import get_supabase

router = APIRouter()

@router.post("/chat")
def chat(message: ChatMessage):
    supabase = get_supabase()
    # Simple schema mock
    schema_info = "candidates table: id, full_name, profession, status"
    response = chat_with_db(message.user_message, schema_info)
    
    if response.get("generated_sql") and supabase:
        # In a real app we might not execute raw SQL directly for security
        pass
        
    return response

@router.get("/history")
def get_history():
    return []

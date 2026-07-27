import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

def get_supabase() -> Client | None:
    if SUPABASE_URL and SUPABASE_KEY and "your_" not in SUPABASE_URL and "your_" not in SUPABASE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception:
            return None
    return None

def get_database_status() -> dict:
    client = get_supabase()
    if not client:
        return {"configured": False, "connected": False, "error": "SUPABASE_URL veya SUPABASE_KEY eksik."}
    try:
        client.table("candidates").select("id").limit(1).execute()
        return {"configured": True, "connected": True}
    except Exception as exc:
        return {"configured": True, "connected": False, "error": str(exc)[:240]}

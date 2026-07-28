import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

_raw_supabase_url = (os.getenv("SUPABASE_URL") or "").strip().rstrip("/")
SUPABASE_URL = _raw_supabase_url.removesuffix("/rest/v1")
SUPABASE_KEY = (os.getenv("SUPABASE_KEY") or "").strip()

def get_supabase() -> Client | None:
    if SUPABASE_URL and SUPABASE_KEY and "your_" not in SUPABASE_URL and "your_" not in SUPABASE_KEY:
        try:
            return create_client(SUPABASE_URL, SUPABASE_KEY)
        except Exception:
            return None
    return None

def get_database_status() -> dict:
    if not SUPABASE_URL or not SUPABASE_KEY:
        return {"configured": False, "connected": False, "error": "SUPABASE_URL veya SUPABASE_KEY eksik."}
    try:
        client = get_supabase()
        if not client:
            raise RuntimeError("Supabase client oluşturulamadı; URL veya key formatını kontrol edin.")
        client.table("candidates").select("id").limit(1).execute()
        return {"configured": True, "connected": True}
    except Exception as exc:
        return {"configured": True, "connected": False, "error": str(exc)[:240]}

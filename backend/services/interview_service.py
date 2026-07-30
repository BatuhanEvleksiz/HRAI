import os
import asyncio
import tempfile
import mimetypes
from typing import Any

import httpx
from dotenv import load_dotenv

load_dotenv()


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """Send audio to an optional WhisperX worker without storing the audio."""
    worker_url = os.getenv("WHISPER_SERVICE_URL")
    if not worker_url:
        return await asyncio.to_thread(_transcribe_with_gemini, file_bytes, filename)
    if not worker_url:
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or "your_" in api_key:
            raise RuntimeError("Ses transkripsiyonu için WHISPER_SERVICE_URL veya GEMINI_API_KEY gerekli.")
        try:
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            suffix = os.path.splitext(filename)[1] or ".audio"
            with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
                temp_file.write(file_bytes)
                temp_path = temp_file.name
            try:
                mime_type = mimetypes.guess_type(filename)[0] or "audio/mpeg"
                remote_file = genai.upload_file(path=temp_path, mime_type=mime_type)
                model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.5-flash"))
                result = model.generate_content([
                    remote_file,
                    "Transcribe this Turkish job interview completely. Return plain text only. Start every turn with exactly [INTERVIEWER] or [CANDIDATE]. Do not summarize or omit words. If the speaker role is uncertain, use [SPEAKER 1] or [SPEAKER 2] instead of guessing.",
                ])
                transcript = result.text.strip()
                if transcript:
                    return transcript
            finally:
                os.unlink(temp_path)
        except Exception as exc:
            raise RuntimeError(f"Ses Gemini ile metne dönüştürülemedi: {exc}") from exc

    async with httpx.AsyncClient(timeout=300) as client:
        response = await client.post(
            worker_url.rstrip("/") + "/transcribe",
            files={"file": (filename, file_bytes, "audio/*")},
        )
        response.raise_for_status()
        data: Any = response.json()
        transcript = data.get("transcript") if isinstance(data, dict) else None
        if not transcript:
            raise RuntimeError("Transkripsiyon servisi boş metin döndürdü.")
        return transcript

def _transcribe_with_gemini(file_bytes: bytes, filename: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "your_" in api_key:
        raise RuntimeError("Ses transkripsiyonu için WHISPER_SERVICE_URL veya GEMINI_API_KEY gerekli.")
    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        suffix = os.path.splitext(filename)[1] or ".audio"
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_file:
            temp_file.write(file_bytes)
            temp_path = temp_file.name
        try:
            mime_type = mimetypes.guess_type(filename)[0] or "audio/mpeg"
            remote_file = genai.upload_file(path=temp_path, mime_type=mime_type)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.5-flash"))
            result = model.generate_content([
                remote_file,
                "Transcribe this Turkish job interview completely. Return plain text only. Start every turn with exactly [INTERVIEWER] or [CANDIDATE]. Do not summarize or omit words. If the speaker role is uncertain, use [SPEAKER 1] or [SPEAKER 2] instead of guessing.",
            ])
            transcript = result.text.strip()
            if transcript:
                return transcript
            raise RuntimeError("Gemini boş transkripsiyon döndürdü.")
        finally:
            os.unlink(temp_path)
    except Exception as exc:
        raise RuntimeError(f"Ses Gemini ile metne dönüştürülemedi: {exc}") from exc

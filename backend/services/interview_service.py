import os
from typing import Any

import httpx


async def transcribe_audio(file_bytes: bytes, filename: str) -> str:
    """Send audio to an optional WhisperX worker without storing the audio."""
    worker_url = os.getenv("WHISPER_SERVICE_URL")
    if not worker_url:
        raise RuntimeError(
            "Ses transkripsiyon servisi yapılandırılmadı. Canlı mülakat için tarayıcı konuşma tanıma veya WHISPER_SERVICE_URL kullanın."
        )

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

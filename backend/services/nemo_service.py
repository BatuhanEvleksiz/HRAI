import os
import base64
from io import BytesIO

import fitz
import httpx
from pypdf import PdfReader

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "nvidia/nemotron-parse"

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract selectable PDF text, then use NVIDIA OCR for scanned PDFs."""
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if len(text) >= 40:
            return text
    except Exception as exc:
        text_error = str(exc)
    else:
        text_error = "PDF metni bulunamadı"

    api_key = (os.getenv("NVIDIA_API_KEY") or "").strip()
    if not api_key or "your_" in api_key:
        raise RuntimeError("Taranmış PDF için NVIDIA_API_KEY gerekli.")

    try:
        document = fitz.open(stream=file_bytes, filetype="pdf")
        page_texts = []
        for page_number, page in enumerate(document):
            if page_number >= 10:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.25, 1.25), alpha=False)
            image_b64 = base64.b64encode(pixmap.tobytes("jpeg", jpg_quality=70)).decode("ascii")
            prompt = (
                "Extract all visible text from this CV page. Preserve reading order. "
                "Return only the extracted text, with no commentary."
                f'<img src="data:image/jpeg;base64,{image_b64}" />'
            )
            response = httpx.post(
                NVIDIA_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": NVIDIA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4096,
                    "temperature": 0,
                },
                timeout=45,
            )
            response.raise_for_status()
            payload = response.json()
            content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content.strip():
                page_texts.append(content.strip())
        document.close()
        ocr_text = "\n\n".join(page_texts).strip()
        if ocr_text:
            return ocr_text
    except Exception as exc:
        raise RuntimeError(f"NVIDIA NeMo OCR başarısız oldu: {exc}") from exc

    raise RuntimeError(f"PDF metni çıkarılamadı: {text_error}")

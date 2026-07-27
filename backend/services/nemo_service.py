import os
from io import BytesIO

from pypdf import PdfReader

api_key = os.getenv("NVIDIA_API_KEY")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
        text = "\n".join(page.extract_text() or "" for page in reader.pages).strip()
        if text:
            return text
    except Exception:
        pass

    if not api_key or "your_" in api_key:
        return "Demo extracted text from PDF without API key."
        
    # Mocking actual API call as specifics aren't provided
    return "Extracted text via NeMo OCR."

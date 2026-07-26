import os

api_key = os.getenv("NVIDIA_API_KEY")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    if not api_key or "your_" in api_key:
        return "Demo extracted text from PDF without API key."
        
    # Mocking actual API call as specifics aren't provided
    return "Extracted text via NeMo OCR."

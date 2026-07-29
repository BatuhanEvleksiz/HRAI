import base64
import json
import os
import re
from io import BytesIO

import fitz
import httpx
from pypdf import PdfReader

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = "nvidia/nemotron-parse"


def _json_blocks(content: str) -> list[dict]:
    """Accept JSON blocks when the parser returns them, including fenced JSON."""
    cleaned = content.strip()
    if "```" in cleaned:
        cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned.strip(), flags=re.IGNORECASE).strip()
    try:
        value = json.loads(cleaned)
    except (TypeError, ValueError):
        return []
    if isinstance(value, dict):
        value = value.get("blocks") or value.get("elements") or value.get("items") or []
    return [item for item in value if isinstance(item, dict) and item.get("text")]


def _ordered_text(content: str) -> str:
    """Sort parser blocks by columns and coordinates before Gemini sees them."""
    blocks = _json_blocks(content)
    if not blocks:
        return content.strip()

    positioned = []
    for block in blocks:
        bbox = block.get("bbox") or block.get("bounding_box") or block.get("box")
        if not isinstance(bbox, (list, tuple)) or len(bbox) < 2:
            continue
        try:
            positioned.append((float(bbox[0]), float(bbox[1]), str(block["text"]).strip()))
        except (TypeError, ValueError):
            continue
    if len(positioned) < 2:
        return "\n".join(str(block["text"]).strip() for block in blocks)

    x_values = sorted(item[0] for item in positioned)
    max_x = max(x_values) or 1.0
    gaps = [(x_values[i + 1] - x_values[i], i) for i in range(len(x_values) - 1)]
    largest_gap, gap_index = max(gaps, default=(0.0, 0))
    split_columns = largest_gap > max_x * 0.18 and len(positioned) >= 4
    if split_columns:
        split_at = (x_values[gap_index] + x_values[gap_index + 1]) / 2
        left = sorted((item for item in positioned if item[0] <= split_at), key=lambda item: (item[1], item[0]))
        right = sorted((item for item in positioned if item[0] > split_at), key=lambda item: (item[1], item[0]))
        ordered = left + right
    else:
        ordered = sorted(positioned, key=lambda item: (item[1], item[0]))
    return "\n".join(item[2] for item in ordered if item[2])


def _selectable_pdf_text(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(BytesIO(file_bytes))
        return "\n".join(page.extract_text() or "" for page in reader.pages).strip()
    except Exception:
        return ""


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Use NVIDIA for every PDF when configured, preserving a real PDF fallback."""
    selectable_text = _selectable_pdf_text(file_bytes)
    api_key = (os.getenv("NVIDIA_API_KEY") or "").strip()
    if not api_key or "your_" in api_key:
        if selectable_text:
            return selectable_text
        raise RuntimeError("PDF OCR için NVIDIA_API_KEY gerekli.")

    try:
        document = fitz.open(stream=file_bytes, filetype="pdf")
        page_texts = []
        for page_number, page in enumerate(document):
            if page_number >= 10:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(1.1, 1.1), alpha=False)
            image_b64 = base64.b64encode(pixmap.tobytes("jpeg", jpg_quality=65)).decode("ascii")
            prompt = (
                "Read this CV page completely. Return ONLY a JSON array of objects. "
                "Each object must contain text, bbox as [x,y,width,height], and type. "
                "Keep every contact detail, language, education, skill and project. "
                f'<img src="data:image/jpeg;base64,{image_b64}" />'
            )
            response = httpx.post(
                NVIDIA_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": NVIDIA_MODEL,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 8192,
                    "temperature": 0,
                },
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
            if content.strip():
                page_texts.append(_ordered_text(content))
        document.close()
        nvidia_text = "\n\n".join(page_texts).strip()
        if nvidia_text:
            return nvidia_text
    except Exception:
        # A real selectable PDF is still more useful than failing the whole upload.
        if not selectable_text:
            raise RuntimeError("NVIDIA NeMo OCR başarısız oldu ve PDF metni bulunamadı.")

    return selectable_text

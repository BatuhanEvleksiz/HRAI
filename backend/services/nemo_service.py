import base64
import json
import os
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import re
from io import BytesIO

import fitz
import httpx
from pypdf import PdfReader

NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_MODEL = os.getenv("NVIDIA_OCR_MODEL", "nvidia/nemotron-parse")


def _json_value(content: str):
    """Accept JSON returned directly or inside a markdown fence."""
    cleaned = (content or "").strip()
    if "```" in cleaned:
        cleaned = re.sub(r"^```(?:json)?|```$", "", cleaned.strip(), flags=re.IGNORECASE).strip()
    try:
        return json.loads(cleaned)
    except (TypeError, ValueError):
        return None


def _json_blocks(value) -> list[dict]:
    """Normalize Nemotron tool arguments into a flat list of text blocks."""
    if isinstance(value, str):
        value = _json_value(value)
    if isinstance(value, dict):
        value = value.get("blocks") or value.get("elements") or value.get("items") or []
    while isinstance(value, list) and len(value) == 1 and isinstance(value[0], list):
        value = value[0]
    if not isinstance(value, list):
        return []
    return [item for item in value if isinstance(item, dict) and item.get("text")]


def _ordered_text(value) -> str:
    """Sort parser blocks by columns and coordinates before Gemini sees them."""
    blocks = _json_blocks(value)
    if not blocks:
        return value.strip() if isinstance(value, str) else ""

    positioned = []
    for block in blocks:
        bbox = block.get("bbox") or block.get("bounding_box") or block.get("box")
        try:
            if isinstance(bbox, dict):
                x = bbox.get("xmin", bbox.get("x", 0))
                y = bbox.get("ymin", bbox.get("y", 0))
            elif isinstance(bbox, (list, tuple)) and len(bbox) >= 2:
                x, y = bbox[0], bbox[1]
            else:
                continue
            positioned.append((float(x), float(y), str(block["text"]).strip()))
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


def _merge_document_text(nvidia_text: str, selectable_text: str) -> tuple[str, bool]:
    """Avoid sending near-identical OCR and native text layers to Gemini."""
    if not selectable_text:
        return "[NVIDIA NEMOTRON PARSE]\n" + nvidia_text, False

    token_pattern = r"[\w@.+:/-]+"
    nvidia_tokens = set(re.findall(token_pattern, nvidia_text.casefold()))
    native_tokens = set(re.findall(token_pattern, selectable_text.casefold()))
    smaller_layer_size = min(len(nvidia_tokens), len(native_tokens))
    overlap = (
        len(nvidia_tokens & native_tokens) / smaller_layer_size
        if smaller_layer_size
        else 0.0
    )
    if overlap >= 0.82:
        return "[NVIDIA NEMOTRON PARSE]\n" + nvidia_text, False

    return (
        "[NVIDIA NEMOTRON PARSE]\n"
        + nvidia_text
        + "\n\n[PDF TEXT LAYER]\n"
        + selectable_text,
        True,
    )


def _nemotron_blocks(message: dict) -> list[dict]:
    tool_calls = message.get("tool_calls") or []
    if tool_calls:
        arguments = tool_calls[0].get("function", {}).get("arguments", "")
        return _json_blocks(arguments)
    return _json_blocks(message.get("content", ""))


def extract_document_from_pdf(file_bytes: bytes, require_nvidia: bool = True) -> dict:
    """Extract every PDF page with Nemotron Parse and retain the native text layer."""
    selectable_text = _selectable_pdf_text(file_bytes)
    api_key = (os.getenv("NVIDIA_API_KEY") or "").strip()
    if not api_key or "your_" in api_key:
        raise RuntimeError("PDF OCR için NVIDIA_API_KEY gerekli.")

    document = None
    try:
        document = fitz.open(stream=file_bytes, filetype="pdf")
        page_texts = []
        page_count = min(len(document), 10)
        scale = max(1.5, min(float(os.getenv("NVIDIA_OCR_SCALE", "2.5")), 4.0))
        for page_number, page in enumerate(document):
            if page_number >= 10:
                break
            pixmap = page.get_pixmap(matrix=fitz.Matrix(scale, scale), alpha=False)
            image_b64 = base64.b64encode(pixmap.tobytes("jpeg", jpg_quality=82)).decode("ascii")
            response = httpx.post(
                NVIDIA_API_URL,
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "model": NVIDIA_MODEL,
                    "tools": [{"type": "function", "function": {"name": "markdown_bbox"}}],
                    "messages": [{
                        "role": "user",
                        "content": [{
                            "type": "image_url",
                            "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"},
                        }],
                    }],
                    "temperature": 0,
                    "max_tokens": 4096,
                },
                timeout=60,
            )
            response.raise_for_status()
            payload = response.json()
            message = payload.get("choices", [{}])[0].get("message", {})
            blocks = _nemotron_blocks(message)
            ordered_page = _ordered_text(blocks)
            if not ordered_page:
                raise RuntimeError(f"NVIDIA NeMo OCR {page_number + 1}. sayfada boş yanıt döndürdü.")
            page_texts.append(ordered_page)
        nvidia_text = "\n\n".join(page_texts).strip()
        if nvidia_text:
            combined_text, native_text_merged = _merge_document_text(
                nvidia_text,
                selectable_text,
            )
            return {
                "text": combined_text,
                "metadata": {
                    "ocr_provider": "nvidia",
                    "ocr_model": NVIDIA_MODEL,
                    "ocr_status": "success",
                    "ocr_pages": page_count,
                    "native_text_layer": bool(selectable_text),
                    "native_text_merged": native_text_merged,
                },
            }
        raise RuntimeError("NVIDIA NeMo OCR boş yanıt döndürdü.")
    except Exception as exc:
        if require_nvidia:
            raise RuntimeError(f"NVIDIA NeMo OCR çalışmadı: {type(exc).__name__}: {exc}") from exc
        if selectable_text:
            return {
                "text": selectable_text,
                "metadata": {
                    "ocr_provider": "pdf_text",
                    "ocr_model": None,
                    "ocr_status": "fallback",
                    "ocr_pages": 0,
                    "native_text_layer": True,
                },
            }
        raise RuntimeError("NVIDIA NeMo OCR başarısız oldu ve PDF metni bulunamadı.") from exc
    finally:
        if document is not None:
            document.close()


def extract_text_from_pdf(file_bytes: bytes) -> str:
    return extract_document_from_pdf(file_bytes)["text"]


def get_nvidia_status(test: bool = False) -> dict:
    api_key = (os.getenv("NVIDIA_API_KEY") or "").strip()
    configured = bool(api_key and "your_" not in api_key)
    result = {"configured": configured, "model": NVIDIA_MODEL, "checked": test}
    if not configured:
        result["state"] = "missing"
        result["error"] = "NVIDIA_API_KEY eksik."
        return result
    if not test:
        result["state"] = "configured"
        return result
    try:
        request = Request(
            "https://integrate.api.nvidia.com/v1/models",
            headers={"Authorization": f"Bearer {api_key}", "Accept": "application/json"},
        )
        with urlopen(request, timeout=8) as response:
            response.read()
        result["state"] = "connected"
    except (HTTPError, URLError, TimeoutError) as exc:
        result["state"] = "unreachable"
        result["error"] = f"{type(exc).__name__}: {exc}"[:240]
    return result

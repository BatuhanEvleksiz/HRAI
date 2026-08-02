from __future__ import annotations

import re
import unicodedata
from typing import Any


SCORING_VERSION = "explainable-job-match-v1"
LANGUAGE_LEVELS = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6, "native": 6, "anadil": 6}


def _normalize(value: Any) -> str:
    text = unicodedata.normalize("NFKD", str(value or "").lower())
    return "".join(char for char in text if not unicodedata.combining(char)).strip()


def _tokens(value: Any) -> set[str]:
    return {
        token for token in re.findall(r"[a-z0-9+#.]{2,}", _normalize(value))
        if token not in {"ve", "ile", "icin", "bir", "the", "and", "of", "to"}
    }


def _as_list(value: Any) -> list[Any]:
    return value if isinstance(value, list) else []


def _candidate_text(candidate: dict[str, Any]) -> str:
    projects = " ".join(
        " ".join([
            str(project.get("title", "")),
            str(project.get("description", "")),
            " ".join(project.get("technologies") or []),
        ])
        for project in _as_list(candidate.get("projects"))
    )
    certifications = " ".join(
        str(item.get("name", "")) if isinstance(item, dict) else str(item)
        for item in _as_list(candidate.get("certifications"))
    )
    return " ".join([
        str(candidate.get("profession", "")),
        str(candidate.get("department", "")),
        str(candidate.get("ai_summary", "")),
        str(candidate.get("raw_cv_text", "")),
        " ".join(candidate.get("skills") or []),
        projects,
        certifications,
    ])


def _job_text(job: dict[str, Any]) -> str:
    return " ".join([
        str(job.get("title", "")),
        str(job.get("department", "")),
        str(job.get("about", "")),
        " ".join(job.get("qualifications") or []),
        " ".join(job.get("responsibilities") or []),
        " ".join(job.get("required_skills") or []),
        " ".join(job.get("preferred_skills") or []),
    ])


def _ratio(found: set[str], requested: list[Any]) -> tuple[float, list[str], list[str]]:
    normalized = [(_normalize(item), str(item)) for item in requested if _normalize(item)]
    if not normalized:
        return 0, [], []
    matched = [label for key, label in normalized if key in found]
    missing = [label for key, label in normalized if key not in found]
    return len(matched) / len(normalized), matched, missing


def score_job_candidate(job: dict[str, Any], candidate: dict[str, Any]) -> dict[str, Any]:
    components: list[dict[str, Any]] = []
    matched_requirements: list[dict[str, str]] = []
    missing_requirements: list[dict[str, str]] = []

    candidate_skills = {_normalize(item) for item in candidate.get("skills") or []}
    required_ratio, matched, missing = _ratio(candidate_skills, job.get("required_skills") or [])
    if job.get("required_skills"):
        components.append({"key": "required_skills", "label": "Zorunlu yetkinlikler", "weight": 30, "ratio": required_ratio})
        matched_requirements.extend({"category": "Yetkinlik", "label": item} for item in matched)
        missing_requirements.extend({"category": "Yetkinlik", "label": item} for item in missing)

    preferred_ratio, matched, missing = _ratio(candidate_skills, job.get("preferred_skills") or [])
    if job.get("preferred_skills"):
        components.append({"key": "preferred_skills", "label": "Tercih edilen yetkinlikler", "weight": 10, "ratio": preferred_ratio})
        matched_requirements.extend({"category": "Tercih", "label": item} for item in matched)
        missing_requirements.extend({"category": "Tercih", "label": item} for item in missing)

    minimum = job.get("min_experience_years")
    maximum = job.get("max_experience_years")
    if minimum is not None or maximum is not None:
        years = max(0, float(candidate.get("experience_years") or 0))
        minimum = float(minimum or 0)
        maximum = float(maximum) if maximum is not None else None
        if years >= minimum and (maximum is None or years <= maximum):
            ratio = 1
        elif years < minimum:
            ratio = years / minimum if minimum else 1
        else:
            ratio = max(0.7, 1 - ((years - maximum) / max(maximum, 1)) * 0.1)
        label = f"{minimum:g}+ yil deneyim" if maximum is None else f"{minimum:g}-{maximum:g} yil deneyim"
        components.append({"key": "experience", "label": "Deneyim", "weight": 15, "ratio": ratio})
        target = matched_requirements if ratio >= 1 else missing_requirements
        target.append({"category": "Deneyim", "label": label})

    education_departments = job.get("education_departments") or []
    if education_departments:
        candidate_education = _normalize(" ".join([
            str(candidate.get("department", "")), str(candidate.get("university", ""))
        ]))
        matched = [item for item in education_departments if _normalize(item) in candidate_education]
        ratio = 1 if matched else 0
        components.append({"key": "education", "label": "Egitim", "weight": 10, "ratio": ratio})
        target = matched_requirements if matched else missing_requirements
        target.append({"category": "Egitim", "label": matched[0] if matched else " / ".join(education_departments)})

    language_requirements = job.get("language_requirements") or []
    if language_requirements:
        candidate_languages = {
            _normalize(item.get("language")): LANGUAGE_LEVELS.get(_normalize(item.get("level")), 0)
            for item in candidate.get("languages") or []
        }
        passed = 0
        for requirement in language_requirements:
            language = str(requirement.get("language", ""))
            level = str(requirement.get("level", ""))
            ok = candidate_languages.get(_normalize(language), 0) >= LANGUAGE_LEVELS.get(_normalize(level), 0)
            passed += int(ok)
            target = matched_requirements if ok else missing_requirements
            target.append({"category": "Dil", "label": f"{language} {level}".strip()})
        components.append({"key": "languages", "label": "Dil", "weight": 10, "ratio": passed / len(language_requirements)})

    requested_certs = job.get("preferred_certifications") or []
    if requested_certs:
        candidate_certs = {
            _normalize(item.get("name") if isinstance(item, dict) else item)
            for item in candidate.get("certifications") or []
        }
        ratio, matched, missing = _ratio(candidate_certs, requested_certs)
        components.append({"key": "certifications", "label": "Sertifikalar", "weight": 10, "ratio": ratio})
        matched_requirements.extend({"category": "Sertifika", "label": item} for item in matched)
        missing_requirements.extend({"category": "Sertifika", "label": item} for item in missing)

    job_tokens = _tokens(_job_text(job))
    candidate_tokens = _tokens(_candidate_text(candidate))
    if job_tokens:
        lexical_ratio = len(job_tokens & candidate_tokens) / len(job_tokens)
        components.append({"key": "relevance", "label": "CV-ilan metin ilgisi", "weight": 15, "ratio": min(lexical_ratio * 2.5, 1)})

    active_weight = sum(component["weight"] for component in components)
    if not active_weight:
        match_score = 0
    else:
        match_score = sum(component["weight"] * component["ratio"] for component in components) / active_weight * 100

    breakdown = {
        component["key"]: {
            "label": component["label"],
            "score": round(component["ratio"] * component["weight"], 1),
            "max": component["weight"],
            "percent": round(component["ratio"] * 100, 1),
        }
        for component in components
    }
    quality_score = float(candidate.get("quality_score") or 0)
    hybrid_score = match_score * 0.8 + quality_score * 0.2
    strongest = sorted(breakdown.values(), key=lambda value: value["percent"], reverse=True)[:2]
    weak_count = len(missing_requirements)
    summary = (
        f"Ilana uyum %{match_score:.0f}; profil kalitesi %{quality_score:.0f}. "
        f"Guclu alanlar: {', '.join(item['label'] for item in strongest) or 'yeterli veri yok'}. "
        f"Eksik veya teyit edilmesi gereken {weak_count} kriter bulunuyor."
    )
    return {
        "candidate": candidate,
        "match_score": round(match_score, 1),
        "quality_score": round(quality_score, 1),
        "hybrid_score": round(hybrid_score, 1),
        "score_breakdown": breakdown,
        "matched_requirements": matched_requirements,
        "missing_requirements": missing_requirements,
        "evaluation_summary": summary,
        "scoring_version": SCORING_VERSION,
    }


def rank_candidates(job: dict[str, Any], candidates: list[dict[str, Any]]) -> list[dict[str, Any]]:
    results = [score_job_candidate(job, candidate) for candidate in candidates]
    results.sort(key=lambda item: (item["hybrid_score"], item["match_score"]), reverse=True)
    for index, result in enumerate(results, start=1):
        result["rank"] = index
    return results

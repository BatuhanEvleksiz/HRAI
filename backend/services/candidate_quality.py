from __future__ import annotations

from typing import Any


QUALITY_VERSION = "profile-quality-v1"


def _present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    return bool(value)


def _component(label: str, score: float, maximum: float) -> dict[str, Any]:
    return {
        "label": label,
        "score": round(min(max(score, 0), maximum), 1),
        "max": maximum,
    }


def calculate_candidate_quality(candidate: dict[str, Any]) -> dict[str, Any]:
    """Measure CV completeness and evidence richness, independent of a job."""
    core_fields = (
        "full_name",
        "email",
        "phone",
        "profession",
        "department",
        "university",
        "location",
        "ai_summary",
    )
    completeness = 25 * sum(_present(candidate.get(key)) for key in core_fields) / len(core_fields)

    years = max(0, float(candidate.get("experience_years") or 0))
    experience = min(years / 5, 1) * 20

    skills = {str(item).strip().lower() for item in candidate.get("skills") or [] if str(item).strip()}
    skill_evidence = min(len(skills) / 8, 1) * 15

    projects = candidate.get("projects") or []
    detailed_projects = sum(
        1 for project in projects
        if _present(project.get("description")) or _present(project.get("technologies"))
    )
    project_evidence = min(len(projects) / 3, 1) * 8 + min(detailed_projects / 3, 1) * 7

    languages = candidate.get("languages") or []
    specified_languages = sum(
        1 for language in languages
        if _present(language.get("language")) and _present(language.get("level"))
    )
    language_evidence = min(specified_languages / 2, 1) * 10

    certifications = candidate.get("certifications") or []
    certification_evidence = min(len(certifications) / 2, 1) * 10

    links = ("linkedin_url", "github_url", "portfolio_url")
    professional_links = 5 * sum(_present(candidate.get(key)) for key in links) / len(links)

    breakdown = {
        "completeness": _component("Temel bilgi dolulugu", completeness, 25),
        "experience": _component("Deneyim kaniti", experience, 20),
        "skills": _component("Yetkinlik cesitliligi", skill_evidence, 15),
        "projects": _component("Proje kaniti", project_evidence, 15),
        "languages": _component("Dil bilgisi", language_evidence, 10),
        "certifications": _component("Sertifikalar", certification_evidence, 10),
        "professional_links": _component("Profesyonel baglantilar", professional_links, 5),
    }
    score = round(sum(item["score"] for item in breakdown.values()), 1)
    return {
        "score": score,
        "breakdown": breakdown,
        "version": QUALITY_VERSION,
        "meaning": "CV profil dolulugu ve kanit zenginligi; ise alim karari degildir.",
    }

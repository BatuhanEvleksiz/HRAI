def calculate_scores(candidates: list, requirements: dict, weights: dict) -> list[dict]:
    results = []
    
    req_skills = set([s.lower() for s in requirements.get("required_skills", [])])
    
    levels = {"a1": 1, "a2": 2, "b1": 3, "b2": 4, "c1": 5, "c2": 6}
    req_langs = {l["language"].lower(): levels.get(str(l.get("level", "")).lower(), 0) for l in requirements.get("required_languages", [])}
    
    req_uni = str(requirements.get("required_university", "")).lower()
    req_projs = [p.lower() for p in requirements.get("required_projects", [])]
    req_summary = [k.lower() for k in requirements.get("llm_summary_keywords", [])]
    
    for c in candidates:
        total = 0.0
        breakdown = {"skills": 0.0, "languages": 0.0, "university": 0.0, "projects": 0.0, "ai_summary": 0.0}
        skill_matches = []
        
        c_skills = set([s.lower() for s in c.get("skills", [])])
        if req_skills:
            matched = req_skills.intersection(c_skills)
            score = (len(matched) / len(req_skills)) * weights.get("skill_weight", 40)
            breakdown["skills"] = score
            for s in req_skills:
                skill_matches.append({"skill": s, "matched": s in c_skills})
        else:
            breakdown["skills"] = weights.get("skill_weight", 40)
            
        c_langs = {l["language"].lower(): levels.get(str(l.get("level", "")).lower(), 0) for l in c.get("languages", [])}
        if req_langs:
            lang_score = 0
            for l, req_lvl in req_langs.items():
                if l in c_langs and c_langs[l] >= req_lvl:
                    lang_score += 1
            breakdown["languages"] = (lang_score / len(req_langs)) * weights.get("language_weight", 10)
        else:
            breakdown["languages"] = weights.get("language_weight", 10)
            
        c_uni = str(c.get("university", "")).lower()
        if req_uni:
            if req_uni in c_uni or c_uni in req_uni:
                breakdown["university"] = weights.get("university_weight", 10)
        else:
            breakdown["university"] = weights.get("university_weight", 10)
            
        c_proj_text = " ".join([f"{p.get('title','')} {p.get('description','')} {p.get('technologies','')}".lower() for p in c.get("projects", [])])
        if req_projs:
            p_score = sum(1 for p in req_projs if p in c_proj_text)
            breakdown["projects"] = (p_score / len(req_projs)) * weights.get("project_weight", 20)
        else:
            breakdown["projects"] = weights.get("project_weight", 20)
            
        c_sum_text = str(c.get("ai_summary", "")).lower()
        if req_summary:
            s_score = sum(1 for s in req_summary if s in c_sum_text)
            breakdown["ai_summary"] = (s_score / len(req_summary)) * weights.get("llm_summary_weight", 20)
        else:
            breakdown["ai_summary"] = weights.get("llm_summary_weight", 20)
            
        total = sum(breakdown.values())
        
        results.append({
            "candidate": c,
            "total_score": round(total, 2),
            "score_breakdown": {k: round(v, 2) for k, v in breakdown.items()},
            "ai_comment": f"Candidate matched well.",
            "skill_matches": skill_matches
        })
        
    return sorted(results, key=lambda x: x["total_score"], reverse=True)

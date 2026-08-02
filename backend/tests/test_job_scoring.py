import unittest

from services.candidate_quality import calculate_candidate_quality
from services.job_matching_engine import rank_candidates


class JobScoringTests(unittest.TestCase):
    def setUp(self):
        self.candidate = {
            "id": "candidate-1",
            "full_name": "Ada Test",
            "email": "ada@example.com",
            "phone": "5551112233",
            "profession": "backend developer",
            "department": "bilgisayar muhendisligi",
            "university": "odtu",
            "location": "ankara",
            "experience_years": 5,
            "skills": ["python", "fastapi", "postgresql"],
            "languages": [{"language": "ingilizce", "level": "c1"}],
            "certifications": [{"name": "AWS"}],
            "projects": [{"title": "API", "description": "FastAPI servisi", "technologies": ["python"]}],
            "linkedin_url": "https://linkedin.com/in/ada",
            "ai_summary": "Backend sistemleri gelistirir.",
        }
        self.job = {
            "title": "Backend Developer",
            "required_skills": ["Python", "FastAPI"],
            "preferred_skills": ["Docker"],
            "min_experience_years": 3,
            "education_departments": ["Bilgisayar Muhendisligi"],
            "language_requirements": [{"language": "Ingilizce", "level": "B2"}],
            "preferred_certifications": ["AWS"],
            "qualifications": [],
            "responsibilities": [],
        }

    def test_quality_is_job_independent_and_explained(self):
        result = calculate_candidate_quality(self.candidate)
        self.assertGreater(result["score"], 50)
        self.assertEqual(result["version"], "profile-quality-v1")
        self.assertIn("projects", result["breakdown"])

    def test_matching_lists_met_and_missing_requirements(self):
        quality = calculate_candidate_quality(self.candidate)
        self.candidate["quality_score"] = quality["score"]
        result = rank_candidates(self.job, [self.candidate])[0]
        self.assertGreater(result["match_score"], 70)
        self.assertEqual(result["rank"], 1)
        self.assertTrue(any(item["label"] == "Python" for item in result["matched_requirements"]))
        self.assertTrue(any(item["label"] == "Docker" for item in result["missing_requirements"]))


if __name__ == "__main__":
    unittest.main()

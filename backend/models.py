from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class CandidateCreate(BaseModel):
    full_name: str
    email: str
    phone: Optional[str] = None
    profession: Optional[str] = None
    university: Optional[str] = None
    experience_years: Optional[int] = 0
    skills: List[str] = []
    languages: List[Dict[str, str]] = [] # {language, level}
    projects: List[Dict[str, Any]] = [] # {title, description, technologies}
    ai_summary: Optional[str] = None
    raw_cv_text: Optional[str] = None
    original_filename: Optional[str] = None
    radar_scores: Dict[str, Any] = Field(default_factory=dict)

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    profession: Optional[str] = None
    university: Optional[str] = None
    experience_years: Optional[int] = None
    skills: Optional[List[str]] = None
    languages: Optional[List[Dict[str, str]]] = None
    projects: Optional[List[Dict[str, Any]]] = None
    ai_summary: Optional[str] = None
    radar_scores: Optional[Dict[str, Any]] = None
    status: Optional[str] = None

class CandidateResponse(CandidateCreate):
    id: str
    status: str = "pending"
    created_at: datetime
    updated_at: datetime

class InterviewCreate(BaseModel):
    candidate_id: str
    interview_date: str
    interview_time: str
    position: Optional[str] = None
    notes: Optional[str] = None

class InterviewUpdate(BaseModel):
    status: Optional[str] = None
    is_completed: Optional[bool] = None
    notes: Optional[str] = None

class InterviewResponse(InterviewCreate):
    id: str
    status: str = "scheduled"
    is_completed: bool = False
    candidate_name: str
    created_at: datetime
    updated_at: datetime

class InterviewAnalysisRequest(BaseModel):
    transcript: str
    interview_id: Optional[str] = None
    candidate_id: Optional[str] = None
    mode: str = "demo"

class InterviewAnalysisCreate(BaseModel):
    interview_id: Optional[str] = None
    candidate_id: str
    transcript: str
    summary: str
    general_evaluation: str
    analysis_mode: str = "demo"
    speaker_segments: List[Dict[str, Any]] = Field(default_factory=list)
    communication_signals: Dict[str, Any] = Field(default_factory=dict)

class InterviewAnalysisResponse(InterviewAnalysisCreate):
    id: str
    created_at: datetime

class ReportCreate(BaseModel):
    title: str
    position: str
    filter_criteria: Dict[str, Any]
    matched_candidates: List[Dict[str, Any]]
    ai_summary: Optional[str] = None

class ReportUpdate(BaseModel):
    matched_candidates: Optional[List[Dict[str, Any]]] = None
    ai_summary: Optional[str] = None

class ReportResponse(ReportCreate):
    id: str
    created_at: datetime

class ScoringWeights(BaseModel):
    skill_weight: float = 40.0
    project_weight: float = 20.0
    llm_summary_weight: float = 20.0
    university_weight: float = 10.0
    language_weight: float = 10.0

class MatchRequest(BaseModel):
    position: str
    required_experience_years: Optional[float] = None
    required_skills: List[str] = []
    required_languages: List[Dict[str, str]] = []
    required_university: Optional[str] = None
    required_universities: List[str] = []
    required_projects: List[str] = []
    llm_summary_keywords: List[str] = []

class MatchResult(BaseModel):
    candidate: Dict[str, Any]
    total_score: float
    score_breakdown: Dict[str, float]
    ai_comment: str
    skill_matches: List[Dict[str, Any]]

class ChatMessage(BaseModel):
    user_message: str

class ChatResponse(BaseModel):
    ai_response: str
    generated_sql: Optional[str] = None

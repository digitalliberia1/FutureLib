from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.job import JobType, ExperienceLevel


class JobCreate(BaseModel):
    title: str
    description: str
    requirements: List[str] = []
    responsibilities: List[str] = []
    skills_required: List[str] = []
    job_type: JobType = JobType.FULL_TIME
    experience_level: ExperienceLevel = ExperienceLevel.MID
    education_required: Optional[str] = None
    county: Optional[str] = None
    city: Optional[str] = None
    is_remote: bool = False
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_negotiable: bool = True
    application_deadline: Optional[datetime] = None
    tags: List[str] = []


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    requirements: Optional[List[str]] = None
    skills_required: Optional[List[str]] = None
    status: Optional[str] = None
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None


class JobResponse(BaseModel):
    id: str
    employer_name: str
    employer_logo: Optional[str] = None
    is_government_post: bool
    title: str
    slug: str
    description: str
    skills_required: List[str]
    job_type: str
    experience_level: str
    county: Optional[str] = None
    is_remote: bool
    salary_min: Optional[float] = None
    salary_max: Optional[float] = None
    salary_negotiable: bool
    application_deadline: Optional[datetime] = None
    status: str
    applicant_count: int
    created_at: datetime


class JobApplicationCreate(BaseModel):
    cover_letter: Optional[str] = None
    portfolio_url: Optional[str] = None

from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class JobType(str, Enum):
    FULL_TIME = "Full-time"
    PART_TIME = "Part-time"
    CONTRACT = "Contract"
    INTERNSHIP = "Internship"
    FREELANCE = "Freelance"
    REMOTE = "Remote"
    GOVERNMENT = "Government"


class ExperienceLevel(str, Enum):
    ENTRY = "Entry Level"
    MID = "Mid Level"
    SENIOR = "Senior Level"
    EXECUTIVE = "Executive"


class JobStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    PAUSED = "paused"


class Job(Document):
    employer_id: str
    employer_name: str
    employer_logo: Optional[str] = None
    is_government_post: bool = False
    ministry: Optional[str] = None
    title: str
    slug: str
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
    salary_currency: str = "LRD"
    salary_negotiable: bool = True
    application_deadline: Optional[datetime] = None
    status: JobStatus = JobStatus.OPEN
    applicant_count: int = 0
    views: int = 0
    tags: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "jobs"
        indexes = ["employer_id", "status", "job_type", "county"]


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class JobApplication(Document):
    job_id: str
    job_title: str
    applicant_id: str
    applicant_name: str
    cover_letter: Optional[str] = None
    resume_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.APPLIED
    employer_notes: Optional[str] = None
    applied_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "job_applications"
        indexes = ["job_id", "applicant_id", "status"]

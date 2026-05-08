from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class GrantType(str, Enum):
    YOUTH_EMPOWERMENT = "Youth Empowerment"
    WOMEN_IN_TECH = "Women in Tech"
    STARTUP_SEED = "Startup Seed"
    AGRICULTURE = "Agriculture"
    EDUCATION = "Education"
    DIGITAL_SKILLS = "Digital Skills"
    SME = "SME Financing"
    RESEARCH = "Research & Innovation"


class GrantStatus(str, Enum):
    OPEN = "open"
    CLOSED = "closed"
    UPCOMING = "upcoming"


class Grant(Document):
    title: str
    description: str
    grant_type: GrantType
    ministry: str
    amount_min: float
    amount_max: float
    currency: str = "LRD"
    eligibility_criteria: List[str] = []
    required_documents: List[str] = []
    application_deadline: Optional[datetime] = None
    status: GrantStatus = GrantStatus.OPEN
    total_slots: Optional[int] = None
    applications_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "grants"
        indexes = ["grant_type", "status"]


class GrantApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"


class GrantApplication(Document):
    grant_id: str
    grant_title: str
    applicant_id: str
    applicant_name: str
    startup_id: Optional[str] = None
    amount_requested: float
    project_description: str
    impact_statement: str
    documents_submitted: List[str] = []
    status: GrantApplicationStatus = GrantApplicationStatus.SUBMITTED
    reviewer_notes: Optional[str] = None
    amount_approved: Optional[float] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    decision_at: Optional[datetime] = None

    class Settings:
        name = "grant_applications"
        indexes = ["grant_id", "applicant_id", "status"]

from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class StartupStage(str, Enum):
    IDEA = "idea"
    PROTOTYPE = "prototype"
    MVP = "mvp"
    EARLY_REVENUE = "early_revenue"
    GROWTH = "growth"
    SCALE = "scale"


class StartupSector(str, Enum):
    AGRITECH = "AgriTech"
    EDTECH = "EdTech"
    FINTECH = "FinTech"
    HEALTHTECH = "HealthTech"
    CLEANTECH = "CleanTech"
    ECOMMERCE = "E-commerce"
    LOGISTICS = "Logistics"
    MEDIA = "Media & Entertainment"
    GOVTECH = "GovTech"
    MANUFACTURING = "Manufacturing"
    TOURISM = "Tourism"
    OTHER = "Other"


class StartupStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    CLOSED = "closed"


class TeamMember(Document):
    name: str
    role: str
    email: Optional[str] = None
    linkedin_url: Optional[str] = None


class Startup(Document):
    founder_id: str
    founder_name: str
    name: str
    slug: str
    tagline: Optional[str] = None
    description: str
    sector: StartupSector
    stage: StartupStage = StartupStage.IDEA
    status: StartupStatus = StartupStatus.PENDING_REVIEW
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    pitch_deck_url: Optional[str] = None
    county: Optional[str] = None
    city: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: int = 1
    team_members: List[TeamMember] = []
    tags: List[str] = []
    social_links: dict = {}
    metrics: dict = {}
    total_funding_received: float = 0.0
    is_hiring: bool = False
    registration_number: Optional[str] = None
    tax_id: Optional[str] = None
    government_verified: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "startups"
        indexes = ["founder_id", "sector", "stage", "status"]


class FundingType(str, Enum):
    GRANT = "grant"
    LOAN = "loan"
    EQUITY = "equity"
    PRIZE = "prize"


class ApplicationStatus(str, Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    SHORTLISTED = "shortlisted"
    APPROVED = "approved"
    REJECTED = "rejected"
    DISBURSED = "disbursed"


class FundingApplication(Document):
    startup_id: str
    startup_name: str
    applicant_id: str
    funding_type: FundingType
    program_name: str
    amount_requested: float
    amount_approved: Optional[float] = None
    purpose: str
    business_plan_url: Optional[str] = None
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    reviewer_id: Optional[str] = None
    reviewer_notes: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    decision_at: Optional[datetime] = None

    class Settings:
        name = "funding_applications"
        indexes = ["startup_id", "applicant_id", "status"]

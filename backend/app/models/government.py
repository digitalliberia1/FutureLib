from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ServiceCategory(str, Enum):
    BUSINESS_LICENSE = "Business License"
    TAX_SERVICES = "Tax Services"
    EDUCATION = "Education"
    HEALTHCARE = "Healthcare"
    PERMITS = "Permits"
    IDENTIFICATION = "Identification"
    SOCIAL_SERVICES = "Social Services"
    INFRASTRUCTURE = "Infrastructure"
    LEGAL = "Legal"
    AGRICULTURE = "Agriculture"


class ServiceStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    MAINTENANCE = "maintenance"


class GovernmentService(Document):
    name: str
    slug: str
    description: str
    category: ServiceCategory
    ministry: str
    status: ServiceStatus = ServiceStatus.ACTIVE
    icon: Optional[str] = None
    required_documents: List[str] = []
    processing_days: int = 5
    fee: float = 0.0
    fee_currency: str = "LRD"
    eligibility_criteria: Optional[str] = None
    instructions: Optional[str] = None
    form_fields: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "government_services"
        indexes = ["category", "ministry", "status"]


class ApplicationStatus(str, Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ADDITIONAL_INFO_REQUIRED = "additional_info_required"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"


class ServiceApplication(Document):
    service_id: str
    service_name: str
    applicant_id: str
    applicant_name: str
    reference_number: str
    status: ApplicationStatus = ApplicationStatus.SUBMITTED
    form_data: dict = {}
    documents_submitted: List[str] = []
    officer_id: Optional[str] = None
    officer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reviewed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    timeline: List[dict] = []

    class Settings:
        name = "service_applications"
        indexes = ["applicant_id", "service_id", "status", "reference_number"]

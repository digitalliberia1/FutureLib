from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class PolicyStatus(str, Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    ACTIVE = "active"
    SUPERSEDED = "superseded"
    ARCHIVED = "archived"


class RiskLevel(str, Enum):
    MINIMAL = "minimal"
    LIMITED = "limited"
    HIGH = "high"
    UNACCEPTABLE = "unacceptable"


class AIPolicy(Document):
    title: str
    description: str
    policy_type: str                      # "regulation", "guideline", "standard", "framework"
    status: PolicyStatus = PolicyStatus.DRAFT
    version: str = "1.0"
    authored_by: str
    author_name: str
    scope: List[str] = []                 # sectors/domains it applies to
    key_principles: List[str] = []
    enforcement_body: str = "Ministry of Digital Affairs"
    published_at: Optional[datetime] = None
    effective_date: Optional[str] = None
    review_date: Optional[str] = None
    created_at: datetime = None
    updated_at: datetime = None

    class Settings:
        name = "ai_policies"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


class AIModel(Document):
    name: str
    description: str
    model_type: str                       # "classification", "nlp", "cv", "generative", "predictive"
    use_case: str
    deploying_org: str
    risk_level: RiskLevel = RiskLevel.LIMITED
    is_approved: bool = False
    approved_by: Optional[str] = None
    training_data_description: str = ""
    bias_assessment: Optional[str] = None
    explainability_score: Optional[float] = None   # 0-100
    accuracy_score: Optional[float] = None
    in_production: bool = False
    version: str = "1.0"
    registered_by: str
    created_at: datetime = None
    updated_at: datetime = None

    class Settings:
        name = "ai_models_registry"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


class AIAudit(Document):
    model_id: str
    model_name: str
    auditor_id: str
    auditor_name: str
    audit_type: str                       # "initial", "periodic", "incident", "compliance"
    findings: List[str] = []
    recommendations: List[str] = []
    risk_assessment: RiskLevel
    overall_score: float = 0.0           # 0-100
    passed: bool = False
    notes: Optional[str] = None
    created_at: datetime = None

    class Settings:
        name = "ai_audits"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)

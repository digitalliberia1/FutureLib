from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ServiceApplicationCreate(BaseModel):
    service_id: str
    form_data: dict = {}


class ServiceApplicationUpdate(BaseModel):
    status: Optional[str] = None
    officer_notes: Optional[str] = None
    rejection_reason: Optional[str] = None


class ServiceApplicationResponse(BaseModel):
    id: str
    service_name: str
    applicant_name: str
    reference_number: str
    status: str
    submitted_at: datetime
    timeline: List[dict]


class GovernmentServiceResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    category: str
    ministry: str
    status: str
    required_documents: List[str]
    processing_days: int
    fee: float
    fee_currency: str
    eligibility_criteria: Optional[str] = None

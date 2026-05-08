from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.startup import StartupStage, StartupSector, FundingType


class StartupCreate(BaseModel):
    name: str
    tagline: Optional[str] = None
    description: str
    sector: StartupSector
    stage: StartupStage = StartupStage.IDEA
    county: Optional[str] = None
    city: Optional[str] = None
    founded_year: Optional[int] = None
    employee_count: int = 1
    website_url: Optional[str] = None
    tags: List[str] = []


class StartupUpdate(BaseModel):
    name: Optional[str] = None
    tagline: Optional[str] = None
    description: Optional[str] = None
    sector: Optional[StartupSector] = None
    stage: Optional[StartupStage] = None
    county: Optional[str] = None
    city: Optional[str] = None
    employee_count: Optional[int] = None
    website_url: Optional[str] = None
    is_hiring: Optional[bool] = None
    tags: Optional[List[str]] = None


class StartupResponse(BaseModel):
    id: str
    founder_name: str
    name: str
    slug: str
    tagline: Optional[str] = None
    description: str
    sector: str
    stage: str
    status: str
    logo_url: Optional[str] = None
    website_url: Optional[str] = None
    county: Optional[str] = None
    employee_count: int
    total_funding_received: float
    is_hiring: bool
    government_verified: bool
    created_at: datetime


class FundingApplicationCreate(BaseModel):
    startup_id: str
    funding_type: FundingType
    program_name: str
    amount_requested: float
    purpose: str


class GrantApplicationCreate(BaseModel):
    grant_id: str
    startup_id: Optional[str] = None
    amount_requested: float
    project_description: str
    impact_statement: str

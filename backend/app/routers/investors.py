from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from beanie import Document
from pydantic import Field
from app.models.startup import Startup, StartupStatus
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/investors", tags=["Investor Portal"])


class InvestorInterest(Document):
    investor_id: str
    investor_name: str
    startup_id: str
    startup_name: str
    message: Optional[str] = None
    investment_range_min: Optional[float] = None
    investment_range_max: Optional[float] = None
    status: str = "expressed"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "investor_interests"


class InterestRequest(BaseModel):
    startup_id: str
    message: Optional[str] = None
    investment_range_min: Optional[float] = None
    investment_range_max: Optional[float] = None


@router.get("/startups")
async def browse_startups_as_investor(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=50),
    sector: Optional[str] = None,
    stage: Optional[str] = None,
    county: Optional[str] = None,
    government_verified: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
):
    filters = [Startup.status == StartupStatus.ACTIVE]
    if sector:
        filters.append(Startup.sector == sector)
    if stage:
        filters.append(Startup.stage == stage)
    if county:
        filters.append(Startup.county == county)
    if government_verified is not None:
        filters.append(Startup.government_verified == government_verified)

    query = Startup.find(*filters)
    total = await query.count()
    startups = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "startups": [
            {
                "id": str(s.id),
                "name": s.name,
                "slug": s.slug,
                "tagline": s.tagline,
                "description": s.description,
                "sector": s.sector,
                "stage": s.stage,
                "county": s.county,
                "logo_url": s.logo_url,
                "website_url": s.website_url,
                "pitch_deck_url": s.pitch_deck_url,
                "employee_count": s.employee_count,
                "founded_year": s.founded_year,
                "total_funding_received": s.total_funding_received,
                "government_verified": s.government_verified,
                "is_hiring": s.is_hiring,
                "metrics": s.metrics,
                "tags": s.tags,
            }
            for s in startups
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.post("/interest")
async def express_interest(body: InterestRequest, current_user: User = Depends(get_current_user)):
    startup = await Startup.get(body.startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")

    existing = await InvestorInterest.find_one(
        InvestorInterest.investor_id == str(current_user.id),
        InvestorInterest.startup_id == body.startup_id,
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already expressed interest in this startup")

    interest = InvestorInterest(
        investor_id=str(current_user.id),
        investor_name=current_user.full_name,
        startup_id=body.startup_id,
        startup_name=startup.name,
        message=body.message,
        investment_range_min=body.investment_range_min,
        investment_range_max=body.investment_range_max,
    )
    await interest.insert()
    return {"message": "Interest expressed successfully. The startup team will be notified."}


@router.get("/my-interests")
async def my_interests(current_user: User = Depends(get_current_user)):
    interests = await InvestorInterest.find(
        InvestorInterest.investor_id == str(current_user.id)
    ).to_list()
    return {
        "interests": [
            {
                "id": str(i.id),
                "startup_id": i.startup_id,
                "startup_name": i.startup_name,
                "message": i.message,
                "investment_range_min": i.investment_range_min,
                "investment_range_max": i.investment_range_max,
                "status": i.status,
                "created_at": i.created_at,
            }
            for i in interests
        ]
    }


@router.get("/startup/{startup_id}/interests")
async def startup_interests(startup_id: str, current_user: User = Depends(get_current_user)):
    startup = await Startup.get(startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    if str(startup.founder_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    interests = await InvestorInterest.find(InvestorInterest.startup_id == startup_id).to_list()
    return {
        "interests": [
            {
                "id": str(i.id),
                "investor_name": i.investor_name,
                "message": i.message,
                "investment_range_min": i.investment_range_min,
                "investment_range_max": i.investment_range_max,
                "status": i.status,
                "created_at": i.created_at,
            }
            for i in interests
        ]
    }

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional
import re
from datetime import datetime, timezone
from app.models.startup import Startup, FundingApplication, StartupStatus, ApplicationStatus
from app.models.grant import Grant, GrantApplication, GrantStatus, GrantApplicationStatus
from app.models.user import User
from app.schemas.startup import StartupCreate, StartupUpdate, FundingApplicationCreate, GrantApplicationCreate
from app.middleware.auth import get_current_user, require_official, require_admin

router = APIRouter(prefix="/startups", tags=["Startup Ecosystem"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


@router.get("/")
async def list_startups(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    sector: Optional[str] = None,
    stage: Optional[str] = None,
    is_hiring: Optional[bool] = None,
    county: Optional[str] = None,
):
    filters = [Startup.status == StartupStatus.ACTIVE]
    if sector:
        filters.append(Startup.sector == sector)
    if stage:
        filters.append(Startup.stage == stage)
    if is_hiring is not None:
        filters.append(Startup.is_hiring == is_hiring)
    if county:
        filters.append(Startup.county == county)

    query = Startup.find(*filters)
    total = await query.count()
    startups = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "startups": [_startup_dict(s) for s in startups],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{startup_id}")
async def get_startup(startup_id: str):
    startup = await Startup.get(startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    return _startup_dict(startup)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def register_startup(body: StartupCreate, current_user: User = Depends(get_current_user)):
    slug = slugify(body.name)
    existing = await Startup.find_one(Startup.slug == slug)
    if existing:
        slug = f"{slug}-{str(current_user.id)[:6]}"

    startup = Startup(
        **body.model_dump(),
        slug=slug,
        founder_id=str(current_user.id),
        founder_name=current_user.full_name,
    )
    await startup.insert()
    return {"message": "Startup registered. Pending government review.", "startup_id": str(startup.id)}


@router.put("/{startup_id}")
async def update_startup(startup_id: str, body: StartupUpdate, current_user: User = Depends(get_current_user)):
    startup = await Startup.get(startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    if str(startup.founder_id) != str(current_user.id) and current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(startup, key, value)
    startup.updated_at = datetime.now(timezone.utc)
    await startup.save()
    return {"message": "Startup updated"}


@router.post("/{startup_id}/verify", dependencies=[Depends(require_official)])
async def verify_startup(startup_id: str):
    startup = await Startup.get(startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    startup.government_verified = True
    startup.status = StartupStatus.ACTIVE
    await startup.save()
    return {"message": "Startup verified by government"}


@router.get("/my/startups")
async def my_startups(current_user: User = Depends(get_current_user)):
    startups = await Startup.find(Startup.founder_id == str(current_user.id)).to_list()
    return {"startups": [_startup_dict(s) for s in startups]}


# ── Funding Applications ──────────────────────────────────────────────────────

@router.post("/funding/apply", status_code=status.HTTP_201_CREATED)
async def apply_for_funding(body: FundingApplicationCreate, current_user: User = Depends(get_current_user)):
    startup = await Startup.get(body.startup_id)
    if not startup:
        raise HTTPException(status_code=404, detail="Startup not found")
    if str(startup.founder_id) != str(current_user.id):
        raise HTTPException(status_code=403, detail="Not your startup")

    application = FundingApplication(
        **body.model_dump(),
        startup_name=startup.name,
        applicant_id=str(current_user.id),
    )
    await application.insert()
    return {"message": "Funding application submitted", "application_id": str(application.id)}


@router.get("/funding/my-applications")
async def my_funding_applications(current_user: User = Depends(get_current_user)):
    apps = await FundingApplication.find(FundingApplication.applicant_id == str(current_user.id)).to_list()
    return {"applications": [_funding_dict(a) for a in apps]}


@router.get("/funding/applications", dependencies=[Depends(require_official)])
async def all_funding_applications(status: Optional[str] = None):
    filters = []
    if status:
        filters.append(FundingApplication.status == status)
    apps = await FundingApplication.find(*filters).to_list()
    return {"applications": [_funding_dict(a) for a in apps]}


@router.patch("/funding/{application_id}/review", dependencies=[Depends(require_official)])
async def review_funding_application(
    application_id: str,
    new_status: ApplicationStatus,
    notes: Optional[str] = None,
    amount_approved: Optional[float] = None,
    current_user: User = Depends(get_current_user),
):
    app = await FundingApplication.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    app.status = new_status
    app.reviewer_id = str(current_user.id)
    app.reviewer_notes = notes
    if amount_approved:
        app.amount_approved = amount_approved
    app.reviewed_at = datetime.now(timezone.utc)
    await app.save()
    return {"message": "Application reviewed"}


# ── Grants ────────────────────────────────────────────────────────────────────

@router.get("/grants/list")
async def list_grants(grant_type: Optional[str] = None):
    filters = [Grant.status == GrantStatus.OPEN]
    if grant_type:
        filters.append(Grant.grant_type == grant_type)
    grants = await Grant.find(*filters).to_list()
    return {"grants": [_grant_dict(g) for g in grants]}


@router.post("/grants/apply", status_code=status.HTTP_201_CREATED)
async def apply_for_grant(body: GrantApplicationCreate, current_user: User = Depends(get_current_user)):
    grant = await Grant.get(body.grant_id)
    if not grant:
        raise HTTPException(status_code=404, detail="Grant not found")
    if grant.status != GrantStatus.OPEN:
        raise HTTPException(status_code=400, detail="Grant is not open for applications")

    application = GrantApplication(
        **body.model_dump(),
        grant_title=grant.title,
        applicant_id=str(current_user.id),
        applicant_name=current_user.full_name,
    )
    await application.insert()

    grant.applications_count += 1
    await grant.save()
    return {"message": "Grant application submitted", "application_id": str(application.id)}


@router.post("/grants", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_official)])
async def create_grant(body: dict):
    grant = Grant(**body)
    await grant.insert()
    return {"message": "Grant created", "grant_id": str(grant.id)}


def _startup_dict(s: Startup) -> dict:
    return {
        "id": str(s.id),
        "founder_name": s.founder_name,
        "name": s.name,
        "slug": s.slug,
        "tagline": s.tagline,
        "description": s.description,
        "sector": s.sector,
        "stage": s.stage,
        "status": s.status,
        "logo_url": s.logo_url,
        "website_url": s.website_url,
        "county": s.county,
        "employee_count": s.employee_count,
        "total_funding_received": s.total_funding_received,
        "is_hiring": s.is_hiring,
        "government_verified": s.government_verified,
        "tags": s.tags,
        "created_at": s.created_at,
    }


def _funding_dict(a: FundingApplication) -> dict:
    return {
        "id": str(a.id),
        "startup_name": a.startup_name,
        "funding_type": a.funding_type,
        "program_name": a.program_name,
        "amount_requested": a.amount_requested,
        "amount_approved": a.amount_approved,
        "status": a.status,
        "submitted_at": a.submitted_at,
    }


def _grant_dict(g: Grant) -> dict:
    return {
        "id": str(g.id),
        "title": g.title,
        "description": g.description,
        "grant_type": g.grant_type,
        "ministry": g.ministry,
        "amount_min": g.amount_min,
        "amount_max": g.amount_max,
        "currency": g.currency,
        "eligibility_criteria": g.eligibility_criteria,
        "application_deadline": g.application_deadline,
        "status": g.status,
        "applications_count": g.applications_count,
    }

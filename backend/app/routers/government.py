from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional
from datetime import datetime, timezone
import uuid
from app.models.government import (
    GovernmentService, ServiceApplication, ServiceStatus, ApplicationStatus as GovAppStatus
)
from app.models.user import User
from app.schemas.government import ServiceApplicationCreate, ServiceApplicationUpdate
from app.middleware.auth import get_current_user, require_official

router = APIRouter(prefix="/government", tags=["Government Services"])


@router.get("/services")
async def list_services(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: Optional[str] = None,
    ministry: Optional[str] = None,
):
    filters = [GovernmentService.status == ServiceStatus.ACTIVE]
    if category:
        filters.append(GovernmentService.category == category)
    if ministry:
        filters.append(GovernmentService.ministry == ministry)

    query = GovernmentService.find(*filters)
    total = await query.count()
    services = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "services": [_service_dict(s) for s in services],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/services/{service_id}")
async def get_service(service_id: str):
    service = await GovernmentService.get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return _service_dict(service)


@router.post("/services", status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_official)])
async def create_service(body: dict):
    service = GovernmentService(**body)
    await service.insert()
    return {"message": "Service created", "service_id": str(service.id)}


@router.post("/services/{service_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_for_service(
    service_id: str,
    body: ServiceApplicationCreate,
    current_user: User = Depends(get_current_user),
):
    service = await GovernmentService.get(service_id)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    if service.status != ServiceStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Service is not currently available")

    ref = f"FL-{service.ministry[:3].upper()}-{uuid.uuid4().hex[:8].upper()}"

    application = ServiceApplication(
        service_id=service_id,
        service_name=service.name,
        applicant_id=str(current_user.id),
        applicant_name=current_user.full_name,
        reference_number=ref,
        form_data=body.form_data,
        timeline=[
            {
                "status": "submitted",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "note": "Application submitted by citizen",
            }
        ],
    )
    await application.insert()
    return {
        "message": "Application submitted successfully",
        "reference_number": ref,
        "application_id": str(application.id),
    }


@router.get("/applications/my")
async def my_applications(current_user: User = Depends(get_current_user)):
    apps = await ServiceApplication.find(
        ServiceApplication.applicant_id == str(current_user.id)
    ).sort("-submitted_at").to_list()
    return {"applications": [_app_dict(a) for a in apps]}


@router.get("/applications/{application_id}")
async def get_application(application_id: str, current_user: User = Depends(get_current_user)):
    app = await ServiceApplication.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
    if str(app.applicant_id) != str(current_user.id) and current_user.role not in ["admin", "government_official"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    return _app_dict(app)


@router.get("/applications", dependencies=[Depends(require_official)])
async def all_applications(
    service_id: Optional[str] = None,
    status: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    filters = []
    if service_id:
        filters.append(ServiceApplication.service_id == service_id)
    if status:
        filters.append(ServiceApplication.status == status)

    query = ServiceApplication.find(*filters)
    total = await query.count()
    apps = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {"applications": [_app_dict(a) for a in apps], "total": total}


@router.patch("/applications/{application_id}/review", dependencies=[Depends(require_official)])
async def review_application(
    application_id: str,
    body: ServiceApplicationUpdate,
    current_user: User = Depends(get_current_user),
):
    app = await ServiceApplication.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if body.status:
        app.status = body.status
        app.timeline.append({
            "status": body.status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "note": body.officer_notes or f"Status updated to {body.status}",
            "officer_id": str(current_user.id),
        })

    if body.officer_notes:
        app.officer_notes = body.officer_notes
    if body.rejection_reason:
        app.rejection_reason = body.rejection_reason

    app.officer_id = str(current_user.id)
    app.reviewed_at = datetime.now(timezone.utc)
    if body.status in ["approved", "completed"]:
        app.completed_at = datetime.now(timezone.utc)
    await app.save()
    return {"message": "Application reviewed"}


@router.get("/ministries")
async def get_ministries():
    return {
        "ministries": [
            "Ministry of Education",
            "Ministry of Youth & Sports",
            "Ministry of Commerce",
            "Ministry of Finance",
            "Ministry of Public Works",
            "National Identification Registry",
            "National Investment Commission",
            "Telecommunications Authority",
            "Cybersecurity Agency",
            "Immigration Services",
            "Employment Bureau",
            "Innovation & Technology Ministry",
            "National Procurement Authority",
            "Revenue Authority",
        ]
    }


@router.get("/categories")
async def get_categories():
    from app.models.government import ServiceCategory
    return {"categories": [c.value for c in ServiceCategory]}


@router.get("/stats", dependencies=[Depends(require_official)])
async def government_stats():
    total_services = await GovernmentService.find().count()
    total_applications = await ServiceApplication.find().count()
    pending = await ServiceApplication.find(ServiceApplication.status == "submitted").count()
    approved = await ServiceApplication.find(ServiceApplication.status == "approved").count()
    return {
        "total_services": total_services,
        "total_applications": total_applications,
        "pending_review": pending,
        "approved": approved,
    }


def _service_dict(s: GovernmentService) -> dict:
    return {
        "id": str(s.id),
        "name": s.name,
        "slug": s.slug,
        "description": s.description,
        "category": s.category,
        "ministry": s.ministry,
        "status": s.status,
        "icon": s.icon,
        "required_documents": s.required_documents,
        "processing_days": s.processing_days,
        "fee": s.fee,
        "fee_currency": s.fee_currency,
        "eligibility_criteria": s.eligibility_criteria,
    }


def _app_dict(a: ServiceApplication) -> dict:
    return {
        "id": str(a.id),
        "service_name": a.service_name,
        "applicant_name": a.applicant_name,
        "reference_number": a.reference_number,
        "status": a.status,
        "form_data": a.form_data,
        "officer_notes": a.officer_notes,
        "rejection_reason": a.rejection_reason,
        "submitted_at": a.submitted_at,
        "reviewed_at": a.reviewed_at,
        "timeline": a.timeline,
    }

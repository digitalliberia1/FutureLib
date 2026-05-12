from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional
from datetime import datetime, timezone

from app.models.smart_city import (
    SmartCityProject,
    IoTDevice,
    IoTReading,
    ProjectStatus,
    ProjectCategory,
    DeviceType,
)
from app.models.user import User
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/smart-city", tags=["Smart City"])


# ── Projects ──────────────────────────────────────────────────────────────────

@router.get("/projects")
async def list_projects(
    category: Optional[ProjectCategory] = None,
    status: Optional[ProjectStatus] = None,
    city: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List smart city projects. Filterable by category, status, city. Public."""
    query = SmartCityProject.find()
    if category:
        query = query.find(SmartCityProject.category == category)
    if status:
        query = query.find(SmartCityProject.status == status)
    if city:
        query = query.find(SmartCityProject.city == city)

    all_projects = await query.sort(-SmartCityProject.created_at).to_list()
    skip = (page - 1) * page_size
    paginated = all_projects[skip: skip + page_size]

    return {
        "total": len(all_projects),
        "page": page,
        "page_size": page_size,
        "results": [
            {
                "id": str(p.id),
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "status": p.status,
                "city": p.city,
                "budget_usd": p.budget_usd,
                "spent_usd": p.spent_usd,
                "progress_percent": p.progress_percent,
                "start_date": p.start_date,
                "end_date": p.end_date,
                "lead_agency": p.lead_agency,
                "partners": p.partners,
                "impact_metrics": p.impact_metrics,
                "created_by": p.created_by,
                "created_at": p.created_at,
                "updated_at": p.updated_at,
            }
            for p in paginated
        ],
    }


@router.post("/projects", status_code=201)
async def create_project(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new smart city project. Admin only."""
    body["created_by"] = str(current_user.id)
    project = SmartCityProject(**body)
    await project.insert()
    return {"id": str(project.id), "message": "Project created successfully"}


@router.get("/projects/{project_id}")
async def get_project(project_id: str):
    """Get a single smart city project by ID. Public."""
    try:
        project = await SmartCityProject.get(project_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return {
        "id": str(project.id),
        "title": project.title,
        "description": project.description,
        "category": project.category,
        "status": project.status,
        "city": project.city,
        "budget_usd": project.budget_usd,
        "spent_usd": project.spent_usd,
        "progress_percent": project.progress_percent,
        "start_date": project.start_date,
        "end_date": project.end_date,
        "lead_agency": project.lead_agency,
        "partners": project.partners,
        "impact_metrics": project.impact_metrics,
        "created_by": project.created_by,
        "created_at": project.created_at,
        "updated_at": project.updated_at,
    }


@router.patch("/projects/{project_id}")
async def update_project(
    project_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update project status, progress, and other fields. Admin only."""
    try:
        project = await SmartCityProject.get(project_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Project not found")
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    updatable = {
        "status", "progress_percent", "spent_usd", "budget_usd",
        "start_date", "end_date", "partners", "impact_metrics",
        "description", "lead_agency", "city",
    }
    for field, value in body.items():
        if field in updatable:
            setattr(project, field, value)

    project.updated_at = datetime.now(timezone.utc)
    await project.save()
    return {"id": str(project.id), "message": "Project updated successfully"}


# ── IoT Devices ───────────────────────────────────────────────────────────────

@router.get("/devices")
async def list_devices(
    device_type: Optional[DeviceType] = None,
    project_id: Optional[str] = None,
    is_online: Optional[bool] = None,
):
    """List IoT devices. Filterable by type, project, and online status. Public."""
    query = IoTDevice.find()
    if device_type:
        query = query.find(IoTDevice.device_type == device_type)
    if project_id:
        query = query.find(IoTDevice.project_id == project_id)
    if is_online is not None:
        query = query.find(IoTDevice.is_online == is_online)

    devices = await query.sort(-IoTDevice.created_at).to_list()
    return [
        {
            "id": str(d.id),
            "name": d.name,
            "device_type": d.device_type,
            "location": d.location,
            "lat": d.lat,
            "lng": d.lng,
            "project_id": d.project_id,
            "is_online": d.is_online,
            "battery_percent": d.battery_percent,
            "last_reading": d.last_reading,
            "last_seen": d.last_seen,
            "installed_at": d.installed_at,
            "created_at": d.created_at,
        }
        for d in devices
    ]


@router.post("/devices", status_code=201)
async def register_device(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Register a new IoT device. Admin only."""
    device = IoTDevice(**body)
    await device.insert()
    return {"id": str(device.id), "message": "Device registered successfully"}


@router.patch("/devices/{device_id}")
async def update_device(
    device_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update device status, reading, or other fields. Admin only."""
    try:
        device = await IoTDevice.get(device_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Device not found")
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    updatable = {
        "is_online", "battery_percent", "last_reading", "location",
        "lat", "lng", "project_id", "name",
    }
    for field, value in body.items():
        if field in updatable:
            setattr(device, field, value)

    device.last_seen = datetime.now(timezone.utc)
    await device.save()
    return {"id": str(device.id), "message": "Device updated successfully"}


@router.post("/devices/{device_id}/readings", status_code=201)
async def push_reading(
    device_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Push a sensor reading for a device. Creates IoTReading and updates device. Admin only."""
    try:
        device = await IoTDevice.get(device_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Device not found")
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    reading_data = body.get("data", body)
    reading = IoTReading(
        device_id=device_id,
        device_type=device.device_type,
        data=reading_data if isinstance(reading_data, dict) else body,
    )
    await reading.insert()

    # Update device's latest reading and last_seen
    device.last_reading = reading.data
    device.last_seen = datetime.now(timezone.utc)
    await device.save()

    return {"id": str(reading.id), "message": "Reading recorded successfully"}


@router.get("/devices/{device_id}/readings")
async def get_device_readings(
    device_id: str,
    limit: int = Query(50, ge=1, le=500),
):
    """Get the last N readings for a device. Public."""
    try:
        device = await IoTDevice.get(device_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Device not found")
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    readings = (
        await IoTReading.find(IoTReading.device_id == device_id)
        .sort(-IoTReading.recorded_at)
        .to_list()
    )
    readings = readings[:limit]
    return [
        {
            "id": str(r.id),
            "device_id": r.device_id,
            "device_type": r.device_type,
            "data": r.data,
            "recorded_at": r.recorded_at,
        }
        for r in readings
    ]


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def smart_city_stats():
    """Smart city overview statistics. Public."""
    all_projects = await SmartCityProject.find().to_list()
    all_devices = await IoTDevice.find().to_list()

    projects_by_status = {}
    for status in ProjectStatus:
        projects_by_status[status.value] = sum(
            1 for p in all_projects if p.status == status
        )

    projects_by_category = {}
    for cat in ProjectCategory:
        count = sum(1 for p in all_projects if p.category == cat)
        if count > 0:
            projects_by_category[cat.value] = count

    total_devices = len(all_devices)
    online_devices = sum(1 for d in all_devices if d.is_online)

    return {
        "projects": {
            "total": len(all_projects),
            "by_status": projects_by_status,
            "by_category": projects_by_category,
        },
        "devices": {
            "total": total_devices,
            "online": online_devices,
            "offline": total_devices - online_devices,
        },
    }

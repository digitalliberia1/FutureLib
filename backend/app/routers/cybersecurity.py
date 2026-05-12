from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional, List
from datetime import datetime, timezone

from app.models.cybersecurity import (
    CyberThreat,
    SecurityIncident,
    VulnerabilityReport,
    ThreatLevel,
    ThreatCategory,
    IncidentStatus,
)
from app.models.user import User
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/cybersecurity", tags=["Cybersecurity"])


# ── Threats ──────────────────────────────────────────────────────────────────

@router.get("/threats")
async def list_threats(
    category: Optional[ThreatCategory] = None,
    level: Optional[ThreatLevel] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List active cyber threats. Filterable by category and level. Public."""
    query = CyberThreat.find(CyberThreat.is_active == True)
    if category:
        query = query.find(CyberThreat.category == category)
    if level:
        query = query.find(CyberThreat.level == level)

    all_threats = await query.sort(-CyberThreat.created_at).to_list()
    skip = (page - 1) * page_size
    paginated = all_threats[skip: skip + page_size]

    return {
        "total": len(all_threats),
        "page": page,
        "page_size": page_size,
        "results": [
            {
                "id": str(t.id),
                "title": t.title,
                "description": t.description,
                "category": t.category,
                "level": t.level,
                "source": t.source,
                "indicators": t.indicators,
                "affected_sectors": t.affected_sectors,
                "is_active": t.is_active,
                "published_at": t.published_at,
                "created_at": t.created_at,
            }
            for t in paginated
        ],
    }


@router.post("/threats", status_code=201)
async def create_threat(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new cyber threat advisory. Admin only."""
    threat = CyberThreat(**body)
    await threat.insert()
    return {"id": str(threat.id), "message": "Threat created successfully"}


@router.get("/threats/{threat_id}")
async def get_threat(threat_id: str):
    """Get a single cyber threat by ID. Public."""
    try:
        threat = await CyberThreat.get(threat_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Threat not found")
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    return {
        "id": str(threat.id),
        "title": threat.title,
        "description": threat.description,
        "category": threat.category,
        "level": threat.level,
        "source": threat.source,
        "indicators": threat.indicators,
        "affected_sectors": threat.affected_sectors,
        "is_active": threat.is_active,
        "published_at": threat.published_at,
        "created_at": threat.created_at,
    }


@router.patch("/threats/{threat_id}/deactivate")
async def deactivate_threat(
    threat_id: str,
    current_user: User = Depends(require_admin),
):
    """Mark a threat as inactive. Admin only."""
    try:
        threat = await CyberThreat.get(threat_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Threat not found")
    if not threat:
        raise HTTPException(status_code=404, detail="Threat not found")
    threat.is_active = False
    await threat.save()
    return {"id": str(threat.id), "message": "Threat deactivated"}


# ── Incidents ─────────────────────────────────────────────────────────────────

@router.get("/incidents")
async def list_incidents(
    status: Optional[IncidentStatus] = None,
    level: Optional[ThreatLevel] = None,
    current_user: User = Depends(get_current_user),
):
    """List security incidents. Authenticated users only. Filterable by status/level."""
    query = SecurityIncident.find()
    if status:
        query = query.find(SecurityIncident.status == status)
    if level:
        query = query.find(SecurityIncident.level == level)

    incidents = await query.sort(-SecurityIncident.created_at).to_list()
    return [
        {
            "id": str(i.id),
            "title": i.title,
            "description": i.description,
            "category": i.category,
            "level": i.level,
            "status": i.status,
            "reported_by": i.reported_by,
            "reporter_name": i.reporter_name,
            "affected_systems": i.affected_systems,
            "timeline": i.timeline,
            "resolution_notes": i.resolution_notes,
            "resolved_at": i.resolved_at,
            "created_at": i.created_at,
            "updated_at": i.updated_at,
        }
        for i in incidents
    ]


@router.post("/incidents", status_code=201)
async def report_incident(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Report a new security incident. Authenticated users only."""
    body["reported_by"] = str(current_user.id)
    body["reporter_name"] = current_user.full_name if hasattr(current_user, "full_name") else current_user.name
    incident = SecurityIncident(**body)
    # Seed the timeline with the initial report event
    incident.timeline = [
        {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": "Incident reported",
            "actor": body["reporter_name"],
        }
    ]
    await incident.insert()
    return {"id": str(incident.id), "message": "Incident reported successfully"}


@router.get("/incidents/{incident_id}")
async def get_incident(
    incident_id: str,
    current_user: User = Depends(get_current_user),
):
    """Get a single security incident by ID. Authenticated users only."""
    try:
        incident = await SecurityIncident.get(incident_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return {
        "id": str(incident.id),
        "title": incident.title,
        "description": incident.description,
        "category": incident.category,
        "level": incident.level,
        "status": incident.status,
        "reported_by": incident.reported_by,
        "reporter_name": incident.reporter_name,
        "affected_systems": incident.affected_systems,
        "timeline": incident.timeline,
        "resolution_notes": incident.resolution_notes,
        "resolved_at": incident.resolved_at,
        "created_at": incident.created_at,
        "updated_at": incident.updated_at,
    }


@router.patch("/incidents/{incident_id}/status")
async def update_incident_status(
    incident_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update incident status and append to timeline. Admin only."""
    try:
        incident = await SecurityIncident.get(incident_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Incident not found")
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    new_status = body.get("status")
    action_note = body.get("action", f"Status changed to {new_status}")
    resolution_notes = body.get("resolution_notes")

    if new_status:
        incident.status = new_status
    if resolution_notes:
        incident.resolution_notes = resolution_notes

    now = datetime.now(timezone.utc)
    incident.updated_at = now

    # Mark resolved_at if transitioning to a terminal state
    if new_status in (IncidentStatus.RESOLVED, IncidentStatus.CLOSED) and not incident.resolved_at:
        incident.resolved_at = now

    admin_name = current_user.full_name if hasattr(current_user, "full_name") else current_user.name
    incident.timeline.append(
        {
            "timestamp": now.isoformat(),
            "action": action_note,
            "actor": admin_name,
        }
    )
    await incident.save()
    return {"id": str(incident.id), "status": incident.status, "message": "Incident updated"}


# ── Vulnerabilities ───────────────────────────────────────────────────────────

@router.get("/vulnerabilities")
async def list_vulnerabilities(
    current_user: User = Depends(get_current_user),
):
    """List all vulnerability reports. Authenticated users only."""
    vulns = await VulnerabilityReport.find().sort(-VulnerabilityReport.created_at).to_list()
    return [
        {
            "id": str(v.id),
            "title": v.title,
            "description": v.description,
            "cvss_score": v.cvss_score,
            "affected_system": v.affected_system,
            "cve_id": v.cve_id,
            "patch_available": v.patch_available,
            "patch_url": v.patch_url,
            "reported_by": v.reported_by,
            "reporter_name": v.reporter_name,
            "status": v.status,
            "created_at": v.created_at,
        }
        for v in vulns
    ]


@router.post("/vulnerabilities", status_code=201)
async def report_vulnerability(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Report a new vulnerability. Authenticated users only."""
    body["reported_by"] = str(current_user.id)
    body["reporter_name"] = current_user.full_name if hasattr(current_user, "full_name") else current_user.name
    vuln = VulnerabilityReport(**body)
    await vuln.insert()
    return {"id": str(vuln.id), "message": "Vulnerability reported successfully"}


@router.patch("/vulnerabilities/{vuln_id}/status")
async def update_vulnerability_status(
    vuln_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update vulnerability status. Admin only."""
    try:
        vuln = await VulnerabilityReport.get(vuln_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Vulnerability not found")
    if not vuln:
        raise HTTPException(status_code=404, detail="Vulnerability not found")

    allowed_statuses = {"open", "patched", "wont_fix", "duplicate"}
    new_status = body.get("status")
    if new_status and new_status not in allowed_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {', '.join(allowed_statuses)}")

    if new_status:
        vuln.status = new_status
    if body.get("patch_available") is not None:
        vuln.patch_available = body["patch_available"]
    if body.get("patch_url"):
        vuln.patch_url = body["patch_url"]

    await vuln.save()
    return {"id": str(vuln.id), "status": vuln.status, "message": "Vulnerability status updated"}


# ── Stats ─────────────────────────────────────────────────────────────────────

@router.get("/stats")
async def cybersecurity_stats():
    """Public cybersecurity overview statistics."""
    threats_by_level = {}
    for level in ThreatLevel:
        count = await CyberThreat.find(
            CyberThreat.is_active == True,
            CyberThreat.level == level,
        ).count()
        threats_by_level[level.value] = count

    open_incidents = await SecurityIncident.find(
        SecurityIncident.status == IncidentStatus.OPEN
    ).count()
    total_incidents = await SecurityIncident.find().count()
    total_vulns = await VulnerabilityReport.find().count()
    critical_vulns = await VulnerabilityReport.find(
        VulnerabilityReport.cvss_score >= 9.0
    ).count()
    open_vulns = await VulnerabilityReport.find(
        VulnerabilityReport.status == "open"
    ).count()
    total_active_threats = await CyberThreat.find(CyberThreat.is_active == True).count()

    return {
        "threats": {
            "total_active": total_active_threats,
            "by_level": threats_by_level,
        },
        "incidents": {
            "total": total_incidents,
            "open": open_incidents,
        },
        "vulnerabilities": {
            "total": total_vulns,
            "open": open_vulns,
            "critical_cvss": critical_vulns,
        },
    }

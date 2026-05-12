from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional
from datetime import datetime, timezone

from app.models.infrastructure import (
    InfraNode,
    InfraMetric,
    ServiceHealth,
    NodeType,
    NodeStatus,
)
from app.models.user import User
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])


# ── Nodes ─────────────────────────────────────────────────────────────────────

@router.get("/nodes")
async def list_nodes(
    status: Optional[NodeStatus] = None,
    region: Optional[str] = None,
    node_type: Optional[NodeType] = None,
    current_user: User = Depends(get_current_user),
):
    """List all infrastructure nodes. Authenticated users only."""
    query = InfraNode.find()
    if status:
        query = query.find(InfraNode.status == status)
    if region:
        query = query.find(InfraNode.region == region)
    if node_type:
        query = query.find(InfraNode.node_type == node_type)

    nodes = await query.sort(-InfraNode.created_at).to_list()
    return [
        {
            "id": str(n.id),
            "name": n.name,
            "node_type": n.node_type,
            "status": n.status,
            "region": n.region,
            "ip_address": n.ip_address,
            "description": n.description,
            "tags": n.tags,
            "uptime_percent": n.uptime_percent,
            "last_checked": n.last_checked,
            "created_at": n.created_at,
        }
        for n in nodes
    ]


@router.post("/nodes", status_code=201)
async def create_node(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new infrastructure node. Admin only."""
    node = InfraNode(**body)
    await node.insert()
    return {"id": str(node.id), "message": "Node created successfully"}


@router.patch("/nodes/{node_id}")
async def update_node(
    node_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update node status, uptime, or other fields. Admin only."""
    try:
        node = await InfraNode.get(node_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Node not found")
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    updatable = {"status", "uptime_percent", "description", "ip_address", "tags", "region"}
    for field, value in body.items():
        if field in updatable:
            setattr(node, field, value)

    node.last_checked = datetime.now(timezone.utc)
    await node.save()
    return {"id": str(node.id), "message": "Node updated successfully"}


@router.delete("/nodes/{node_id}")
async def delete_node(
    node_id: str,
    current_user: User = Depends(require_admin),
):
    """Delete an infrastructure node. Admin only."""
    try:
        node = await InfraNode.get(node_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Node not found")
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    await node.delete()
    return {"message": "Node deleted successfully"}


# ── Metrics ───────────────────────────────────────────────────────────────────

@router.post("/nodes/{node_id}/metrics", status_code=201)
async def record_metric(
    node_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Record a performance metric snapshot for a node. Admin only."""
    try:
        node = await InfraNode.get(node_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Node not found")
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    body["node_id"] = node_id
    metric = InfraMetric(**body)
    await metric.insert()

    # Update node's last_checked timestamp
    node.last_checked = datetime.now(timezone.utc)
    await node.save()

    return {"id": str(metric.id), "message": "Metric recorded successfully"}


@router.get("/nodes/{node_id}/metrics")
async def get_node_metrics(
    node_id: str,
    limit: int = Query(20, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """Get the most recent N metrics for a node. Authenticated users only."""
    try:
        node = await InfraNode.get(node_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Node not found")
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    metrics = (
        await InfraMetric.find(InfraMetric.node_id == node_id)
        .sort(-InfraMetric.recorded_at)
        .to_list()
    )
    metrics = metrics[:limit]
    return [
        {
            "id": str(m.id),
            "node_id": m.node_id,
            "cpu_percent": m.cpu_percent,
            "memory_percent": m.memory_percent,
            "disk_percent": m.disk_percent,
            "network_in_mbps": m.network_in_mbps,
            "network_out_mbps": m.network_out_mbps,
            "response_time_ms": m.response_time_ms,
            "recorded_at": m.recorded_at,
        }
        for m in metrics
    ]


# ── Service Health ─────────────────────────────────────────────────────────────

@router.get("/health")
async def list_service_health():
    """List all service health records. Public."""
    services = await ServiceHealth.find().sort(ServiceHealth.service_name).to_list()
    return [
        {
            "id": str(s.id),
            "service_name": s.service_name,
            "endpoint": s.endpoint,
            "status": s.status,
            "response_time_ms": s.response_time_ms,
            "status_code": s.status_code,
            "last_checked": s.last_checked,
            "uptime_24h": s.uptime_24h,
            "incidents_7d": s.incidents_7d,
        }
        for s in services
    ]


@router.post("/health", status_code=201)
async def upsert_service_health(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create or update a service health record. Admin only."""
    service_name = body.get("service_name")
    if not service_name:
        raise HTTPException(status_code=400, detail="service_name is required")

    existing = await ServiceHealth.find_one(ServiceHealth.service_name == service_name)
    if existing:
        updatable = {
            "endpoint", "status", "response_time_ms", "status_code",
            "uptime_24h", "incidents_7d",
        }
        for field, value in body.items():
            if field in updatable:
                setattr(existing, field, value)
        existing.last_checked = datetime.now(timezone.utc)
        await existing.save()
        return {"id": str(existing.id), "message": "Service health record updated"}
    else:
        service = ServiceHealth(**body)
        await service.insert()
        return {"id": str(service.id), "message": "Service health record created"}


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def infrastructure_overview():
    """Infrastructure summary statistics. Public."""
    all_nodes = await InfraNode.find().to_list()
    total_nodes = len(all_nodes)

    by_status = {}
    for status in NodeStatus:
        by_status[status.value] = sum(1 for n in all_nodes if n.status == status)

    avg_uptime = (
        round(sum(n.uptime_percent for n in all_nodes) / total_nodes, 2)
        if total_nodes > 0
        else 0.0
    )

    by_region: dict = {}
    for node in all_nodes:
        by_region[node.region] = by_region.get(node.region, 0) + 1

    all_services = await ServiceHealth.find().to_list()
    services_healthy = sum(1 for s in all_services if s.status == NodeStatus.ONLINE)
    services_degraded = sum(1 for s in all_services if s.status == NodeStatus.DEGRADED)
    services_offline = sum(1 for s in all_services if s.status == NodeStatus.OFFLINE)

    return {
        "nodes": {
            "total": total_nodes,
            "by_status": by_status,
            "avg_uptime_percent": avg_uptime,
            "by_region": by_region,
        },
        "services": {
            "total": len(all_services),
            "healthy": services_healthy,
            "degraded": services_degraded,
            "offline": services_offline,
        },
    }

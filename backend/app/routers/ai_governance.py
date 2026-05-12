from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional
from datetime import datetime, timezone

from app.models.ai_governance import (
    AIPolicy,
    AIModel,
    AIAudit,
    PolicyStatus,
    RiskLevel,
)
from app.models.user import User
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/ai-governance", tags=["AI Governance"])


# ── Policies ──────────────────────────────────────────────────────────────────

@router.get("/policies")
async def list_policies(
    status: Optional[PolicyStatus] = None,
    policy_type: Optional[str] = None,
):
    """List AI governance policies. Filterable by status and type. Public."""
    query = AIPolicy.find()
    if status:
        query = query.find(AIPolicy.status == status)
    if policy_type:
        query = query.find(AIPolicy.policy_type == policy_type)

    policies = await query.sort(-AIPolicy.created_at).to_list()
    return [
        {
            "id": str(p.id),
            "title": p.title,
            "description": p.description,
            "policy_type": p.policy_type,
            "status": p.status,
            "version": p.version,
            "authored_by": p.authored_by,
            "author_name": p.author_name,
            "scope": p.scope,
            "key_principles": p.key_principles,
            "enforcement_body": p.enforcement_body,
            "published_at": p.published_at,
            "effective_date": p.effective_date,
            "review_date": p.review_date,
            "created_at": p.created_at,
            "updated_at": p.updated_at,
        }
        for p in policies
    ]


@router.post("/policies", status_code=201)
async def create_policy(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new AI policy. Admin only. Sets authored_by and author_name from user."""
    body["authored_by"] = str(current_user.id)
    body["author_name"] = current_user.full_name
    policy = AIPolicy(**body)
    await policy.insert()
    return {"id": str(policy.id), "message": "Policy created successfully"}


@router.get("/policies/{policy_id}")
async def get_policy(policy_id: str):
    """Get a single AI policy by ID. Public."""
    try:
        policy = await AIPolicy.get(policy_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Policy not found")
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    return {
        "id": str(policy.id),
        "title": policy.title,
        "description": policy.description,
        "policy_type": policy.policy_type,
        "status": policy.status,
        "version": policy.version,
        "authored_by": policy.authored_by,
        "author_name": policy.author_name,
        "scope": policy.scope,
        "key_principles": policy.key_principles,
        "enforcement_body": policy.enforcement_body,
        "published_at": policy.published_at,
        "effective_date": policy.effective_date,
        "review_date": policy.review_date,
        "created_at": policy.created_at,
        "updated_at": policy.updated_at,
    }


@router.patch("/policies/{policy_id}/status")
async def update_policy_status(
    policy_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Update a policy's status. Sets published_at when status becomes 'active'. Admin only."""
    try:
        policy = await AIPolicy.get(policy_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Policy not found")
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    new_status = body.get("status")
    if not new_status:
        raise HTTPException(status_code=400, detail="status field is required")

    policy.status = new_status
    now = datetime.now(timezone.utc)

    # Auto-set published_at the first time the policy goes active
    if new_status == PolicyStatus.ACTIVE and not policy.published_at:
        policy.published_at = now

    if body.get("effective_date"):
        policy.effective_date = body["effective_date"]
    if body.get("review_date"):
        policy.review_date = body["review_date"]

    policy.updated_at = now
    await policy.save()
    return {"id": str(policy.id), "status": policy.status, "message": "Policy status updated"}


# ── AI Models Registry ────────────────────────────────────────────────────────

@router.get("/models")
async def list_models(
    risk_level: Optional[RiskLevel] = None,
    is_approved: Optional[bool] = None,
):
    """List registered AI models. Filterable by risk level and approval. Public."""
    query = AIModel.find()
    if risk_level:
        query = query.find(AIModel.risk_level == risk_level)
    if is_approved is not None:
        query = query.find(AIModel.is_approved == is_approved)

    models = await query.sort(-AIModel.created_at).to_list()
    return [
        {
            "id": str(m.id),
            "name": m.name,
            "description": m.description,
            "model_type": m.model_type,
            "use_case": m.use_case,
            "deploying_org": m.deploying_org,
            "risk_level": m.risk_level,
            "is_approved": m.is_approved,
            "approved_by": m.approved_by,
            "training_data_description": m.training_data_description,
            "bias_assessment": m.bias_assessment,
            "explainability_score": m.explainability_score,
            "accuracy_score": m.accuracy_score,
            "in_production": m.in_production,
            "version": m.version,
            "registered_by": m.registered_by,
            "created_at": m.created_at,
            "updated_at": m.updated_at,
        }
        for m in models
    ]


@router.post("/models", status_code=201)
async def register_model(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Register an AI model. Authenticated users only. Sets registered_by from user."""
    body["registered_by"] = str(current_user.id)
    model = AIModel(**body)
    await model.insert()
    return {"id": str(model.id), "message": "AI model registered successfully"}


@router.patch("/models/{model_id}/approve")
async def approve_model(
    model_id: str,
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Approve or reject an AI model. Admin only. Sets is_approved and approved_by."""
    try:
        model = await AIModel.get(model_id)
    except Exception:
        raise HTTPException(status_code=404, detail="AI model not found")
    if not model:
        raise HTTPException(status_code=404, detail="AI model not found")

    approved = body.get("is_approved")
    if approved is None:
        raise HTTPException(status_code=400, detail="is_approved field is required")

    model.is_approved = bool(approved)
    model.approved_by = str(current_user.id) if approved else None

    if body.get("in_production") is not None:
        model.in_production = bool(body["in_production"])

    model.updated_at = datetime.now(timezone.utc)
    await model.save()

    action = "approved" if model.is_approved else "rejected"
    return {"id": str(model.id), "is_approved": model.is_approved, "message": f"Model {action} successfully"}


# ── Audits ────────────────────────────────────────────────────────────────────

@router.get("/audits")
async def list_audits(
    current_user: User = Depends(get_current_user),
):
    """List all AI audits. Authenticated users only."""
    audits = await AIAudit.find().sort(-AIAudit.created_at).to_list()
    return [
        {
            "id": str(a.id),
            "model_id": a.model_id,
            "model_name": a.model_name,
            "auditor_id": a.auditor_id,
            "auditor_name": a.auditor_name,
            "audit_type": a.audit_type,
            "findings": a.findings,
            "recommendations": a.recommendations,
            "risk_assessment": a.risk_assessment,
            "overall_score": a.overall_score,
            "passed": a.passed,
            "notes": a.notes,
            "created_at": a.created_at,
        }
        for a in audits
    ]


@router.post("/audits", status_code=201)
async def create_audit(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Create an AI audit. Authenticated users only. Sets auditor_id/auditor_name from user."""
    body["auditor_id"] = str(current_user.id)
    body["auditor_name"] = current_user.full_name

    # Verify the model being audited exists
    model_id = body.get("model_id")
    if model_id:
        try:
            model = await AIModel.get(model_id)
        except Exception:
            model = None
        if not model:
            raise HTTPException(status_code=404, detail="AI model not found")
        if not body.get("model_name"):
            body["model_name"] = model.name

    audit = AIAudit(**body)
    await audit.insert()
    return {"id": str(audit.id), "message": "Audit created successfully"}


# ── Dashboard ─────────────────────────────────────────────────────────────────

@router.get("/dashboard")
async def ai_governance_dashboard():
    """AI governance overview statistics. Public."""
    all_policies = await AIPolicy.find().to_list()
    all_models = await AIModel.find().to_list()
    all_audits = await AIAudit.find().to_list()

    policies_by_status = {}
    for status in PolicyStatus:
        count = sum(1 for p in all_policies if p.status == status)
        policies_by_status[status.value] = count

    models_by_risk = {}
    for risk in RiskLevel:
        count = sum(1 for m in all_models if m.risk_level == risk)
        models_by_risk[risk.value] = count

    total_approved = sum(1 for m in all_models if m.is_approved)
    in_production = sum(1 for m in all_models if m.in_production)

    # Recent audits: last 30 days count
    from datetime import timedelta
    cutoff = datetime.now(timezone.utc) - timedelta(days=30)
    recent_audits = sum(
        1 for a in all_audits
        if a.created_at and a.created_at.replace(tzinfo=timezone.utc) >= cutoff
        if a.created_at
    )

    passed_audits = sum(1 for a in all_audits if a.passed)

    return {
        "policies": {
            "total": len(all_policies),
            "by_status": policies_by_status,
        },
        "models": {
            "total": len(all_models),
            "by_risk_level": models_by_risk,
            "total_approved": total_approved,
            "in_production": in_production,
        },
        "audits": {
            "total": len(all_audits),
            "recent_30d": recent_audits,
            "passed": passed_audits,
        },
    }

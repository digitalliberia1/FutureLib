from fastapi import APIRouter, Depends, HTTPException, Query
from bson import ObjectId
from typing import Optional
from datetime import datetime, timezone

from app.models.digital_economy import (
    TradePartner,
    DigitalTransaction,
    EconomicZone,
    TradeType,
    EconomyZoneType,
)
from app.models.user import User, UserRole
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/digital-economy", tags=["Digital Economy"])


# ── Trade Partners ─────────────────────────────────────────────────────────────

@router.get("/partners")
async def list_partners():
    """List all trade partners. Public."""
    partners = await TradePartner.find().sort(TradePartner.country).to_list()
    return [
        {
            "id": str(p.id),
            "country": p.country,
            "country_code": p.country_code,
            "region": p.region,
            "trade_volume_usd": p.trade_volume_usd,
            "primary_exports": p.primary_exports,
            "primary_imports": p.primary_imports,
            "agreement_type": p.agreement_type,
            "digital_services_enabled": p.digital_services_enabled,
            "created_at": p.created_at,
        }
        for p in partners
    ]


@router.post("/partners", status_code=201)
async def create_partner(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new trade partner. Admin only."""
    partner = TradePartner(**body)
    await partner.insert()
    return {"id": str(partner.id), "message": "Trade partner created successfully"}


# ── Transactions ──────────────────────────────────────────────────────────────

@router.get("/transactions")
async def list_transactions(
    transaction_type: Optional[TradeType] = None,
    partner_country: Optional[str] = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
):
    """List digital transactions. Authenticated users only. Filterable by type and country."""
    query = DigitalTransaction.find()
    if transaction_type:
        query = query.find(DigitalTransaction.transaction_type == transaction_type)
    if partner_country:
        query = query.find(DigitalTransaction.partner_country == partner_country)

    all_txns = await query.sort(-DigitalTransaction.created_at).to_list()
    skip = (page - 1) * page_size
    paginated = all_txns[skip: skip + page_size]

    return {
        "total": len(all_txns),
        "page": page,
        "page_size": page_size,
        "results": [
            {
                "id": str(t.id),
                "transaction_type": t.transaction_type,
                "partner_country": t.partner_country,
                "amount_usd": t.amount_usd,
                "currency": t.currency,
                "sector": t.sector,
                "description": t.description,
                "processed_by": t.processed_by,
                "status": t.status,
                "created_at": t.created_at,
            }
            for t in paginated
        ],
    }


@router.post("/transactions", status_code=201)
async def create_transaction(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    """Create a digital transaction. Must be government official or admin."""
    if current_user.role not in (UserRole.GOVERNMENT_OFFICIAL, UserRole.ADMIN):
        raise HTTPException(
            status_code=403,
            detail="Only government officials or admins can record transactions",
        )
    body["processed_by"] = str(current_user.id)
    txn = DigitalTransaction(**body)
    await txn.insert()
    return {"id": str(txn.id), "message": "Transaction recorded successfully"}


# ── Economic Zones ─────────────────────────────────────────────────────────────

@router.get("/zones")
async def list_zones():
    """List all economic zones. Public."""
    zones = await EconomicZone.find().sort(EconomicZone.name).to_list()
    return [
        {
            "id": str(z.id),
            "name": z.name,
            "zone_type": z.zone_type,
            "location": z.location,
            "description": z.description,
            "area_km2": z.area_km2,
            "established_year": z.established_year,
            "total_companies": z.total_companies,
            "total_employees": z.total_employees,
            "annual_revenue_usd": z.annual_revenue_usd,
            "incentives": z.incentives,
            "lead_agency": z.lead_agency,
            "status": z.status,
            "created_at": z.created_at,
        }
        for z in zones
    ]


@router.post("/zones", status_code=201)
async def create_zone(
    body: dict,
    current_user: User = Depends(require_admin),
):
    """Create a new economic zone. Admin only."""
    zone = EconomicZone(**body)
    await zone.insert()
    return {"id": str(zone.id), "message": "Economic zone created successfully"}


# ── Overview ──────────────────────────────────────────────────────────────────

@router.get("/overview")
async def digital_economy_overview():
    """Digital economy overview statistics. Public."""
    all_partners = await TradePartner.find().to_list()
    all_txns = await DigitalTransaction.find().to_list()
    all_zones = await EconomicZone.find().to_list()

    total_volume = sum(t.amount_usd for t in all_txns)

    # Top partners by volume (sorted by trade_volume_usd descending, top 10)
    sorted_partners = sorted(all_partners, key=lambda p: p.trade_volume_usd, reverse=True)
    top_partners = [
        {
            "country": p.country,
            "country_code": p.country_code,
            "trade_volume_usd": p.trade_volume_usd,
            "region": p.region,
        }
        for p in sorted_partners[:10]
    ]

    # Transactions by type
    txns_by_type = {}
    for trade_type in TradeType:
        count = sum(1 for t in all_txns if t.transaction_type == trade_type)
        volume = sum(t.amount_usd for t in all_txns if t.transaction_type == trade_type)
        txns_by_type[trade_type.value] = {"count": count, "volume_usd": volume}

    # Zones by type
    zones_by_type = {}
    for zone_type in EconomyZoneType:
        count = sum(1 for z in all_zones if z.zone_type == zone_type)
        if count > 0:
            zones_by_type[zone_type.value] = count

    return {
        "partners": {
            "total": len(all_partners),
            "top_by_volume": top_partners,
        },
        "transactions": {
            "total": len(all_txns),
            "total_volume_usd": total_volume,
            "by_type": txns_by_type,
        },
        "zones": {
            "total": len(all_zones),
            "by_type": zones_by_type,
        },
    }

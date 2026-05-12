from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class TradeType(str, Enum):
    EXPORT = "export"
    IMPORT = "import"
    SERVICE = "service"
    REMITTANCE = "remittance"
    FDI = "fdi"


class EconomyZoneType(str, Enum):
    FREE_TRADE = "free_trade"
    EXPORT_PROCESSING = "export_processing"
    TECHNOLOGY = "technology"
    AGRICULTURAL = "agricultural"
    INDUSTRIAL = "industrial"


class TradePartner(Document):
    country: str
    country_code: str                     # ISO 3166-1 alpha-2
    region: str                           # ECOWAS, Africa, Global
    trade_volume_usd: float = 0.0
    primary_exports: List[str] = []
    primary_imports: List[str] = []
    agreement_type: Optional[str] = None  # bilateral, ECOWAS, AfCFTA
    digital_services_enabled: bool = True
    created_at: datetime = None

    class Settings:
        name = "trade_partners"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)


class DigitalTransaction(Document):
    transaction_type: TradeType
    partner_country: str
    amount_usd: float
    currency: str = "USD"
    sector: str                            # "technology", "agriculture", etc
    description: str
    processed_by: str                     # user_id of official
    status: str = "completed"             # pending, completed, failed
    created_at: datetime = None

    class Settings:
        name = "digital_transactions"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)


class EconomicZone(Document):
    name: str
    zone_type: EconomyZoneType
    location: str
    description: str
    area_km2: float = 0.0
    established_year: Optional[int] = None
    total_companies: int = 0
    total_employees: int = 0
    annual_revenue_usd: float = 0.0
    incentives: List[str] = []
    lead_agency: str
    status: str = "active"
    created_at: datetime = None

    class Settings:
        name = "economic_zones"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)

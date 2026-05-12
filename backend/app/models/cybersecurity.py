from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ThreatLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class ThreatCategory(str, Enum):
    PHISHING = "phishing"
    MALWARE = "malware"
    RANSOMWARE = "ransomware"
    DDOS = "ddos"
    DATA_BREACH = "data_breach"
    INSIDER_THREAT = "insider_threat"
    SOCIAL_ENGINEERING = "social_engineering"
    ZERO_DAY = "zero_day"
    APT = "apt"
    OTHER = "other"


class IncidentStatus(str, Enum):
    OPEN = "open"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    RESOLVED = "resolved"
    CLOSED = "closed"


class CyberThreat(Document):
    title: str
    description: str
    category: ThreatCategory
    level: ThreatLevel
    source: Optional[str] = None          # e.g. "CERT-LR", "CISA"
    indicators: List[str] = []            # IPs, domains, hashes
    affected_sectors: List[str] = []
    is_active: bool = True
    published_at: datetime = None
    created_at: datetime = None

    class Settings:
        name = "cyber_threats"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.published_at:
            self.published_at = now


class SecurityIncident(Document):
    title: str
    description: str
    category: ThreatCategory
    level: ThreatLevel
    status: IncidentStatus = IncidentStatus.OPEN
    reported_by: str                       # user_id
    reporter_name: str
    affected_systems: List[str] = []
    timeline: List[dict] = []             # [{timestamp, action, actor}]
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime = None
    updated_at: datetime = None

    class Settings:
        name = "security_incidents"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


class VulnerabilityReport(Document):
    title: str
    description: str
    cvss_score: float = 0.0               # 0-10
    affected_system: str
    cve_id: Optional[str] = None
    patch_available: bool = False
    patch_url: Optional[str] = None
    reported_by: str
    reporter_name: str
    status: str = "open"                  # open, patched, wont_fix, duplicate
    created_at: datetime = None

    class Settings:
        name = "vulnerability_reports"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.created_at:
            self.created_at = datetime.now(timezone.utc)

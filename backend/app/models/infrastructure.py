from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class NodeType(str, Enum):
    SERVER = "server"
    DATABASE = "database"
    NETWORK = "network"
    STORAGE = "storage"
    API_GATEWAY = "api_gateway"
    CDN = "cdn"
    LOAD_BALANCER = "load_balancer"
    FIREWALL = "firewall"


class NodeStatus(str, Enum):
    ONLINE = "online"
    DEGRADED = "degraded"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    UNKNOWN = "unknown"


class InfraNode(Document):
    name: str
    node_type: NodeType
    status: NodeStatus = NodeStatus.ONLINE
    region: str = "Monrovia"              # e.g. Monrovia, Buchanan, Harper
    ip_address: Optional[str] = None
    description: Optional[str] = None
    tags: List[str] = []
    uptime_percent: float = 99.9
    last_checked: datetime = None
    created_at: datetime = None

    class Settings:
        name = "infra_nodes"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.last_checked:
            self.last_checked = now


class InfraMetric(Document):
    node_id: str
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    disk_percent: float = 0.0
    network_in_mbps: float = 0.0
    network_out_mbps: float = 0.0
    response_time_ms: float = 0.0
    recorded_at: datetime = None

    class Settings:
        name = "infra_metrics"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.recorded_at:
            self.recorded_at = datetime.now(timezone.utc)


class ServiceHealth(Document):
    service_name: str                     # e.g. "FutureLib API", "Auth Service"
    endpoint: str
    status: NodeStatus = NodeStatus.ONLINE
    response_time_ms: float = 0.0
    status_code: int = 200
    last_checked: datetime = None
    uptime_24h: float = 100.0
    incidents_7d: int = 0

    class Settings:
        name = "service_health"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.last_checked:
            self.last_checked = datetime.now(timezone.utc)

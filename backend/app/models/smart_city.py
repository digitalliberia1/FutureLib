from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ProjectStatus(str, Enum):
    PLANNING = "planning"
    APPROVED = "approved"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"


class ProjectCategory(str, Enum):
    TRANSPORTATION = "transportation"
    ENERGY = "energy"
    WATER = "water"
    WASTE = "waste"
    PUBLIC_SAFETY = "public_safety"
    HEALTH = "health"
    EDUCATION = "education"
    CONNECTIVITY = "connectivity"
    ENVIRONMENT = "environment"
    GOVERNANCE = "governance"


class DeviceType(str, Enum):
    SENSOR = "sensor"
    CAMERA = "camera"
    TRAFFIC_LIGHT = "traffic_light"
    WEATHER_STATION = "weather_station"
    WATER_METER = "water_meter"
    SMART_LIGHT = "smart_light"
    AIR_QUALITY = "air_quality"
    NOISE_MONITOR = "noise_monitor"
    FLOOD_SENSOR = "flood_sensor"
    SOLAR_PANEL = "solar_panel"


class SmartCityProject(Document):
    title: str
    description: str
    category: ProjectCategory
    status: ProjectStatus = ProjectStatus.PLANNING
    city: str = "Monrovia"
    budget_usd: float = 0.0
    spent_usd: float = 0.0
    progress_percent: float = 0.0
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    lead_agency: str
    partners: List[str] = []
    impact_metrics: dict = {}             # e.g. {"citizens_impacted": 50000}
    created_by: str
    created_at: datetime = None
    updated_at: datetime = None

    class Settings:
        name = "smart_city_projects"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.updated_at:
            self.updated_at = now


class IoTDevice(Document):
    name: str
    device_type: DeviceType
    location: str                          # human-readable: "Broad St, Monrovia"
    lat: Optional[float] = None
    lng: Optional[float] = None
    project_id: Optional[str] = None
    is_online: bool = True
    battery_percent: Optional[float] = None
    last_reading: Optional[dict] = None    # latest sensor data
    last_seen: datetime = None
    installed_at: datetime = None
    created_at: datetime = None

    class Settings:
        name = "iot_devices"

    def __init__(self, **data):
        super().__init__(**data)
        now = datetime.now(timezone.utc)
        if not self.created_at:
            self.created_at = now
        if not self.last_seen:
            self.last_seen = now
        if not self.installed_at:
            self.installed_at = now


class IoTReading(Document):
    device_id: str
    device_type: DeviceType
    data: dict                             # flexible sensor payload
    recorded_at: datetime = None

    class Settings:
        name = "iot_readings"

    def __init__(self, **data):
        super().__init__(**data)
        if not self.recorded_at:
            self.recorded_at = datetime.now(timezone.utc)

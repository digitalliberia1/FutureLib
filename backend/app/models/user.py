from beanie import Document, Indexed
from pydantic import EmailStr, Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class UserRole(str, Enum):
    CITIZEN = "citizen"
    GOVERNMENT_OFFICIAL = "government_official"
    STARTUP_FOUNDER = "startup_founder"
    INVESTOR = "investor"
    EDUCATOR = "educator"
    ADMIN = "admin"


class UserStatus(str, Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    SUSPENDED = "suspended"
    PENDING_VERIFICATION = "pending_verification"


class County(str, Enum):
    BOMI = "Bomi"
    BONG = "Bong"
    GBARPOLU = "Gbarpolu"
    GRAND_BASSA = "Grand Bassa"
    GRAND_CAPE_MOUNT = "Grand Cape Mount"
    GRAND_GEDEH = "Grand Gedeh"
    GRAND_KRU = "Grand Kru"
    LOFA = "Lofa"
    MARGIBI = "Margibi"
    MARYLAND = "Maryland"
    MONTSERRADO = "Montserrado"
    NIMBA = "Nimba"
    RIVERCESS = "Rivercess"
    RIVER_GEE = "River Gee"
    SINOE = "Sinoe"


class Address(Document):
    county: Optional[County] = None
    city: Optional[str] = None
    community: Optional[str] = None


class SkillEntry(Document):
    name: str
    level: str = "beginner"
    verified: bool = False


class User(Document):
    full_name: str
    email: Indexed(EmailStr, unique=True)
    phone: Optional[str] = None
    national_id: Optional[str] = None
    password_hash: str
    role: UserRole = UserRole.CITIZEN
    status: UserStatus = UserStatus.PENDING_VERIFICATION
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    county: Optional[County] = None
    city: Optional[str] = None

    # verification
    email_verified: bool = False
    phone_verified: bool = False
    id_verified: bool = False
    mfa_enabled: bool = False
    mfa_secret: Optional[str] = None

    # profile
    skills: List[SkillEntry] = []
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None

    # government official fields
    ministry: Optional[str] = None
    position: Optional[str] = None
    employee_id: Optional[str] = None

    # stats
    courses_enrolled: int = 0
    courses_completed: int = 0
    points: int = 0
    badges: List[str] = []

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: Optional[datetime] = None

    class Settings:
        name = "users"
        indexes = [
            "email",
            "role",
            "status",
            "national_id",
        ]

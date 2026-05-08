from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole, UserStatus, County


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    bio: Optional[str] = None
    county: Optional[County] = None
    city: Optional[str] = None
    education_level: Optional[str] = None
    occupation: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: UserRole
    status: UserStatus
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    county: Optional[str] = None
    city: Optional[str] = None
    email_verified: bool
    mfa_enabled: bool
    courses_enrolled: int
    courses_completed: int
    points: int
    badges: List[str]
    created_at: datetime


class UserListResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

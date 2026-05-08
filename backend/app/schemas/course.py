from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.models.course import CourseCategory, CourseLevel, CourseStatus, LessonType


class CourseCreate(BaseModel):
    title: str
    description: str
    short_description: Optional[str] = None
    category: CourseCategory
    level: CourseLevel = CourseLevel.BEGINNER
    price: float = 0.0
    is_free: bool = True
    is_government_sponsored: bool = False
    language: str = "English"
    tags: List[str] = []
    prerequisites: List[str] = []
    learning_outcomes: List[str] = []


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    category: Optional[CourseCategory] = None
    level: Optional[CourseLevel] = None
    status: Optional[CourseStatus] = None
    price: Optional[float] = None
    is_free: Optional[bool] = None
    tags: Optional[List[str]] = None
    learning_outcomes: Optional[List[str]] = None


class CourseResponse(BaseModel):
    id: str
    title: str
    slug: str
    description: str
    short_description: Optional[str] = None
    category: str
    level: str
    status: str
    thumbnail_url: Optional[str] = None
    instructor_name: str
    price: float
    is_free: bool
    is_government_sponsored: bool
    certificate_available: bool
    total_lessons: int
    total_duration_hours: float
    enrolled_count: int
    rating: float
    rating_count: int
    tags: List[str]
    created_at: datetime


class LessonCreate(BaseModel):
    title: str
    description: Optional[str] = None
    lesson_type: LessonType = LessonType.VIDEO
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration_minutes: int = 0
    order: int = 0
    is_free_preview: bool = False


class EnrollmentResponse(BaseModel):
    id: str
    course_id: str
    course_title: str
    status: str
    progress_percent: float
    certificate_issued: bool
    enrolled_at: datetime
    last_accessed: datetime


class CourseReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

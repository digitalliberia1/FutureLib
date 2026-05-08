from beanie import Document, Link
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum
from bson import ObjectId


class CourseCategory(str, Enum):
    PROGRAMMING = "Programming"
    AI_ML = "AI & Machine Learning"
    CYBERSECURITY = "Cybersecurity"
    NETWORKING = "Networking"
    UI_UX = "UI/UX Design"
    ROBOTICS = "Robotics"
    CLOUD_COMPUTING = "Cloud Computing"
    DATA_SCIENCE = "Data Science"
    ECOMMERCE = "E-commerce"
    DIGITAL_MARKETING = "Digital Marketing"
    ENTREPRENEURSHIP = "Entrepreneurship"
    FINANCIAL_LITERACY = "Financial Literacy"
    AGRICULTURE_TECH = "Agriculture Technology"
    RENEWABLE_ENERGY = "Renewable Energy"
    CONSTRUCTION_TECH = "Construction Technology"


class CourseLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class CourseStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class LessonType(str, Enum):
    VIDEO = "video"
    TEXT = "text"
    QUIZ = "quiz"
    ASSIGNMENT = "assignment"
    LIVE = "live"


class Lesson(Document):
    course_id: str
    title: str
    description: Optional[str] = None
    lesson_type: LessonType = LessonType.VIDEO
    content_url: Optional[str] = None
    content_text: Optional[str] = None
    duration_minutes: int = 0
    order: int = 0
    is_free_preview: bool = False
    quiz_questions: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "lessons"


class Course(Document):
    title: str
    slug: str
    description: str
    short_description: Optional[str] = None
    category: CourseCategory
    level: CourseLevel = CourseLevel.BEGINNER
    status: CourseStatus = CourseStatus.DRAFT
    thumbnail_url: Optional[str] = None
    intro_video_url: Optional[str] = None
    instructor_id: str
    instructor_name: str
    price: float = 0.0
    is_free: bool = True
    is_government_sponsored: bool = False
    certificate_available: bool = True
    language: str = "English"
    tags: List[str] = []
    prerequisites: List[str] = []
    learning_outcomes: List[str] = []
    total_lessons: int = 0
    total_duration_hours: float = 0.0
    enrolled_count: int = 0
    rating: float = 0.0
    rating_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    published_at: Optional[datetime] = None

    class Settings:
        name = "courses"
        indexes = ["category", "level", "status", "instructor_id", "slug"]


class EnrollmentStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    DROPPED = "dropped"


class Enrollment(Document):
    user_id: str
    course_id: str
    course_title: str
    status: EnrollmentStatus = EnrollmentStatus.ACTIVE
    progress_percent: float = 0.0
    lessons_completed: List[str] = []
    current_lesson_id: Optional[str] = None
    certificate_issued: bool = False
    certificate_url: Optional[str] = None
    enrolled_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: Optional[datetime] = None
    last_accessed: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "enrollments"
        indexes = ["user_id", "course_id"]


class CourseReview(Document):
    course_id: str
    user_id: str
    user_name: str
    rating: int
    comment: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "course_reviews"

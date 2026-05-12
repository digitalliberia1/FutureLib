from beanie import Document
from pydantic import Field
from typing import Optional, List
from datetime import datetime, timezone
from enum import Enum


class ThreadCategory(str, Enum):
    GENERAL = "general"
    COURSE = "course"
    CAREER = "career"
    STARTUP = "startup"
    GOVERNMENT = "government"
    TECH = "tech"
    ANNOUNCEMENTS = "announcements"


class ForumThread(Document):
    title: str
    body: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    category: ThreadCategory = ThreadCategory.GENERAL
    course_id: Optional[str] = None  # if thread is attached to a course
    tags: List[str] = []
    is_pinned: bool = False
    is_locked: bool = False
    view_count: int = 0
    reply_count: int = 0
    upvotes: int = 0
    upvoter_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "forum_threads"
        indexes = ["author_id", "category", "course_id", "is_pinned"]


class ForumPost(Document):
    thread_id: str
    body: str
    author_id: str
    author_name: str
    author_avatar: Optional[str] = None
    parent_post_id: Optional[str] = None  # for nested replies
    upvotes: int = 0
    upvoter_ids: List[str] = []
    is_accepted_answer: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "forum_posts"
        indexes = ["thread_id", "author_id"]

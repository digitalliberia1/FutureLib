from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional, List
from datetime import datetime, timezone
import re
from app.models.course import Course, Lesson, Enrollment, CourseReview, CourseStatus, EnrollmentStatus
from app.models.user import User
from app.schemas.course import CourseCreate, CourseUpdate, LessonCreate, CourseReviewCreate
from app.middleware.auth import get_current_user, require_educator

router = APIRouter(prefix="/learning", tags=["Learning Platform"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


@router.get("/courses")
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    category: Optional[str] = None,
    level: Optional[str] = None,
    is_free: Optional[bool] = None,
    is_government_sponsored: Optional[bool] = None,
    search: Optional[str] = None,
):
    filters = [Course.status == CourseStatus.PUBLISHED]
    if category:
        filters.append(Course.category == category)
    if level:
        filters.append(Course.level == level)
    if is_free is not None:
        filters.append(Course.is_free == is_free)
    if is_government_sponsored is not None:
        filters.append(Course.is_government_sponsored == is_government_sponsored)

    query = Course.find(*filters)
    total = await query.count()
    courses = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "courses": [_course_dict(c) for c in courses],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/courses/{course_id}")
async def get_course(course_id: str):
    course = await Course.get(course_id)
    if not course or course.status != CourseStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Course not found")
    lessons = await Lesson.find(Lesson.course_id == course_id).sort("+order").to_list()
    result = _course_dict(course)
    result["lessons"] = [
        {
            "id": str(l.id),
            "title": l.title,
            "lesson_type": l.lesson_type,
            "duration_minutes": l.duration_minutes,
            "order": l.order,
            "is_free_preview": l.is_free_preview,
        }
        for l in lessons
    ]
    return result


@router.post("/courses", status_code=status.HTTP_201_CREATED)
async def create_course(body: CourseCreate, current_user: User = Depends(require_educator)):
    slug = slugify(body.title)
    existing = await Course.find_one(Course.slug == slug)
    if existing:
        slug = f"{slug}-{str(current_user.id)[:6]}"

    course = Course(
        **body.model_dump(),
        slug=slug,
        instructor_id=str(current_user.id),
        instructor_name=current_user.full_name,
    )
    await course.insert()
    return {"message": "Course created", "course_id": str(course.id)}


@router.put("/courses/{course_id}")
async def update_course(course_id: str, body: CourseUpdate, current_user: User = Depends(require_educator)):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if str(course.instructor_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(course, key, value)

    if body.status == "published" and not course.published_at:
        course.published_at = datetime.now(timezone.utc)

    course.updated_at = datetime.now(timezone.utc)
    await course.save()
    return {"message": "Course updated"}


@router.post("/courses/{course_id}/lessons", status_code=status.HTTP_201_CREATED)
async def add_lesson(course_id: str, body: LessonCreate, current_user: User = Depends(require_educator)):
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    if str(course.instructor_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    lesson = Lesson(**body.model_dump(), course_id=course_id)
    await lesson.insert()

    course.total_lessons += 1
    course.total_duration_hours = round(course.total_duration_hours + body.duration_minutes / 60, 2)
    await course.save()
    return {"message": "Lesson added", "lesson_id": str(lesson.id)}


@router.post("/courses/{course_id}/enroll")
async def enroll_in_course(course_id: str, current_user: User = Depends(get_current_user)):
    course = await Course.get(course_id)
    if not course or course.status != CourseStatus.PUBLISHED:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = await Enrollment.find_one(
        Enrollment.user_id == str(current_user.id),
        Enrollment.course_id == course_id,
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already enrolled")

    enrollment = Enrollment(
        user_id=str(current_user.id),
        course_id=course_id,
        course_title=course.title,
    )
    await enrollment.insert()

    course.enrolled_count += 1
    await course.save()

    current_user.courses_enrolled += 1
    await current_user.save()

    return {"message": "Enrolled successfully", "enrollment_id": str(enrollment.id)}


@router.get("/my-courses")
async def get_my_courses(current_user: User = Depends(get_current_user)):
    enrollments = await Enrollment.find(Enrollment.user_id == str(current_user.id)).to_list()
    return {
        "enrollments": [
            {
                "id": str(e.id),
                "course_id": e.course_id,
                "course_title": e.course_title,
                "status": e.status,
                "progress_percent": e.progress_percent,
                "certificate_issued": e.certificate_issued,
                "enrolled_at": e.enrolled_at,
                "last_accessed": e.last_accessed,
            }
            for e in enrollments
        ]
    }


@router.post("/courses/{course_id}/lessons/{lesson_id}/complete")
async def complete_lesson(course_id: str, lesson_id: str, current_user: User = Depends(get_current_user)):
    enrollment = await Enrollment.find_one(
        Enrollment.user_id == str(current_user.id),
        Enrollment.course_id == course_id,
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    if lesson_id not in enrollment.lessons_completed:
        enrollment.lessons_completed.append(lesson_id)

    course = await Course.get(course_id)
    if course and course.total_lessons > 0:
        enrollment.progress_percent = round(
            len(enrollment.lessons_completed) / course.total_lessons * 100, 1
        )

    if enrollment.progress_percent >= 100:
        enrollment.status = EnrollmentStatus.COMPLETED
        enrollment.completed_at = datetime.now(timezone.utc)
        enrollment.certificate_issued = True
        current_user.courses_completed += 1
        current_user.points += 100
        await current_user.save()

    enrollment.last_accessed = datetime.now(timezone.utc)
    await enrollment.save()
    return {"progress_percent": enrollment.progress_percent, "completed": enrollment.status == EnrollmentStatus.COMPLETED}


@router.post("/courses/{course_id}/reviews")
async def review_course(course_id: str, body: CourseReviewCreate, current_user: User = Depends(get_current_user)):
    enrollment = await Enrollment.find_one(
        Enrollment.user_id == str(current_user.id),
        Enrollment.course_id == course_id,
    )
    if not enrollment:
        raise HTTPException(status_code=403, detail="Must be enrolled to review")

    existing_review = await CourseReview.find_one(
        CourseReview.course_id == course_id,
        CourseReview.user_id == str(current_user.id),
    )
    if existing_review:
        raise HTTPException(status_code=400, detail="Already reviewed")

    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be 1-5")

    review = CourseReview(
        course_id=course_id,
        user_id=str(current_user.id),
        user_name=current_user.full_name,
        rating=body.rating,
        comment=body.comment,
    )
    await review.insert()

    course = await Course.get(course_id)
    if course:
        total = course.rating * course.rating_count + body.rating
        course.rating_count += 1
        course.rating = round(total / course.rating_count, 2)
        await course.save()

    return {"message": "Review submitted"}


@router.get("/courses/{course_id}/reviews")
async def get_reviews(course_id: str):
    reviews = await CourseReview.find(CourseReview.course_id == course_id).to_list()
    return {
        "reviews": [
            {
                "id": str(r.id),
                "user_name": r.user_name,
                "rating": r.rating,
                "comment": r.comment,
                "created_at": r.created_at,
            }
            for r in reviews
        ]
    }


@router.get("/categories")
async def get_categories():
    from app.models.course import CourseCategory
    return {"categories": [c.value for c in CourseCategory]}


def _course_dict(course: Course) -> dict:
    return {
        "id": str(course.id),
        "title": course.title,
        "slug": course.slug,
        "description": course.description,
        "short_description": course.short_description,
        "category": course.category,
        "level": course.level,
        "status": course.status,
        "thumbnail_url": course.thumbnail_url,
        "instructor_name": course.instructor_name,
        "price": course.price,
        "is_free": course.is_free,
        "is_government_sponsored": course.is_government_sponsored,
        "certificate_available": course.certificate_available,
        "total_lessons": course.total_lessons,
        "total_duration_hours": course.total_duration_hours,
        "enrolled_count": course.enrolled_count,
        "rating": course.rating,
        "rating_count": course.rating_count,
        "tags": course.tags,
        "learning_outcomes": course.learning_outcomes,
        "created_at": course.created_at,
    }

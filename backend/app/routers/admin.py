from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from datetime import datetime, timezone
from app.models.user import User, UserRole, UserStatus
from app.middleware.auth import get_current_user, require_admin

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
async def get_admin_stats(_: User = Depends(require_admin)):
    from app.models.course import Course, Enrollment
    from app.models.startup import Startup
    from app.models.job import Job
    from app.models.government import GovernmentService, ServiceApplication

    total_users = await User.find().count()
    users_by_role = {}
    for role in UserRole:
        count = await User.find(User.role == role).count()
        users_by_role[role.value] = count

    active_users = await User.find(User.status == UserStatus.ACTIVE).count()
    pending_users = await User.find(User.status == UserStatus.PENDING_VERIFICATION).count()
    suspended_users = await User.find(User.status == UserStatus.SUSPENDED).count()

    total_courses = await Course.find().count()
    total_enrollments = await Enrollment.find().count()
    total_startups = await Startup.find().count()
    total_jobs = await Job.find().count()
    total_services = await GovernmentService.find().count()
    total_applications = await ServiceApplication.find().count()

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "pending": pending_users,
            "suspended": suspended_users,
            "by_role": users_by_role,
        },
        "content": {
            "courses": total_courses,
            "enrollments": total_enrollments,
            "startups": total_startups,
            "jobs": total_jobs,
            "services": total_services,
            "applications": total_applications,
        },
    }


@router.get("/users")
async def list_all_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    _: User = Depends(require_admin),
):
    filters = []
    if role:
        filters.append(User.role == role)
    if status:
        filters.append(User.status == status)

    query = User.find(*filters).sort("-created_at")
    total = await query.count()
    users = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    # Apply search filter in Python (Beanie doesn't support regex easily)
    if search:
        q = search.lower()
        users = [u for u in users if q in u.full_name.lower() or q in u.email.lower()]

    return {
        "users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
                "county": u.county,
                "email_verified": u.email_verified,
                "courses_enrolled": u.courses_enrolled,
                "courses_completed": u.courses_completed,
                "points": u.points,
                "created_at": u.created_at,
                "last_login": u.last_login,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/users/{user_id}/role")
async def update_user_role(user_id: str, new_role: UserRole, _: User = Depends(require_admin)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = new_role
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return {"message": f"Role updated to {new_role}"}


@router.patch("/users/{user_id}/status")
async def update_user_status(user_id: str, new_status: UserStatus, _: User = Depends(require_admin)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = new_status
    user.updated_at = datetime.now(timezone.utc)
    await user.save()
    return {"message": f"Status updated to {new_status}"}


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, current_admin: User = Depends(require_admin)):
    if user_id == str(current_admin.id):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await user.delete()
    return {"message": "User deleted"}


@router.post("/users/{user_id}/send-notification")
async def send_notification_to_user(
    user_id: str,
    title: str,
    message: str,
    _: User = Depends(require_admin),
):
    from app.models.notification import Notification, NotificationType
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=NotificationType.INFO,
    )
    await n.insert()
    return {"message": "Notification sent"}


@router.post("/broadcast")
async def broadcast_notification(
    title: str,
    message: str,
    role: Optional[str] = None,
    _: User = Depends(require_admin),
):
    from app.models.notification import Notification, NotificationType
    filters = []
    if role:
        filters.append(User.role == role)
    users = await User.find(*filters).to_list()
    count = 0
    for user in users:
        n = Notification(
            user_id=str(user.id),
            title=title,
            message=message,
            notification_type=NotificationType.INFO,
        )
        await n.insert()
        count += 1
    return {"message": f"Broadcast sent to {count} users"}


@router.get("/courses")
async def list_all_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = None,
    _: User = Depends(require_admin),
):
    from app.models.course import Course
    filters = []
    if status:
        filters.append(Course.status == status)
    query = Course.find(*filters).sort("-created_at")
    total = await query.count()
    courses = await query.skip((page - 1) * page_size).limit(page_size).to_list()
    return {
        "courses": [
            {
                "id": str(c.id),
                "title": c.title,
                "category": c.category,
                "level": c.level,
                "status": c.status,
                "instructor_name": c.instructor_name,
                "enrolled_count": c.enrolled_count,
                "is_free": c.is_free,
                "created_at": c.created_at,
            }
            for c in courses
        ],
        "total": total,
    }


@router.patch("/courses/{course_id}/status")
async def update_course_status(course_id: str, new_status: str, _: User = Depends(require_admin)):
    from app.models.course import Course, CourseStatus
    course = await Course.get(course_id)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    course.status = CourseStatus(new_status)
    course.updated_at = datetime.now(timezone.utc)
    await course.save()
    return {"message": f"Course status updated to {new_status}"}

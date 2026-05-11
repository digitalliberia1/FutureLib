from fastapi import APIRouter, Depends
from app.models.user import User, UserRole
from app.models.course import Course, Enrollment
from app.models.startup import Startup
from app.models.job import Job, JobApplication
from app.models.government import GovernmentService, ServiceApplication
from app.models.grant import Grant, GrantApplication
from app.middleware.auth import get_current_user
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("/platform")
async def platform_overview(current_user: User = Depends(get_current_user)):
    total_users = await User.find().count()
    total_courses = await Course.find().count()
    total_startups = await Startup.find().count()
    total_jobs = await Job.find().count()
    total_enrollments = await Enrollment.find().count()
    total_applications = await ServiceApplication.find().count()

    citizens = await User.find(User.role == UserRole.CITIZEN).count()
    officials = await User.find(User.role == UserRole.GOVERNMENT_OFFICIAL).count()
    founders = await User.find(User.role == UserRole.STARTUP_FOUNDER).count()

    # Enrollments by status
    active_enrollments = await Enrollment.find(Enrollment.status == "active").count()
    completed_enrollments = await Enrollment.find(Enrollment.status == "completed").count()

    # Open jobs
    open_jobs = await Job.find(Job.status == "open").count()
    gov_jobs = await Job.find(Job.is_government_post == True).count()

    return {
        "users": {
            "total": total_users,
            "citizens": citizens,
            "officials": officials,
            "founders": founders,
        },
        "learning": {
            "total_courses": total_courses,
            "total_enrollments": total_enrollments,
            "active_enrollments": active_enrollments,
            "completed_enrollments": completed_enrollments,
        },
        "economy": {
            "total_startups": total_startups,
            "open_jobs": open_jobs,
            "government_jobs": gov_jobs,
        },
        "government": {
            "total_applications": total_applications,
        },
    }


@router.get("/learning")
async def learning_analytics(current_user: User = Depends(get_current_user)):
    from app.models.course import CourseCategory
    categories = [c.value for c in CourseCategory]

    category_data = []
    for cat in categories:
        count = await Course.find(Course.category == cat).count()
        if count > 0:
            category_data.append({"category": cat, "courses": count})

    category_data.sort(key=lambda x: x["courses"], reverse=True)

    total_enrollments = await Enrollment.find().count()
    completed = await Enrollment.find(Enrollment.status == "completed").count()
    completion_rate = round(completed / total_enrollments * 100, 1) if total_enrollments > 0 else 0

    return {
        "categories": category_data,
        "total_enrollments": total_enrollments,
        "completion_rate": completion_rate,
        "certificates_issued": completed,
    }


@router.get("/economy")
async def economy_analytics(current_user: User = Depends(get_current_user)):
    from app.models.startup import StartupSector, StartupStage
    sectors = [s.value for s in StartupSector]

    sector_data = []
    for sector in sectors:
        count = await Startup.find(Startup.sector == sector).count()
        if count > 0:
            sector_data.append({"sector": sector, "count": count})

    stage_data = []
    for stage in StartupStage:
        count = await Startup.find(Startup.stage == stage).count()
        stage_data.append({"stage": stage.value, "count": count})

    from app.models.job import JobType
    job_type_data = []
    for jt in JobType:
        count = await Job.find(Job.job_type == jt).count()
        if count > 0:
            job_type_data.append({"type": jt.value, "count": count})

    total_funding_apps = await GrantApplication.find().count()
    approved_grants = await GrantApplication.find(GrantApplication.status == "approved").count()

    return {
        "startups_by_sector": sector_data,
        "startups_by_stage": stage_data,
        "jobs_by_type": job_type_data,
        "funding": {
            "total_applications": total_funding_apps,
            "approved": approved_grants,
        },
    }


@router.get("/government")
async def government_analytics(current_user: User = Depends(get_current_user)):
    from app.models.government import ServiceCategory
    categories = [c.value for c in ServiceCategory]

    cat_data = []
    for cat in categories:
        total = await GovernmentService.find(GovernmentService.category == cat).count()
        apps = await ServiceApplication.find(ServiceApplication.service_id.in_(
            [str(s.id) for s in await GovernmentService.find(GovernmentService.category == cat).to_list()]
        )).count()
        if total > 0:
            cat_data.append({"category": cat, "services": total, "applications": apps})

    by_status = {
        "submitted": await ServiceApplication.find(ServiceApplication.status == "submitted").count(),
        "under_review": await ServiceApplication.find(ServiceApplication.status == "under_review").count(),
        "approved": await ServiceApplication.find(ServiceApplication.status == "approved").count(),
        "rejected": await ServiceApplication.find(ServiceApplication.status == "rejected").count(),
        "completed": await ServiceApplication.find(ServiceApplication.status == "completed").count(),
    }

    return {
        "categories": cat_data,
        "applications_by_status": by_status,
        "total_services": await GovernmentService.find().count(),
        "total_applications": await ServiceApplication.find().count(),
    }

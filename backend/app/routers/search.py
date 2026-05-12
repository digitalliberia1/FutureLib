from fastapi import APIRouter, Query
from typing import Optional

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/")
async def unified_search(
    q: str = Query(..., min_length=1, description="Search query"),
    type: Optional[str] = Query(None, description="Filter by type: courses, jobs, startups, services"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
):
    results = []
    total = 0

    search_types = [type] if type else ["courses", "jobs", "startups", "services"]

    for search_type in search_types:
        if search_type == "courses":
            from app.models.course import Course, CourseStatus
            courses = await Course.find(Course.status == CourseStatus.PUBLISHED).to_list()
            for c in courses:
                text = f"{c.title} {c.description or ''} {c.category} {' '.join(c.tags)}".lower()
                if q.lower() in text:
                    results.append({
                        "type": "course",
                        "id": str(c.id),
                        "title": c.title,
                        "description": c.short_description or c.description[:120] if c.description else "",
                        "meta": f"{c.category} · {c.level} · {'FREE' if c.is_free else f'${c.price}'}",
                        "url": f"/learn/{c.id}",
                        "badge": "📚 Course",
                        "badge_color": "badge-blue",
                    })

        elif search_type == "jobs":
            from app.models.job import Job, JobStatus
            jobs = await Job.find(Job.status == JobStatus.OPEN).to_list()
            for j in jobs:
                text = f"{j.title} {j.description or ''} {j.job_type} {j.employer_name} {' '.join(j.skills_required)}".lower()
                if q.lower() in text:
                    results.append({
                        "type": "job",
                        "id": str(j.id),
                        "title": j.title,
                        "description": j.description[:120] if j.description else "",
                        "meta": f"{j.employer_name} · {j.job_type} · {j.experience_level}",
                        "url": f"/jobs",
                        "badge": "💼 Job",
                        "badge_color": "badge-green",
                    })

        elif search_type == "startups":
            from app.models.startup import Startup, StartupStatus
            startups = await Startup.find(Startup.status == StartupStatus.APPROVED).to_list()
            for s in startups:
                text = f"{s.name} {s.description or ''} {s.sector} {s.tagline or ''}".lower()
                if q.lower() in text:
                    results.append({
                        "type": "startup",
                        "id": str(s.id),
                        "title": s.name,
                        "description": s.tagline or (s.description[:120] if s.description else ""),
                        "meta": f"{s.sector} · {s.stage}",
                        "url": f"/startups",
                        "badge": "🚀 Startup",
                        "badge_color": "badge-red",
                    })

        elif search_type == "services":
            from app.models.government import GovernmentService, ServiceStatus
            services = await GovernmentService.find(GovernmentService.status == ServiceStatus.ACTIVE).to_list()
            for svc in services:
                text = f"{svc.name} {svc.description or ''} {svc.category} {svc.ministry}".lower()
                if q.lower() in text:
                    results.append({
                        "type": "service",
                        "id": str(svc.id),
                        "title": svc.name,
                        "description": svc.description[:120] if svc.description else "",
                        "meta": f"{svc.ministry} · {svc.processing_days} days",
                        "url": f"/services",
                        "badge": "🏛️ Service",
                        "badge_color": "badge-purple",
                    })

    total = len(results)
    start = (page - 1) * page_size
    paginated = results[start : start + page_size]

    return {
        "results": paginated,
        "total": total,
        "query": q,
        "page": page,
        "page_size": page_size,
        "type_counts": {
            "courses": sum(1 for r in results if r["type"] == "course"),
            "jobs": sum(1 for r in results if r["type"] == "job"),
            "startups": sum(1 for r in results if r["type"] == "startup"),
            "services": sum(1 for r in results if r["type"] == "service"),
        },
    }

from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import Optional
import re
from datetime import datetime, timezone
from app.models.job import Job, JobApplication, JobStatus, ApplicationStatus
from app.models.user import User
from app.schemas.job import JobCreate, JobUpdate, JobApplicationCreate
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/jobs", tags=["Job Marketplace"])


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    return re.sub(r"[\s_-]+", "-", text)


@router.get("/")
async def list_jobs(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    job_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    county: Optional[str] = None,
    is_remote: Optional[bool] = None,
    is_government: Optional[bool] = None,
    search: Optional[str] = None,
):
    filters = [Job.status == JobStatus.OPEN]
    if job_type:
        filters.append(Job.job_type == job_type)
    if experience_level:
        filters.append(Job.experience_level == experience_level)
    if county:
        filters.append(Job.county == county)
    if is_remote is not None:
        filters.append(Job.is_remote == is_remote)
    if is_government is not None:
        filters.append(Job.is_government_post == is_government)

    query = Job.find(*filters)
    total = await query.count()
    jobs = await query.sort("-created_at").skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "jobs": [_job_dict(j) for j in jobs],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/{job_id}")
async def get_job(job_id: str):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    job.views += 1
    await job.save()
    return _job_dict(job)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def post_job(body: JobCreate, current_user: User = Depends(get_current_user)):
    slug = slugify(body.title)
    existing = await Job.find_one(Job.slug == slug)
    if existing:
        slug = f"{slug}-{str(current_user.id)[:6]}"

    is_gov = current_user.role in ["government_official", "admin"]
    ministry = current_user.ministry if is_gov else None

    job = Job(
        **body.model_dump(),
        slug=slug,
        employer_id=str(current_user.id),
        employer_name=current_user.full_name,
        is_government_post=is_gov,
        ministry=ministry,
    )
    await job.insert()
    return {"message": "Job posted successfully", "job_id": str(job.id)}


@router.put("/{job_id}")
async def update_job(job_id: str, body: JobUpdate, current_user: User = Depends(get_current_user)):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.employer_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    job.updated_at = datetime.now(timezone.utc)
    await job.save()
    return {"message": "Job updated"}


@router.delete("/{job_id}")
async def close_job(job_id: str, current_user: User = Depends(get_current_user)):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.employer_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    job.status = JobStatus.CLOSED
    await job.save()
    return {"message": "Job closed"}


@router.post("/{job_id}/apply", status_code=status.HTTP_201_CREATED)
async def apply_for_job(job_id: str, body: JobApplicationCreate, current_user: User = Depends(get_current_user)):
    job = await Job.get(job_id)
    if not job or job.status != JobStatus.OPEN:
        raise HTTPException(status_code=404, detail="Job not found or closed")

    existing = await JobApplication.find_one(
        JobApplication.job_id == job_id,
        JobApplication.applicant_id == str(current_user.id),
    )
    if existing:
        raise HTTPException(status_code=400, detail="Already applied for this job")

    application = JobApplication(
        job_id=job_id,
        job_title=job.title,
        applicant_id=str(current_user.id),
        applicant_name=current_user.full_name,
        cover_letter=body.cover_letter,
        portfolio_url=body.portfolio_url,
    )
    await application.insert()

    job.applicant_count += 1
    await job.save()
    return {"message": "Application submitted", "application_id": str(application.id)}


@router.get("/my/applications")
async def my_applications(current_user: User = Depends(get_current_user)):
    apps = await JobApplication.find(
        JobApplication.applicant_id == str(current_user.id)
    ).sort("-applied_at").to_list()
    return {
        "applications": [
            {
                "id": str(a.id),
                "job_id": a.job_id,
                "job_title": a.job_title,
                "status": a.status,
                "applied_at": a.applied_at,
            }
            for a in apps
        ]
    }


@router.get("/{job_id}/applications")
async def job_applications(job_id: str, current_user: User = Depends(get_current_user)):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.employer_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    apps = await JobApplication.find(JobApplication.job_id == job_id).to_list()
    return {
        "applications": [
            {
                "id": str(a.id),
                "applicant_name": a.applicant_name,
                "status": a.status,
                "applied_at": a.applied_at,
                "cover_letter": a.cover_letter,
                "portfolio_url": a.portfolio_url,
            }
            for a in apps
        ]
    }


@router.patch("/{job_id}/applications/{application_id}/status")
async def update_application_status(
    job_id: str,
    application_id: str,
    new_status: ApplicationStatus,
    current_user: User = Depends(get_current_user),
):
    job = await Job.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if str(job.employer_id) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    app = await JobApplication.get(application_id)
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = new_status
    app.updated_at = datetime.now(timezone.utc)
    await app.save()
    return {"message": f"Application status updated to {new_status}"}


@router.get("/stats/overview")
async def jobs_overview():
    total = await Job.find().count()
    open_jobs = await Job.find(Job.status == JobStatus.OPEN).count()
    gov_jobs = await Job.find(Job.is_government_post == True, Job.status == JobStatus.OPEN).count()
    return {
        "total_jobs": total,
        "open_jobs": open_jobs,
        "government_jobs": gov_jobs,
    }


def _job_dict(j: Job) -> dict:
    return {
        "id": str(j.id),
        "employer_name": j.employer_name,
        "employer_logo": j.employer_logo,
        "is_government_post": j.is_government_post,
        "ministry": j.ministry,
        "title": j.title,
        "slug": j.slug,
        "description": j.description,
        "requirements": j.requirements,
        "skills_required": j.skills_required,
        "job_type": j.job_type,
        "experience_level": j.experience_level,
        "county": j.county,
        "is_remote": j.is_remote,
        "salary_min": j.salary_min,
        "salary_max": j.salary_max,
        "salary_negotiable": j.salary_negotiable,
        "application_deadline": j.application_deadline,
        "status": j.status,
        "applicant_count": j.applicant_count,
        "views": j.views,
        "tags": j.tags,
        "created_at": j.created_at,
    }

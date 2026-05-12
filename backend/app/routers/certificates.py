from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone
import uuid
import hashlib
from app.models.user import User
from app.models.course import Enrollment, EnrollmentStatus, Course
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/certificates", tags=["Certificates"])


def _generate_cert_id(user_id: str, course_id: str) -> str:
    raw = f"FL-CERT-{user_id}-{course_id}-{uuid.uuid4().hex[:8]}"
    return raw.upper()


def _generate_verification_hash(cert_id: str) -> str:
    return hashlib.sha256(cert_id.encode()).hexdigest()[:16].upper()


@router.get("/my")
async def get_my_certificates(current_user: User = Depends(get_current_user)):
    enrollments = await Enrollment.find(
        Enrollment.user_id == str(current_user.id),
        Enrollment.certificate_issued == True,
    ).to_list()

    certs = []
    for e in enrollments:
        course = await Course.get(e.course_id)
        cert_id = e.certificate_url or _generate_cert_id(str(current_user.id), e.course_id)
        certs.append({
            "certificate_id": cert_id,
            "course_id": e.course_id,
            "course_title": e.course_title,
            "course_category": course.category if course else None,
            "instructor_name": course.instructor_name if course else None,
            "recipient_name": current_user.full_name,
            "completed_at": e.completed_at,
            "issued_at": e.completed_at,
            "verification_url": f"/certificates/verify/{cert_id}",
        })

    return {"certificates": certs, "total": len(certs)}


@router.post("/courses/{course_id}/generate")
async def generate_certificate(course_id: str, current_user: User = Depends(get_current_user)):
    enrollment = await Enrollment.find_one(
        Enrollment.user_id == str(current_user.id),
        Enrollment.course_id == course_id,
    )
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    if enrollment.status != EnrollmentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Course not yet completed")

    if not enrollment.certificate_url:
        cert_id = _generate_cert_id(str(current_user.id), course_id)
        enrollment.certificate_url = cert_id
        enrollment.certificate_issued = True
        await enrollment.save()

    course = await Course.get(course_id)

    return {
        "certificate_id": enrollment.certificate_url,
        "course_title": enrollment.course_title,
        "course_category": course.category if course else None,
        "instructor_name": course.instructor_name if course else None,
        "recipient_name": current_user.full_name,
        "completed_at": enrollment.completed_at,
        "verification_hash": _generate_verification_hash(enrollment.certificate_url),
        "verification_url": f"/certificates/verify/{enrollment.certificate_url}",
        "message": "Certificate generated successfully",
    }


@router.get("/verify/{certificate_id}")
async def verify_certificate(certificate_id: str):
    """Public endpoint to verify a certificate — no auth required."""
    # Find enrollment by certificate_url
    enrollment = await Enrollment.find_one(
        Enrollment.certificate_url == certificate_id,
        Enrollment.certificate_issued == True,
    )
    if not enrollment:
        return {
            "valid": False,
            "message": "Certificate not found or invalid",
        }

    user = await User.get(enrollment.user_id)
    course = await Course.get(enrollment.course_id)

    return {
        "valid": True,
        "certificate_id": certificate_id,
        "recipient_name": user.full_name if user else "Unknown",
        "course_title": enrollment.course_title,
        "course_category": course.category if course else None,
        "instructor_name": course.instructor_name if course else None,
        "completed_at": enrollment.completed_at,
        "issued_by": "FutureLib — National Digital Platform of Liberia",
        "verification_hash": _generate_verification_hash(certificate_id),
    }

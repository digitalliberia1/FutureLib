"""
Open edX Learning Router — proxies the FutureLib 'learn' section to Open edX APIs.

All endpoints live under /api/v1/lms/ to avoid collision with the existing
/api/v1/learning/ router that stores courses in MongoDB.

Architecture:
  FutureLib Frontend  →  FutureLib Backend (/lms/*)  →  Open edX LMS/Discovery
  User auth handled by FutureLib JWT; Open edX calls use server-side OAuth2.
"""

import logging
from typing import Optional

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel

from app.config import settings
from app.middleware.auth import get_current_user
from app.models.user import User
from app.services import openedx_client as lms
from app.services.openedx_auth import provision_user, get_sso_url

router = APIRouter(prefix="/lms", tags=["Open edX LMS"])
logger = logging.getLogger(__name__)


# ─── helpers ─────────────────────────────────────────────────────────────────

def _lms_error(exc: httpx.HTTPStatusError) -> HTTPException:
    """Translate an Open edX HTTP error into a FastAPI HTTPException."""
    try:
        detail = exc.response.json()
    except Exception:
        detail = exc.response.text or "Open edX LMS error"
    return HTTPException(status_code=exc.response.status_code, detail=detail)


async def _get_or_provision(user: User) -> str:
    """Return the Open edX username for a FutureLib user, provisioning if needed."""
    if not settings.OPENEDX_AUTO_PROVISION:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Open edX auto-provisioning is disabled.",
        )
    result = await provision_user(
        full_name=user.full_name,
        email=user.email,
        futurelib_user_id=str(user.id),
    )
    return result["username"]


# ─── Course Catalog (public) ─────────────────────────────────────────────────

@router.get("/courses")
async def list_courses(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    search: Optional[str] = None,
    org: Optional[str] = None,
):
    """Proxy Open edX course catalog — no authentication required."""
    try:
        return await lms.list_courses(page=page, page_size=page_size, search=search, org=org)
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


@router.get("/courses/{course_id:path}")
async def get_course(course_id: str):
    """Proxy a single Open edX course detail (URL-safe course key)."""
    try:
        return await lms.get_course(course_id)
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


# ─── Enrollment ──────────────────────────────────────────────────────────────

class EnrollRequest(BaseModel):
    course_id: str
    mode: str = "honor"


@router.post("/enroll", status_code=status.HTTP_201_CREATED)
async def enroll_current_user(
    body: EnrollRequest,
    current_user: User = Depends(get_current_user),
):
    """Enroll the authenticated FutureLib user in an Open edX course."""
    try:
        username = await _get_or_provision(current_user)
        result = await lms.enroll_user(username, body.course_id, body.mode)
        return {"message": "Enrolled successfully", "enrollment": result}
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


@router.get("/enrollment/{course_id:path}")
async def get_enrollment(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return the current user's enrollment status for a course."""
    try:
        username = await _get_or_provision(current_user)
        enrollment = await lms.get_enrollment(username, course_id)
        return enrollment or {"is_active": False, "mode": None}
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


@router.get("/my-courses")
async def list_my_courses(current_user: User = Depends(get_current_user)):
    """Return all Open edX enrollments for the current user."""
    try:
        username = await _get_or_provision(current_user)
        return await lms.list_user_enrollments(username)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


# ─── Course Content / Progress ───────────────────────────────────────────────

@router.get("/progress/{course_id:path}")
async def get_progress(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return course-home progress data for the current user."""
    try:
        username = await _get_or_provision(current_user)
        return await lms.get_course_progress(username, course_id)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


@router.get("/blocks/{course_id:path}")
async def get_course_blocks(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return the full course block tree for building a custom course player."""
    try:
        username = await _get_or_provision(current_user)
        return await lms.get_course_blocks(username, course_id)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


@router.get("/completion/{course_id:path}")
async def get_completion(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return the completion aggregates for a course."""
    try:
        username = await _get_or_provision(current_user)
        return await lms.get_completion_summary(username, course_id)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


# ─── Grades ──────────────────────────────────────────────────────────────────

@router.get("/grades/{course_id:path}")
async def get_grades(
    course_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return grade summary for the current user in a course."""
    try:
        username = await _get_or_provision(current_user)
        return await lms.get_grades(username, course_id)
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


# ─── Certificates ─────────────────────────────────────────────────────────────

@router.get("/certificates")
async def get_certificates(current_user: User = Depends(get_current_user)):
    """Return all Open edX certificates earned by the current user."""
    try:
        username = await _get_or_provision(current_user)
        return {"certificates": await lms.get_certificates(username)}
    except HTTPException:
        raise
    except httpx.HTTPStatusError as exc:
        raise _lms_error(exc)
    except httpx.RequestError:
        raise HTTPException(status_code=503, detail="Open edX LMS is unreachable.")


# ─── SSO URL ──────────────────────────────────────────────────────────────────

class SSORequest(BaseModel):
    next_url: str = "/dashboard"


@router.post("/sso-url")
async def get_lms_sso_url(
    body: SSORequest,
    current_user: User = Depends(get_current_user),
):
    """
    Return a short-lived SSO URL that seamlessly logs the user into Open edX.

    The frontend opens this URL in a new tab or navigates to it for the
    embedded course player when direct iframe embedding is needed.
    """
    try:
        username = await _get_or_provision(current_user)
        url = await get_sso_url(username, next_url=body.next_url)
        return {"sso_url": url, "username": username}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("SSO URL generation failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to generate SSO URL.")


# ─── LMS Base URL (used by frontend for iframe src) ───────────────────────────

@router.get("/config")
async def lms_config():
    """Return Open edX public configuration for the frontend."""
    return {
        "lms_url": settings.OPENEDX_LMS_URL,
        "cms_url": settings.OPENEDX_CMS_URL,
        "platform_name": settings.OPENEDX_PLATFORM_NAME,
    }

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from app.models.user import User, UserRole, UserStatus
from app.schemas.user import UserProfileUpdate, UserResponse, ChangePasswordRequest
from app.middleware.auth import get_current_user, require_admin
from app.utils.security import verify_password, hash_password
from datetime import datetime, timezone

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
async def get_my_profile(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        role=current_user.role,
        status=current_user.status,
        avatar_url=current_user.avatar_url,
        bio=current_user.bio,
        county=current_user.county,
        city=current_user.city,
        email_verified=current_user.email_verified,
        mfa_enabled=current_user.mfa_enabled,
        courses_enrolled=current_user.courses_enrolled,
        courses_completed=current_user.courses_completed,
        points=current_user.points,
        badges=current_user.badges,
        created_at=current_user.created_at,
    )


@router.put("/me")
async def update_my_profile(body: UserProfileUpdate, current_user: User = Depends(get_current_user)):
    update_data = body.model_dump(exclude_none=True)
    for key, value in update_data.items():
        setattr(current_user, key, value)
    current_user.updated_at = datetime.now(timezone.utc)
    await current_user.save()
    return {"message": "Profile updated successfully"}


@router.post("/me/change-password")
async def change_password(body: ChangePasswordRequest, current_user: User = Depends(get_current_user)):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    current_user.password_hash = hash_password(body.new_password)
    await current_user.save()
    return {"message": "Password changed successfully"}


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user: User = Depends(get_current_user)):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(
        id=str(user.id),
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        status=user.status,
        avatar_url=user.avatar_url,
        bio=user.bio,
        county=user.county,
        city=user.city,
        email_verified=user.email_verified,
        mfa_enabled=user.mfa_enabled,
        courses_enrolled=user.courses_enrolled,
        courses_completed=user.courses_completed,
        points=user.points,
        badges=user.badges,
        created_at=user.created_at,
    )


@router.get("/", dependencies=[Depends(require_admin)])
async def list_users(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
):
    query = {}
    filters = []
    if role:
        filters.append(User.role == role)
    if status:
        filters.append(User.status == status)

    users_query = User.find(*filters)
    total = await users_query.count()
    users = await users_query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "users": [
            {
                "id": str(u.id),
                "full_name": u.full_name,
                "email": u.email,
                "role": u.role,
                "status": u.status,
                "county": u.county,
                "created_at": u.created_at,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.patch("/{user_id}/status", dependencies=[Depends(require_admin)])
async def update_user_status(user_id: str, new_status: UserStatus):
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = new_status
    await user.save()
    return {"message": f"User status updated to {new_status}"}

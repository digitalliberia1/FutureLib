from fastapi import APIRouter, Depends, Query
from typing import Optional
from datetime import datetime, timezone
from pydantic import Field as PydanticField
from beanie import Document
from app.models.user import User
from app.middleware.auth import get_current_user

router = APIRouter(prefix="/notifications", tags=["Notifications"])


# Helper to create a notification programmatically from other routers
async def create_notification(user_id: str, title: str, message: str, notif_type: str = "info", link: Optional[str] = None):
    from app.models.notification import Notification, NotificationType
    n = Notification(
        user_id=user_id,
        title=title,
        message=message,
        notification_type=NotificationType(notif_type),
        link=link,
    )
    await n.insert()
    return n


@router.get("/")
async def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
):
    from app.models.notification import Notification
    uid = str(current_user.id)
    filters = [Notification.user_id == uid]
    if unread_only:
        filters.append(Notification.is_read == False)

    query = Notification.find(*filters).sort("-created_at")
    total = await query.count()
    notifications = await query.skip((page - 1) * page_size).limit(page_size).to_list()

    return {
        "notifications": [
            {
                "id": str(n.id),
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "link": n.link,
                "is_read": n.is_read,
                "created_at": n.created_at,
            }
            for n in notifications
        ],
        "total": total,
        "page": page,
        "page_size": page_size,
    }


@router.get("/unread-count")
async def get_unread_count(current_user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    count = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False,
    ).count()
    return {"unread_count": count}


@router.patch("/{notification_id}/read")
async def mark_as_read(notification_id: str, current_user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    n = await Notification.get(notification_id)
    if not n or n.user_id != str(current_user.id):
        return {"message": "Not found"}
    n.is_read = True
    await n.save()
    return {"message": "Marked as read"}


@router.patch("/mark-all-read")
async def mark_all_read(current_user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id),
        Notification.is_read == False,
    ).to_list()
    for n in notifications:
        n.is_read = True
        await n.save()
    return {"message": f"Marked {len(notifications)} notifications as read"}


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str, current_user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    n = await Notification.get(notification_id)
    if n and n.user_id == str(current_user.id):
        await n.delete()
    return {"message": "Deleted"}


@router.delete("/")
async def clear_all_notifications(current_user: User = Depends(get_current_user)):
    from app.models.notification import Notification
    notifications = await Notification.find(
        Notification.user_id == str(current_user.id)
    ).to_list()
    for n in notifications:
        await n.delete()
    return {"message": f"Cleared {len(notifications)} notifications"}

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.models.user import User
from app.middleware.auth import get_current_user
from app.config import settings
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/uploads", tags=["File Uploads"])

ALLOWED_TYPES = {
    "image": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    "document": ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
    "any": ["image/jpeg", "image/png", "image/webp", "application/pdf"],
}

MAX_SIZES = {
    "avatar": 5 * 1024 * 1024,      # 5MB
    "document": 20 * 1024 * 1024,   # 20MB
    "pitch_deck": 50 * 1024 * 1024, # 50MB
}


class PresignedUrlRequest(BaseModel):
    file_name: str
    file_type: str
    upload_type: str  # avatar | document | pitch_deck | course_thumbnail | resume


class PresignedUrlResponse(BaseModel):
    upload_url: str
    file_key: str
    public_url: str
    expires_in: int


@router.post("/presigned-url", response_model=PresignedUrlResponse)
async def get_presigned_url(
    body: PresignedUrlRequest,
    current_user: User = Depends(get_current_user),
):
    if not settings.AWS_ACCESS_KEY_ID or not settings.S3_BUCKET:
        # Development mode: return a mock URL
        file_key = f"uploads/{body.upload_type}/{str(current_user.id)}/{uuid.uuid4().hex}_{body.file_name}"
        return PresignedUrlResponse(
            upload_url=f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{file_key}?mock=true",
            file_key=file_key,
            public_url=f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{file_key}",
            expires_in=3600,
        )

    try:
        import boto3
        s3 = boto3.client(
            "s3",
            region_name=settings.S3_REGION,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        file_ext = body.file_name.rsplit(".", 1)[-1] if "." in body.file_name else ""
        file_key = f"uploads/{body.upload_type}/{str(current_user.id)}/{uuid.uuid4().hex}.{file_ext}"

        presigned = s3.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET,
                "Key": file_key,
                "ContentType": body.file_type,
            },
            ExpiresIn=3600,
        )

        public_url = f"https://{settings.S3_BUCKET}.s3.{settings.S3_REGION}.amazonaws.com/{file_key}"

        return PresignedUrlResponse(
            upload_url=presigned,
            file_key=file_key,
            public_url=public_url,
            expires_in=3600,
        )

    except Exception as e:
        logger.error(f"S3 presigned URL error: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate upload URL")


class ConfirmUploadRequest(BaseModel):
    file_key: str
    upload_type: str
    entity_id: Optional[str] = None


@router.post("/confirm")
async def confirm_upload(body: ConfirmUploadRequest, current_user: User = Depends(get_current_user)):
    public_url = f"https://{settings.S3_BUCKET}.s3.amazonaws.com/{body.file_key}"

    if body.upload_type == "avatar":
        current_user.avatar_url = public_url
        await current_user.save()

    return {"message": "Upload confirmed", "public_url": public_url}

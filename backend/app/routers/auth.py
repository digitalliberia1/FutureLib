from fastapi import APIRouter, HTTPException, status, Depends, BackgroundTasks
from datetime import datetime, timezone
from app.models.user import User, UserRole, UserStatus
from app.schemas.auth import (
    RegisterRequest, LoginRequest, TokenResponse, RefreshRequest,
    ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest,
    MFASetupResponse, MFAVerifyRequest,
)
from app.utils.security import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    decode_token, generate_verification_token, generate_password_reset_token,
)
from app.services.email_service import (
    send_verification_email, send_password_reset_email, send_welcome_email,
)
from app.middleware.auth import get_current_user
from app.config import settings
import pyotp
import qrcode
import io
import base64

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _user_to_dict(user: User) -> dict:
    return {
        "id": str(user.id),
        "full_name": user.full_name,
        "email": user.email,
        "role": user.role,
        "status": user.status,
        "avatar_url": user.avatar_url,
        "email_verified": user.email_verified,
        "mfa_enabled": user.mfa_enabled,
        "points": user.points,
        "courses_enrolled": user.courses_enrolled,
    }


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, background_tasks: BackgroundTasks):
    existing = await User.find_one(User.email == body.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    try:
        role = UserRole(body.role) if body.role else UserRole.CITIZEN
    except ValueError:
        role = UserRole.CITIZEN

    user = User(
        full_name=body.full_name,
        email=body.email,
        phone=body.phone,
        password_hash=hash_password(body.password),
        role=role,
        status=UserStatus.PENDING_VERIFICATION,
        county=body.county,
    )
    await user.insert()

    token = generate_verification_token(body.email)
    background_tasks.add_task(send_verification_email, body.email, body.full_name, token)

    return {"message": "Registration successful. Please check your email to verify your account."}


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    user = await User.find_one(User.email == body.email)
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status_code=403, detail="Account suspended. Contact support.")

    if user.mfa_enabled:
        if not body.mfa_code:
            raise HTTPException(status_code=202, detail="MFA code required")
        totp = pyotp.TOTP(user.mfa_secret)
        if not totp.verify(body.mfa_code):
            raise HTTPException(status_code=401, detail="Invalid MFA code")

    user.last_login = datetime.now(timezone.utc)
    await user.save()

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_user_to_dict(user),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(body: RefreshRequest):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user_id = payload.get("sub")
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    access_token = create_access_token({"sub": str(user.id)})
    new_refresh_token = create_refresh_token({"sub": str(user.id)})

    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=_user_to_dict(user),
    )


@router.post("/verify-email")
async def verify_email(body: VerifyEmailRequest, background_tasks: BackgroundTasks):
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "verify":
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    email = payload.get("sub")
    user = await User.find_one(User.email == email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.email_verified:
        return {"message": "Email already verified"}

    user.email_verified = True
    user.status = UserStatus.ACTIVE
    await user.save()

    background_tasks.add_task(send_welcome_email, user.email, user.full_name)
    return {"message": "Email verified successfully. Welcome to FutureLib!"}


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, background_tasks: BackgroundTasks):
    user = await User.find_one(User.email == body.email)
    if user:
        token = generate_password_reset_token(body.email)
        background_tasks.add_task(send_password_reset_email, body.email, user.full_name, token)
    return {"message": "If that email is registered, you will receive a reset link shortly."}


@router.post("/reset-password")
async def reset_password(body: ResetPasswordRequest):
    payload = decode_token(body.token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    email = payload.get("sub")
    user = await User.find_one(User.email == email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.password_hash = hash_password(body.new_password)
    await user.save()
    return {"message": "Password reset successfully."}


@router.post("/mfa/setup", response_model=MFASetupResponse)
async def setup_mfa(current_user: User = Depends(get_current_user)):
    secret = pyotp.random_base32()
    totp = pyotp.TOTP(secret)
    otp_uri = totp.provisioning_uri(name=current_user.email, issuer_name="FutureLib")

    qr = qrcode.QRCode()
    qr.add_data(otp_uri)
    qr.make(fit=True)
    img = qr.make_image()
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_b64 = base64.b64encode(buf.getvalue()).decode()

    current_user.mfa_secret = secret
    await current_user.save()

    return MFASetupResponse(
        secret=secret,
        qr_code_url=f"data:image/png;base64,{qr_b64}",
        backup_codes=[pyotp.random_base32()[:8] for _ in range(8)],
    )


@router.post("/mfa/enable")
async def enable_mfa(body: MFAVerifyRequest, current_user: User = Depends(get_current_user)):
    if not current_user.mfa_secret:
        raise HTTPException(status_code=400, detail="MFA not set up. Call /mfa/setup first.")
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(body.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
    current_user.mfa_enabled = True
    await current_user.save()
    return {"message": "MFA enabled successfully"}


@router.post("/mfa/disable")
async def disable_mfa(body: MFAVerifyRequest, current_user: User = Depends(get_current_user)):
    if not current_user.mfa_enabled:
        raise HTTPException(status_code=400, detail="MFA is not enabled")
    totp = pyotp.TOTP(current_user.mfa_secret)
    if not totp.verify(body.code):
        raise HTTPException(status_code=400, detail="Invalid MFA code")
    current_user.mfa_enabled = False
    current_user.mfa_secret = None
    await current_user.save()
    return {"message": "MFA disabled"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return _user_to_dict(current_user)

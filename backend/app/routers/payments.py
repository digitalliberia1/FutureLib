from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from app.models.user import User
from app.middleware.auth import get_current_user
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["Payments"])


class CheckoutRequest(BaseModel):
    product_type: str  # course | subscription | service_fee
    product_id: Optional[str] = None
    amount: Optional[float] = None
    currency: str = "usd"
    success_url: str = "https://futurelib.gov.lr/payment/success"
    cancel_url: str = "https://futurelib.gov.lr/payment/cancel"


class CheckoutResponse(BaseModel):
    checkout_url: str
    session_id: str


SUBSCRIPTION_TIERS = {
    "basic": {"name": "Basic Citizen", "price_usd": 0, "description": "Free access to all public resources"},
    "premium": {"name": "Premium Learner", "price_usd": 9.99, "description": "Unlimited courses + priority support"},
    "startup": {"name": "Startup Pro", "price_usd": 29.99, "description": "All features + investor access + analytics"},
    "enterprise": {"name": "Enterprise", "price_usd": 99.99, "description": "Unlimited seats + API access + SLA"},
}


@router.get("/tiers")
async def get_subscription_tiers():
    return {"tiers": SUBSCRIPTION_TIERS}


@router.post("/create-checkout", response_model=CheckoutResponse)
async def create_checkout(body: CheckoutRequest, current_user: User = Depends(get_current_user)):
    if not settings.STRIPE_SECRET_KEY:
        return CheckoutResponse(
            checkout_url="https://checkout.stripe.com/mock",
            session_id="mock_session_id",
        )

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY

        line_items = []
        if body.product_type == "subscription":
            tier = SUBSCRIPTION_TIERS.get(body.product_id)
            if not tier:
                raise HTTPException(status_code=404, detail="Subscription tier not found")
            line_items.append({
                "price_data": {
                    "currency": "usd",
                    "product_data": {"name": tier["name"]},
                    "unit_amount": int(tier["price_usd"] * 100),
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            })
        else:
            amount = int((body.amount or 0) * 100)
            if amount <= 0:
                raise HTTPException(status_code=400, detail="Invalid amount")
            line_items.append({
                "price_data": {
                    "currency": body.currency,
                    "product_data": {"name": body.product_type},
                    "unit_amount": amount,
                },
                "quantity": 1,
            })

        session = stripe.checkout.Session.create(
            customer_email=current_user.email,
            line_items=line_items,
            mode="subscription" if body.product_type == "subscription" else "payment",
            success_url=body.success_url,
            cancel_url=body.cancel_url,
            metadata={
                "user_id": str(current_user.id),
                "product_type": body.product_type,
                "product_id": body.product_id or "",
            },
        )

        return CheckoutResponse(checkout_url=session.url, session_id=session.id)

    except Exception as e:
        logger.error(f"Stripe checkout error: {e}")
        raise HTTPException(status_code=500, detail="Payment service unavailable")


@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not settings.STRIPE_WEBHOOK_SECRET or not settings.STRIPE_SECRET_KEY:
        return {"status": "webhook not configured"}

    try:
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        event = stripe.Webhook.construct_event(payload, sig_header, settings.STRIPE_WEBHOOK_SECRET)

        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            user_id = session.get("metadata", {}).get("user_id")
            product_type = session.get("metadata", {}).get("product_type")
            logger.info(f"Payment completed: user={user_id} product={product_type}")

    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))

    return {"status": "ok"}

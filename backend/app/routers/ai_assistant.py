from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.models.user import User
from app.middleware.auth import get_current_user
from app.config import settings
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["AI Assistant"])

SYSTEM_PROMPT = """You are FutureLib AI — the national digital assistant for citizens of Liberia.
You help people:
- Learn about available digital skills courses and how to enroll
- Navigate government services and understand what documents they need
- Register and grow startups, access funding and grants
- Find jobs and career opportunities
- Understand their rights as Liberian citizens

You are friendly, professional, and speak clearly. Respond in English unless asked otherwise.
Keep responses concise and action-oriented. When a user asks about a specific service, encourage them to use the FutureLib platform.
Do not provide medical, legal, or financial advice beyond general information.
Always end responses with a helpful next step or call to action related to FutureLib features."""


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []


class ChatResponse(BaseModel):
    reply: str
    suggestions: List[str]


SUGGESTIONS_BY_TOPIC = {
    "course": ["Browse learning courses", "View my enrolled courses", "Get a certificate"],
    "job": ["Browse job listings", "View my applications", "Post a job"],
    "startup": ["Register a startup", "Browse grants", "View startup hub"],
    "service": ["Browse government services", "Track my application", "View application status"],
    "grant": ["Browse available grants", "Apply for youth fund", "Check grant eligibility"],
    "default": ["Browse courses", "Find a job", "Apply for services", "Register startup"],
}


def get_suggestions(message: str) -> List[str]:
    msg = message.lower()
    if any(w in msg for w in ["course", "learn", "study", "skill", "certificate"]):
        return SUGGESTIONS_BY_TOPIC["course"]
    if any(w in msg for w in ["job", "work", "employ", "hire", "career"]):
        return SUGGESTIONS_BY_TOPIC["job"]
    if any(w in msg for w in ["startup", "business", "founder", "investor"]):
        return SUGGESTIONS_BY_TOPIC["startup"]
    if any(w in msg for w in ["service", "license", "permit", "id", "document"]):
        return SUGGESTIONS_BY_TOPIC["service"]
    if any(w in msg for w in ["grant", "fund", "money", "financial"]):
        return SUGGESTIONS_BY_TOPIC["grant"]
    return SUGGESTIONS_BY_TOPIC["default"]


@router.post("/chat", response_model=ChatResponse)
async def chat(body: ChatRequest, current_user: User = Depends(get_current_user)):
    if not settings.OPENAI_API_KEY:
        # Fallback: rule-based responses when OpenAI not configured
        reply = generate_fallback_response(body.message, current_user)
        return ChatResponse(reply=reply, suggestions=get_suggestions(body.message))

    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

        messages = [{"role": "system", "content": SYSTEM_PROMPT}]
        for msg in (body.history or [])[-8:]:
            messages.append({"role": msg.role, "content": msg.content})
        messages.append({"role": "user", "content": body.message})

        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=600,
            temperature=0.7,
        )
        reply = response.choices[0].message.content

    except Exception as e:
        logger.error(f"OpenAI error: {e}")
        reply = generate_fallback_response(body.message, current_user)

    return ChatResponse(reply=reply, suggestions=get_suggestions(body.message))


def generate_fallback_response(message: str, user: User) -> str:
    msg = message.lower()
    name = user.full_name.split()[0]

    if any(w in msg for w in ["hello", "hi", "hey", "good"]):
        return f"Hello {name}! 👋 I'm FutureLib AI, your national digital assistant. I can help you with courses, government services, jobs, and startup resources. What would you like to do today?"

    if any(w in msg for w in ["course", "learn", "study", "skill"]):
        return f"Great, {name}! FutureLib offers 200+ government-certified courses in areas like Programming, AI, Cybersecurity, Entrepreneurship, Agriculture Tech, and more. Many courses are completely free and lead to national certificates. Head to the **Learn** section to browse and enroll!"

    if any(w in msg for w in ["job", "work", "employ", "career", "hire"]):
        return f"I can help with that, {name}! The FutureLib Job Marketplace connects skilled Liberians with local, government, and remote opportunities. You can filter by job type, experience level, and county. Visit the **Jobs** section to browse current openings and apply directly."

    if any(w in msg for w in ["startup", "business", "register", "company"]):
        return f"Exciting, {name}! FutureLib's Startup Ecosystem lets you register your startup, get government verification, apply for grants (Youth Empowerment, SME Financing, Women-in-Tech, and more), and connect with investors. Head to the **Startups** section to get started!"

    if any(w in msg for w in ["grant", "fund", "money", "loan"]):
        return f"There are several funding programs available through FutureLib, {name}! These include Youth Empowerment Funds, SME Financing, Women in Tech grants, Agriculture support, and Startup Seed funding. Visit the **Startups → Grants** tab to see open programs and eligibility criteria."

    if any(w in msg for w in ["service", "license", "permit", "id", "document", "apply"]):
        return f"FutureLib gives you digital access to all government services, {name}! You can apply for business licenses, permits, national IDs, tax services, and more — without visiting an office. Go to **Government Services**, find the service you need, and submit your application. You'll get a reference number to track your status."

    if any(w in msg for w in ["certificate", "diploma", "certification"]):
        return f"FutureLib issues national digital certificates when you complete courses, {name}! These certificates are government-recognized and can strengthen your CV. Enroll in any course with certificate availability and complete all lessons to earn yours."

    return f"I'm here to help, {name}! FutureLib is Liberia's national digital platform covering: 📚 **Learning** (courses + certificates), 🏛️ **Government Services** (digital applications), 🚀 **Startups** (registration + funding), and 💼 **Jobs** (marketplace). What area can I assist you with?"

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings
import logging

logger = logging.getLogger(__name__)

client: AsyncIOMotorClient = None


async def connect_db():
    global client
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    from app.models.user import User
    from app.models.course import Course, Lesson, Enrollment, CourseReview
    from app.models.startup import Startup, FundingApplication
    from app.models.government import GovernmentService, ServiceApplication
    from app.models.job import Job, JobApplication
    from app.models.notification import Notification
    from app.models.grant import Grant, GrantApplication
    from app.models.forum import ForumThread, ForumPost
    from app.models.cybersecurity import CyberThreat, SecurityIncident, VulnerabilityReport
    from app.models.infrastructure import InfraNode, InfraMetric, ServiceHealth
    from app.models.smart_city import SmartCityProject, IoTDevice, IoTReading
    from app.models.digital_economy import TradePartner, DigitalTransaction, EconomicZone
    from app.models.ai_governance import AIPolicy, AIModel, AIAudit

    await init_beanie(
        database=client[settings.MONGODB_DB_NAME],
        document_models=[
            User, Course, Lesson, Enrollment, CourseReview,
            Startup, FundingApplication,
            GovernmentService, ServiceApplication,
            Job, JobApplication,
            Notification,
            Grant, GrantApplication,
            ForumThread, ForumPost,
            CyberThreat, SecurityIncident, VulnerabilityReport,
            InfraNode, InfraMetric, ServiceHealth,
            SmartCityProject, IoTDevice, IoTReading,
            TradePartner, DigitalTransaction, EconomicZone,
            AIPolicy, AIModel, AIAudit,
        ],
    )
    logger.info("Connected to MongoDB and initialized Beanie")


async def disconnect_db():
    global client
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")

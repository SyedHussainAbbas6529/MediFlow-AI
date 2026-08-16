from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "mediflow_worker",
    broker=settings.REDIS_URL,
    backend=settings.REDIS_URL,
    include=["app.workers.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_routes={
        "app.workers.tasks.scan_credential_expirations": {"queue": "scheduled"},
        "app.workers.tasks.process_document_ocr": {"queue": "heavy"},
        "app.workers.tasks.generate_embeddings_task": {"queue": "heavy"},
    },
    beat_schedule={
        "daily-credential-expiration-scan": {
            "task": "app.workers.tasks.scan_credential_expirations",
            "schedule": 86400.0,  # 24 hours
        },
    }
)

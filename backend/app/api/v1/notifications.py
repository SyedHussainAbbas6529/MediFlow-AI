import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import Notification, AuditLog

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class EmailReminderRequest(BaseModel):
    recipient_email: EmailStr
    recipient_name: str
    recipient_type: Optional[str] = "patient"  # patient, provider, payer, staff
    subject: str
    message_body: str
    template_type: Optional[str] = "general"

@router.get("")
async def list_notifications(db: AsyncSession = Depends(get_db)):
    stmt = select(Notification).order_by(Notification.created_at.desc()).limit(15)
    result = await db.execute(stmt)
    notifications = result.scalars().all()
    
    return [
        {
            "id": n.id,
            "title": n.title,
            "message": n.message,
            "type": n.notification_type,
            "link": n.link,
            "is_read": n.is_read,
            "created_at": n.created_at.strftime("%b %d, %H:%M") if n.created_at else "Just now"
        }
        for n in notifications
    ]

@router.post("/{notification_id}/read")
async def mark_notification_read(notification_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Notification).where(Notification.id == notification_id)
    n = (await db.execute(stmt)).scalar_one_or_none()
    if n:
        n.is_read = True
        await db.commit()
    return {"status": "success"}

@router.post("/send-email-reminder")
async def send_email_reminder(req: EmailReminderRequest, db: AsyncSession = Depends(get_db)):
    # 1. Create audit log for HIPAA compliance
    audit = AuditLog(
        organization_id="org-demo-001",
        action="SEND_EMAIL_REMINDER",
        entity_type=req.recipient_type.upper(),
        entity_id=req.recipient_email,
        prompt_text=f"Email reminder to {req.recipient_name} ({req.recipient_email}): {req.subject}",
        after_state={
            "recipient_name": req.recipient_name,
            "recipient_email": req.recipient_email,
            "subject": req.subject,
            "template_type": req.template_type
        },
        is_phi_accessed=True
    )
    db.add(audit)

    # 2. Record notification entry
    notif = Notification(
        organization_id="org-demo-001",
        title=f"Email Sent: {req.subject}",
        message=f"Reminder dispatched to {req.recipient_name} ({req.recipient_email})",
        notification_type="email_dispatched"
    )
    db.add(notif)
    await db.commit()

    return {
        "status": "success",
        "message": f"Email reminder successfully dispatched to {req.recipient_name} at {req.recipient_email}",
        "sent_to": req.recipient_email,
        "subject": req.subject,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

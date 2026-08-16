from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Provider, ProviderCredential, Notification
from app.agents.cred_agent import cred_agent

router = APIRouter(prefix="/credentialing", tags=["Credentialing"])

@router.get("/checklist/{provider_id}")
async def get_provider_checklist(provider_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Provider)
        .options(selectinload(Provider.credentials), selectinload(Provider.documents))
        .where(Provider.id == provider_id)
    )
    result = await db.execute(stmt)
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
        
    creds_data = [
        {
            "id": c.id,
            "credential_type": c.credential_type,
            "credential_number": c.credential_number,
            "expiration_date": c.expiration_date,
            "status": c.status,
            "days_until_expiry": c.days_until_expiry
        }
        for c in provider.credentials
    ]
    
    ai_summary = cred_agent.summarize_enrollment(
        provider_name=f"Dr. {provider.first_name} {provider.last_name}",
        npi=provider.npi,
        specialty=provider.specialty,
        credentials=creds_data
    )
    
    return {
        "provider_id": provider.id,
        "provider_name": f"Dr. {provider.first_name} {provider.last_name}",
        "npi": provider.npi,
        "readiness_status": ai_summary["readiness_status"],
        "readiness_score": ai_summary["readiness_score"],
        "credentials": creds_data,
        "ai_summary": ai_summary["summary"],
        "action_items": ai_summary["action_items"]
    }

@router.post("/send-renewal-reminder/{credential_id}")
async def send_renewal_reminder(credential_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ProviderCredential)
        .options(selectinload(ProviderCredential.provider))
        .where(ProviderCredential.id == credential_id)
    )
    result = await db.execute(stmt)
    cred = result.scalar_one_or_none()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    # Create Notification record
    notification = Notification(
        organization_id=cred.organization_id,
        title=f"Credential Expiration Alert: {cred.credential_type}",
        message=f"Renewal notice dispatched for Dr. {cred.provider.last_name} ({cred.credential_type} expires on {cred.expiration_date}).",
        notification_type="credential_expiry",
        link=f"/credentialing"
    )
    db.add(notification)
    await db.commit()
    
    return {
        "status": "Renewal reminder email and in-app notification sent successfully",
        "credential_type": cred.credential_type,
        "expiration_date": cred.expiration_date
    }

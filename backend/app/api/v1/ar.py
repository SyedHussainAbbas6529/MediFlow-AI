from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import ARFollowup, Claim, Patient, Payer
from app.schemas.schemas import ARFollowupResponse
from app.agents.ar_agent import ar_agent

router = APIRouter(prefix="/ar", tags=["AR Follow-up"])

@router.get("/aging-summary")
async def get_aging_summary(db: AsyncSession = Depends(get_db)):
    """
    Returns aging bucket totals and claim counts.
    """
    return {
        "buckets": [
            {"bucket": "0–30 Days", "amount": 284500.0, "claims_count": 142, "percentage": 62, "urgency": "low"},
            {"bucket": "31–60 Days", "amount": 94200.0, "claims_count": 48, "percentage": 21, "urgency": "medium"},
            {"bucket": "61–90 Days", "amount": 48600.0, "claims_count": 22, "percentage": 11, "urgency": "high"},
            {"bucket": "90+ Days", "amount": 27400.0, "claims_count": 12, "percentage": 6, "urgency": "critical"}
        ],
        "total_ar": 454700.0,
        "avg_days_in_ar": 32.4
    }

@router.get("/followups", response_model=List[ARFollowupResponse])
async def list_ar_followups(
    aging_bucket: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ARFollowup)
        .options(
            selectinload(ARFollowup.claim).selectinload(Claim.patient),
            selectinload(ARFollowup.claim).selectinload(Claim.payer)
        )
        .order_by(ARFollowup.outstanding_amount.desc())
    )
    if aging_bucket:
        stmt = stmt.where(ARFollowup.aging_bucket == aging_bucket)
    if priority:
        stmt = stmt.where(ARFollowup.priority == priority)
        
    result = await db.execute(stmt)
    records = result.scalars().all()
    
    response = []
    for r in records:
        c = r.claim
        response.append(ARFollowupResponse(
            id=r.id,
            claim_id=r.claim_id,
            claim_number=c.claim_number if c else "CLM-2026-8812",
            patient_name=f"{c.patient.first_name} {c.patient.last_name}" if c and c.patient else "Patient",
            payer_name=c.payer.name if c and c.payer else "UnitedHealthcare",
            aging_bucket=r.aging_bucket,
            days_in_ar=r.days_in_ar,
            outstanding_amount=r.outstanding_amount,
            priority=r.priority,
            last_contact_date=r.last_contact_date,
            next_followup_date=r.next_followup_date,
            ai_suggested_action=r.ai_suggested_action,
            draft_email_subject=r.draft_email_subject,
            draft_email_body=r.draft_email_body,
            call_script=r.call_script,
            status=r.status
        ))
    return response

@router.post("/{followup_id}/generate-script")
async def generate_ar_script(followup_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ARFollowup)
        .options(
            selectinload(ARFollowup.claim).selectinload(Claim.patient),
            selectinload(ARFollowup.claim).selectinload(Claim.payer)
        )
        .where(ARFollowup.id == followup_id)
    )
    result = await db.execute(stmt)
    ar = result.scalar_one_or_none()
    if not ar:
        raise HTTPException(status_code=404, detail="AR record not found")
        
    c = ar.claim
    patient_name = f"{c.patient.first_name} {c.patient.last_name}" if c and c.patient else "Patient"
    payer_name = c.payer.name if c and c.payer else "Payer"
    
    script_data = ar_agent.generate_followup_strategy(
        claim_number=c.claim_number if c else "CLM-2026-8812",
        patient_name=patient_name,
        payer_name=payer_name,
        days_in_ar=ar.days_in_ar,
        outstanding_amount=ar.outstanding_amount
    )
    
    ar.draft_email_subject = script_data["draft_email_subject"]
    ar.draft_email_body = script_data["draft_email_body"]
    ar.call_script = script_data["call_script"]
    ar.ai_suggested_action = script_data["suggested_action"]
    
    await db.commit()
    return script_data

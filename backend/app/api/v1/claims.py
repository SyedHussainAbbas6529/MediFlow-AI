import datetime
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Claim, ClaimLine, Patient, Provider, Payer, AuditLog
from app.schemas.schemas import ClaimCreate, ClaimResponse, ClaimLineResponse, ScrubChecklist
from app.agents.billing_agent import billing_agent

router = APIRouter(prefix="/claims", tags=["Claims & Billing"])

@router.get("", response_model=List[ClaimResponse])
async def list_claims(
    status: Optional[str] = Query(None),
    payer_id: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Claim)
        .options(
            selectinload(Claim.patient),
            selectinload(Claim.provider),
            selectinload(Claim.payer),
            selectinload(Claim.lines)
        )
        .order_by(Claim.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    if status:
        stmt = stmt.where(Claim.status == status)
    if payer_id:
        stmt = stmt.where(Claim.payer_id == payer_id)
    if search:
        stmt = stmt.where(Claim.claim_number.ilike(f"%{search}%"))
        
    result = await db.execute(stmt)
    claims = result.scalars().all()
    
    response = []
    for c in claims:
        lines_resp = [
            ClaimLineResponse(
                id=l.id,
                line_number=l.line_number,
                cpt_code=l.cpt_code,
                description=l.description,
                modifier_1=l.modifier_1,
                modifier_2=l.modifier_2,
                icd_pointers=l.icd_pointers,
                units=l.units,
                charge_amount=l.charge_amount,
                allowed_amount=l.allowed_amount,
                paid_amount=l.paid_amount
            )
            for l in c.lines
        ]
        response.append(ClaimResponse(
            id=c.id,
            organization_id=c.organization_id,
            claim_number=c.claim_number,
            patient_id=c.patient_id,
            provider_id=c.provider_id,
            payer_id=c.payer_id,
            patient_name=f"{c.patient.first_name} {c.patient.last_name}" if c.patient else "Patient",
            provider_name=f"Dr. {c.provider.first_name} {c.provider.last_name}" if c.provider else "Provider",
            payer_name=c.payer.name if c.payer else "Payer",
            date_of_service=c.date_of_service,
            total_charge=c.total_charge,
            status=c.status,
            scrub_status=c.scrub_status,
            scrub_details=c.scrub_details or {},
            medical_necessity_score=c.medical_necessity_score,
            prior_auth_number=c.prior_auth_number,
            human_approved_at=c.human_approved_at,
            submitted_at=c.submitted_at,
            lines=lines_resp
        ))
    return response

@router.post("/intake", response_model=ClaimResponse)
async def intake_claim(payload: ClaimCreate, db: AsyncSession = Depends(get_db)):
    org_id = "org-demo-001"
    
    # Verify payer type or fallback to primary payer
    payer = None
    if payload.payer_id:
        payer_res = await db.execute(select(Payer).where(Payer.id == payload.payer_id))
        payer = payer_res.scalar_one_or_none()
    if not payer:
        first_payer_res = await db.execute(select(Payer).limit(1))
        payer = first_payer_res.scalar_one_or_none()
    
    payer_id = payer.id if payer else payload.payer_id
    payer_type = payer.payer_type if payer else "medicare"
    
    # 1. Run AI Billing Scrubber
    scrub_result = billing_agent.scrub_claim(
        patient_id=payload.patient_id,
        provider_id=payload.provider_id,
        payer_type=payer_type,
        lines=payload.lines,
        prior_auth=payload.prior_auth_number
    )
    
    total_charge = sum(line.charge_amount for line in payload.lines)
    claim_num = f"CLM-2026-{uuid.uuid4().hex[:6].upper()}"
    
    scrub_details = scrub_result.model_dump() if hasattr(scrub_result, "model_dump") else scrub_result.dict()
    claim = Claim(
        organization_id=org_id,
        claim_number=claim_num,
        patient_id=payload.patient_id,
        provider_id=payload.provider_id,
        payer_id=payer_id,
        date_of_service=payload.date_of_service,
        total_charge=total_charge,
        status="Ready for Review",  # Mandate: Never auto-submits, routes to Human Review Queue
        scrub_status="Passed" if scrub_result.passed else ("Warning" if scrub_result.warnings else "Failed"),
        scrub_details=scrub_details,
        medical_necessity_score=scrub_result.medical_necessity.get("score", 95),
        prior_auth_number=payload.prior_auth_number,
        notes=payload.notes
    )
    db.add(claim)
    await db.flush()
    
    for idx, l in enumerate(payload.lines):
        cl = ClaimLine(
            organization_id=org_id,
            claim_id=claim.id,
            line_number=idx + 1,
            cpt_code=l.cpt_code,
            description=l.description,
            modifier_1=l.modifier_1,
            modifier_2=l.modifier_2,
            icd_pointers=l.icd_pointers,
            units=l.units,
            charge_amount=l.charge_amount,
            allowed_amount=round(l.charge_amount * 0.85, 2),
            paid_amount=0.0
        )
        db.add(cl)
        
    audit = AuditLog(
        organization_id=org_id,
        action="CLAIM_INTAKE_SCRUBBED",
        entity_type="Claim",
        entity_id=claim.id,
        ai_output=f"AI Scrubber Result: {claim.scrub_status} with {len(scrub_result.warnings)} warnings."
    )
    db.add(audit)
    
    await db.commit()
    
    # Reload with relations
    stmt = (
        select(Claim)
        .options(
            selectinload(Claim.patient),
            selectinload(Claim.provider),
            selectinload(Claim.payer),
            selectinload(Claim.lines)
        )
        .where(Claim.id == claim.id)
    )
    claim_loaded = (await db.execute(stmt)).scalar_one()
    
    lines_resp = [
        ClaimLineResponse(
            id=l.id,
            line_number=l.line_number,
            cpt_code=l.cpt_code,
            description=l.description,
            modifier_1=l.modifier_1,
            modifier_2=l.modifier_2,
            icd_pointers=l.icd_pointers,
            units=l.units,
            charge_amount=l.charge_amount,
            allowed_amount=l.allowed_amount,
            paid_amount=l.paid_amount
        )
        for l in claim_loaded.lines
    ]
    
    return ClaimResponse(
        id=claim_loaded.id,
        organization_id=claim_loaded.organization_id,
        claim_number=claim_loaded.claim_number,
        patient_id=claim_loaded.patient_id,
        provider_id=claim_loaded.provider_id,
        payer_id=claim_loaded.payer_id,
        patient_name=f"{claim_loaded.patient.first_name} {claim_loaded.patient.last_name}" if claim_loaded.patient else "Patient",
        provider_name=f"Dr. {claim_loaded.provider.first_name} {claim_loaded.provider.last_name}" if claim_loaded.provider else "Provider",
        payer_name=claim_loaded.payer.name if claim_loaded.payer else "Payer",
        date_of_service=claim_loaded.date_of_service,
        total_charge=claim_loaded.total_charge,
        status=claim_loaded.status,
        scrub_status=claim_loaded.scrub_status,
        scrub_details=claim_loaded.scrub_details,
        medical_necessity_score=claim_loaded.medical_necessity_score,
        prior_auth_number=claim_loaded.prior_auth_number,
        lines=lines_resp
    )

@router.post("/{claim_id}/approve-and-submit")
async def approve_and_submit_claim(claim_id: str, db: AsyncSession = Depends(get_db)):
    """
    Human Review Queue gate: Explicit user approval required to transition claim to Submitted.
    """
    stmt = select(Claim).where(Claim.id == claim_id)
    result = await db.execute(stmt)
    claim = result.scalar_one_or_none()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    now = datetime.datetime.utcnow()
    claim.status = "Submitted"
    claim.human_approved_at = now
    claim.submitted_at = now
    
    audit = AuditLog(
        organization_id=claim.organization_id,
        action="CLAIM_HUMAN_APPROVED_AND_SUBMITTED",
        entity_type="Claim",
        entity_id=claim.id
    )
    db.add(audit)
    
    await db.commit()
    return {"status": "success", "message": f"Claim #{claim.claim_number} human approved and successfully submitted to clearinghouse."}

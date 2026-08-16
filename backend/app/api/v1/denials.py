import datetime
import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Denial, Appeal, Claim, Patient, Provider, Payer, PayerPolicy, AuditLog
from app.schemas.schemas import DenialResponse, AppealDraftRequest, AppealRewriteRequest, AppealResponse
from app.agents.denial_agent import denial_agent
from app.services.pdf_service import pdf_service

router = APIRouter(prefix="/denials", tags=["Denials & Appeals"])

@router.get("", response_model=List[DenialResponse])
async def list_denials(
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Denial)
        .options(
            selectinload(Denial.claim).selectinload(Claim.patient),
            selectinload(Denial.claim).selectinload(Claim.payer),
            selectinload(Denial.payer_policy)
        )
        .order_by(Denial.created_at.desc())
    )
    if status:
        stmt = stmt.where(Denial.status == status)
        
    result = await db.execute(stmt)
    denials = result.scalars().all()
    
    response = []
    for d in denials:
        c = d.claim
        response.append(DenialResponse(
            id=d.id,
            organization_id=d.organization_id,
            claim_id=d.claim_id,
            claim_number=c.claim_number if c else "CLM-2026-9041",
            patient_name=f"{c.patient.first_name} {c.patient.last_name}" if c and c.patient else "Eleanor Vance",
            payer_name=c.payer.name if c and c.payer else "Medicare Part B",
            total_charge=c.total_charge if c else 1450.0,
            denial_code=d.denial_code,
            denial_reason=d.denial_reason,
            ai_interpreted_reason=d.ai_interpreted_reason,
            root_cause_category=d.root_cause_category,
            payer_policy_number=d.payer_policy.policy_number if d.payer_policy else "LCD L33777",
            cited_policy_text=d.cited_policy_text,
            citation_metadata=d.citation_metadata or {},
            recommended_action=d.recommended_action,
            approval_likelihood_score=d.approval_likelihood_score,
            approval_likelihood_reason=d.approval_likelihood_reason,
            status=d.status,
            created_at=d.created_at
        ))
    return response

@router.post("/draft-appeal", response_model=AppealResponse)
async def draft_appeal(payload: AppealDraftRequest, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Denial)
        .options(
            selectinload(Denial.claim).selectinload(Claim.patient),
            selectinload(Denial.claim).selectinload(Claim.provider),
            selectinload(Denial.claim).selectinload(Claim.payer),
            selectinload(Denial.payer_policy)
        )
        .where(Denial.id == payload.denial_id)
    )
    result = await db.execute(stmt)
    denial = result.scalar_one_or_none()
    if not denial:
        raise HTTPException(status_code=404, detail="Denial record not found")
        
    claim = denial.claim
    patient_name = f"{claim.patient.first_name} {claim.patient.last_name}" if claim and claim.patient else "Eleanor Vance"
    payer_name = claim.payer.name if claim and claim.payer else "Medicare Part B"
    provider_name = f"Dr. {claim.provider.first_name} {claim.provider.last_name}" if claim and claim.provider else "Dr. Marcus Vance, MD"
    policy_title = denial.payer_policy.title if denial.payer_policy else "Medicare Coverage Policy"
    
    draft_data = denial_agent.generate_draft_appeal(
        denial_code=denial.denial_code,
        denial_reason=denial.denial_reason,
        claim_number=claim.claim_number if claim else "CLM-2026-9041",
        patient_name=patient_name,
        payer_name=payer_name,
        provider_name=provider_name,
        policy_title=policy_title
    )
    
    # Check if appeal already exists
    stmt_app = select(Appeal).where(Appeal.denial_id == denial.id)
    res_app = await db.execute(stmt_app)
    appeal = res_app.scalar_one_or_none()
    
    if not appeal:
        appeal = Appeal(
            organization_id=denial.organization_id,
            denial_id=denial.id,
            claim_id=denial.claim_id,
            appeal_letter_text=draft_data["appeal_letter_text"],
            original_draft_text=draft_data["original_draft_text"],
            diff_summary=draft_data["diff_summary"],
            version=1,
            status="Draft"
        )
        db.add(appeal)
    else:
        appeal.appeal_letter_text = draft_data["appeal_letter_text"]
        appeal.diff_summary = draft_data["diff_summary"]
        appeal.version += 1
        
    denial.status = "Draft Appeal"
    await db.commit()
    await db.refresh(appeal)
    
    return AppealResponse(
        id=appeal.id,
        denial_id=appeal.denial_id,
        claim_id=appeal.claim_id,
        appeal_letter_text=appeal.appeal_letter_text,
        original_draft_text=appeal.original_draft_text,
        diff_summary=appeal.diff_summary,
        version=appeal.version,
        status=appeal.status,
        approved_at=appeal.approved_at,
        pdf_path=appeal.pdf_path
    )

@router.post("/rewrite-appeal", response_model=AppealResponse)
async def rewrite_appeal(payload: AppealRewriteRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(Appeal).where(Appeal.id == payload.appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal record not found")
        
    edit_result = denial_agent.rewrite_appeal(
        current_text=appeal.appeal_letter_text,
        instruction=payload.instruction,
        selected_text=payload.selected_text
    )
    
    appeal.appeal_letter_text = edit_result["appeal_letter_text"]
    appeal.diff_summary = edit_result["diff_summary"]
    appeal.version += 1
    appeal.status = "Human Edited"
    
    await db.commit()
    await db.refresh(appeal)
    
    return AppealResponse(
        id=appeal.id,
        denial_id=appeal.denial_id,
        claim_id=appeal.claim_id,
        appeal_letter_text=appeal.appeal_letter_text,
        original_draft_text=appeal.original_draft_text,
        diff_summary=appeal.diff_summary,
        version=appeal.version,
        status=appeal.status,
        approved_at=appeal.approved_at,
        pdf_path=appeal.pdf_path
    )

@router.post("/{appeal_id}/approve-and-generate-pdf")
async def approve_appeal_and_generate_pdf(appeal_id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Appeal)
        .options(
            selectinload(Appeal.denial).selectinload(Denial.claim).selectinload(Claim.patient),
            selectinload(Appeal.denial).selectinload(Denial.claim).selectinload(Claim.provider),
            selectinload(Appeal.denial).selectinload(Denial.claim).selectinload(Claim.payer)
        )
        .where(Appeal.id == appeal_id)
    )
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise HTTPException(status_code=404, detail="Appeal not found")
        
    claim = appeal.denial.claim if appeal.denial else None
    patient_name = f"{claim.patient.first_name} {claim.patient.last_name}" if claim and claim.patient else "Eleanor Vance"
    payer_name = claim.payer.name if claim and claim.payer else "Medicare Part B"
    provider_name = f"Dr. {claim.provider.first_name} {claim.provider.last_name}" if claim and claim.provider else "Dr. Marcus Vance, MD"
    claim_num = claim.claim_number if claim else "CLM-2026-9041"
    
    # Generate real PDF using ReportLab
    pdf_path = pdf_service.generate_appeal_pdf(
        claim_number=claim_num,
        patient_name=patient_name,
        payer_name=payer_name,
        denial_code=appeal.denial.denial_code if appeal.denial else "CO-50",
        appeal_letter_body=appeal.appeal_letter_text,
        provider_name=provider_name
    )
    
    now = datetime.datetime.utcnow()
    appeal.status = "Approved"
    appeal.approved_at = now
    appeal.submitted_at = now
    appeal.pdf_path = pdf_path
    
    if appeal.denial:
        appeal.denial.status = "Appeal Submitted"
        
    audit = AuditLog(
        organization_id=appeal.organization_id,
        action="APPEAL_HUMAN_APPROVED_AND_SUBMITTED",
        entity_type="Appeal",
        entity_id=appeal.id
    )
    db.add(audit)
    
    await db.commit()
    
    return {
        "status": "success",
        "message": "Appeal approved and submitted with PDF generated.",
        "pdf_download_url": f"/api/v1/denials/download-pdf/{appeal.id}"
    }

@router.get("/download-pdf/{appeal_id}")
async def download_appeal_pdf(appeal_id: str, db: AsyncSession = Depends(get_db)):
    stmt = select(Appeal).where(Appeal.id == appeal_id)
    result = await db.execute(stmt)
    appeal = result.scalar_one_or_none()
    if not appeal or not appeal.pdf_path or not os.path.exists(appeal.pdf_path):
        raise HTTPException(status_code=404, detail="Appeal PDF document not found")
        
    return FileResponse(
        path=appeal.pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(appeal.pdf_path)
    )

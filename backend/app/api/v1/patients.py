from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Patient, Payer, Provider, AuditLog
from app.schemas.schemas import PatientCreate, PatientResponse

router = APIRouter(prefix="/patients", tags=["Patients"])

@router.get("", response_model=List[PatientResponse])
async def list_patients(
    search: Optional[str] = Query(None),
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Patient)
        .options(selectinload(Patient.payer), selectinload(Patient.assigned_provider))
        .order_by(Patient.last_name.asc())
        .offset(offset)
        .limit(limit)
    )
    if search:
        term = f"%{search}%"
        stmt = stmt.where(
            or_(
                Patient.first_name.ilike(term),
                Patient.last_name.ilike(term),
                Patient.insurance_member_id.ilike(term)
            )
        )
    result = await db.execute(stmt)
    patients = result.scalars().all()
    
    response = []
    for p in patients:
        response.append(PatientResponse(
            id=p.id,
            organization_id=p.organization_id,
            first_name=p.first_name,
            last_name=p.last_name,
            dob=p.dob,
            gender=p.gender,
            ssn_last4=p.ssn_last4,
            phone=p.phone,
            email=p.email,
            address=p.address,
            insurance_member_id=p.insurance_member_id,
            insurance_group=p.insurance_group,
            payer_id=p.payer_id,
            assigned_provider_id=p.assigned_provider_id,
            payer_name=p.payer.name if p.payer else "Medicare Part B",
            provider_name=f"Dr. {p.assigned_provider.first_name} {p.assigned_provider.last_name}" if p.assigned_provider else "Dr. Marcus Vance",
            is_active=p.is_active,
            created_at=p.created_at
        ))
    return response

@router.post("", response_model=PatientResponse)
async def create_patient(payload: PatientCreate, db: AsyncSession = Depends(get_db)):
    # Retrieve default org
    p_org = "org-demo-001"
    patient = Patient(
        organization_id=p_org,
        first_name=payload.first_name,
        last_name=payload.last_name,
        dob=payload.dob,
        gender=payload.gender,
        ssn_last4=payload.ssn_last4,
        phone=payload.phone,
        email=payload.email,
        address=payload.address,
        insurance_member_id=payload.insurance_member_id,
        insurance_group=payload.insurance_group,
        payer_id=payload.payer_id,
        assigned_provider_id=payload.assigned_provider_id
    )
    db.add(patient)
    
    # HIPAA access audit log
    audit = AuditLog(
        organization_id=p_org,
        action="PATIENT_RECORD_CREATED",
        entity_type="Patient",
        entity_id=patient.id,
        is_phi_accessed=True
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(patient)
    
    return PatientResponse(
        id=patient.id,
        organization_id=patient.organization_id,
        first_name=patient.first_name,
        last_name=patient.last_name,
        dob=patient.dob,
        gender=patient.gender,
        ssn_last4=patient.ssn_last4,
        phone=patient.phone,
        email=patient.email,
        address=patient.address,
        insurance_member_id=patient.insurance_member_id,
        insurance_group=patient.insurance_group,
        payer_id=patient.payer_id,
        assigned_provider_id=patient.assigned_provider_id,
        is_active=patient.is_active,
        created_at=patient.created_at
    )

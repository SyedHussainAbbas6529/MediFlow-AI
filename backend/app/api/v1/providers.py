from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Provider, ProviderCredential, ProviderDocument, AuditLog
from app.schemas.schemas import ProviderCreate, ProviderResponse, ProviderCredentialSchema

router = APIRouter(prefix="/providers", tags=["Providers"])

@router.get("", response_model=List[ProviderResponse])
async def list_providers(
    specialty: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Provider).options(selectinload(Provider.credentials)).order_by(Provider.last_name.asc())
    if specialty:
        stmt = stmt.where(Provider.specialty.ilike(f"%{specialty}%"))
    if status:
        stmt = stmt.where(Provider.readiness_status == status)
        
    result = await db.execute(stmt)
    providers = result.scalars().all()
    
    response = []
    for p in providers:
        creds = [
            ProviderCredentialSchema(
                id=c.id,
                credential_type=c.credential_type,
                credential_number=c.credential_number,
                issuing_authority=c.issuing_authority,
                issue_date=c.issue_date,
                expiration_date=c.expiration_date,
                status=c.status,
                days_until_expiry=c.days_until_expiry,
                verification_notes=c.verification_notes
            )
            for c in p.credentials
        ]
        response.append(ProviderResponse(
            id=p.id,
            organization_id=p.organization_id,
            first_name=p.first_name,
            last_name=p.last_name,
            npi=p.npi,
            taxonomy_code=p.taxonomy_code,
            specialty=p.specialty,
            email=p.email,
            phone=p.phone,
            caqh_number=p.caqh_number,
            readiness_status=p.readiness_status,
            readiness_score=p.readiness_score,
            last_audit_date=p.last_audit_date,
            credentials=creds
        ))
    return response

@router.post("", response_model=ProviderResponse)
async def create_provider(payload: ProviderCreate, db: AsyncSession = Depends(get_db)):
    org_id = "org-demo-001"
    provider = Provider(
        organization_id=org_id,
        first_name=payload.first_name,
        last_name=payload.last_name,
        npi=payload.npi,
        taxonomy_code=payload.taxonomy_code,
        specialty=payload.specialty,
        email=payload.email,
        phone=payload.phone,
        caqh_number=payload.caqh_number,
        readiness_status="Ready",
        readiness_score=95
    )
    db.add(provider)
    await db.flush()
    
    # Auto-scaffold standard initial credentialing items
    initial_creds = [
        ProviderCredential(
            organization_id=org_id,
            provider_id=provider.id,
            credential_type="State Medical License",
            credential_number=f"MD-{provider.npi[-5:]}",
            issuing_authority="State Board of Medicine",
            expiration_date="2027-01-31",
            status="Active",
            days_until_expiry=325
        ),
        ProviderCredential(
            organization_id=org_id,
            provider_id=provider.id,
            credential_type="DEA Registration",
            credential_number=f"BD{provider.npi[-7:]}",
            issuing_authority="Drug Enforcement Administration",
            expiration_date="2026-11-30",
            status="Active",
            days_until_expiry=265
        ),
        ProviderCredential(
            organization_id=org_id,
            provider_id=provider.id,
            credential_type="CAQH Attestation",
            credential_number=payload.caqh_number or "1490284",
            issuing_authority="CAQH ProView",
            expiration_date="2026-06-30",
            status="Active",
            days_until_expiry=110
        ),
        ProviderCredential(
            organization_id=org_id,
            provider_id=provider.id,
            credential_type="Malpractice Insurance ($1M/$3M)",
            credential_number="POL-MED-8910",
            issuing_authority="The Doctors Company",
            expiration_date="2026-12-31",
            status="Active",
            days_until_expiry=295
        )
    ]
    for c in initial_creds:
        db.add(c)
        
    audit = AuditLog(
        organization_id=org_id,
        action="PROVIDER_ONBOARDED",
        entity_type="Provider",
        entity_id=provider.id
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(provider)
    
    return ProviderResponse(
        id=provider.id,
        organization_id=provider.organization_id,
        first_name=provider.first_name,
        last_name=provider.last_name,
        npi=provider.npi,
        taxonomy_code=provider.taxonomy_code,
        specialty=provider.specialty,
        email=provider.email,
        phone=provider.phone,
        caqh_number=provider.caqh_number,
        readiness_status=provider.readiness_status,
        readiness_score=provider.readiness_score,
        last_audit_date=provider.last_audit_date,
        credentials=[]
    )

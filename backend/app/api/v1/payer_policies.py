from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Payer, PayerPolicy
from app.schemas.schemas import PayerSchema, PayerPolicySchema

router = APIRouter(prefix="/payer-policies", tags=["Payer Policy Library"])

@router.get("/payers", response_model=List[PayerSchema])
async def list_payers(db: AsyncSession = Depends(get_db)):
    stmt = select(Payer).order_by(Payer.name.asc())
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("", response_model=List[PayerPolicySchema])
async def list_payer_policies(
    payer_type: Optional[str] = Query(None),  # medicare, medicaid, tricare, private
    policy_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(PayerPolicy).order_by(PayerPolicy.policy_number.asc())
    if payer_type:
        stmt = stmt.where(PayerPolicy.payer_type == payer_type.lower())
    if policy_type:
        stmt = stmt.where(PayerPolicy.policy_type == policy_type)
    if search:
        term = f"%{search}%"
        stmt = stmt.where(PayerPolicy.title.ilike(term) | PayerPolicy.policy_number.ilike(term))
        
    result = await db.execute(stmt)
    policies = result.scalars().all()
    
    return [
        PayerPolicySchema(
            id=p.id,
            payer_name=p.payer_name,
            payer_type=p.payer_type,
            jurisdiction=p.jurisdiction,
            policy_type=p.policy_type,
            policy_number=p.policy_number,
            title=p.title,
            description=p.description,
            effective_date=p.effective_date,
            end_date=p.end_date,
            cpt_icd_scope=p.cpt_icd_scope or [],
            is_active=p.is_active
        )
        for p in policies
    ]

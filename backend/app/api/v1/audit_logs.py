from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import AuditLog
from app.schemas.schemas import AuditLogResponse

router = APIRouter(prefix="/audit-logs", tags=["HIPAA & AI Audit Logs"])

@router.get("", response_model=List[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = Query(None),
    is_phi: Optional[bool] = Query(None),
    limit: int = 50,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action.ilike(f"%{action}%"))
    if is_phi is not None:
        stmt = stmt.where(AuditLog.is_phi_accessed == is_phi)
        
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [
        AuditLogResponse(
            id=l.id,
            user_email=l.user_email or "System / Authorized User",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            prompt_text=l.prompt_text,
            retrieved_doc_ids=l.retrieved_doc_ids or [],
            is_phi_accessed=l.is_phi_accessed,
            timestamp=l.timestamp
        )
        for l in logs
    ]

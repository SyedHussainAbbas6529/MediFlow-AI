import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import (
    Organization, User, Role, Permission, RolePermission,
    IntegrationConnection, Subscription, AuditLog
)
from app.schemas.schemas import RoleSchema, PermissionSchema, UpdateRolePermissionsRequest, SubscriptionResponse

router = APIRouter(prefix="/settings", tags=["Settings & RBAC"])

class OrgProfileUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    tax_id: Optional[str] = None
    npi: Optional[str] = None

class CreateStaffRequest(BaseModel):
    full_name: str
    email: EmailStr
    role_slug: str = "medical_biller"
    phone: Optional[str] = None

class UpdatePlanRequest(BaseModel):
    plan_tier: str

@router.get("/organization")
@router.get("/org-profile")
async def get_org_profile(db: AsyncSession = Depends(get_db)):
    stmt = select(Organization).limit(1)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    
    return {
        "id": org.id if org else "org-demo-001",
        "name": org.name if org else "Apex Medical Practice",
        "slug": org.slug if org else "apex-medical",
        "email": org.email if org and org.email else "ops@apexmedical.health",
        "phone": org.phone if org and org.phone else "+1 (800) 555-0199",
        "address": org.address if org and org.address else "450 Medical Center Blvd, Suite 800, Austin, TX 78701",
        "tax_id": org.tax_id if org and org.tax_id else "XX-XXXX8921",
        "hipaa_baa_active": True,
        "encryption_status": "AES-256 Enabled & Active",
        "primary_brand_color": "#0EA5E9"
    }

@router.put("/organization")
@router.put("/org-profile")
async def update_org_profile(payload: OrgProfileUpdate, db: AsyncSession = Depends(get_db)):
    stmt = select(Organization).limit(1)
    result = await db.execute(stmt)
    org = result.scalar_one_or_none()
    if not org:
        org = Organization(
            name="Apex Medical Practice",
            slug="apex-medical"
        )
        db.add(org)

    if payload.name:
        org.name = payload.name
    if payload.email:
        org.email = payload.email
    if payload.phone:
        org.phone = payload.phone
    if payload.address:
        org.address = payload.address
    if payload.tax_id:
        org.tax_id = payload.tax_id

    # Log audit trail
    updated_dict = payload.model_dump(exclude_unset=True) if hasattr(payload, "model_dump") else payload.dict(exclude_unset=True)
    audit = AuditLog(
        organization_id=org.id,
        action="UPDATE_PRACTICE_PROFILE",
        entity_type="ORGANIZATION",
        entity_id=org.id,
        prompt_text=f"Practice profile updated: {org.name}",
        after_state=updated_dict
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": "Practice profile updated successfully!",
        "organization": {
            "name": org.name,
            "email": org.email,
            "phone": org.phone,
            "address": org.address,
            "tax_id": org.tax_id
        }
    }

@router.get("/staff")
async def list_staff_members(db: AsyncSession = Depends(get_db)):
    stmt = select(User).options(selectinload(User.role)).order_by(User.created_at.asc())
    result = await db.execute(stmt)
    users = result.scalars().all()

    if not users:
        # Return realistic seed staff
        return [
            {"id": "usr-1", "full_name": "Dr. Alexander Vance", "email": "admin@mediflowai.health", "role_name": "Super Admin", "role_slug": "super_admin", "status": "Active", "last_active": "Just now"},
            {"id": "usr-2", "full_name": "Sarah Sterling", "email": "billing.mgr@mediflowai.health", "role_name": "Billing Manager", "role_slug": "billing_manager", "status": "Active", "last_active": "5 mins ago"},
            {"id": "usr-3", "full_name": "David Kim", "email": "biller@mediflowai.health", "role_name": "Medical Biller", "role_slug": "medical_biller", "status": "Active", "last_active": "1 hour ago"},
            {"id": "usr-4", "full_name": "Rachel Adams", "email": "cred.spec@mediflowai.health", "role_name": "License Specialist", "role_slug": "credentialing_specialist", "status": "Active", "last_active": "2 hours ago"},
            {"id": "usr-5", "full_name": "Michael Torres", "email": "ar.spec@mediflowai.health", "role_name": "Payment Collector", "role_slug": "ar_specialist", "status": "Active", "last_active": "Yesterday"},
        ]

    return [
        {
            "id": u.id,
            "full_name": u.full_name,
            "email": u.email,
            "role_name": u.role.name if u.role else "Medical Biller",
            "role_slug": u.role.slug if u.role else "medical_biller",
            "status": "Active" if u.is_active else "Inactive",
            "last_active": "Recently"
        }
        for u in users
    ]

@router.post("/staff")
async def create_staff_member(payload: CreateStaffRequest, db: AsyncSession = Depends(get_db)):
    # Check if role exists
    stmt_role = select(Role).where(Role.slug == payload.role_slug)
    role = (await db.execute(stmt_role)).scalar_one_or_none()

    new_user = User(
        organization_id="org-demo-001",
        email=payload.email,
        full_name=payload.full_name,
        hashed_password="demo_hashed_password",
        role_id=role.id if role else None,
        is_active=True,
        is_verified=True
    )
    db.add(new_user)

    audit = AuditLog(
        organization_id="org-demo-001",
        action="INVITE_STAFF_MEMBER",
        entity_type="USER",
        entity_id=payload.email,
        prompt_text=f"Invited staff member {payload.full_name} ({payload.email})",
        after_state={"name": payload.full_name, "role": payload.role_slug}
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "success",
        "message": f"Staff member {payload.full_name} ({payload.email}) invited successfully with role '{payload.role_slug}'.",
        "user": {
            "id": new_user.id,
            "full_name": new_user.full_name,
            "email": new_user.email,
            "role_slug": payload.role_slug
        }
    }

@router.get("/roles-matrix")
@router.get("/roles-permissions-matrix")
async def get_roles_permission_matrix(db: AsyncSession = Depends(get_db)):
    stmt_roles = select(Role).options(selectinload(Role.role_permissions).selectinload(RolePermission.permission))
    roles = (await db.execute(stmt_roles)).scalars().all()
    
    stmt_perms = select(Permission).order_by(Permission.module.asc())
    all_perms = (await db.execute(stmt_perms)).scalars().all()
    
    perms_by_module: Dict[str, List[Dict[str, Any]]] = {}
    for p in all_perms:
        if p.module not in perms_by_module:
            perms_by_module[p.module] = []
        perms_by_module[p.module].append({
            "id": p.id,
            "slug": p.slug,
            "name": p.name,
            "description": p.description
        })
        
    roles_data = []
    for r in roles:
        assigned_perm_ids = [rp.permission_id for rp in r.role_permissions if rp.permission_id]
        roles_data.append({
            "id": r.id,
            "name": r.name,
            "slug": r.slug,
            "description": r.description,
            "is_system": r.is_system,
            "permission_ids": assigned_perm_ids
        })
        
    return {
        "roles": roles_data,
        "permissions_by_module": perms_by_module
    }

@router.put("/roles/{role_id}/permissions")
@router.post("/roles/{role_id}/permissions")
async def update_role_permissions(
    role_id: str,
    payload: UpdateRolePermissionsRequest,
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Role).options(selectinload(Role.role_permissions)).where(Role.id == role_id)
    role = (await db.execute(stmt)).scalar_one_or_none()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
        
    # Delete existing
    for rp in list(role.role_permissions):
        await db.delete(rp)
        
    # Add new
    for pid in payload.permission_ids:
        new_rp = RolePermission(role_id=role.id, permission_id=pid)
        db.add(new_rp)
        
    await db.commit()
    return {"status": "success", "message": f"Permissions updated for role '{role.name}' without server redeployment."}

@router.get("/integrations")
async def list_integrations(db: AsyncSession = Depends(get_db)):
    stmt = select(IntegrationConnection)
    result = await db.execute(stmt)
    integrations = result.scalars().all()
    
    if not integrations:
        return [
            {"id": "conn-1", "provider_key": "athenahealth", "name": "Athenahealth EHR", "status": "connected", "last_sync": "10 mins ago"},
            {"id": "conn-2", "provider_key": "waystar", "name": "Waystar Clearinghouse", "status": "connected", "last_sync": "4 mins ago"},
            {"id": "conn-3", "provider_key": "availity", "name": "Availity Payer Portal", "status": "connected", "last_sync": "1 hour ago"},
            {"id": "conn-4", "provider_key": "drchrono", "name": "DrChrono EHR", "status": "disconnected", "last_sync": "Never"},
            {"id": "conn-5", "provider_key": "eclinicalworks", "name": "eClinicalWorks", "status": "disconnected", "last_sync": "Never"},
            {"id": "conn-6", "provider_key": "gdrive", "name": "Google Drive Vault", "status": "connected", "last_sync": "30 mins ago"},
            {"id": "conn-7", "provider_key": "sharepoint", "name": "Microsoft SharePoint", "status": "disconnected", "last_sync": "Never"},
        ]
        
    return [
        {
            "id": i.id,
            "provider_key": i.provider_key,
            "name": i.name,
            "status": i.status,
            "last_sync": i.last_sync_at.strftime("%b %d, %H:%M") if i.last_sync_at else "Never"
        }
        for i in integrations
    ]

@router.post("/integrations/{provider_key}/toggle")
async def toggle_integration(provider_key: str, db: AsyncSession = Depends(get_db)):
    stmt = select(IntegrationConnection).where(IntegrationConnection.provider_key == provider_key)
    conn = (await db.execute(stmt)).scalar_one_or_none()
    if conn:
        conn.status = "disconnected" if conn.status == "connected" else "connected"
        await db.commit()
        return {"status": conn.status, "message": f"{conn.name} is now {conn.status}"}
    return {"status": "connected", "message": f"{provider_key} connector toggled"}

@router.get("/billing")
@router.get("/subscription")
async def get_saas_subscription(db: AsyncSession = Depends(get_db)):
    stmt = select(Subscription).limit(1)
    sub = (await db.execute(stmt)).scalar_one_or_none()
    if not sub:
        return {
            "plan_tier": "Enterprise",
            "status": "active",
            "max_users": 50,
            "max_claims_per_month": 10000,
            "current_month_claims": 320,
            "current_period_end": "2027-01-01"
        }
    return {
        "plan_tier": sub.plan_tier,
        "status": sub.status,
        "max_users": sub.max_users,
        "max_claims_per_month": sub.max_claims_per_month,
        "current_month_claims": sub.current_month_claims,
        "current_period_end": sub.current_period_end.isoformat() if sub.current_period_end else "2027-01-01"
    }

@router.post("/subscription/tier")
async def change_plan_tier(payload: UpdatePlanRequest, db: AsyncSession = Depends(get_db)):
    tier_limits = {
        "Starter": {"max_users": 5, "max_claims": 500},
        "Professional": {"max_users": 20, "max_claims": 3000},
        "Enterprise": {"max_users": 100, "max_claims": 25000}
    }
    limits = tier_limits.get(payload.plan_tier, tier_limits["Enterprise"])

    stmt = select(Subscription).limit(1)
    sub = (await db.execute(stmt)).scalar_one_or_none()
    if sub:
        sub.plan_tier = payload.plan_tier
        sub.max_users = limits["max_users"]
        sub.max_claims_per_month = limits["max_claims"]
    else:
        sub = Subscription(
            organization_id="org-demo-001",
            plan_tier=payload.plan_tier,
            max_users=limits["max_users"],
            max_claims_per_month=limits["max_claims"],
            current_month_claims=320,
            status="active"
        )
        db.add(sub)
    await db.commit()

    return {
        "status": "success",
        "message": f"Subscription plan upgraded to '{payload.plan_tier}'.",
        "subscription": {
            "plan_tier": sub.plan_tier,
            "max_users": sub.max_users,
            "max_claims_per_month": sub.max_claims_per_month
        }
    }

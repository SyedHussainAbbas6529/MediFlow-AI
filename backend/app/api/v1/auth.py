from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token, generate_totp_secret, verify_totp, get_totp_uri
from app.models.entities import Organization, User, Role, Subscription, AuditLog
from app.schemas.schemas import LoginRequest, RegisterOrgRequest, TokenResponse, UserResponse, PasswordResetRequest, PasswordResetConfirm, TwoFactorSetupResponse, TwoFactorVerifyRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register_organization(payload: RegisterOrgRequest, db: AsyncSession = Depends(get_db)):
    # Check if user email already exists
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already registered")
        
    # 1. Create Organization
    org_slug = payload.organization_name.lower().replace(" ", "-").replace(".", "")
    org = Organization(
        name=payload.organization_name,
        slug=org_slug,
        phone=payload.phone,
        email=payload.email
    )
    db.add(org)
    await db.flush()
    
    # 2. Get or create Super Admin Role
    role_res = await db.execute(select(Role).where(Role.slug == "super_admin"))
    super_admin_role = role_res.scalar_one_or_none()
    
    # 3. Create Super Admin User
    user = User(
        organization_id=org.id,
        email=payload.email,
        hashed_password=get_password_hash(payload.password),
        full_name=payload.full_name,
        role_id=super_admin_role.id if super_admin_role else None,
        is_verified=True
    )
    db.add(user)
    
    # 4. Create default SaaS Subscription
    sub = Subscription(
        organization_id=org.id,
        plan_tier="Enterprise",
        max_users=50,
        max_claims_per_month=10000
    )
    db.add(sub)
    
    # Audit log
    audit = AuditLog(
        organization_id=org.id,
        user_email=user.email,
        action="ORGANIZATION_REGISTERED",
        entity_type="Organization",
        entity_id=org.id
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(user)
    
    access_token = create_access_token(user.id, {"org_id": org.id, "email": user.email, "role": "super_admin"})
    refresh_token = create_refresh_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "organization_id": org.id,
            "organization_name": org.name,
            "email": user.email,
            "full_name": user.full_name,
            "role": "super_admin"
        }
    )

@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(User)
        .options(selectinload(User.organization), selectinload(User.role))
        .where(User.email == payload.email)
    )
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
        
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    # Check 2FA if enabled
    if user.totp_enabled:
        if not payload.totp_code or not verify_totp(user.totp_secret, payload.totp_code):
            raise HTTPException(status_code=401, detail="2FA authentication code required or invalid")
            
    role_slug = user.role.slug if user.role else "viewer"
    access_token = create_access_token(user.id, {"org_id": user.organization_id, "email": user.email, "role": role_slug})
    refresh_token = create_refresh_token(user.id)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user={
            "id": user.id,
            "organization_id": user.organization_id,
            "organization_name": user.organization.name if user.organization else "MediFlow Health",
            "email": user.email,
            "full_name": user.full_name,
            "role": role_slug
        }
    )

@router.get("/me")
async def get_me(db: AsyncSession = Depends(get_db)):
    # Demo/test helper returning the active user
    stmt = select(User).options(selectinload(User.role), selectinload(User.organization)).limit(1)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="No user found")
    return {
        "id": user.id,
        "organization_id": user.organization_id,
        "organization_name": user.organization.name if user.organization else "MediFlow Health",
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.slug if user.role else "super_admin",
        "totp_enabled": user.totp_enabled
    }

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_2fa(db: AsyncSession = Depends(get_db)):
    stmt = select(User).limit(1)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    secret = generate_totp_secret()
    user.totp_secret = secret
    await db.commit()
    
    qr_uri = get_totp_uri(secret, user.email)
    return TwoFactorSetupResponse(secret=secret, qr_uri=qr_uri)

@router.post("/2fa/verify")
async def verify_2fa_setup(payload: TwoFactorVerifyRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).limit(1)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user.totp_secret or not verify_totp(user.totp_secret, payload.code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
        
    user.totp_enabled = True
    await db.commit()
    return {"status": "2FA successfully enabled"}

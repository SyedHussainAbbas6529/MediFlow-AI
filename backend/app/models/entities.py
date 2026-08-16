import datetime
import uuid
from typing import List, Optional
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, DateTime, Text, ForeignKey, JSON, Enum
)
from sqlalchemy.orm import relationship
from app.core.database import Base

def generate_uuid() -> str:
    return str(uuid.uuid4())

class Organization(Base):
    __tablename__ = "organizations"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    tax_id = Column(String(50), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    users = relationship("User", back_populates="organization", cascade="all, delete-orphan")
    subscription = relationship("Subscription", back_populates="organization", uselist=False)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=True)
    totp_secret = Column(String(64), nullable=True)
    totp_enabled = Column(Boolean, default=False)
    failed_login_attempts = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    organization = relationship("Organization", back_populates="users")
    role = relationship("Role", back_populates="users")

class Role(Base):
    __tablename__ = "roles"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=True)  # null = system template
    name = Column(String(100), nullable=False)
    slug = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=True)
    is_system = Column(Boolean, default=False)
    
    users = relationship("User", back_populates="role")
    role_permissions = relationship("RolePermission", back_populates="role", cascade="all, delete-orphan")

class Permission(Base):
    __tablename__ = "permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=False)
    module = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    
    role_permissions = relationship("RolePermission", back_populates="permission", cascade="all, delete-orphan")

class RolePermission(Base):
    __tablename__ = "role_permissions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    role_id = Column(String(36), ForeignKey("roles.id"), nullable=False)
    permission_id = Column(String(36), ForeignKey("permissions.id"), nullable=False)
    
    role = relationship("Role", back_populates="role_permissions")
    permission = relationship("Permission", back_populates="role_permissions")

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    dob = Column(String(20), nullable=False)
    gender = Column(String(20), nullable=True)
    ssn_last4 = Column(String(4), nullable=True)
    phone = Column(String(50), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    insurance_member_id = Column(String(100), nullable=True)
    insurance_group = Column(String(100), nullable=True)
    payer_id = Column(String(36), ForeignKey("payers.id"), nullable=True)
    assigned_provider_id = Column(String(36), ForeignKey("providers.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    payer = relationship("Payer", foreign_keys=[payer_id])
    assigned_provider = relationship("Provider", foreign_keys=[assigned_provider_id])
    claims = relationship("Claim", back_populates="patient")

class Provider(Base):
    __tablename__ = "providers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    npi = Column(String(20), nullable=False, index=True)
    taxonomy_code = Column(String(50), nullable=True)
    specialty = Column(String(100), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    caqh_number = Column(String(50), nullable=True)
    readiness_status = Column(String(50), default="Ready")  # Ready, Conditional, Not Ready
    readiness_score = Column(Integer, default=95)
    last_audit_date = Column(DateTime, default=datetime.datetime.utcnow)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    credentials = relationship("ProviderCredential", back_populates="provider", cascade="all, delete-orphan")
    documents = relationship("ProviderDocument", back_populates="provider", cascade="all, delete-orphan")
    claims = relationship("Claim", back_populates="provider")

class ProviderCredential(Base):
    __tablename__ = "provider_credentials"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    provider_id = Column(String(36), ForeignKey("providers.id"), nullable=False, index=True)
    credential_type = Column(String(100), nullable=False)  # State License, DEA, CAQH, Malpractice, Board Cert, Payer Enrollment
    credential_number = Column(String(100), nullable=True)
    issuing_authority = Column(String(100), nullable=True)
    issue_date = Column(String(20), nullable=True)
    expiration_date = Column(String(20), nullable=True)
    status = Column(String(50), default="Active")  # Active, Expiring Soon, Expired, Missing
    days_until_expiry = Column(Integer, default=180)
    verification_notes = Column(Text, nullable=True)
    
    provider = relationship("Provider", back_populates="credentials")

class ProviderDocument(Base):
    __tablename__ = "provider_documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    provider_id = Column(String(36), ForeignKey("providers.id"), nullable=False)
    name = Column(String(255), nullable=False)
    document_type = Column(String(100), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)
    ocr_extracted_text = Column(Text, nullable=True)
    
    provider = relationship("Provider", back_populates="documents")

class Payer(Base):
    __tablename__ = "payers"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    payer_id_code = Column(String(50), nullable=False)
    payer_type = Column(String(50), default="private")  # medicare, medicaid, tricare, private
    mac_region = Column(String(50), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    claims_address = Column(String(255), nullable=True)
    
    policies = relationship("PayerPolicy", back_populates="payer", cascade="all, delete-orphan")

class PayerPolicy(Base):
    __tablename__ = "payer_policies"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    payer_id = Column(String(36), ForeignKey("payers.id"), nullable=True)
    payer_name = Column(String(255), nullable=False)
    payer_type = Column(String(50), nullable=False)  # medicare, medicaid, tricare, private
    jurisdiction = Column(String(100), nullable=True)  # Federal, State, MAC Region J, etc.
    policy_type = Column(String(100), nullable=False)  # NCD, LCD, medical_policy, reimbursement_policy, prior_auth_rule
    policy_number = Column(String(100), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    effective_date = Column(String(20), nullable=True)
    end_date = Column(String(20), nullable=True)
    cpt_icd_scope = Column(JSON, default=list)  # Applicable CPT/ICD codes
    source_document_id = Column(String(36), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    payer = relationship("Payer", back_populates="policies")

class Claim(Base):
    __tablename__ = "claims"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    claim_number = Column(String(100), unique=True, nullable=False, index=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    provider_id = Column(String(36), ForeignKey("providers.id"), nullable=False)
    payer_id = Column(String(36), ForeignKey("payers.id"), nullable=False)
    date_of_service = Column(String(20), nullable=False)
    total_charge = Column(Float, default=0.0)
    status = Column(String(50), default="Draft")  # Draft, Scrubbing, Ready for Review, Approved, Submitted, Accepted, Denied, Paid
    scrub_status = Column(String(50), default="Passed")  # Passed, Warning, Failed
    scrub_details = Column(JSON, default=dict)
    medical_necessity_score = Column(Integer, default=95)
    prior_auth_number = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    human_approved_by_id = Column(String(36), nullable=True)
    human_approved_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    patient = relationship("Patient", back_populates="claims")
    provider = relationship("Provider", back_populates="claims")
    payer = relationship("Payer")
    lines = relationship("ClaimLine", back_populates="claim", cascade="all, delete-orphan")
    denials = relationship("Denial", back_populates="claim", cascade="all, delete-orphan")

class ClaimLine(Base):
    __tablename__ = "claim_lines"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False)
    line_number = Column(Integer, default=1)
    cpt_code = Column(String(20), nullable=False)
    description = Column(String(255), nullable=True)
    modifier_1 = Column(String(10), nullable=True)
    modifier_2 = Column(String(10), nullable=True)
    icd_pointers = Column(String(50), nullable=True)  # e.g., "M54.5, M54.2"
    units = Column(Integer, default=1)
    charge_amount = Column(Float, default=0.0)
    allowed_amount = Column(Float, default=0.0)
    paid_amount = Column(Float, default=0.0)
    
    claim = relationship("Claim", back_populates="lines")

class Denial(Base):
    __tablename__ = "denials"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False, index=True)
    denial_code = Column(String(50), nullable=False)  # CO-50, PR-204, CO-16, etc.
    denial_reason = Column(String(255), nullable=False)
    ai_interpreted_reason = Column(Text, nullable=True)
    root_cause_category = Column(String(100), nullable=True)  # Medical Necessity, Missing Modifier, Timely Filing, Coding
    payer_policy_id = Column(String(36), ForeignKey("payer_policies.id"), nullable=True)
    cited_policy_text = Column(Text, nullable=True)
    citation_metadata = Column(JSON, default=dict)
    recommended_action = Column(Text, nullable=True)
    approval_likelihood_score = Column(Integer, default=85)
    approval_likelihood_reason = Column(Text, nullable=True)
    status = Column(String(50), default="Open")  # Open, Draft Appeal, In Review, Appeal Submitted, Overturned, Upheld
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    claim = relationship("Claim", back_populates="denials")
    payer_policy = relationship("PayerPolicy")
    appeals = relationship("Appeal", back_populates="denial", cascade="all, delete-orphan")

class Appeal(Base):
    __tablename__ = "appeals"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    denial_id = Column(String(36), ForeignKey("denials.id"), nullable=False)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False)
    appeal_letter_text = Column(Text, nullable=False)
    original_draft_text = Column(Text, nullable=True)
    diff_summary = Column(Text, nullable=True)
    version = Column(Integer, default=1)
    status = Column(String(50), default="Draft")  # Draft, Human Edited, Approved, Submitted
    approved_by_id = Column(String(36), nullable=True)
    approved_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)
    pdf_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    denial = relationship("Denial", back_populates="appeals")

class ARFollowup(Base):
    __tablename__ = "ar_followups"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    claim_id = Column(String(36), ForeignKey("claims.id"), nullable=False)
    aging_bucket = Column(String(20), default="31-60")  # 0-30, 31-60, 61-90, 90+
    days_in_ar = Column(Integer, default=45)
    outstanding_amount = Column(Float, default=0.0)
    priority = Column(String(20), default="Medium")  # High, Medium, Low
    last_contact_date = Column(String(20), nullable=True)
    next_followup_date = Column(String(20), nullable=True)
    ai_suggested_action = Column(Text, nullable=True)
    draft_email_subject = Column(String(255), nullable=True)
    draft_email_body = Column(Text, nullable=True)
    call_script = Column(Text, nullable=True)
    status = Column(String(50), default="Pending")  # Pending, Action Taken, Resolved
    
    claim = relationship("Claim")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), default="Payer Policy")  # Payer Policy, SOP, Clinical Guideline, Credentialing Rule, Contract, Fee Schedule
    payer_id = Column(String(36), ForeignKey("payers.id"), nullable=True)
    file_path = Column(String(500), nullable=False)
    file_size = Column(Integer, default=0)
    file_type = Column(String(50), default="pdf")
    page_count = Column(Integer, default=1)
    ocr_status = Column(String(50), default="Completed")
    chunk_count = Column(Integer, default=0)
    citations_count = Column(Integer, default=0)
    uploaded_by_id = Column(String(36), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    payer = relationship("Payer")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    chunk_index = Column(Integer, default=0)
    page_number = Column(Integer, default=1)
    content = Column(Text, nullable=False)
    embedding_json = Column(JSON, nullable=True)  # Pluggable vector or embedding store
    metadata_json = Column(JSON, default=dict)
    
    document = relationship("Document", back_populates="chunks")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    user_email = Column(String(255), nullable=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=True)
    prompt_text = Column(Text, nullable=True)
    retrieved_doc_ids = Column(JSON, default=list)
    ai_output = Column(Text, nullable=True)
    before_state = Column(JSON, nullable=True)
    after_state = Column(JSON, nullable=True)
    is_phi_accessed = Column(Boolean, default=False)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=True)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="alert")
    link = Column(String(255), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    priority = Column(String(20), default="Medium")
    due_date = Column(String(20), nullable=True)
    assigned_user_id = Column(String(36), nullable=True)
    related_entity_type = Column(String(50), nullable=True)
    related_entity_id = Column(String(36), nullable=True)
    status = Column(String(50), default="Todo")  # Todo, In Progress, Done
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AgentRun(Base):
    __tablename__ = "ai_agent_runs"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    agent_name = Column(String(100), nullable=False)
    prompt = Column(Text, nullable=False)
    response = Column(Text, nullable=True)
    model_used = Column(String(50), default="gpt-4o")
    tokens_used = Column(Integer, default=0)
    execution_time_ms = Column(Float, default=0.0)
    status = Column(String(50), default="Success")
    citations = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class IntegrationConnection(Base):
    __tablename__ = "integration_connections"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False)
    provider_key = Column(String(50), nullable=False)  # athenahealth, waystar, availity, drchrono, eclinicalworks, gdrive, sharepoint
    name = Column(String(100), nullable=False)
    status = Column(String(50), default="disconnected")  # connected, disconnected, error
    auth_payload = Column(JSON, default=dict)
    last_sync_at = Column(DateTime, nullable=True)

class Subscription(Base):
    __tablename__ = "subscriptions"
    
    id = Column(String(36), primary_key=True, default=generate_uuid)
    organization_id = Column(String(36), ForeignKey("organizations.id"), nullable=False, unique=True)
    plan_tier = Column(String(50), default="Enterprise")  # Starter, Professional, Enterprise
    status = Column(String(50), default="active")
    max_users = Column(Integer, default=25)
    max_claims_per_month = Column(Integer, default=5000)
    current_month_claims = Column(Integer, default=320)
    stripe_customer_id = Column(String(100), nullable=True)
    stripe_subscription_id = Column(String(100), nullable=True)
    current_period_end = Column(DateTime, default=lambda: datetime.datetime.utcnow() + datetime.timedelta(days=365))
    
    organization = relationship("Organization", back_populates="subscription")

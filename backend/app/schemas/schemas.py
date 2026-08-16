import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, EmailStr, Field

# --- AUTH SCHEMAS ---
class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    totp_code: Optional[str] = None

class RegisterOrgRequest(BaseModel):
    organization_name: Optional[str] = None
    full_name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    organization_id: str
    email: str
    full_name: str
    role: Optional[Dict[str, Any]] = None
    is_active: bool
    is_verified: bool
    totp_enabled: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: Optional[str] = None
    email: Optional[EmailStr] = None
    new_password: str

class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_uri: str

class TwoFactorVerifyRequest(BaseModel):
    code: str

# --- ROLES & PERMISSIONS ---
class PermissionSchema(BaseModel):
    id: str
    slug: str
    name: str
    module: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleSchema(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    is_system: bool
    permissions: List[PermissionSchema] = []

    class Config:
        from_attributes = True

class UpdateRolePermissionsRequest(BaseModel):
    permission_ids: List[str]

# --- PATIENT SCHEMAS ---
class PatientCreate(BaseModel):
    first_name: str
    last_name: str
    dob: str
    gender: Optional[str] = "Unspecified"
    ssn_last4: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_member_id: Optional[str] = None
    insurance_group: Optional[str] = None
    payer_id: Optional[str] = None
    assigned_provider_id: Optional[str] = None

class PatientResponse(BaseModel):
    id: str
    organization_id: str
    first_name: str
    last_name: str
    dob: str
    gender: Optional[str] = None
    ssn_last4: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    insurance_member_id: Optional[str] = None
    insurance_group: Optional[str] = None
    payer_id: Optional[str] = None
    assigned_provider_id: Optional[str] = None
    payer_name: Optional[str] = None
    provider_name: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- PROVIDER & CREDENTIALING SCHEMAS ---
class ProviderCredentialSchema(BaseModel):
    id: str
    credential_type: str
    credential_number: Optional[str] = None
    issuing_authority: Optional[str] = None
    issue_date: Optional[str] = None
    expiration_date: Optional[str] = None
    status: str
    days_until_expiry: int
    verification_notes: Optional[str] = None

    class Config:
        from_attributes = True

class ProviderCreate(BaseModel):
    first_name: str
    last_name: str
    npi: str
    taxonomy_code: Optional[str] = None
    specialty: str
    email: Optional[str] = None
    phone: Optional[str] = None
    caqh_number: Optional[str] = None

class ProviderResponse(BaseModel):
    id: str
    organization_id: str
    first_name: str
    last_name: str
    npi: str
    taxonomy_code: Optional[str] = None
    specialty: str
    email: Optional[str] = None
    phone: Optional[str] = None
    caqh_number: Optional[str] = None
    readiness_status: str
    readiness_score: int
    last_audit_date: Optional[datetime.datetime] = None
    credentials: List[ProviderCredentialSchema] = []

    class Config:
        from_attributes = True

# --- PAYER & POLICIES ---
class PayerSchema(BaseModel):
    id: str
    name: str
    payer_id_code: str
    payer_type: str
    mac_region: Optional[str] = None
    contact_phone: Optional[str] = None

    class Config:
        from_attributes = True

class PayerPolicySchema(BaseModel):
    id: str
    payer_name: str
    payer_type: str
    jurisdiction: Optional[str] = None
    policy_type: str
    policy_number: str
    title: str
    description: Optional[str] = None
    effective_date: Optional[str] = None
    end_date: Optional[str] = None
    cpt_icd_scope: List[str] = []
    is_active: bool

    class Config:
        from_attributes = True

# --- CLAIMS & BILLING ---
class ClaimLineCreate(BaseModel):
    line_number: int = 1
    cpt_code: str
    description: Optional[str] = None
    modifier_1: Optional[str] = None
    modifier_2: Optional[str] = None
    icd_pointers: Optional[str] = None
    units: int = 1
    charge_amount: float

class ClaimLineResponse(BaseModel):
    id: str
    line_number: int
    cpt_code: str
    description: Optional[str] = None
    modifier_1: Optional[str] = None
    modifier_2: Optional[str] = None
    icd_pointers: Optional[str] = None
    units: int
    charge_amount: float
    allowed_amount: float
    paid_amount: float

    class Config:
        from_attributes = True

class ClaimCreate(BaseModel):
    patient_id: str
    provider_id: str
    payer_id: Optional[str] = None
    date_of_service: str
    lines: List[ClaimLineCreate]
    prior_auth_number: Optional[str] = None
    notes: Optional[str] = None

class ScrubChecklist(BaseModel):
    passed: bool
    completeness: Dict[str, Any]
    coding_validation: Dict[str, Any]
    medical_necessity: Dict[str, Any]
    duplicate_check: Dict[str, Any]
    payer_policy_match: Optional[Dict[str, Any]] = None
    warnings: List[str] = []
    errors: List[str] = []

class ClaimResponse(BaseModel):
    id: str
    organization_id: str
    claim_number: str
    patient_id: str
    provider_id: str
    payer_id: str
    patient_name: Optional[str] = None
    provider_name: Optional[str] = None
    payer_name: Optional[str] = None
    date_of_service: str
    total_charge: float
    status: str
    scrub_status: str
    scrub_details: Dict[str, Any] = {}
    medical_necessity_score: int
    prior_auth_number: Optional[str] = None
    human_approved_at: Optional[datetime.datetime] = None
    submitted_at: Optional[datetime.datetime] = None
    lines: List[ClaimLineResponse] = []

    class Config:
        from_attributes = True

# --- DENIALS & APPEALS ---
class DenialResponse(BaseModel):
    id: str
    organization_id: str
    claim_id: str
    claim_number: Optional[str] = None
    patient_name: Optional[str] = None
    payer_name: Optional[str] = None
    total_charge: Optional[float] = None
    denial_code: str
    denial_reason: str
    ai_interpreted_reason: Optional[str] = None
    root_cause_category: Optional[str] = None
    payer_policy_number: Optional[str] = None
    cited_policy_text: Optional[str] = None
    citation_metadata: Dict[str, Any] = {}
    recommended_action: Optional[str] = None
    approval_likelihood_score: int
    approval_likelihood_reason: Optional[str] = None
    status: str
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class AppealDraftRequest(BaseModel):
    denial_id: str
    custom_instructions: Optional[str] = None

class AppealRewriteRequest(BaseModel):
    appeal_id: str
    instruction: str  # "formal", "concise", "strengthen", "add_citation", "fix_tone", or custom text
    selected_text: Optional[str] = None

class AppealResponse(BaseModel):
    id: str
    denial_id: str
    claim_id: str
    appeal_letter_text: str
    original_draft_text: Optional[str] = None
    diff_summary: Optional[str] = None
    version: int
    status: str
    approved_at: Optional[datetime.datetime] = None
    pdf_path: Optional[str] = None

    class Config:
        from_attributes = True

# --- AR FOLLOW-UP ---
class ARFollowupResponse(BaseModel):
    id: str
    claim_id: str
    claim_number: Optional[str] = None
    patient_name: Optional[str] = None
    payer_name: Optional[str] = None
    aging_bucket: str
    days_in_ar: int
    outstanding_amount: float
    priority: str
    last_contact_date: Optional[str] = None
    next_followup_date: Optional[str] = None
    ai_suggested_action: Optional[str] = None
    draft_email_subject: Optional[str] = None
    draft_email_body: Optional[str] = None
    call_script: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# --- DOCUMENTS & RAG ---
class DocumentResponse(BaseModel):
    id: str
    title: str
    category: str
    payer_name: Optional[str] = None
    file_type: str
    file_size: int
    page_count: int
    ocr_status: str
    chunk_count: int
    citations_count: int
    created_at: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

class ExtractionResponse(BaseModel):
    document_type: str  # claim_eob, insurance_card, denial_letter, credential
    confidence_score: float
    extracted_fields: Dict[str, Any]
    warnings: List[str] = []

class SearchRAGRequest(BaseModel):
    query: str
    payer_id: Optional[str] = None
    category: Optional[str] = None
    limit: int = 5

class CitationItem(BaseModel):
    document_title: str
    page_number: int
    chunk_id: str
    snippet: str
    relevance_score: float

# --- ASSISTANT ---
class AssistantMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None
    payer_filter: Optional[str] = None
    attached_file_id: Optional[str] = None

class AssistantMessageResponse(BaseModel):
    reply: str
    agent_name: str
    citations: List[CitationItem] = []
    suggested_actions: List[str] = []

# --- AUDIT LOGS ---
class AuditLogResponse(BaseModel):
    id: str
    user_email: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    prompt_text: Optional[str] = None
    retrieved_doc_ids: List[str] = []
    is_phi_accessed: bool
    timestamp: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

# --- SAAS BILLING ---
class SubscriptionResponse(BaseModel):
    plan_tier: str
    status: str
    max_users: int
    max_claims_per_month: int
    current_month_claims: int
    current_period_end: Optional[datetime.datetime] = None

    class Config:
        from_attributes = True

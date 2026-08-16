import asyncio
import datetime
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.entities import (
    Organization, User, Role, Permission, RolePermission,
    Payer, PayerPolicy, Document, DocumentChunk,
    IntegrationConnection, Subscription
)
from app.services.vector_service import vector_search_service

async def seed_database():
    # 1. Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
    async with AsyncSessionLocal() as db:
        # Check if already seeded
        org_check = await db.execute(select(Organization).limit(1))
        if org_check.scalar_one_or_none():
            print("Database already contains structure. Skipping initial seeding.")
            return

        print("[CLEAN PRODUCTION SEEDING] Initializing clean production database structure (Zero Sample Data)...")

        # 1. Clean Organization
        org = Organization(
            id="org-prod-001",
            name="Apex Medical Practice",
            slug="apex-medical",
            tax_id="74-9823412",
            phone="+1 (800) 555-0199",
            email="admin@apexmedical.health",
            address="450 Medical Center Blvd, Suite 800, Austin, TX 78701"
        )
        db.add(org)
        await db.flush()

        # 2. Roles
        role_definitions = [
            ("Super Admin", "super_admin", "Full global system & tenant control", True),
            ("Admin", "admin", "Organization management and configuration", True),
            ("Billing Manager", "billing_manager", "Oversees claim approvals, scrubs, and submissions", True),
            ("Medical Biller", "medical_biller", "Claim intake, coding validation, and scrubber review", True),
            ("Credentialing Specialist", "credentialing_specialist", "Provider onboarding, primary source verification, expirations", True),
            ("Accounts Receivable Specialist", "ar_specialist", "AR aging triage, payer outreach, and denial follow-up", True),
            ("Reviewer", "reviewer", "Clinical and medical necessity review", True),
            ("Provider", "provider", "Scoped provider dashboard (own claims & credentials)", True),
            ("Viewer", "viewer", "Read-only access across all modules", True),
        ]
        
        role_map = {}
        for name, slug, desc, is_sys in role_definitions:
            r = Role(
                id=f"role-{slug}",
                organization_id=org.id,
                name=name,
                slug=slug,
                description=desc,
                is_system=is_sys
            )
            db.add(r)
            role_map[slug] = r
            
        await db.flush()

        # 3. Permissions
        permissions_data = [
            # Claims
            ("claims.view", "View Claims", "claims", "View claim lists and details"),
            ("claims.create", "Create Claims", "claims", "Submit new claim intake forms"),
            ("claims.scrub", "Run AI Scrubber", "claims", "Execute automated claim validation"),
            ("claims.approve", "Approve & Submit Claims", "claims", "Authorize claim transmission to clearinghouse"),
            # Denials
            ("denials.view", "View Denials", "denials", "View denial queue and root cause analysis"),
            ("denials.appeal_draft", "Draft AI Appeals", "denials", "Generate and edit appeal letters"),
            ("denials.appeal_approve", "Approve Appeals", "denials", "Submit formal appeals and export PDF"),
            # Credentialing
            ("credentials.view", "View Credentials", "credentialing", "View provider licenses and checklists"),
            ("credentials.manage", "Manage Credentials", "credentialing", "Add/edit licenses and trigger renewals"),
            # Patients
            ("patients.view", "View Patients", "patients", "View patient demographics and records"),
            ("patients.manage", "Manage Patients", "patients", "Create and edit patient files"),
            # AR
            ("ar.view", "View AR", "ar", "Inspect aging buckets and outstanding claims"),
            ("ar.manage", "Manage AR", "ar", "Generate payer follow-up scripts and actions"),
            # Settings & Audit
            ("settings.manage", "Manage Settings", "settings", "Configure organization and integrations"),
            ("roles.manage", "Manage Roles & RBAC", "settings", "Adjust permissions per role"),
            ("audit.view", "View Audit Logs", "audit", "Inspect immutable HIPAA and AI audit trails")
        ]
        
        perm_objs = []
        for slug, name, module, desc in permissions_data:
            p = Permission(
                id=f"perm-{slug.replace('.', '-')}",
                name=name,
                slug=slug,
                module=module,
                description=desc
            )
            db.add(p)
            perm_objs.append(p)
            
        await db.flush()

        # Map All Permissions to Super Admin and Admin
        for p in perm_objs:
            rp_super = RolePermission(role_id=role_map["super_admin"].id, permission_id=p.id)
            rp_admin = RolePermission(role_id=role_map["admin"].id, permission_id=p.id)
            db.add(rp_super)
            db.add(rp_admin)
            
            # Billing Manager permissions
            if p.module in ["claims", "denials", "patients", "ar", "audit"]:
                db.add(RolePermission(role_id=role_map["billing_manager"].id, permission_id=p.id))
            # Medical Biller permissions
            if p.module in ["claims", "denials", "patients"]:
                db.add(RolePermission(role_id=role_map["medical_biller"].id, permission_id=p.id))
            # Credentialing Specialist permissions
            if p.module in ["credentialing", "audit"]:
                db.add(RolePermission(role_id=role_map["credentialing_specialist"].id, permission_id=p.id))
            # AR Specialist permissions
            if p.module in ["ar", "denials", "patients"]:
                db.add(RolePermission(role_id=role_map["ar_specialist"].id, permission_id=p.id))
            # Viewer permissions
            if "view" in p.slug:
                db.add(RolePermission(role_id=role_map["viewer"].id, permission_id=p.id))
                
        await db.flush()

        # 4. Create Initial Administrator Account for Real Practice Owner
        admin_user = User(
            id="user-admin-001",
            organization_id=org.id,
            email="admin@mediflowai.health",
            hashed_password=get_password_hash("Password123!"),
            full_name="Dr. Alexander Vance",
            role_id=role_map["super_admin"].id,
            is_verified=True,
            is_active=True
        )
        db.add(admin_user)

        # 5. Standard Insurance Payers
        payers_data = [
            ("Medicare Part B (Noridian MAC)", "MEDICARE_B_NORIDIAN", "medicare", "MAC Region J", "1-800-633-4227"),
            ("Medicare Part B (Novitas MAC)", "MEDICARE_B_NOVITAS", "medicare", "MAC Region L", "1-800-633-4227"),
            ("Texas Medicaid (TMHP)", "TEXAS_MEDICAID", "medicaid", "State of Texas", "1-800-925-9126"),
            ("New York Medicaid (eMedNY)", "NY_MEDICAID", "medicaid", "State of New York", "1-800-343-9000"),
            ("TRICARE East (Humana Military)", "TRICARE_EAST", "tricare", "Eastern US", "1-800-444-5445"),
            ("Blue Cross Blue Shield of Texas", "BCBS_TX", "private", "Texas / National", "1-800-521-2227"),
            ("UnitedHealthcare Commercial", "UHC_COMM", "private", "National", "1-877-842-3210"),
            ("Aetna Health Insurance", "AETNA_COMM", "private", "National", "1-888-632-3862"),
            ("Cigna Healthcare", "CIGNA_COMM", "private", "National", "1-800-882-4462"),
            ("Humana ChoiceCare", "HUMANA_COMM", "private", "National", "1-800-448-6262"),
        ]
        
        payer_objs = []
        for name, code, p_type, region, phone in payers_data:
            p = Payer(
                organization_id=org.id,
                name=name,
                payer_id_code=code,
                payer_type=p_type,
                mac_region=region,
                contact_phone=phone,
                claims_address="P.O. Box 9820, Health Claims Center"
            )
            db.add(p)
            payer_objs.append(p)
            
        await db.flush()

        # 6. Standard Payer Coding Guidelines (LCD / NCD rules for AI Scrubber)
        policies_data = [
            (
                payer_objs[0].id, payer_objs[0].name, "medicare", "MAC Region J", "LCD", "L33777",
                "Major Joint Injections (Hyaluronic Acid / Corticosteroid)",
                "Coverage indications for intra-articular knee/shoulder injections. Conservative treatment of at least 6 weeks required prior to hyaluronic injection. Radiographic OA confirmation mandatory.",
                ["20610", "J7321", "M17.11", "M17.12", "M19.011"]
            ),
            (
                payer_objs[0].id, payer_objs[0].name, "medicare", "Federal", "NCD", "NCD-220.2",
                "FDG PET Scans for Oncologic Indications",
                "Medicare coverage criteria for initial staging and subsequent restaging of solid tumors, lymphoma, and solitary pulmonary nodules.",
                ["78815", "78816", "C34.90", "C50.919"]
            ),
            (
                payer_objs[2].id, payer_objs[2].name, "medicaid", "Texas", "reimbursement_policy", "TX-MED-440",
                "Texas Medicaid Preventive & Evaluation Services",
                "Guidelines regarding comprehensive well-child exams and modifier 25 requirements on same-day illness evaluations.",
                ["99213", "99214", "99381", "99391", "Z00.129"]
            ),
            (
                payer_objs[5].id, payer_objs[5].name, "private", "Texas / National", "medical_policy", "BCBS-CLIN-102",
                "Spinal MRI Pre-Authorization & Conservative Care Requirements",
                "Lumbar and cervical spinal MRI coverage rules requiring documentation of radicular pain and failed physical therapy unless red-flag neurological deficits present.",
                ["72148", "72141", "M54.2", "M54.16"]
            ),
            (
                payer_objs[6].id, payer_objs[6].name, "private", "National", "reimbursement_policy", "UHC-REIMB-025",
                "Evaluation and Management with Concurrent Minor Procedures (Modifier 25)",
                "Documentation guidelines for appending modifier 25 to separate and distinct E/M services performed on the same date as a minor procedure (0-10 day global period).",
                ["99214", "93000", "11102", "17000"]
            )
        ]

        for p_id, p_name, p_type, jur, pol_type, pol_num, title, desc, codes in policies_data:
            pol = PayerPolicy(
                organization_id=org.id,
                payer_id=p_id,
                payer_name=p_name,
                payer_type=p_type,
                jurisdiction=jur,
                policy_type=pol_type,
                policy_number=pol_num,
                title=title,
                description=desc,
                effective_date="2024-01-01",
                end_date="2027-12-31",
                cpt_icd_scope=codes,
                is_active=True
            )
            db.add(pol)
            
        await db.flush()

        # 7. Standard Knowledge Base Documents & Vector Chunks for Policy Engine
        doc_samples = [
            ("Medicare Part B LCD L33777 - Major Joint Injections", "Payer Policy", payer_objs[0].id, [
                "CMS MAC Region J LCD L33777 defines coverage indications for CPT 20610 (Arthrocentesis, major joint). Primary indication requires documented radiographic confirmation of grade II-IV osteoarthritis of the knee.",
                "Prior to approving hyaluronic acid viscosupplementation, the medical record must demonstrate failure or contraindication to a 6-week trial of conservative non-pharmacologic or analgesic therapy.",
                "Billing requirement: Modifier -RT or -LT must be appended to indicate anatomical location. Multiple joint injections on the same date require modifier -59 on subsequent lines."
            ]),
            ("CMS NCD 220.2 - FDG PET Scans for Oncology", "Payer Policy", payer_objs[0].id, [
                "National Coverage Determination 220.2 provides coverage for whole-body PET scans using FDG for initial treatment strategy and subsequent restaging in biopsy-proven malignant neoplasms.",
                "Diagnostic documentation must include primary oncologic diagnosis, current TNM staging classification, and clear clinical rationale why standard CT or MRI is insufficient.",
                "Claims submitted without supporting pathology reports or prior imaging cross-references will be denied under CARC CO-50 (Non-covered medical necessity)."
            ]),
            ("BCBS Clinical Guidelines - Advanced Spine Imaging", "Payer Policy", payer_objs[5].id, [
                "BCBS Pre-Service Clinical Review Policy 102 dictates that MRI of the Lumbar Spine (CPT 72148) is covered when persistent low back pain is accompanied by lower extremity radiculopathy.",
                "Unless severe progressive motor weakness or cauda equina syndrome is documented, coverage requires completion of a minimum of 4 weeks of formal physical therapy or directed conservative home exercise."
            ]),
            ("MediFlow Standard Operating Procedure - Claims Scrubbing & Quality", "SOP", None, [
                "MediFlow RCM Quality Directive: Every claim must be scrubbed for CPT/ICD compatibility, valid NPI rendering numbers, active payer eligibility, and correct modifier assignment.",
                "Under no circumstances may an AI agent automatically submit a claim to a payer clearinghouse. All scrubbed claims must pass through the Human Review Queue for certified medical biller sign-off."
            ])
        ]

        for title, category, payer_id, chunks_text in doc_samples:
            doc = Document(
                organization_id=org.id,
                title=title,
                category=category,
                payer_id=payer_id,
                file_path=f"policies/{title.lower().replace(' ', '_')}.pdf",
                file_size=142000,
                file_type="pdf",
                page_count=len(chunks_text),
                ocr_status="Completed",
                chunk_count=len(chunks_text),
                citations_count=5
            )
            db.add(doc)
            await db.flush()
            
            for idx, text in enumerate(chunks_text):
                emb = vector_search_service.compute_mock_embedding(text)
                c_obj = DocumentChunk(
                    organization_id=org.id,
                    document_id=doc.id,
                    chunk_index=idx,
                    page_number=idx + 1,
                    content=text,
                    embedding_json=emb,
                    metadata_json={"title": title, "category": category}
                )
                db.add(c_obj)

        # 8. Active Clearinghouse & EHR Connectors (Available for configuration)
        connectors = [
            ("athenahealth", "Athenahealth EHR", "disconnected"),
            ("waystar", "Waystar Clearinghouse", "disconnected"),
            ("availity", "Availity Payer Portal", "disconnected"),
            ("drchrono", "DrChrono EHR", "disconnected"),
            ("eclinicalworks", "eClinicalWorks", "disconnected"),
            ("gdrive", "Google Drive Vault", "disconnected"),
            ("sharepoint", "Microsoft SharePoint", "disconnected"),
        ]
        for key, name, status in connectors:
            c = IntegrationConnection(
                organization_id=org.id,
                provider_key=key,
                name=name,
                status=status
            )
            db.add(c)

        # 9. Practice SaaS Subscription
        sub = Subscription(
            organization_id=org.id,
            plan_tier="Enterprise",
            status="active",
            max_users=50,
            max_claims_per_month=10000,
            current_month_claims=0
        )
        db.add(sub)

        await db.commit()
        print("[SUCCESS] Clean production database initialization complete (0 dummy claims/patients/providers).")

if __name__ == "__main__":
    asyncio.run(seed_database())

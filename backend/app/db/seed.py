import asyncio
import datetime
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import AsyncSessionLocal, engine, Base
from app.core.security import get_password_hash
from app.models.entities import (
    Organization, User, Role, Permission, RolePermission,
    Patient, Provider, ProviderCredential, ProviderDocument,
    Payer, PayerPolicy, Claim, ClaimLine, Denial, Appeal,
    ARFollowup, Document, DocumentChunk, AuditLog, Notification,
    Task, IntegrationConnection, Subscription
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
            print("Database already contains data. Skipping initial seeding.")
            return

        print("[SEEDING] Seeding MediFlow AI production-grade database with realistic clinical & RCM data...")

        # 1. Organization
        org = Organization(
            id="org-demo-001",
            name="MediFlow Healthcare Solutions",
            slug="mediflow-health",
            tax_id="74-9823412",
            phone="+1 (800) 555-0199",
            email="ops@mediflowai.health",
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
                slug=slug,
                name=name,
                module=module,
                description=desc
            )
            db.add(p)
            perm_objs.append(p)
            
        await db.flush()

        # Map All Permissions to Super Admin and Admin
        for p in perm_objs:
            db.add(RolePermission(role_id=role_map["super_admin"].id, permission_id=p.id))
            db.add(RolePermission(role_id=role_map["admin"].id, permission_id=p.id))
            
            # Map Biller permissions
            if p.module in ["claims", "denials", "patients", "ar"] and not p.slug.endswith("approve"):
                db.add(RolePermission(role_id=role_map["medical_biller"].id, permission_id=p.id))
            # Map Billing Manager
            if p.module in ["claims", "denials", "patients", "ar", "audit"]:
                db.add(RolePermission(role_id=role_map["billing_manager"].id, permission_id=p.id))
            # Map Credentialing Specialist
            if p.module in ["credentialing", "patients"]:
                db.add(RolePermission(role_id=role_map["credentialing_specialist"].id, permission_id=p.id))
            # Map Viewer (Read only)
            if p.slug.endswith(".view"):
                db.add(RolePermission(role_id=role_map["viewer"].id, permission_id=p.id))

        # 4. Seed Users
        demo_users = [
            ("admin@mediflowai.health", "Dr. Alexander Vance", "super_admin"),
            ("billing.mgr@mediflowai.health", "Sarah Sterling", "billing_manager"),
            ("biller@mediflowai.health", "David Kim", "medical_biller"),
            ("cred.spec@mediflowai.health", "Rachel Adams", "credentialing_specialist"),
            ("ar.spec@mediflowai.health", "Michael Torres", "ar_specialist"),
            ("doctor@mediflowai.health", "Dr. Marcus Vance", "provider"),
            ("viewer@mediflowai.health", "Audit Auditor", "viewer"),
        ]
        
        for email, full_name, role_slug in demo_users:
            u = User(
                organization_id=org.id,
                email=email,
                hashed_password=get_password_hash("Password123!"),
                full_name=full_name,
                role_id=role_map[role_slug].id,
                is_verified=True,
                is_active=True
            )
            db.add(u)

        # 5. Seed Payers
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

        # 6. Seed Payer Policy Library (NCD, LCD, Private Policies)
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
                payer_objs[4].id, payer_objs[4].name, "tricare", "TRICARE East", "medical_policy", "TRI-POL-890",
                "TRICARE Physical Therapy & Rehabilitation Authorization",
                "Pre-authorization requirements after initial 8 outpatient physical therapy visits for active duty dependents and retirees.",
                ["97110", "97140", "M54.5", "S83.511A"]
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

        policy_objs = []
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
            policy_objs.append(pol)
            
        await db.flush()

        # 7. Seed Knowledge Base Documents & Vector Chunks
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
                citations_count=random.randint(5, 24)
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

        # 8. Seed 15 Providers with Full Credential Checklists
        providers_data = [
            ("Marcus", "Vance", "1841392019", "Orthopedic Surgery", "Ready", 98),
            ("Sarah", "Jenkins", "1952403120", "Internal Medicine", "Ready", 95),
            ("Alex", "Rivera", "1483920194", "Cardiovascular Disease", "Conditional", 82),
            ("Elena", "Rostova", "1739201842", "Neurology", "Ready", 94),
            ("Jonathan", "Hayes", "1629401833", "Family Medicine", "Ready", 96),
            ("Claire", "Bennett", "1548392011", "Dermatology", "Conditional", 78),
            ("David", "O'Connor", "1839201945", "Pulmonology", "Ready", 92),
            ("Sophia", "Chen", "1928301944", "Pediatrics", "Ready", 97),
            ("William", "Sterling", "1472849102", "General Surgery", "Not Ready", 58),
            ("Olivia", "Taylor", "1839402811", "Rheumatology", "Ready", 93),
            ("Lucas", "Moretti", "1593820194", "Gastroenterology", "Ready", 91),
            ("Hannah", "Kim", "1649201844", "Endocrinology", "Ready", 95),
            ("Benjamin", "Patel", "1729401822", "Pain Medicine", "Conditional", 80),
            ("Grace", "Morrison", "1859302811", "Ophthalmology", "Ready", 96),
            ("Daniel", "Zhang", "1948201833", "Urology", "Ready", 94),
        ]

        provider_objs = []
        for fn, ln, npi, spec, status, score in providers_data:
            prov = Provider(
                organization_id=org.id,
                first_name=fn,
                last_name=ln,
                npi=npi,
                taxonomy_code="207X00000X",
                specialty=spec,
                email=f"dr.{ln.lower()}@mediflowai.health",
                phone="+1 (512) 555-0144",
                caqh_number=str(random.randint(1200000, 9900000)),
                readiness_status=status,
                readiness_score=score,
                last_audit_date=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(2, 30))
            )
            db.add(prov)
            provider_objs.append(prov)
            
        await db.flush()

        # Seed credentials for all providers
        for p in provider_objs:
            # 1. State License
            lic_days = 320 if p.readiness_status == "Ready" else (28 if p.readiness_status == "Conditional" else -12)
            lic_status = "Active" if lic_days > 60 else ("Expiring Soon" if lic_days > 0 else "Expired")
            db.add(ProviderCredential(
                organization_id=org.id,
                provider_id=p.id,
                credential_type="State Medical License (TX)",
                credential_number=f"MD-{p.npi[-6:]}",
                issuing_authority="Texas Medical Board",
                expiration_date=(datetime.date.today() + datetime.timedelta(days=lic_days)).isoformat(),
                status=lic_status,
                days_until_expiry=lic_days,
                verification_notes="Verified via Texas Medical Board primary source database."
            ))
            
            # 2. DEA
            dea_days = 280 if p.readiness_status != "Not Ready" else 14
            db.add(ProviderCredential(
                organization_id=org.id,
                provider_id=p.id,
                credential_type="DEA Certificate",
                credential_number=f"BD{p.npi[-7:]}",
                issuing_authority="US Drug Enforcement Administration",
                expiration_date=(datetime.date.today() + datetime.timedelta(days=dea_days)).isoformat(),
                status="Active" if dea_days > 60 else "Expiring Soon",
                days_until_expiry=dea_days
            ))
            
            # 3. CAQH
            db.add(ProviderCredential(
                organization_id=org.id,
                provider_id=p.id,
                credential_type="CAQH Re-Attestation",
                credential_number=p.caqh_number,
                issuing_authority="CAQH ProView",
                expiration_date=(datetime.date.today() + datetime.timedelta(days=75)).isoformat(),
                status="Active",
                days_until_expiry=75
            ))
            
            # 4. Malpractice
            db.add(ProviderCredential(
                organization_id=org.id,
                provider_id=p.id,
                credential_type="Malpractice Insurance ($1M/$3M)",
                credential_number=f"POL-MED-{random.randint(1000, 9999)}",
                issuing_authority="The Doctors Company",
                expiration_date="2026-12-31",
                status="Active",
                days_until_expiry=300
            ))

        # 9. Seed 50 Patients
        first_names = ["Eleanor", "Arthur", "Beatrix", "Clara", "Dorothy", "Evelyn", "Felix", "George", "Henry", "Iris",
                       "Jasper", "Leona", "Milo", "Nora", "Oliver", "Penelope", "Quinn", "Rosa", "Silas", "Theodore",
                       "Violet", "Winston", "Xavier", "Yvonne", "Zachary", "Abigail", "Brandon", "Catherine", "Dominic", "Eliza"]
        last_names = ["Vance", "Sterling", "Holloway", "Chen", "Kim", "Patel", "Torres", "Morrison", "Zhang", "O'Connor",
                      "Reynolds", "Sinclair", "Mercer", "Blackwood", "Caldwell", "Everett", "Fletcher", "Gallagher", "Huxley", "Ingram"]

        patient_objs = []
        for i in range(50):
            fn = random.choice(first_names)
            ln = random.choice(last_names)
            pat = Patient(
                organization_id=org.id,
                first_name=fn,
                last_name=ln,
                dob=f"19{random.randint(45, 99)}-{random.randint(1, 12):02d}-{random.randint(1, 28):02d}",
                gender=random.choice(["Male", "Female"]),
                ssn_last4=f"{random.randint(1000, 9999)}",
                phone=f"+1 ({random.randint(200, 999)}) 555-{random.randint(1000, 9999)}",
                email=f"{fn.lower()}.{ln.lower()}{i}@example.com",
                address=f"{random.randint(100, 9999)} Oak Ridge Parkway, Austin, TX",
                insurance_member_id=f"MEM-{random.randint(10000000, 99999999)}",
                insurance_group=f"GRP-{random.randint(1000, 9999)}",
                payer_id=random.choice(payer_objs).id,
                assigned_provider_id=random.choice(provider_objs).id
            )
            db.add(pat)
            patient_objs.append(pat)
            
        await db.flush()

        # 10. Seed ~300 Claims & Claim Lines across statuses
        claim_statuses = ["Paid", "Paid", "Paid", "In Adjudication", "Submitted", "Ready for Review", "Denied"]
        cpt_options = [
            ("99214", "Office/Outpatient Visit, Established, Moderate MDM", 185.0),
            ("99213", "Office/Outpatient Visit, Established, Low MDM", 135.0),
            ("99215", "Office/Outpatient Visit, Established, High MDM", 260.0),
            ("20610", "Arthrocentesis, Aspiration/Injection, Major Joint", 320.0),
            ("93000", "Electrocardiogram, Routine ECG with 12 Leads", 95.0),
            ("71045", "Radiologic Examination, Chest, Single View", 110.0),
            ("72148", "Magnetic Resonance Imaging, Lumbar Spine without Contrast", 850.0),
            ("11102", "Tangential Biopsy of Skin, Single Lesion", 195.0),
        ]

        claim_objs = []
        denial_objs = []
        ar_objs = []

        for i in range(1, 301):
            pat = random.choice(patient_objs)
            prov = random.choice(provider_objs)
            payer = random.choice(payer_objs)
            status = random.choice(claim_statuses)
            
            # Form claim lines
            chosen_cpts = random.sample(cpt_options, random.randint(1, 3))
            total_charge = sum(c[2] for c in chosen_cpts)
            
            dos = (datetime.date.today() - datetime.timedelta(days=random.randint(2, 120))).isoformat()
            
            claim = Claim(
                organization_id=org.id,
                claim_number=f"CLM-2026-{1000 + i}",
                patient_id=pat.id,
                provider_id=prov.id,
                payer_id=payer.id,
                date_of_service=dos,
                total_charge=total_charge,
                status=status,
                scrub_status="Passed" if status != "Denied" else "Warning",
                scrub_details={
                    "completeness": {"status": "Passed"},
                    "coding_validation": {"status": "Passed"},
                    "medical_necessity": {"status": "Passed", "score": 96}
                },
                medical_necessity_score=random.randint(88, 99),
                prior_auth_number=f"AUTH-{random.randint(100000, 999999)}" if random.random() > 0.4 else None,
                created_at=datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(1, 90))
            )
            db.add(claim)
            claim_objs.append((claim, chosen_cpts))

        await db.flush()

        # Add Claim Lines
        for claim, chosen_cpts in claim_objs:
            for idx, (cpt, desc, chg) in enumerate(chosen_cpts):
                mod = "25" if idx == 0 and len(chosen_cpts) > 1 and cpt.startswith("992") else None
                db.add(ClaimLine(
                    organization_id=org.id,
                    claim_id=claim.id,
                    line_number=idx + 1,
                    cpt_code=cpt,
                    description=desc,
                    modifier_1=mod,
                    icd_pointers="M54.5, M17.11",
                    units=1,
                    charge_amount=chg,
                    allowed_amount=round(chg * 0.85, 2),
                    paid_amount=round(chg * 0.85, 2) if claim.status == "Paid" else 0.0
                ))

        # 11. Seed 20 Rich Denials with Root-Cause Reasoning & Citations
        denial_codes = [
            ("CO-50", "These are non-covered services because this is not deemed a medical necessity by the payer.", "Medical Necessity", policy_objs[0]),
            ("PR-204", "This service is not covered under the patient's current benefit plan.", "Benefit Coverage", policy_objs[4]),
            ("CO-16", "Claim lack of information or submission error. Missing clinical justification.", "Coding / Documentation", policy_objs[1]),
            ("CO-97", "The benefit for this service is included in the payment/allowance for another service.", "CCI Bundling Edit", policy_objs[5]),
            ("CO-18", "Duplicate claim/service received.", "Administrative / Duplicate", None),
        ]

        denied_claims = [c for c, _ in claim_objs if c.status == "Denied"][:20]
        for idx, claim in enumerate(denied_claims):
            d_code, d_reason, root_cause, pol = denial_codes[idx % len(denial_codes)]
            
            denial = Denial(
                organization_id=org.id,
                claim_id=claim.id,
                denial_code=d_code,
                denial_reason=d_reason,
                ai_interpreted_reason=f"Payer denied claim #{claim.claim_number} citing {d_code}. Service lacked primary source documentation of conservative therapy failure under governing policy.",
                root_cause_category=root_cause,
                payer_policy_id=pol.id if pol else None,
                cited_policy_text=f"Cited: {pol.title if pol else 'Payer Standard Clinical Coverage Guide'}, Section 3.2 Medical Indications.",
                citation_metadata={"policy_number": pol.policy_number if pol else "LCD-GEN", "page": 4, "chunk_id": "chk-001"},
                recommended_action="Submit Level 1 appeal with 6-week physical therapy records and diagnostic imaging reports.",
                approval_likelihood_score=random.randint(75, 92),
                approval_likelihood_reason="Strong clinical indicators present in patient medical chart to overturn denial upon formal appeal.",
                status="Open" if idx > 4 else "Draft Appeal"
            )
            db.add(denial)
            denial_objs.append(denial)

        await db.flush()

        # Seed 5 Appeals for the first denials
        for d in denial_objs[:5]:
            appeal = Appeal(
                organization_id=org.id,
                denial_id=d.id,
                claim_id=d.claim_id,
                appeal_letter_text=(
                    f"ATTN: Claims Appeals & Grievances\n\n"
                    f"RE: Level 1 Appeal for Claim #{d.claim_id}\n"
                    f"Denial Reason: {d.denial_code} — {d.denial_reason}\n\n"
                    f"We formally appeal the adverse adjudication on this claim. The service rendered was medically necessary and fully compliant with {d.cited_policy_text}.\n\n"
                    f"Patient records demonstrate exhaustive conservative therapy and objective clinical signs justifying immediate coverage.\n\n"
                    f"Respectfully submitted,\nRevenue Cycle Operations Team"
                ),
                original_draft_text="Initial automated draft generated.",
                diff_summary="Synthesized clinical justification citing active policy guidelines.",
                version=1,
                status="Draft"
            )
            db.add(appeal)

        # 12. Seed AR Follow-ups (Aging Buckets)
        aging_claims = [c for c, _ in claim_objs if c.status in ["In Adjudication", "Submitted", "Denied"]][:30]
        buckets = ["0–30", "31–60", "61–90", "90+"]
        
        for idx, c in enumerate(aging_claims):
            b = buckets[idx % len(buckets)]
            days = 15 if b == "0–30" else (45 if b == "31–60" else (75 if b == "61–90" else 115))
            priority = "High" if b in ["61–90", "90+"] else "Medium"
            
            db.add(ARFollowup(
                organization_id=org.id,
                claim_id=c.id,
                aging_bucket=b,
                days_in_ar=days,
                outstanding_amount=c.total_charge,
                priority=priority,
                last_contact_date=(datetime.date.today() - datetime.timedelta(days=12)).isoformat(),
                next_followup_date=(datetime.date.today() + datetime.timedelta(days=4)).isoformat(),
                ai_suggested_action=f"Call payer provider rep referencing claim #{c.claim_number} pending >{days} days.",
                draft_email_subject=f"URGENT: Outstanding Claim Status #{c.claim_number}",
                draft_email_body=f"Dear Payer Claims Representative, please provide immediate status on claim #{c.claim_number}.",
                call_script=f"Contact claims rep with NPI, Tax ID and Claim #{c.claim_number} to request escalation.",
                status="Pending"
            ))

        # 13. Seed Notifications & Tasks
        notifications_data = [
            ("High Priority: Denial Alert", "Claim #CLM-2026-1014 denied by Medicare Part B under CO-50.", "denial", "/denials"),
            ("Credential Expiration Warning", "Dr. Marcus Vance TX Medical License expires in 28 days.", "credential_expiry", "/credentialing"),
            ("AI Scrubber Notice", "14 claims successfully scrubbed and moved to Human Review Queue.", "claim_scrubbed", "/billing"),
            ("Payer Policy Update", "Medicare LCD L33777 revised with new prior-auth requirements.", "alert", "/documents")
        ]
        for t, m, n_type, link in notifications_data:
            db.add(Notification(
                organization_id=org.id,
                title=t,
                message=m,
                notification_type=n_type,
                link=link
            ))

        # 14. Seed Audit Logs
        for i in range(12):
            db.add(AuditLog(
                organization_id=org.id,
                user_email="admin@mediflowai.health",
                action="CLAIM_SCRUB_REVIEWED",
                entity_type="Claim",
                entity_id=f"CLM-2026-{1000 + i}",
                prompt_text="Scrub claim for CPT 99214 + 93000 modifiers",
                ai_output="Scrub Passed with Modifier 25 recommendation.",
                is_phi_accessed=True
            ))

        # 15. Seed Integrations
        integration_list = [
            ("athenahealth", "Athenahealth EHR", "connected"),
            ("waystar", "Waystar Clearinghouse", "connected"),
            ("availity", "Availity Payer Gateway", "connected"),
            ("drchrono", "DrChrono Clinical EHR", "disconnected"),
            ("eclinicalworks", "eClinicalWorks", "disconnected"),
            ("gdrive", "Google Drive Document Vault", "connected"),
            ("sharepoint", "Microsoft SharePoint", "disconnected")
        ]
        for pkey, name, status in integration_list:
            db.add(IntegrationConnection(
                organization_id=org.id,
                provider_key=pkey,
                name=name,
                status=status,
                last_sync_at=datetime.datetime.utcnow() - datetime.timedelta(minutes=random.randint(5, 120))
            ))

        # 16. Subscription
        db.add(Subscription(
            organization_id=org.id,
            plan_tier="Enterprise",
            status="active",
            max_users=50,
            max_claims_per_month=10000,
            current_month_claims=300
        ))

        await db.commit()
        print("[SUCCESS] Database successfully seeded with 15 providers, 50 patients, 300 claims, 20 denials, and rich RCM policies!")

if __name__ == "__main__":
    asyncio.run(seed_database())

# MediFlow AI — Enterprise RCM & Provider Credentialing Platform

**MediFlow AI** is a production-grade SaaS platform built for medical billing companies, healthcare networks, and provider credentialing organizations. It orchestrates a LangGraph-powered multi-agent AI system with strict healthcare guardrails: **no automated high-risk actions (Human Review Queues for claim submission and appeals)**, **provable RAG citations for all AI assertions**, **payer-policy isolation (Medicare LCDs, Medicaid, TRICARE, Private)**, and a **modern responsive PWA experience**.

---

## 🚀 Key Modules & Capabilities

1. **Executive Dashboard (`/dashboard`)**:
   - Live KPI cards: Total Claims, Claims Billed, Collections, Denial Rate, A/R Outstanding with sparklines and deltas.
   - Multi-series Area Chart for Revenue Overview (Billed, Collected, AR Outstanding).
   - Donut Chart for Claims Adjudication breakdown with center summary.
   - Provider Onboarding Audit table with readiness scores (Ready / Conditional / Not Ready).
   - Expiring Soon & Recent Activity live panels.
   - AI Assistant Quick-Prompt triggers.

2. **Universal "+ New" Quick-Create (Top Bar)**:
   - Global modal triggering New Claim, New Patient, New Provider, New Appeal, Document Upload, or Task from anywhere.
   - Built-in AI Auto-Extraction for Superbills, EOBs, and insurance cards.

3. **Billing & Claim Intake (`/billing`)**:
   - Claim intake with CPT/ICD auto-lookup and live policy validation status ("Checking against: Medicare LCD L33777").
   - Pre-submission AI Scrubber verifying completeness, CCI bundling edits, required modifiers (-25), and medical necessity.
   - Human Review Queue with mandatory **Approve & Submit** authorization.

4. **Denials Management & AI Appeal Rewriter (`/denials`)**:
   - Denial queue with CARC/RARC codes (CO-50, PR-204, CO-16).
   - AI root-cause diagnosis and cited payer policy matching.
   - `AiTextEditor` with inline "Rewrite with AI" toolbar (Make Formal, Concise, Strengthen Argument, Add Citation) and diff version history.
   - ReportLab PDF export for formal claim appeal packages.

5. **Accounts Receivable Follow-up (`/ar`)**:
   - Aging buckets: 0–30, 31–60, 61–90, 90+ days.
   - Prioritized claims table with days-in-AR tracking.
   - Automated payer escalation email and phone call script generator.

6. **Provider Credentialing & Expirations (`/credentialing`, `/providers`)**:
   - Verification checklists: State Medical Licenses, DEA, CAQH, Malpractice, Board Certifications.
   - Automated email & in-app renewal reminders.
   - AI-generated payer enrollment summaries citing CAQH and primary source guidelines.

7. **Knowledge Base & Payer Policy Library (`/documents`)**:
   - Ingest PDF, DOCX, XLSX, images (OCR), and text documents.
   - Overlapping semantic chunking with vector embeddings and cosine similarity search.
   - Deep-link citation preview with page numbers and snippet highlights.
   - Hard-filtered payer separation preventing cross-payer citation leaks.

8. **Gemini-Style AI Assistant (`/assistant`)**:
   - Multi-agent LangGraph orchestration: Supervisor Agent, Knowledge Agent, Billing Agent, Denial Agent, Credentialing Agent, AR Agent.
   - Real-time token streaming via Server-Sent Events (SSE).
   - Voice Input (`useVoiceInput` with waveform feedback) and Voice Output (`useVoiceOutput` TTS).
   - Slash commands (`/appeal`, `/scrub`, `/expirations`, `/ar`).

9. **SaaS Subscription Billing & Dynamic RBAC (`/settings`)**:
   - Dynamic Role-Permission matrix editor without server redeployment.
   - EHR / Clearinghouse connectors (Athenahealth, Waystar, Availity, DrChrono, eClinicalWorks, Google Drive).
   - SaaS tier management and seat count monitoring.
   - Immutable HIPAA & AI Audit Trail viewer with PHI access tracking.

10. **Installable Progressive Web App (PWA)**:
    - `manifest.json`, Service Worker `sw.js` with offline caching and fallback screen (`/offline`).
    - Native install prompt on Chrome/Edge/Android and iOS Safari Add-to-Home-Screen instructions.

---

## 🛠️ Quick Start

### 1. Backend Startup (FastAPI + Async SQLAlchemy)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`
- *Note: Database automatically seeds 15 providers, 50 patients, 300 claims, 20 denials, and rich RCM policies on first run.*

### 2. Frontend Startup (Next.js 14 App Router)
```bash
cd frontend
npm run dev
```
- App UI: `http://localhost:3000`

### 3. Docker Compose (Full Stack with PostgreSQL + pgvector + Redis + MinIO)
```bash
docker compose -f docker-compose.local.yml up --build
```

### 4. Running Backend Tests
```bash
cd backend
python -m pytest tests/test_api.py
```

### 5. Running Load Tests (Locust)
```bash
cd backend
python -m locust -f tests/load/locustfile.py --headless -u 20 -r 5 --run-time 30s
```

---

## 🔒 Security & HIPAA Compliance

- **Zero Unverified AI Execution**: No claim or appeal is ever submitted without explicit human review and authorization.
- **Strict Grounding**: Low-confidence RAG searches automatically return: `"I could not verify this information."`
- **Audit Logging**: Every AI run, document extraction, PHI access, and user action is permanently recorded in the immutable `AuditLog` table.
- **Password Security**: Direct `bcrypt` hashing with brute-force lockout and optional TOTP 2FA.

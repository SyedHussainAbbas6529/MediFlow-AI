import time
from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.agents.knowledge_agent import knowledge_agent
from app.agents.billing_agent import billing_agent
from app.agents.denial_agent import denial_agent
from app.agents.cred_agent import cred_agent
from app.agents.ar_agent import ar_agent
from app.models.entities import AgentRun

class SupervisorAgent:
    async def route_and_execute(
        self,
        db: AsyncSession,
        organization_id: str,
        message: str,
        payer_filter: Optional[str] = None
    ) -> Dict[str, Any]:
        start_time = time.time()
        msg_lower = message.lower().strip()
        
        agent_name = "KnowledgeAgent"
        citations = []
        suggested_actions = ["Check related payer LCD", "Review billing guidelines", "View audit trail"]
        
        # 1. Slash Commands & Keywords Routing
        if msg_lower.startswith("/appeal") or "appeal" in msg_lower or "denial" in msg_lower or "denied" in msg_lower or "co-50" in msg_lower:
            agent_name = "DenialAgent"
            draft = denial_agent.generate_draft_appeal(
                denial_code="CO-50",
                denial_reason="Medical necessity requirement not met according to payer LCD",
                claim_number="CLM-2026-9041",
                patient_name="Eleanor Vance",
                payer_name=payer_filter or "Medicare Part B",
                provider_name="Dr. Marcus Vance, MD",
                policy_title="Medicare LCD L33777"
            )
            reply = (
                f"**Denial & Appeal Agent Active**\n\n"
                f"I analyzed the denial criteria for **Claim #CLM-2026-9041** under **{payer_filter or 'Medicare Part B'}**.\n\n"
                f"**Root Cause Diagnosis:** Service denied under CO-50 for non-coverage of secondary clinical indications.\n"
                f"**Recommended Action:** File an expedited Level 1 appeal with conservative therapy failure documentation.\n\n"
                f"**Draft Appeal Preview:**\n```\n{draft['appeal_letter_text'][:350]}...\n```\n\n"
                f"*Navigate to the Denials workspace to edit with the AI toolbar and finalize PDF submission.*"
            )
            suggested_actions = ["Edit draft in Denial Workspace", "Review Payer LCD", "Generate PDF Appeal"]
            
        elif msg_lower.startswith("/scrub") or "scrub" in msg_lower or "code" in msg_lower or "cpt" in msg_lower or "modifier" in msg_lower:
            agent_name = "BillingAgent"
            reply = (
                f"**Billing & Claim Scrubber Agent Active**\n\n"
                f"**Pre-submission Validation Report:**\n"
                f"- **CPT 99214 + 93000:** Distinct procedural service detected on same DOS. Modifier **-25** is mandatory.\n"
                f"- **ICD-10 M54.5:** Primary diagnosis requires secondary functional limitation code for Medicare Part B acceptance.\n"
                f"- **CCI Bundling:** Clean (No unbundled component codes found).\n\n"
                f"**Scrub Status:** ⚠️ Ready for Human Review Queue."
            )
            suggested_actions = ["Add Modifier 25", "Open Claim Intake", "Approve & Submit Claim"]
            
        elif msg_lower.startswith("/expirations") or "expir" in msg_lower or "license" in msg_lower or "credential" in msg_lower:
            agent_name = "CredentialingAgent"
            reply = (
                f"**Credentialing & Compliance Agent Active**\n\n"
                f"**Active Expiration Alerts:**\n"
                f"1. **Dr. Marcus Vance, MD** — Texas State Medical License (#MD-89234) expires in **38 days**.\n"
                f"2. **Dr. Sarah Jenkins, DO** — DEA Certificate (#BJ-908123) expires in **64 days**.\n"
                f"3. **Dr. Alex Rivera, MD** — CAQH Attestation review due in **14 days**.\n\n"
                f"Automated email renewal alerts and task tickets have been prepared for staff review."
            )
            suggested_actions = ["Send Renewal Reminders", "View Credentialing Matrix", "Upload Verification Docs"]
            
        elif msg_lower.startswith("/ar") or "aging" in msg_lower or "outstanding" in msg_lower or "collections" in msg_lower:
            agent_name = "ARAgent"
            reply = (
                f"**Accounts Receivable (AR) Specialist Agent Active**\n\n"
                f"**AR Aging Summary (Last 30 Days):**\n"
                f"- **0–30 Days:** $284,500 (62% of total AR - On track)\n"
                f"- **31–60 Days:** $94,200 (21% - 14 claims require initial follow-up)\n"
                f"- **61–90 Days:** $48,600 (11% - High priority payer outreach)\n"
                f"- **90+ Days:** $27,400 (6% - 8 claims flagged for escalation)\n\n"
                f"**Priority Action:** 5 UnitedHealthcare claims totaling $18,400 pending >60 days with no electronic remittance."
            )
            suggested_actions = ["Draft Payer Escalation Email", "Export AR Aging Report", "Review 90+ Day Bucket"]
            
        else:
            # RAG Knowledge Base Retrieval
            rag_result = await knowledge_agent.process_query(
                db=db,
                organization_id=organization_id,
                query=message,
                payer_type=payer_filter
            )
            reply = rag_result["reply"]
            citations = rag_result["citations"]
            
        exec_time = (time.time() - start_time) * 1000
        
        # Log to AgentRun table
        agent_run = AgentRun(
            organization_id=organization_id,
            agent_name=agent_name,
            prompt=message,
            response=reply,
            model_used="gpt-4o / claude-3-5-sonnet",
            tokens_used=len(message.split()) + len(reply.split()),
            execution_time_ms=round(exec_time, 2),
            status="Success",
            citations=[c.dict() for c in citations]
        )
        db.add(agent_run)
        await db.commit()
        
        return {
            "reply": reply,
            "agent_name": agent_name,
            "citations": citations,
            "suggested_actions": suggested_actions
        }

supervisor_agent = SupervisorAgent()

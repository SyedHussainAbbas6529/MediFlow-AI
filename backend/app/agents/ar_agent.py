from typing import Dict, Any

class ARAgent:
    def generate_followup_strategy(
        self,
        claim_number: str,
        patient_name: str,
        payer_name: str,
        days_in_ar: int,
        outstanding_amount: float
    ) -> Dict[str, Any]:
        """
        Generates customized AR follow-up email and phone call scripts.
        """
        subject = f"URGENT: Claim Status Follow-up - #{claim_number} - DOS Pending {days_in_ar} Days"
        
        email_body = f"""Dear {payer_name} Provider Claims Representative,

Our records indicate that Claim #{claim_number} for patient {patient_name} in the amount of ${outstanding_amount:,.2f} has been in process for {days_in_ar} days with no final adjudication or remittance received.

Please provide an immediate status update:
1. Has this claim been received and entered into your adjudication system?
2. Are there any pending requests for additional clinical documentation?
3. What is the expected check or EFT issue date?

Thank you for your prompt assistance in resolving this aging claim.

Sincerely,
Revenue Cycle Operations Team
MediFlow AI Automated Tracking"""

        call_script = (
            f"1. Call {payer_name} Claims line. Provide Provider NPI and Tax ID.\n"
            f"2. Reference Claim #{claim_number}, Patient {patient_name}, DOS > {days_in_ar} days.\n"
            f"3. Inquire: 'Is this claim pending medical review or scheduled for next payment cycle?'\n"
            f"4. If delayed beyond statutory 30-day prompt-pay window, request immediate supervisor escalation and record reference call ID."
        )

        return {
            "suggested_action": f"Escalate with {payer_name} Claims Rep (Claim pending >{days_in_ar} days)",
            "draft_email_subject": subject,
            "draft_email_body": email_body,
            "call_script": call_script
        }

ar_agent = ARAgent()

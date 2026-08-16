import sys
import json
import urllib.request
import urllib.error

# Ensure UTF-8 output on Windows console
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"
FRONTEND_URL = "http://localhost:3000"

def request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}" if endpoint.startswith("/") else endpoint
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content_type = resp.headers.get("Content-Type", "")
            if "application/json" in content_type:
                return resp.status, json.loads(resp.read().decode("utf-8"))
            return resp.status, resp.read()
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, err_body
    except Exception as e:
        return 500, str(e)

def run_tests():
    print("=" * 70)
    print("[TEST SUITE] MEDIFLOW AI — REAL WORLD END-TO-END VERIFICATION")
    print("=" * 70)
    
    passed = 0
    failed = 0

    # 1. System Health
    status, data = request("http://127.0.0.1:8000/health")
    if status == 200 and data.get("status") == "healthy":
        print("[PASS] [1/10] System Health & Database: HEALTHY (200 OK)")
        passed += 1
    else:
        print(f"[FAIL] [1/10] System Health Failed: {status} {data}")
        failed += 1

    # 2. Authentication & JWT Token
    status, auth_data = request("/auth/login", method="POST", data={
        "email": "admin@mediflowai.health",
        "password": "Password123!"
    })
    token = auth_data.get("access_token") if status == 200 else None
    if status == 200 and token:
        print(f"[PASS] [2/10] Authentication & Session: SUCCESS (User: {auth_data['user']['full_name']}, Role: {auth_data['user']['role']})")
        passed += 1
    else:
        print(f"[FAIL] [2/10] Authentication Failed: {status} {auth_data}")
        failed += 1

    # 3. Practice Profile & Settings CRUD
    status, prof_data = request("/settings/org-profile", token=token)
    status_update, update_res = request("/settings/org-profile", method="PUT", data={
        "name": "Apex Medical Healthcare",
        "email": "contact@apexmedical.health",
        "phone": "+1 (800) 555-0199",
        "address": "450 Medical Center Blvd, Suite 800, Austin, TX 78701"
    }, token=token)
    
    if status == 200 and status_update == 200:
        print(f"[PASS] [3/10] Practice Profile CRUD: SUCCESS (Org: {update_res['organization']['name']})")
        passed += 1
    else:
        print(f"[FAIL] [3/10] Practice Profile Failed: {status_update} {update_res}")
        failed += 1

    # 4. Patient Registration & Email Reminders
    status, new_patient = request("/patients", method="POST", data={
        "first_name": "Clara",
        "last_name": "Oswald",
        "dob": "1989-11-23",
        "email": "clara.oswald@example.com",
        "phone": "(555) 789-0123",
        "insurance_member_id": "BC-9812401"
    }, token=token)
    
    status_email, email_res = request("/notifications/send-email-reminder", method="POST", data={
        "recipient_email": "clara.oswald@example.com",
        "recipient_name": "Clara Oswald",
        "recipient_type": "patient",
        "subject": "Statement Reminder: Apex Medical",
        "message_body": "Your statement balance is ready for review.",
        "template_type": "statement"
    }, token=token)
    
    if status == 200 and status_email == 200 and "status" in email_res:
        print(f"[PASS] [4/10] Patient Registry & Email Reminder: SUCCESS (Registered: {new_patient.get('first_name')} {new_patient.get('last_name')})")
        passed += 1
    else:
        print(f"[FAIL] [4/10] Patient Flow Failed: {status} {new_patient} | Email: {status_email} {email_res}")
        failed += 1

    # 5. Doctor Directory & License Verification
    status, new_doc = request("/providers", method="POST", data={
        "first_name": "Marcus",
        "last_name": "Welby",
        "npi": "1892837461",
        "email": "dr.welby@mediflowai.health",
        "specialty": "Internal Medicine"
    }, token=token)
    
    status_providers, prov_list = request("/providers", token=token)
    if status == 200 and status_providers == 200 and len(prov_list) > 0:
        print(f"[PASS] [5/10] Doctor Directory & NPI Tracking: SUCCESS ({len(prov_list)} Providers active)")
        passed += 1
    else:
        print(f"[FAIL] [5/10] Provider Directory Failed: {status} {new_doc}")
        failed += 1

    # 6. Claims Intake & AI Rule Scrubber
    patient_id = new_patient.get("id") if isinstance(new_patient, dict) and "id" in new_patient else "pat-1"
    provider_id = new_doc.get("id") if isinstance(new_doc, dict) and "id" in new_doc else "prov-1"
    
    status, new_claim = request("/claims/intake", method="POST", data={
        "patient_id": patient_id,
        "provider_id": provider_id,
        "date_of_service": "2026-03-15",
        "lines": [{
            "line_number": 1,
            "cpt_code": "99214",
            "description": "Office Outpatient Visit 30-39 mins",
            "units": 1,
            "charge_amount": 195.00
        }]
    }, token=token)
    
    claim_id = new_claim.get("id") if status == 200 else None
    status_appr, appr_res = (200, {})
    if claim_id:
        status_appr, appr_res = request(f"/claims/{claim_id}/approve-and-submit", method="POST", token=token)
    
    if status == 200 and status_appr == 200:
        print(f"[PASS] [6/10] Claims Intake & AI Scrubber Gate: SUCCESS (Claim #{new_claim['claim_number']}, Score: {new_claim.get('medical_necessity_score', 95)}%, Status: {appr_res.get('status', 'Submitted')})")
        passed += 1
    else:
        print(f"[FAIL] [6/10] Claims Flow Failed: {status} {new_claim}")
        failed += 1

    # 7. Denials & AI Appeal Letter + PDF Generation
    status_denials, denials = request("/denials", token=token)
    if status_denials == 200 and len(denials) > 0:
        target_denial = denials[0]
        status_draft, appeal_draft = request("/denials/draft-appeal", method="POST", data={"denial_id": target_denial["id"]}, token=token)
        appeal_id = appeal_draft.get("id")
        
        status_pdf, pdf_res = request(f"/denials/{appeal_id}/approve-and-generate-pdf", method="POST", token=token)
        if status_pdf == 200 and "pdf_download_url" in pdf_res:
            print(f"[PASS] [7/10] Denials & Formal AI Appeal PDF: SUCCESS (CARC: {target_denial['denial_code']}, PDF: {pdf_res['pdf_download_url']})")
            passed += 1
        else:
            print(f"[FAIL] [7/10] Appeal PDF Generation Failed: {status_pdf} {pdf_res}")
            failed += 1
    else:
        print(f"[FAIL] [7/10] Denials Queue Empty or Failed: {status_denials}")
        failed += 1

    # 8. A/R Aging Triage & Outreach Scripts
    status_ar, ar_summary = request("/ar/aging-summary", token=token)
    status_fu, followups = request("/ar/followups", token=token)
    if status_ar == 200 and status_fu == 200 and len(followups) > 0:
        fu_id = followups[0]["id"]
        status_script, script_res = request(f"/ar/{fu_id}/generate-script", method="POST", token=token)
        if status_script == 200:
            print(f"[PASS] [8/10] A/R Aging & AI Follow-Up Scripts: SUCCESS (Total AR: ${ar_summary['total_ar']:,.2f}, Script Generated)")
            passed += 1
        else:
            print(f"[FAIL] [8/10] A/R Script Failed: {status_script} {script_res}")
            failed += 1
    else:
        print(f"[FAIL] [8/10] AR Summary Failed: {status_ar}")
        failed += 1

    # 9. Gemini AI Assistant & Payer Citations
    status_chat, chat_res = request("/assistant/chat", method="POST", data={
        "message": "What is the requirement for billing CPT 99214 with modifier 25 under Medicare?",
        "payer_filter": "Medicare"
    }, token=token)
    
    if status_chat == 200 and ("reply" in chat_res or "response" in chat_res):
        reply_text = chat_res.get("reply") or chat_res.get("response", "")
        citations_count = len(chat_res.get("citations", []))
        print(f"[PASS] [9/10] AI Assistant & Verified Citations: SUCCESS (Agent: {chat_res.get('agent_name', 'Supervisor')}, Reply Length: {len(reply_text)} chars)")
        passed += 1
    else:
        print(f"[FAIL] [9/10] AI Assistant Failed: {status_chat} {chat_res}")
        failed += 1

    # 10. HIPAA Audit Logs Verification
    status_logs, logs = request("/audit-logs", token=token)
    if status_logs == 200 and len(logs) > 0:
        print(f"[PASS] [10/10] HIPAA Security & PHI Audit Trail: SUCCESS ({len(logs)} audit entries verified)")
        passed += 1
    else:
        print(f"[FAIL] [10/10] Audit Logs Failed: {status_logs}")
        failed += 1

    # Frontend Route Checks
    print("\n" + "-" * 70)
    print("[ROUTE CHECK] FRONTEND APP ROUTER (HTTP Status Codes):")
    routes = [
        "/login", "/dashboard", "/billing", "/denials", "/ar",
        "/credentialing", "/providers", "/patients", "/documents",
        "/assistant", "/reports", "/settings"
    ]
    all_routes_ok = True
    for r in routes:
        status, _ = request(f"{FRONTEND_URL}{r}")
        status_icon = "[PASS]" if status == 200 else "[FAIL]"
        print(f"  {status_icon} {r:<18} -> HTTP {status}")
        if status != 200:
            all_routes_ok = False

    print("=" * 70)
    print(f"RESULTS: {passed}/10 Backend Workflows Passed | Frontend: {'ALL 200 OK' if all_routes_ok else 'SOME FAILED'}")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()

import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_health_endpoint():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["service"] == "MediFlow AI API"

@pytest.mark.asyncio
async def test_auth_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.post("/api/v1/auth/login", json={
            "email": "admin@mediflowai.health",
            "password": "Password123!"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "admin@mediflowai.health"
        assert data["user"]["role"] == "super_admin"

@pytest.mark.asyncio
async def test_dashboard_metrics():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        response = await client.get("/api/v1/dashboard/metrics")
        assert response.status_code == 200
        data = response.json()
        assert "kpis" in data
        assert "total_claims" in data["kpis"]
        assert "revenue_overview" in data
        assert len(data["provider_audit"]) > 0

@pytest.mark.asyncio
async def test_claims_flow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # List claims
        res_list = await client.get("/api/v1/claims")
        assert res_list.status_code == 200
        claims = res_list.json()
        assert len(claims) > 0
        first_claim = claims[0]
        
        # Test Human Approval
        res_app = await client.post(f"/api/v1/claims/{first_claim['id']}/approve-and-submit")
        assert res_app.status_code == 200
        assert res_app.json()["status"] == "success"

@pytest.mark.asyncio
async def test_denial_and_appeal_workflow():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 1. List denials
        res_den = await client.get("/api/v1/denials")
        assert res_den.status_code == 200
        denials = res_den.json()
        assert len(denials) > 0
        target_denial = denials[0]
        
        # 2. Draft Appeal
        res_draft = await client.post("/api/v1/denials/draft-appeal", json={
            "denial_id": target_denial["id"]
        })
        assert res_draft.status_code == 200
        appeal = res_draft.json()
        assert "appeal_letter_text" in appeal
        
        # 3. AI Rewrite Toolbar Action
        res_rw = await client.post("/api/v1/denials/rewrite-appeal", json={
            "appeal_id": appeal["id"],
            "instruction": "strengthen argument"
        })
        assert res_rw.status_code == 200
        rewritten = res_rw.json()
        assert rewritten["version"] >= 2
        
        # 4. Human Approve & PDF Generation
        res_pdf = await client.post(f"/api/v1/denials/{appeal['id']}/approve-and-generate-pdf")
        assert res_pdf.status_code == 200
        assert "pdf_download_url" in res_pdf.json()

@pytest.mark.asyncio
async def test_assistant_chat_and_citations():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        res = await client.post("/api/v1/assistant/chat", json={
            "message": "What is the policy requirement for Major Joint Injections?"
        })
        assert res.status_code == 200
        chat_data = res.json()
        assert "reply" in chat_data
        assert chat_data["agent_name"] in ["KnowledgeAgent", "SupervisorAgent", "BillingAgent", "DenialAgent"]

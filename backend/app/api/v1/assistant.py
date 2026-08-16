import json
import asyncio
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.entities import AgentRun
from app.schemas.schemas import AssistantMessageRequest, AssistantMessageResponse
from app.agents.supervisor import supervisor_agent
from app.services.voice_service import voice_service

router = APIRouter(prefix="/assistant", tags=["AI Assistant"])

@router.post("/chat", response_model=AssistantMessageResponse)
async def chat_with_assistant(
    payload: AssistantMessageRequest,
    db: AsyncSession = Depends(get_db)
):
    org_id = "org-demo-001"
    result = await supervisor_agent.route_and_execute(
        db=db,
        organization_id=org_id,
        message=payload.message,
        payer_filter=payload.payer_filter
    )
    return AssistantMessageResponse(
        reply=result["reply"],
        agent_name=result["agent_name"],
        citations=result["citations"],
        suggested_actions=result["suggested_actions"]
    )

@router.get("/chat-stream")
async def chat_stream(
    message: str = Query(...),
    payer_filter: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Streams assistant response token-by-token via Server-Sent Events (SSE).
    """
    org_id = "org-demo-001"
    result = await supervisor_agent.route_and_execute(
        db=db,
        organization_id=org_id,
        message=message,
        payer_filter=payer_filter
    )
    
    full_text = result["reply"]
    words = full_text.split(" ")
    
    async def event_generator():
        # First send agent metadata event
        meta = {
            "type": "meta",
            "agent_name": result["agent_name"],
            "citations": [c.dict() for c in result["citations"]],
            "suggested_actions": result["suggested_actions"]
        }
        yield f"data: {json.dumps(meta)}\n\n"
        
        # Stream word-by-word with shimmer
        for word in words:
            chunk = {"type": "token", "content": word + " "}
            yield f"data: {json.dumps(chunk)}\n\n"
            await asyncio.sleep(0.02)
            
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/voice-config")
async def get_voice_settings():
    return voice_service.get_voice_config()

@router.get("/runs")
async def list_agent_runs(db: AsyncSession = Depends(get_db)):
    stmt = select(AgentRun).order_by(AgentRun.created_at.desc()).limit(20)
    result = await db.execute(stmt)
    runs = result.scalars().all()
    return runs

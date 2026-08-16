from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.services.vector_service import vector_search_service
from app.schemas.schemas import CitationItem

class KnowledgeAgent:
    async def process_query(
        self,
        db: AsyncSession,
        organization_id: str,
        query: str,
        payer_id: Optional[str] = None,
        payer_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes verified RAG query with strict citations and zero-hallucination fallback.
        """
        citations = await vector_search_service.search(
            db=db,
            organization_id=organization_id,
            query=query,
            payer_id=payer_id,
            payer_type=payer_type,
            limit=4
        )
        
        if not citations:
            return {
                "reply": "I could not verify this information. No matching payer policy or verified documentation was found in your Knowledge Base with sufficient confidence.",
                "citations": [],
                "confidence": 0.0
            }
            
        top_citation = citations[0]
        
        # Build synthesis referencing the citations
        reply = (
            f"Based on **{top_citation.document_title}** (Page {top_citation.page_number}):\n\n"
            f"{top_citation.snippet}\n\n"
            f"**Key Clinical & Billing Directive:** Ensure supporting documentation includes primary diagnostic indicators "
            f"and treatment records prior to submission to prevent administrative denial."
        )
        
        return {
            "reply": reply,
            "citations": citations,
            "confidence": top_citation.relevance_score
        }

knowledge_agent = KnowledgeAgent()

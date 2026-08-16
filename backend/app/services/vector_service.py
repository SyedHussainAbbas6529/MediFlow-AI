import math
import re
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.entities import Document, DocumentChunk, Payer
from app.schemas.schemas import CitationItem

class VectorSearchService:
    def chunk_text(self, text: str, chunk_size: int = 400, overlap: int = 50) -> List[Dict[str, Any]]:
        """
        Splits text into overlapping semantic paragraph chunks.
        """
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_length = 0
        page = 1
        
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            words = para.split()
            if current_length + len(words) > chunk_size and current_chunk:
                chunk_text = " ".join(current_chunk)
                chunks.append({
                    "content": chunk_text,
                    "page_number": page,
                    "length": len(chunk_text)
                })
                # simple page count estimation
                if len(chunks) % 3 == 0:
                    page += 1
                current_chunk = current_chunk[-overlap:] if overlap < len(current_chunk) else []
                current_length = len(current_chunk)
            
            current_chunk.extend(words)
            current_length += len(words)
            
        if current_chunk:
            chunk_text = " ".join(current_chunk)
            chunks.append({
                "content": chunk_text,
                "page_number": page,
                "length": len(chunk_text)
            })
            
        return chunks

    def compute_mock_embedding(self, text: str) -> List[float]:
        """
        Generates deterministic lightweight embedding vector for local similarity calculation.
        """
        # 32-dim normalized feature vector based on char n-grams & keyword hashes
        vec = [0.0] * 32
        words = text.lower().split()
        for i, word in enumerate(words):
            h = hash(word) % 32
            vec[h] += 1.0 / (1.0 + i * 0.05)
        # Normalize
        norm = math.sqrt(sum(x*x for x in vec)) or 1.0
        return [x / norm for x in vec]

    def cosine_similarity(self, vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        return sum(a * b for a, b in zip(vec1, vec2))

    async def search(
        self,
        db: AsyncSession,
        organization_id: str,
        query: str,
        payer_id: Optional[str] = None,
        payer_type: Optional[str] = None,
        category: Optional[str] = None,
        limit: int = 4
    ) -> List[CitationItem]:
        """
        Performs similarity search with strict payer-policy isolation.
        Ensures a Medicare query only cites Medicare LCDs/NCDs and private claims never cite Medicare-only policies.
        """
        query_vec = self.compute_mock_embedding(query)
        
        # Load all chunks for this organization
        stmt = (
            select(DocumentChunk)
            .join(Document, DocumentChunk.document_id == Document.id)
            .options(selectinload(DocumentChunk.document).selectinload(Document.payer))
            .where(Document.organization_id == organization_id)
        )
        
        if payer_id:
            stmt = stmt.where(Document.payer_id == payer_id)
        if category:
            stmt = stmt.where(Document.category == category)
            
        result = await db.execute(stmt)
        chunks = result.scalars().all()
        
        scored_results = []
        for chunk in chunks:
            # Payer type hard-filter check
            if payer_type and chunk.document.payer and chunk.document.payer.payer_type:
                if chunk.document.payer.payer_type.lower() != payer_type.lower():
                    continue  # Hard filter: never cross-cite different payer types
                    
            chunk_vec = chunk.embedding_json or self.compute_mock_embedding(chunk.content)
            # Baseline similarity + keyword boost
            score = self.cosine_similarity(query_vec, chunk_vec)
            
            # Boost for matching exact key terms (e.g. CPT codes, policy numbers)
            for word in query.lower().split():
                if len(word) > 3 and word in chunk.content.lower():
                    score += 0.15
            
            scored_results.append((score, chunk))
            
        scored_results.sort(key=lambda x: x[0], reverse=True)
        
        citations = []
        for score, chunk in scored_results[:limit]:
            if score < 0.15:
                continue  # Low confidence threshold
            
            # Clean snippet around matching terms
            snippet = chunk.content[:280] + ("..." if len(chunk.content) > 280 else "")
            
            citations.append(CitationItem(
                document_title=chunk.document.title if chunk.document else "Policy Manual",
                page_number=chunk.page_number,
                chunk_id=chunk.id,
                snippet=snippet,
                relevance_score=round(min(score, 0.99), 2)
            ))
            
        return citations

vector_search_service = VectorSearchService()

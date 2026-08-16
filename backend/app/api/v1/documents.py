import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.entities import Document, DocumentChunk, Payer, AuditLog
from app.schemas.schemas import DocumentResponse, SearchRAGRequest, CitationItem
from app.services.storage_service import storage_service
from app.services.ocr_service import ocr_service
from app.services.vector_service import vector_search_service

router = APIRouter(prefix="/documents", tags=["Knowledge Base & Documents"])

@router.get("", response_model=List[DocumentResponse])
async def list_documents(
    category: Optional[str] = Query(None),
    payer_id: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).options(selectinload(Document.payer)).order_by(Document.created_at.desc())
    if category:
        stmt = stmt.where(Document.category == category)
    if payer_id:
        stmt = stmt.where(Document.payer_id == payer_id)
        
    result = await db.execute(stmt)
    docs = result.scalars().all()
    
    response = []
    for d in docs:
        response.append(DocumentResponse(
            id=d.id,
            title=d.title,
            category=d.category,
            payer_name=d.payer.name if d.payer else "All Payers / General",
            file_type=d.file_type,
            file_size=d.file_size,
            page_count=d.page_count,
            ocr_status=d.ocr_status,
            chunk_count=d.chunk_count,
            citations_count=d.citations_count,
            created_at=d.created_at
        ))
    return response

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    title: str = Form(...),
    category: str = Form("Payer Policy"),
    payer_id: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    org_id = "org-demo-001"
    content = await file.read()
    file_path, file_size = await storage_service.save_file(file.filename, content)
    ext = os.path.splitext(file.filename)[1].replace(".", "").lower() or "pdf"
    
    # Run OCR & Text Extraction
    extracted_text = await ocr_service.extract_text_from_file(file_path)
    
    # Chunking
    chunks = vector_search_service.chunk_text(extracted_text, chunk_size=350, overlap=40)
    
    doc = Document(
        organization_id=org_id,
        title=title,
        category=category,
        payer_id=payer_id,
        file_path=file_path,
        file_size=file_size,
        file_type=ext,
        page_count=max(1, len(chunks) // 2),
        ocr_status="Completed",
        chunk_count=len(chunks),
        citations_count=0
    )
    db.add(doc)
    await db.flush()
    
    # Save Document Chunks with embeddings
    for idx, c in enumerate(chunks):
        emb = vector_search_service.compute_mock_embedding(c["content"])
        chunk_obj = DocumentChunk(
            organization_id=org_id,
            document_id=doc.id,
            chunk_index=idx,
            page_number=c["page_number"],
            content=c["content"],
            embedding_json=emb,
            metadata_json={"title": title, "category": category}
        )
        db.add(chunk_obj)
        
    audit = AuditLog(
        organization_id=org_id,
        action="DOCUMENT_INGESTED_AND_CHUNKED",
        entity_type="Document",
        entity_id=doc.id,
        ai_output=f"Indexed {len(chunks)} vector chunks for semantic RAG search."
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(doc)
    
    return DocumentResponse(
        id=doc.id,
        title=doc.title,
        category=doc.category,
        payer_name="Standard Carrier",
        file_type=doc.file_type,
        file_size=doc.file_size,
        page_count=doc.page_count,
        ocr_status=doc.ocr_status,
        chunk_count=doc.chunk_count,
        citations_count=doc.citations_count,
        created_at=doc.created_at
    )

@router.post("/search-rag", response_model=List[CitationItem])
async def search_rag(payload: SearchRAGRequest, db: AsyncSession = Depends(get_db)):
    org_id = "org-demo-001"
    citations = await vector_search_service.search(
        db=db,
        organization_id=org_id,
        query=payload.query,
        payer_id=payload.payer_id,
        category=payload.category,
        limit=payload.limit
    )
    return citations

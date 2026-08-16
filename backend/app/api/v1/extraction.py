from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models.entities import AuditLog
from app.services.storage_service import storage_service
from app.services.ocr_service import ocr_service
from app.services.extraction_service import extraction_service
from app.schemas.schemas import ExtractionResponse

router = APIRouter(prefix="/extraction", tags=["AI Auto-Extraction"])

@router.post("/auto-extract", response_model=ExtractionResponse)
async def auto_extract_file(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    """
    Extracts structured medical billing/credentialing data from an uploaded document.
    Fields pre-fill forms as editable, AI-flagged, unsaved drafts.
    """
    content = await file.read()
    file_path, file_size = await storage_service.save_file(file.filename, content)
    
    # 1. OCR text
    text = await ocr_service.extract_text_from_file(file_path)
    
    # 2. Extract structured entities
    extracted = await extraction_service.extract_entities(text=text, filename=file.filename)
    
    # 3. Log to HIPAA Audit Trail
    audit = AuditLog(
        organization_id="org-demo-001",
        action="AI_DOCUMENT_FIELD_EXTRACTION",
        entity_type="File",
        entity_id=file.filename,
        prompt_text=f"AI extraction on file: {file.filename}",
        ai_output=f"Extracted {len(extracted.extracted_fields)} fields with confidence {extracted.confidence_score}."
    )
    db.add(audit)
    await db.commit()
    
    return extracted

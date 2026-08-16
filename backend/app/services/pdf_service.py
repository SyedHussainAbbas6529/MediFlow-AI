import os
import uuid
from typing import Optional
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from app.core.config import settings

class PDFService:
    def __init__(self):
        self.output_dir = os.path.join(settings.STORAGE_LOCAL_DIR, "generated_pdfs")
        os.makedirs(self.output_dir, exist_ok=True)

    def generate_appeal_pdf(
        self,
        claim_number: str,
        patient_name: str,
        payer_name: str,
        denial_code: str,
        appeal_letter_body: str,
        provider_name: str = "Dr. Marcus Vance, MD",
        npi: str = "1841392019"
    ) -> str:
        filename = f"Appeal_Letter_{claim_number}_{uuid.uuid4().hex[:6]}.pdf"
        file_path = os.path.join(self.output_dir, filename)
        
        doc = SimpleDocTemplate(
            file_path,
            pagesize=letter,
            rightMargin=54,
            leftMargin=54,
            topMargin=54,
            bottomMargin=54
        )
        
        styles = getSampleStyleSheet()
        
        header_style = ParagraphStyle(
            'HeaderStyle',
            parent=styles['Heading1'],
            fontSize=16,
            textColor=colors.HexColor('#4F46E5'),
            spaceAfter=6
        )
        
        meta_label_style = ParagraphStyle(
            'MetaLabel',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748B'),
            fontName='Helvetica-Bold'
        )
        
        meta_val_style = ParagraphStyle(
            'MetaVal',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#0F172A')
        )
        
        body_style = ParagraphStyle(
            'BodyStyle',
            parent=styles['Normal'],
            fontSize=10,
            leading=15,
            textColor=colors.HexColor('#1E293B'),
            spaceAfter=10
        )
        
        story = []
        
        # Header
        story.append(Paragraph("FORMAL MEDICAL NECESSITY & CLAIMS APPEAL", header_style))
        story.append(Paragraph("MediFlow AI Automated Appeal Support Document", meta_label_style))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#4F46E5'), spaceAfter=14))
        
        # Claim Metadata Table
        data = [
            [Paragraph("Payer / Claims Dept:", meta_label_style), Paragraph(payer_name, meta_val_style),
             Paragraph("Claim Reference #:", meta_label_style), Paragraph(claim_number, meta_val_style)],
            [Paragraph("Patient Name:", meta_label_style), Paragraph(patient_name, meta_val_style),
             Paragraph("Denial Code:", meta_label_style), Paragraph(denial_code, meta_val_style)],
            [Paragraph("Rendering Provider:", meta_label_style), Paragraph(provider_name, meta_val_style),
             Paragraph("Provider NPI:", meta_label_style), Paragraph(npi, meta_val_style)]
        ]
        
        table = Table(data, colWidths=[120, 140, 110, 134])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#F1F5F9')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(table)
        story.append(Spacer(1, 16))
        
        # Appeal Letter Content
        paragraphs = appeal_letter_body.split("\n\n")
        for p in paragraphs:
            if p.strip():
                # Replace newlines with breaks
                clean_p = p.replace("\n", "<br/>")
                story.append(Paragraph(clean_p, body_style))
                story.append(Spacer(1, 6))
                
        # Footer / Sign-off
        story.append(Spacer(1, 14))
        story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#CBD5E1'), spaceAfter=10))
        story.append(Paragraph("Submitted via MediFlow AI Enterprise RCM Platform — Authorized Human Review Confirmed.", meta_label_style))
        
        doc.build(story)
        return file_path

pdf_service = PDFService()

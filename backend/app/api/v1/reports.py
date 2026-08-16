from fastapi import APIRouter, Depends, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db

router = APIRouter(prefix="/reports", tags=["Reporting & Analytics"])

@router.get("/metrics")
async def get_analytics_metrics(timeframe: str = Query("30d"), db: AsyncSession = Depends(get_db)):
    return {
        "kpis": {
            "first_pass_rate": 96.4,
            "first_pass_delta": "+1.8%",
            "denial_rate": 3.8,
            "denial_rate_delta": "-0.9%",
            "avg_days_in_ar": 28.5,
            "avg_days_delta": "-4.2 days",
            "appeal_success_rate": 84.2,
            "appeal_success_delta": "+5.1%",
            "clean_claims_count": 284,
            "total_reimbursed": "$842,500"
        },
        "trends": [
            {"month": "Oct", "first_pass": 93.1, "denials": 5.8, "days_ar": 36.2},
            {"month": "Nov", "first_pass": 94.0, "denials": 5.2, "days_ar": 34.0},
            {"month": "Dec", "first_pass": 94.8, "denials": 4.6, "days_ar": 31.5},
            {"month": "Jan", "first_pass": 95.3, "denials": 4.2, "days_ar": 30.1},
            {"month": "Feb", "first_pass": 95.9, "denials": 3.9, "days_ar": 29.0},
            {"month": "Mar", "first_pass": 96.4, "denials": 3.8, "days_ar": 28.5}
        ],
        "payer_performance": [
            {"payer": "Medicare Part B", "claims": 142, "acceptance_rate": 97.2, "avg_pay_days": 18},
            {"payer": "Blue Cross Blue Shield", "claims": 88, "acceptance_rate": 95.8, "avg_pay_days": 24},
            {"payer": "UnitedHealthcare", "claims": 64, "acceptance_rate": 93.4, "avg_pay_days": 32},
            {"payer": "Aetna", "claims": 45, "acceptance_rate": 96.1, "avg_pay_days": 22},
            {"payer": "Cigna", "claims": 31, "acceptance_rate": 94.5, "avg_pay_days": 28}
        ],
        "provider_productivity": [
            {"name": "Dr. Marcus Vance", "specialty": "Orthopedic Surgery", "claims": 98, "billed": 245000, "clean_rate": 98.1},
            {"name": "Dr. Sarah Jenkins", "specialty": "Internal Medicine", "claims": 82, "billed": 142000, "clean_rate": 96.5},
            {"name": "Dr. Alex Rivera", "specialty": "Cardiology", "claims": 65, "billed": 198000, "clean_rate": 95.2},
            {"name": "Dr. Elena Rostova", "specialty": "Neurology", "claims": 44, "billed": 165000, "clean_rate": 97.0}
        ]
    }

@router.get("/export-csv")
async def export_reports_csv():
    csv_data = "Payer,Claims Submitted,Clean Claim Rate (%),Avg Days to Pay,Total Billed ($)\n"
    csv_data += "Medicare Part B,142,97.2,18,348500\n"
    csv_data += "Blue Cross Blue Shield,88,95.8,24,215000\n"
    csv_data += "UnitedHealthcare,64,93.4,32,168000\n"
    csv_data += "Aetna,45,96.1,22,112000\n"
    csv_data += "Cigna,31,94.5,28,84500\n"
    
    return PlainTextResponse(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=mediflow_rcm_performance_report.csv"}
    )

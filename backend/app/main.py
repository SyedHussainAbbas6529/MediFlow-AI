from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter
from app.core.logging_config import RequestLoggingMiddleware, logger
from app.db.seed import seed_database

# Routers
from app.api.v1.auth import router as auth_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.patients import router as patients_router
from app.api.v1.providers import router as providers_router
from app.api.v1.credentialing import router as cred_router
from app.api.v1.claims import router as claims_router
from app.api.v1.denials import router as denials_router
from app.api.v1.ar import router as ar_router
from app.api.v1.documents import router as documents_router
from app.api.v1.extraction import router as extraction_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.payer_policies import router as payer_policies_router
from app.api.v1.reports import router as reports_router
from app.api.v1.settings import router as settings_router
from app.api.v1.audit_logs import router as audit_logs_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.ws import router as ws_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing MediFlow AI Backend Services...")
    # Auto-seed realistic demo data on startup
    try:
        await seed_database()
    except Exception as e:
        logger.error(f"Error during initial seed: {e}")
    yield
    logger.info("Shutting down MediFlow AI Backend Services...")

app = FastAPI(
    title="MediFlow AI — RCM & Credentialing Platform API",
    description="Enterprise Multi-Agent Revenue Cycle Management (RCM) and Provider Credentialing Platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Attach rate limiter
app.state.limiter = limiter

@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please retry later."}
    )

# Middlewares
app.add_middleware(RequestLoggingMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Open in dev, locked down in cloud prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_prefix)
app.include_router(dashboard_router, prefix=api_prefix)
app.include_router(patients_router, prefix=api_prefix)
app.include_router(providers_router, prefix=api_prefix)
app.include_router(cred_router, prefix=api_prefix)
app.include_router(claims_router, prefix=api_prefix)
app.include_router(denials_router, prefix=api_prefix)
app.include_router(ar_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(extraction_router, prefix=api_prefix)
app.include_router(assistant_router, prefix=api_prefix)
app.include_router(payer_policies_router, prefix=api_prefix)
app.include_router(reports_router, prefix=api_prefix)
app.include_router(settings_router, prefix=api_prefix)
app.include_router(audit_logs_router, prefix=api_prefix)
app.include_router(notifications_router, prefix=api_prefix)
app.include_router(ws_router)

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "MediFlow AI API",
        "version": "1.0.0",
        "llm_provider": settings.LLM_PROVIDER,
        "voice_provider": settings.VOICE_PROVIDER
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

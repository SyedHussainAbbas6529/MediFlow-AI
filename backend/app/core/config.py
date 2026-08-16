import os
from typing import List, Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "MediFlow AI"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    
    # Security & JWT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "mediflow_super_secret_jwt_key_enterprise_rcm_credentialing_2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day for dev/testing ease (spec notes 15 min + refresh in prod)
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./mediflow.db")
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    
    # LLM & AI Orchestration
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "mock")  # openai | anthropic | mock
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY", None)
    ANTHROPIC_API_KEY: Optional[str] = os.getenv("ANTHROPIC_API_KEY", None)
    ZERO_DATA_RETENTION: bool = os.getenv("ZERO_DATA_RETENTION", "True").lower() == "true"
    
    # Voice Provider
    VOICE_PROVIDER: str = os.getenv("VOICE_PROVIDER", "browser")  # browser | whisper | cloud
    
    # Storage
    STORAGE_TYPE: str = os.getenv("STORAGE_TYPE", "local")  # local | minio | s3
    STORAGE_LOCAL_DIR: str = os.getenv("STORAGE_LOCAL_DIR", "./uploads")
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    class Config:
        case_sensitive = True
        extra = "allow"

settings = Settings()

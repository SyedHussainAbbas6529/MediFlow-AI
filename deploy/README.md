# MediFlow AI — Deployment & Operations Guide

## 1. Local Development Profile
Run the complete stack locally using Docker Compose against real PostgreSQL 16 + pgvector, Redis, and MinIO:
```bash
docker compose -f docker-compose.local.yml up --build
```
- Frontend: `http://localhost:3000`
- Backend API Docs: `http://localhost:8000/docs`
- MinIO Console: `http://localhost:9001`

## 2. Cloud Migration Runbook
1. **Managed PostgreSQL Setup**: Provision AWS RDS PostgreSQL 16 or Supabase, enable `pgvector`:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. **Secrets Configuration**: Set `DATABASE_URL`, `REDIS_URL`, `SECRET_KEY`, `OPENAI_API_KEY` in AWS Secrets Manager / Vault.
3. **Database Migration & Seeding**:
   ```bash
   alembic upgrade head
   python -m app.db.seed
   ```
4. **Kubernetes Deployment**:
   ```bash
   kubectl apply -f deploy/k8s/
   ```

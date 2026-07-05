# JustUs v3.0 — Deployment State
**Julius Cameron Hill | JCH-2026 | Titan Universal AI LLC**

## Live URLs
- Frontend: https://justus.titanuai.com (Vercel)
- Backend API: https://justus-api.titanuai.com (GCP VM: justus-sovereign)

## Architecture
- Frontend: Next.js 15, Tailwind v4, next-intl, deployed on Vercel
- Backend: FastAPI + uvicorn running in Docker container `justus-backend` on port 8000
- Proxy: Docker nginx container (`justus-nginx`) on ports 80/443 with SSL
- WebSocket: `justus-ws` container on port 8080

## To update backend code on VM
```bash
cd ~/justus-titanup && git pull origin main
docker cp backend/main.py justus-backend:/app/main.py
docker cp backend/offline_data.py justus-backend:/app/offline_data.py
docker restart justus-backend
curl https://justus-api.titanuai.com/health
```

## Verified Endpoints (2026-07-05)
- GET  /health ✓
- POST /auth/register ✓
- POST /auth/login ✓
- POST /chat ✓
- POST /draft ✓
- POST /record-event ✓
- GET  /timeline ✓
- POST /risk-predict ✓ (HIGH risk score verified)
- GET  /offline ✓
- POST /police-mode ✓

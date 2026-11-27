# MediCore Hospital Management System

## Overview
MediCore is a hospital management demo application.

## Technology Stack
- Frontend: Next.js, React
- Backend: Node.js, Express, TypeScript
- Database: PostgreSQL 16
- Analytics: Python, FastAPI
- Testing: Vitest, Supertest, pytest, HTTPX
- CI: GitHub Actions
- Containerization: Docker Compose

## Modules
- Dashboard
- Patients
- Staff
- Appointments
- Encounters
- Prescriptions
- Laboratory
- Billing
- Consent
- Audit Logs
- Analytics

## Local Setup

### Database
From the repository root:
docker compose up -d postgres

### Backend
cd apps/api
npm install
npm run dev

### Frontend
cd apps/web
npm install
npm run dev

### Analytics API
cd apps/analytics/python
pip install -r requirements.txt
uvicorn src.api:app --reload --port 8000

## Tests

Backend:
cd apps/api
npm test
npm run build

Analytics:
cd apps/analytics/python
python -m pytest tests -v

## Security
- Environment variables for configuration
- Server-side authorization
- Input validation
- Password hashing
- Audit and consent modules

## Limitations
This is a demonstration project using synthetic data.
Clinical reference ranges are illustrative and not intended for diagnosis.
Production deployment, external integrations and production security configuration require additional verification.

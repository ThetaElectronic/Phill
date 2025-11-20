# Phill Rebuild

This repository contains the 2025 rebuild scaffold for Phill. Use the Docker compose stack to bring up the API and frontend so you can see the placeholder UI and verify networking.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (only needed for running the frontend without Docker)
- Python 3.12 (only needed for running the backend without Docker)

## Quick start (Docker)
1. Copy the environment template to the repository root (it will be loaded by Docker Compose via `env_file`) and fill in secrets:
   ```bash
   cp .env.example .env
   ```
2. Build and start the stack from the `deploy` directory:
   ```bash
   cd deploy
   docker compose up --build
   ```
3. Open the app at http://localhost:3000 to view the Next.js pages. The API is available at http://localhost:8001 (with `/docs` for Swagger).

## Run frontend locally (without Docker)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The app will be available at http://localhost:3000. (React 19 release candidates currently require `--legacy-peer-deps`.)

## Run backend locally (without Docker)
```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```
Then visit http://localhost:8001/docs for the interactive API docs.

## Current state of the UI
The frontend currently contains page stubs for login, dashboard, incidents, documents, companies, AI chat, settings, and admin areas. The visuals are minimal placeholders until components and styling are implemented.

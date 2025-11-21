# Phill Rebuild

This repository contains the 2025 rebuild scaffold for Phill. Use the Docker compose stack to bring up the API and frontend so you can see the placeholder UI and verify networking.

> If the site does not load, use the Nginx health endpoint at http://localhost/healthz to confirm the proxy is running.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (only needed for running the frontend without Docker)
- Python 3.12 (only needed for running the backend without Docker)

## Quick start (Docker)
1. Copy the environment template to the repository root (it will be loaded by Docker Compose via `env_file`) and fill in secrets:
   ```bash
   cp .env.example .env
   ```
2. From the repository root, build and start the stack (the frontend image bakes `NEXT_PUBLIC_API_URL` during build; update your `.env` before running):
   ```bash
   docker compose up --build
   ```
   > Prefer the root `docker-compose.yml` unless you have a reason to run from `deploy/`; it uses the same services without needing relative `../` paths.
3. Open the app through Nginx at http://localhost (the API is proxied at `/api`). If you want to reach the backend directly, use http://localhost:8001 (with `/docs` for Swagger).
   - Verify containers: `docker compose ps`
   - Check Nginx proxy health: `curl http://localhost/healthz`

## Run frontend locally (without Docker)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The app will be available at http://localhost:3000. (React 19 release candidates currently require `--legacy-peer-deps`.) Set `NEXT_PUBLIC_API_URL` to `http://localhost:8001` in your local `.env` when bypassing Nginx.

Alternatively, you can run the scripts from the repository root using the passthrough commands defined in `package.json`:

```bash
npm run install:frontend
npm run dev
```

> If you change `NEXT_PUBLIC_API_URL`, rebuild the frontend image (`docker compose build frontend`) so the value is baked into the static assets.

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

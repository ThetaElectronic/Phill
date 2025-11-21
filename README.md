# Phill Rebuild

This repository contains the 2025 rebuild scaffold for Phill. Use the Docker compose stack to bring up the API and frontend so you can see the placeholder UI and verify networking.

> If the site does not load, use the Nginx health endpoint at http://localhost/healthz to confirm the proxy is running, and hit
> the API health endpoint at http://localhost/api/health to verify backend routing through the proxy.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (only needed for running the frontend without Docker)
- Python 3.12 (only needed for running the backend without Docker)

## Quick start (Docker)
1. Copy the environment template to the repository root (it will be loaded by Docker Compose via `env_file`) and fill in secrets:
   ```bash
   cp .env.example .env
   ```
   - Leave `NEXT_BACKEND_URL` as `http://backend:8001` when running inside Docker so the frontend proxies to the backend container. Override it to `http://localhost:8001` only when running the frontend outside Docker.
   - For the live domain, set `API_HOST` and `FRONTEND_URL` to `https://app.jarvis-fuel.com`, add both `https://app.jarvis-fuel.com` and `https://jarvis-fuel.com` to `CORS_ORIGINS`, and keep `NEXT_PUBLIC_API_URL` set to `/api` so browser calls are proxied through Nginx.
2. From the repository root, build and start the stack (the frontend image bakes `NEXT_PUBLIC_API_URL` and `NEXT_BACKEND_URL` during build; update your `.env` before running):
   ```bash
   docker compose up --build
   ```
   > Prefer the root `docker-compose.yml` unless you have a reason to run from `deploy/`; it uses the same services without needing relative `../` paths.
3. Open the app through Nginx at http://localhost (the API is proxied at `/api`). If you want to reach the backend directly, use http://localhost:8001 (with `/docs` for Swagger) or http://localhost:8001/health for a lightweight check.
   - Verify containers: `docker compose ps`
   - Check Nginx proxy health: `curl http://localhost/healthz`
   - The homepage shows API reachability using `NEXT_PUBLIC_API_URL`; if it reports unreachable, confirm your `.env` values and rebuild or restart.

## Run frontend locally (without Docker)
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
The app will be available at http://localhost:3000. (React 19 release candidates currently require `--legacy-peer-deps`.) Set `NEXT_PUBLIC_API_URL` to `http://localhost:8001` in your local `.env` when bypassing Nginx.

To proxy `/api` calls to a locally running backend without Nginx, set `NEXT_BACKEND_URL` (defaults to `http://localhost:8001`):

```bash
NEXT_BACKEND_URL=http://localhost:8001 NEXT_PUBLIC_API_URL=/api npm run dev
```

Alternatively, you can run the scripts from the repository root using the passthrough commands defined in `package.json`:

```bash
npm run install:frontend
npm run dev
```

> If you change `NEXT_PUBLIC_API_URL` or `NEXT_BACKEND_URL`, rebuild the frontend image (`docker compose build frontend`) so the values are baked into the static assets.

## Production domain notes (app.jarvis-fuel.com / jarvis-fuel.com)
- Point both `app.jarvis-fuel.com` and `jarvis-fuel.com` DNS A records at the host IP `129.212.191.100`.
- The Nginx config listens on port 80 for `app.jarvis-fuel.com` and issues a 301 redirect from `jarvis-fuel.com` to the app subdomain.
- When running on the host, keep `NEXT_PUBLIC_API_URL=/api` so browser requests use the same origin; Nginx proxies `/api` to the backend container.
- After updating DNS, deploy with `docker compose up --build -d` and verify the proxy at `http://app.jarvis-fuel.com/healthz` and the API at `http://app.jarvis-fuel.com/api/health`.

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

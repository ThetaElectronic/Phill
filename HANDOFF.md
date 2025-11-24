# Phill – Handoff Notes

This file summarizes the current state of the project and the next actions requested by the user.

## Current status
- **Stack:** FastAPI backend (Python 3.12), Next.js 15 frontend (React 19), PostgreSQL 16, Prisma schema in `database/prisma/schema.prisma`, Docker + Nginx deployment.
- **Domains:** Primary app URL is `https://app.jarvis-fuel.com` behind Cloudflare; apex `https://jarvis-fuel.com` redirects to the app via Nginx.
- **Environment:** Root `.env` is used by both root and `deploy` Docker Compose stacks. CORS and CSP support production domains plus local defaults. Node 20 is required (`.nvmrc`, engines fields); frontend Dockerfile also uses Node 20.
- **Auth/security:** Login uses email (username optional) and persists access+refresh tokens. Protected pages are fully hidden unless authenticated; middleware redirects anonymous users to `/login`. Password reset and access-request flows exist (`/api/auth/request-reset`, `/api/auth/request-access`, and token confirmation endpoint). Admin-only view at `/admin/requests` lists inbound requests.
- **Bootstrap scripts:** Located in `backend/scripts/` (`bootstrap_user.py`, `bootstrap_admin.py`, `bootstrap_founder.py` if needed) and included in the backend image. They seed users/companies via env defaults. Latest instructions in README.
- **AI:** OpenAI client uses `openai` package; `httpx` pinned to 0.27.2 to avoid `proxies` kwarg error. AI endpoints at `/api/ai/chat`; memory scoped per company.
- **Frontend UX:** Apple-like glass aesthetic. No previews for anonymous users; login page includes minimal forgot-password and access-request panels. Session indicator present for signed-in users. Dashboard/incidents/documents/tickets pull live data with bearer tokens when available.
- **Deployment:** Nginx config (root and `deploy/nginx.conf`) now includes HTTPS server blocks with cert paths placeholders and `/healthz` + `/api` proxying. Compose files omit container_name to avoid conflicts. Health checks configured for services.

## Recent issue fixed
- Backend failed to start due to `openai` client rejecting `proxies` kwarg from newer `httpx`; `backend/requirements.txt` pins `httpx==0.27.2` to restore compatibility.

## Outstanding/next steps requested by user
- Verify backend restarts cleanly after the httpx pin (`docker compose up -d --build backend`) and confirm `/healthz` and `/api/health` over HTTPS via Nginx/Cloudflare.
- If authentication still fails, re-check `.env` values for `NEXT_PUBLIC_API_URL`/`NEXT_BACKEND_URL` and ensure cert files match the Nginx TLS paths.
- Continue simplifying UI content for regular users (keep clutter minimal) while retaining the glass aesthetic.
- Support creating or confirming the user `nathanielwilson@guardianfueltech.com` (password provided by user) via the bootstrap helper if not already present.

## Useful commands
- Local checks: `python -m compileall backend/app`; `CI=1 npm run build --prefix frontend` (Node 20 required).
- Docker (from repo root): `docker compose up -d --build` to rebuild backend/frontend with current `.env`.
- Bootstrap user example (inside backend container): `python scripts/bootstrap_user.py --email nathanielwilson@guardianfueltech.com --password '<password>' --name 'Nathaniel Wilson' --role admin --company-name 'Guardian Fuel Tech' --company-domain 'guardianfueltech.com'`.

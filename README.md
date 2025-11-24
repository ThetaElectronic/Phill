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
   - If you bypass Nginx (for example by opening the frontend directly on port 3000), set `NEXT_PUBLIC_API_URL=https://app.jarvis-fuel.com/api` (or your backend URL) before rebuilding the frontend so token requests hit the real API instead of returning HTML.
2. From the repository root, build and start the stack (the frontend image bakes `NEXT_PUBLIC_API_URL` and `NEXT_BACKEND_URL` during build; update your `.env` before running). Compose resolves build contexts and `.env` via `${COMPOSE_FILE_DIR}`, so running in `/opt/phill` ensures contexts are `./backend` and `./frontend` instead of `/opt/backend`:
   ```bash
   docker compose up --build
   ```
   > Prefer the root `docker-compose.yml` unless you have a reason to run from `deploy/`; it uses the same services without needing relative `../` paths.
3. Open the app through Nginx at http://localhost (the API is proxied at `/api`). If you want to reach the backend directly, use http://localhost:8001 (with `/docs` for Swagger) or http://localhost:8001/health for a lightweight check.
   - Verify containers: `docker compose ps`
   - Wait for health checks: backend/db/frontend declare health checks; `docker inspect --format='{{json .State.Health.Status}}' phill-backend` (or frontend/db) should report `healthy` before testing the site.
   - Check Nginx proxy health: `curl http://localhost/healthz`
   - The homepage shows API reachability using `NEXT_PUBLIC_API_URL`; if it reports unreachable, confirm your `.env` values and rebuild or restart.

## Bootstrap a founder login (one-time)
- The users API requires an authenticated manager/founder to create additional accounts. Use the built-in bootstrap script to seed the first founder without writing inline Python:

  ```bash
  docker compose exec backend python scripts/bootstrap_founder.py \
    --company "Jarvis Fuel" \
    --domain jarvis-fuel.com \
    --email founder@app.jarvis-fuel.com \
    --username founder \
    --password "CHANGE_ME_STRONG"
  ```

- The script is idempotent: if a user already exists for that email, it leaves the record intact and simply reports the email.
- After running the script, sign in at `/login` with the credentials you provided. Use the Tokens box on the login page to verify access and hit protected routes.
- Rotate the password immediately after testing and store it in a secret manager.

## Run frontend locally (without Docker)
```bash
cd frontend
npm install
npm run dev
```
The app will be available at http://localhost:3000. A local `.npmrc` forces `legacy-peer-deps` so installs succeed with the React 19 release candidates. Set `NEXT_PUBLIC_API_URL` to `http://localhost:8001` in your local `.env` when bypassing Nginx.

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

## End-to-end deployment on Ubuntu 22 (DigitalOcean + Cloudflare)
Use these exact commands on a fresh Ubuntu 22 server (IP `129.212.191.100`) to bring the site up at `https://app.jarvis-fuel.com`:

1) Install prerequisites (Docker, Docker Compose v2, Git):

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin git
sudo systemctl enable --now docker
```

2) Clone the repo and prepare the environment file:

```bash
sudo mkdir -p /opt && cd /opt
sudo git clone https://github.com/your-org/phill.git phill
cd /opt/phill
cp .env.example .env
```

3) Edit `.env` for production:
- Set `API_HOST=https://app.jarvis-fuel.com` and `FRONTEND_URL=https://app.jarvis-fuel.com`.
- Keep `NEXT_PUBLIC_API_URL=/api` and `NEXT_BACKEND_URL=http://backend:8001` so the frontend proxies through Nginx to the backend container.
- Add your secrets for `JWT_SECRET`, `PASSWORD_PEPPER`, `SMTP_*`, `OPENAI_API_KEY`, and database credentials if you change the defaults.

4) Ensure Cloudflare DNS points `app.jarvis-fuel.com` and `jarvis-fuel.com` A records at `129.212.191.100`. If using Cloudflare proxy, enable Websockets and keep HTTP 80 open (TLS termination can stay at Cloudflare or be added to Nginx separately).

5) Build and start the stack (runs Nginx, backend, frontend, Postgres):

```bash
cd /opt/phill
sudo docker compose up --build -d
```

6) Wait for health checks to report `healthy`:

```bash
sudo docker compose ps
sudo docker inspect --format='{{json .State.Health.Status}}' phill-backend
sudo docker inspect --format='{{json .State.Health.Status}}' phill-frontend
```

7) Verify routing through Nginx:

```bash
   curl -I http://app.jarvis-fuel.com/healthz
   curl -I http://app.jarvis-fuel.com/api/health
   ```

## Resolving merge conflicts without losing code
When GitHub shows conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`), the buttons mean:

- **Accept current change** keeps the code already in your branch.
- **Accept incoming change** replaces your branch’s code with the other branch’s version (this can delete your edits if the incoming side removed them).
- **Accept both changes** keeps both blocks so you can edit them together.

If you see large sections disappear after clicking **Accept incoming change**, it means the other branch deleted or replaced that code. Use **Accept current change** to keep your version, or **Accept both changes** and then manually trim/merge in the editor. After resolving, remove the conflict markers, save, and rerun your tests/builds before committing.

If you see `200 OK` on both, the site should load at https://app.jarvis-fuel.com.

8) Common fixes if the site does not load:
- Rebuild after changing `.env`: `sudo docker compose build frontend backend && sudo docker compose up -d`
- Check logs: `sudo docker compose logs -f nginx backend frontend`
- Verify Cloudflare proxy headers reach Nginx: `curl -I http://app.jarvis-fuel.com/healthz` should show `Server: nginx`.

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

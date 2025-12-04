# Phill Rebuild

This repository contains the 2025 rebuild scaffold for Phill. Use the Docker compose stack to bring up the API and frontend so you can see the placeholder UI and verify networking.

> If the site does not load, use the Nginx health endpoint at http://localhost/healthz to confirm the proxy is running, and hit
> the API health endpoint at http://localhost/api/health to verify backend routing through the proxy.
> A helper script is also available to check both backend endpoints at once: `docker compose exec backend python scripts/check_status.py`. Add `--insecure` if you are testing against a self-signed certificate, `--include-healthz` to probe the proxy, `--include-ai` to verify OpenAI readiness via `/api/ai/status`, and `--timeout 10` if the host is slow to respond.

## Prerequisites
- Docker and Docker Compose
- Node.js 20+ (only needed for running the frontend without Docker)
- Python 3.12 (only needed for running the backend without Docker)

> A root `.nvmrc` pins Node 20. Run `nvm use` (or install Node 20.x manually) before local frontend commands. Older Node releases (e.g., 12/14) will surface `next: not found`, `Unsupported engine`, or `Unexpected token ?` errors because Next.js 15 targets Node 18.18+.

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
   - Container names are no longer hardcoded. If you previously ran a stack that set `container_name` (e.g., `phill-db`, `phill-backend`), stop and remove those containers first to avoid name conflicts: `docker rm -f phill-backend phill-frontend phill-db phill-nginx` (or `docker compose -p phill down` if you started with that project name).
3. Open the app through Nginx at http://localhost (the API is proxied at `/api`). If you want to reach the backend directly, use http://localhost:8001 (with `/docs` for Swagger) or http://localhost:8001/health for a lightweight check.
   - Verify containers: `docker compose ps`
   - Wait for health checks: backend/db/frontend declare health checks; `docker inspect --format='{{json .State.Health.Status}}' phill-backend` (or frontend/db) should report `healthy` before testing the site.
    - Check Nginx proxy health: `curl http://localhost/healthz`
   - Check backend health endpoints together: `docker compose exec backend python scripts/check_status.py` (append `--insecure` if you are temporarily using self-signed certs, `--include-healthz` to hit the proxy, `--include-ai` to verify `/api/ai/status`, or `--timeout 10` if the host is slow)
   - The homepage shows API reachability using `NEXT_PUBLIC_API_URL`; if it reports unreachable, confirm your `.env` values and rebuild or restart.

## Bootstrap a private admin login (one-time)
- The users API requires an authenticated admin to create additional accounts. Use the built-in bootstrap script to seed the first admin account without writing inline Python (the username defaults to the email so you only need to specify it if you want something different):

  ```bash
  docker compose exec backend python scripts/bootstrap_admin.py \
    --company "Jarvis Fuel" \
    --domain jarvis-fuel.com \
    --email admin@app.jarvis-fuel.com \
    --password "CHANGE_ME_STRONG"
  ```

- The script is idempotent: if a user already exists for that email, it leaves the record intact and simply reports the email. Add `--update` to reset the password/name if you need to rotate credentials for an existing record.
- After running the script, sign in at `/login` with the credentials you provided. Protected routes stay hidden until authentication succeeds.
- Rotate the password immediately after testing and store it in a secret manager.
- `PASSWORD_RESET_EXPIRE_MINUTES` controls how long reset tokens stay valid (default 30 minutes).
- If you run the bootstrap command from a non-interactive shell (e.g., inside another script), add `-T` to `docker compose exec` to avoid the "input device is not a TTY" error:

  ```bash
  docker compose exec -T backend python scripts/bootstrap_admin.py --help
  ```
- API login options:
  - JSON: `curl -X POST $NEXT_BACKEND_URL/api/auth/login -H 'Content-Type: application/json' -d '{"email":"you@example.com","password":"your_password"}'`
  - OAuth2 form (used by the frontend): `curl -X POST $NEXT_BACKEND_URL/api/auth/token -H 'Content-Type: application/x-www-form-urlencoded' -d 'username=you@example.com&password=your_password'`
  - JSON to the token endpoint (username or email allowed): `curl -X POST $NEXT_BACKEND_URL/api/auth/token -H 'Content-Type: application/json' -d '{"username":"you@example.com","password":"your_password"}'`

### Self-service profile and password
- Signed-in users can visit `/account` to update their **name/username** or change their **password** without admin help.
- API equivalents for scripted changes:
  - Update profile: `curl -X PATCH $NEXT_BACKEND_URL/api/users/me -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"name":"New Name","username":"new-handle"}'`
  - Change password: `curl -X POST $NEXT_BACKEND_URL/api/users/me/password -H 'Authorization: Bearer <token>' -H 'Content-Type: application/json' -d '{"current_password":"old","new_password":"new-secret"}'`
  - On password change, existing tokens stay valid until they expire; refresh from the UI or re-login to rotate them immediately.

### Admin workspace
- Visit `/admin` for a clean landing page that links to all admin tools (system health, diagnostics, AI training files, users, requests, and email checks) without cluttering the main UI.
- Admin pages are wrapped in an admin-only guard: signed-in non-admins see a clear "Admins only" notice with a link back to the dashboard instead of broken API calls.
- The admin requests view includes search, sort (newest/oldest), reset controls, and shown/total counts so you can quickly audit access or password reset submissions without wading through clutter.

### Admin user management
- Admins and founders can manage users from `/admin/users` (UI) or `/api/users` (API). Admins are constrained to their own company scope and cannot grant a higher role than their own.
- The UI shows a simple list of existing users you are allowed to see and a form to add new accounts with name, email, password, and role. Each user row also includes a **password reset** control for setting a temporary password when someone is locked out.
- To add a user via API (honors the same role checks):

  ```bash
  curl -X POST $NEXT_BACKEND_URL/api/users \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"name":"Teammate","email":"person@example.com","password":"TempP@ssw0rd!","role":"user"}'
  ```

- To set a user's password as an admin (must be in your company unless you are a founder, and you cannot reset someone with a higher role than yours):

  ```bash
  curl -X POST $NEXT_BACKEND_URL/api/users/<user_id>/password \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"password":"NewTempP@ssw0rd!"}'
  ```

### Admin system status
- Visit `/admin/system` to see live readiness for the database, SMTP, and AI configuration. The page calls `/api/admin/status` (admin-only), auto-refreshes every 30 seconds, and surfaces both an overall status banner and per-subsystem indicators along with the backend's latency buckets. A **Refresh now** button is available for immediate checks after configuration changes.
- The status endpoint reports `status` = `ok` only when the database, SMTP settings, and AI configuration are all ready. It also includes the current environment (`ENV`), version tag (`APP_VERSION`, defaults to `dev`), and the UTC timestamp of the last check.
- API equivalent:

  ```bash
  curl -H "Authorization: Bearer <token>" $NEXT_BACKEND_URL/api/admin/status | jq
  ```

### Admin diagnostics (advanced)
- Visit `/admin/diagnostics` for the detailed payloads and endpoints that would clutter the user-facing UI. The page pulls the raw responses from `/api/admin/status` and `/ai/status`, surfaces latency buckets, shows endpoint URLs for quick copy/paste, and renders the JSON payloads for debugging. Copy buttons are available next to endpoints and payloads so you can quickly share the exact status data with ops or support.

### AI chat with document grounding
- Upload PDFs or text files on the `/ai` page to ground the next reply. Choose whether each upload is **company scoped** (default) or shared for **global training** across all tenants, and adjust the scope later from the document list if needed. Extracted text is trimmed to the first ~20k characters by default for storage and grounding (configurable via `AI_DOCUMENT_MAX_TEXT`). The default upload size limit is 512 KB; override with `AI_DOCUMENT_MAX_BYTES` if needed. Stored training text is returned in the documents list so you can inspect exactly what was saved for grounding.
- Admins can audit training uploads at `/admin/documents`, see size/type metadata (including stored text), flip scopes between company/global, or remove outdated files without leaving the panel.
- Browse existing training files on `/documents` (users) or `/admin/documents` (admins) with scope filters, search, sort, refresh, and reset controls. Both pages show the last refresh time, document counts, let you copy the stored training text for quick verification, and now offer a **Download text** shortcut that saves the stored content as a `.txt` file.
- Select any number of documents in the sidebar before sending your prompt; the backend prepends their text to the AI request so the reply references the provided material. Global training files are usable by every company, while company-scoped uploads remain private to their owner. Scope changes keep ownership with the original company and take effect immediately.
- Toggle memory to save the chat under your personal AI profile (tagged to your user and company) so future personality tuning has more examples. Leave it off for ephemeral questions.
- Remove a document you uploaded at any time from the `/ai` page or via the API; deletions are immediate and limited to the owner company.
- API examples:

  ```bash
  # Upload a PDF or text file
  curl -X POST "$NEXT_BACKEND_URL/api/ai/documents" \
    -H "Authorization: Bearer <token>" \
    -F "file=@/path/to/guide.pdf" \
    -F "scope=company" # or scope=global

  # Chat with a document attached (replace <doc_id> from the upload response)
  curl -X POST "$NEXT_BACKEND_URL/api/ai/chat" \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Summarize the SOP","document_ids":["<doc_id>"]}'

  # Delete an uploaded document (it must belong to your company)
  curl -X DELETE "$NEXT_BACKEND_URL/api/ai/documents/<doc_id>" \
    -H "Authorization: Bearer <token>"

  # Change a document scope after upload (owner company only)
  curl -X PATCH "$NEXT_BACKEND_URL/api/ai/documents/<doc_id>" \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d '{"scope":"global"}'
  ```

### Create Nathaniel's admin account
- To bootstrap `Nathaniel Wilson` with email-based login on the live stack, run this from the repo root (values provided by Nathaniel; update later if needed):

  ```bash
  docker compose exec backend \
    BOOTSTRAP_COMPANY="Guardian FuelTech" \
    BOOTSTRAP_DOMAIN="guardianfueltech.com" \
    BOOTSTRAP_EMAIL="nathanielwilson@guardianfueltech.com" \
    BOOTSTRAP_PASSWORD="Genesistheta2013!" \
    BOOTSTRAP_NAME="Nathaniel Wilson" \
    python scripts/bootstrap_user.py --role admin --update
  ```

- The script is idempotent: if the user already exists, it leaves the record intact and simply reports the email. Add `--update` to reset the password/name if the account already exists with different credentials. Sign in at `/login` with the email/password above and rotate the password immediately after confirming access.

### Self-service auth requests (login page)
- The login page now sends **password reset** and **access requests** to the backend via `/api/auth/request-reset` and `/api/auth/request-access`.
- Requests are stored server-side (email, IP, user-agent) for follow-up; responses always return `202 Accepted` without revealing whether an account exists.
- If SMTP is configured (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`), the backend emails reset tokens and acknowledges access requests automatically; otherwise the requests are still recorded. Use `SMTP_STARTTLS=false` if your provider does not support STARTTLS or `SMTP_USE_TLS=true` for implicit TLS (port 465).
- Admins can verify mail delivery from the UI at `/admin/email` (or by POSTing to `/api/admin/email/test` with `{ "recipient": "you@example.com" }`). The UI also surfaces SMTP readiness from `/api/admin/email/status` before enabling sends.

### Completing a password reset
- When you submit a reset request, the backend creates a short-lived token. In non-production environments, the raw token is returned in the API response for quick testing. In production, the backend emails the token to the address on file and includes a link to `/login?reset=<token>` for convenience.
- Use the login page’s **Confirm reset** form (or the prefilled reset link) to set a new password. Tokens expire after `PASSWORD_RESET_EXPIRE_MINUTES`, enforce the 8+ character password policy, and can only be used once.

## Protected pages are fully hidden until login
- Unauthenticated visitors are redirected to `/login` and do not see navigation, footer links, or content previews.
- Once signed in, the full app shell and pages (dashboard, incidents, documents, AI, admin) become available based on role.

## Run frontend locally (without Docker)
```bash
cd frontend
nvm use  # honors .nvmrc (Node 20)
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
- The Nginx config now terminates TLS on port 443 for both hosts and redirects HTTP 80 to HTTPS. Place your certificate and key at `deploy/ssl/fullchain.pem` and `deploy/ssl/privkey.pem` (Cloudflare Origin Certs work here); only install your real certs on the server and avoid committing them to Git. If those files are missing when the container starts, the Nginx entrypoint auto-generates a temporary self-signed certificate (CN defaults to `app.jarvis-fuel.com`, overridable with `TLS_DOMAIN`) so the proxy can boot; replace it with your real cert immediately. You can also create one manually with `deploy/ssl/generate-self-signed.sh <domain>` and keep it out of Git.
- When running on the host, keep `NEXT_PUBLIC_API_URL=/api` so browser requests use the same origin; Nginx proxies `/api` to the backend container.
- After updating DNS and adding certificates, deploy with `docker compose up --build -d` and verify the proxy at `https://app.jarvis-fuel.com/healthz` and the API at `https://app.jarvis-fuel.com/api/health`.

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
- Add your secrets for `JWT_SECRET`, `PASSWORD_PEPPER`, `SMTP_*`, `OPENAI_API_KEY`, and database credentials if you change the defaults. Optional: cap AI uploads with `AI_DOCUMENT_MAX_BYTES` (defaults to 512000 bytes) and trim stored document text with `AI_DOCUMENT_MAX_TEXT` (defaults to 20000 characters). SMTP supports `SMTP_STARTTLS` (default true) and `SMTP_USE_TLS` (implicit TLS, default false) for providers that require a specific mode.

### Fast AI key drop-in

Add your OpenAI project key to `.env` (or the deployment secrets store) so Phill AI can answer chats and process training files:

```env
# Example placeholder (replace with your real project key)
OPENAI_API_KEY=<your-openai-api-key>
AI_MODEL=gpt-4o-mini
```

If you prefer to keep the key out of version control, set it directly in your hosting provider and restart the stack; the AI status endpoint (`/api/ai/status`) will confirm when credentials are in place.

When you update the key or model, use the **Refresh status** control on the AI workspace (or query `/api/ai/status` directly) to confirm Phill can see the new configuration before sending chats.

### AI and SMTP readiness checks
- `/api/ai/status` reports whether `OPENAI_API_KEY` and `AI_MODEL` are set so the AI UI can guide users before sending requests.
- `/api/admin/email/status` (admin-only) surfaces whether SMTP credentials are present alongside the configured host and from-address; the `/admin/email` page reads it before enabling test sends.

4) Provide TLS certs for the origin so Cloudflare can connect on port 443 (prevents 521 errors):
   - Place your real certificate and key on the server at `deploy/ssl/fullchain.pem` and `deploy/ssl/privkey.pem` before going live. The `/deploy/ssl` directory is ignored by Git so you don’t accidentally commit private keys.
   - If those files are missing when the Nginx container starts, it now auto-generates a temporary self-signed certificate so the proxy can boot. Override the CN with `TLS_DOMAIN=<your-domain>` (defaults to `app.jarvis-fuel.com`). Replace the generated files with your real cert immediately after issuance.
   - You can also pre-generate a throwaway self-signed pair locally (do **not** commit it):
     - Easiest: `bash deploy/ssl/generate-self-signed.sh app.jarvis-fuel.com`
     - Manual OpenSSL equivalent:
       ```bash
       openssl req -x509 -nodes -days 365 \
         -newkey rsa:2048 \
         -keyout deploy/ssl/privkey.pem \
         -out deploy/ssl/fullchain.pem \
         -subj "/CN=app.jarvis-fuel.com"
       ```
   - Keep Cloudflare in **Full (Strict)** or **Full** mode so it reaches the origin over HTTPS.
   - Port 80 is kept open only to redirect to HTTPS and to serve `/healthz`.

5) Ensure Cloudflare DNS points `app.jarvis-fuel.com` and `jarvis-fuel.com` A records at `129.212.191.100`. If using Cloudflare proxy, enable Websockets.

6) Build and start the stack (runs Nginx, backend, frontend, Postgres):

```bash
cd /opt/phill
sudo docker compose up --build -d
```

7) Wait for health checks to report `healthy`:

```bash
sudo docker compose ps
sudo docker inspect --format='{{json .State.Health.Status}}' phill-backend
sudo docker inspect --format='{{json .State.Health.Status}}' phill-frontend
```

8) Verify routing through Nginx (HTTPS):

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

9) Common fixes if the site does not load:
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

## Server-side auth redirects
- Protected pages now redirect unauthenticated visitors to `/login?next=<path>` using cookies set during login.
- The login form accepts email for the username field and stores access + refresh tokens in cookies/localStorage; keep `NEXT_PUBLIC_API_URL` aligned so the token call hits the backend.
- After running `bootstrap_admin.py`, sign in via `/login` with the admin email/password, then revisit protected URLs (dashboard, incidents, tickets, documents, AI) to confirm redirects clear and data loads.
- Admins can review inbound access + reset submissions at `/admin/requests` after signing in; the lists are empty until users send requests from the login page.

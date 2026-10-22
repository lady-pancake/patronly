# Patronly

Patronly connects patrons with the artists they love. It starts as a website, with mobile apps to follow.

## Repository layout

```
patronly/
├── frontend/   Angular 21 + TypeScript + Tailwind CSS 4 + spartan/ui  → Vercel
├── backend/    FastAPI + Strawberry GraphQL + SQLAlchemy + Alembic      → Vercel (serverless)
│                └── Postgres database                                  → Supabase
└── .github/workflows/     CI: frontend tests + build, backend lint + tests + migrations
```

The frontend talks to the backend only through GraphQL at `/graphql`. A mobile app can reuse the same API later.

## Local development

You need Node.js 22.12+ (or 24), Python 3.12+, and a Postgres database (a Supabase project, or a local Postgres).

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env            # then fill in DATABASE_URL
alembic upgrade head            # create tables
python -m app.seed              # load the sample studios (safe to re-run; --prune drops removed ones)
uvicorn app.main:app --reload   # http://localhost:8000
```

- GraphQL playground (GraphiQL): http://localhost:8000/graphql
- REST health check: http://localhost:8000/health
- Tests and lint: `pytest` and `ruff check . && ruff format --check .`

The API starts without a database too. `health` then reports `database: "not_configured"`.

### Frontend

```bash
cd frontend
npm install
cp .env.example .env            # optional, defaults to http://localhost:8000/graphql
npm start                       # http://localhost:4200
```

At startup the app loads studios from the API's `artists` query. If the API can't be reached, or has no studios yet, it falls back to the bundled sample data and logs a warning in the browser console, so the UI still works on its own.

- Tests: `npm test`
- Production build: `npm run build`
- Add spartan/ui components: `npx ng g @spartan-ng/cli:ui <name>` (for example `dialog`, `input`). They land in `frontend/libs/ui` and import from `@spartan-ng/helm/<name>`.

The frontend reads `NG_APP_GRAPHQL_URL` at build time. `scripts/set-env.mjs` writes it into `src/environments/environment.ts` (generated, not committed) before every `start`, `build` and `test`.

### Sample GraphQL query

```graphql
query {
  health { status version database }
  artists(limit: 10, medium: "Painting") { slug displayName city priceMin priceMax availability }
  artist(slug: "maren") { displayName works { title imageUrl } reviews { quote author } }
}
```

### Sample studios

`backend/app/seed/catalogue.json` holds the prototype's 96 sample studios. `python -m app.seed` loads it into whatever `DATABASE_URL` points at, matching artists by slug, so re-running updates them instead of duplicating. The file is generated from the frontend's sample data: after changing `frontend/src/app/core/data/seed.ts`, run `npm run export-catalogue` in `frontend/`.

The studio builder starts from a sample studio (Alex Ward, with sample prices and payout details) kept in the `studio_templates` table. Edit `backend/app/seed/studio_template.json` and re-run `python -m app.seed` to change it. The frontend loads it with the `studioTemplate` query, and a guest's edits stay in their browser tab.

### Guest access and roles

Patronly is a portfolio prototype, so there are no real accounts.

- The sign-in page opens with a password gate. Visitors enter their name and the shared password. Each pass through the gate is saved as a row in the `guests` table (name, browser, first and last seen), so you can see who has looked around: `select name, created_at, last_seen_at from guests order by created_at desc;` in the Supabase SQL editor.
- The API then hands back a guest pass (a signed token, kept in the browser tab's session storage).
- The avatar menu switches between the **patron** and **artist** views. The API sends the list of actions each view allows (`me { roles { role entitlements } }`, defined in `backend/app/auth/entitlements.py`). The frontend only checks for an action (`viewer.can('VIEW_DASHBOARD')` and the `entitled(...)` route guard), never the role.
- Nothing a guest does is saved on the server. Favourites, messages and studio edits live in session storage and reset when the tab closes. The sample studios come from the database.
- The password is stored hashed in `backend/app/auth/guest.py`. Set `GUEST_PASSWORD` on the API to use a different one.
- Running locally (`npm start`) skips the gate and signs you in as "Local dev", without logging a visit. Set `NG_APP_SKIP_GATE=false` in `frontend/.env` to test the gate. Vercel builds always show it.

### Database migrations

Schema changes live in `backend/alembic/versions`. After changing `backend/app/db/models.py`:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

Migrations don't run on deploy. Apply them to Supabase before (or right after) pushing a change that needs them: run `alembic upgrade head` with `DATABASE_URL` pointing at Supabase, or apply the SQL from `alembic upgrade head --sql` in the Supabase SQL editor.

## Environment variables

| Where | Variable | Example | Notes |
| --- | --- | --- | --- |
| Vercel (API) | `DATABASE_URL` | `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres` | Supabase **Transaction pooler** string (port 6543), which suits serverless. `postgresql://` is switched to the async driver automatically. |
| Vercel (API) | `CORS_ORIGINS` | `https://patronly.vercel.app` | Comma separated. The web app's production URL (and custom domain later). |
| Vercel (API) | `CORS_ORIGIN_REGEX` | `https://patronly-.*\.vercel\.app` | Optional. Lets Vercel preview deployments call the API. |
| Vercel (API) | `ENVIRONMENT` | `production` | Hides GraphiQL in production. |
| Vercel (API) | `GUEST_PASSWORD` | | Optional. Replaces the built-in guest password. |
| Vercel (API) | `GUEST_TOKEN_SECRET` | | Optional. Signs guest passes; by default derived from `DATABASE_URL`. |
| Vercel (web) | `NG_APP_GRAPHQL_URL` | `https://patronly-api.vercel.app/graphql` | The API project's URL plus `/graphql`. |

Locally, `backend/.env` can use either the Session pooler (port 5432) or the Transaction pooler string. Examples live in `backend/.env.example` and `frontend/.env.example`. Never commit real `.env` files.

## Deploying (one-time setup)

The API and the web app are two Vercel projects built from the same repo, one with Root Directory `backend` and one with `frontend`.

### 1. Supabase (database)

1. Open **Connect** at the top of the Supabase project and copy the **Transaction pooler** connection string. Put the database password in place of `[YOUR-PASSWORD]`. (Forgot it? Project Settings → Database → Reset database password.)
2. Make sure the schema is up to date (see Database migrations above).

### 2. Vercel (API)

1. At https://vercel.com/new import the `lady-pancake/patronly` repo and name the project `patronly-api`.
2. Set **Root Directory** to `backend`. Vercel detects FastAPI, installs the packages listed in `pyproject.toml` and serves the `app` from `api/index.py`.
3. Add the environment variables `DATABASE_URL` (from step 1), `ENVIRONMENT=production` and, for now, `CORS_ORIGINS=http://localhost:4200`.
4. Deploy, then open `https://<api-project>.vercel.app/health`. You should see `"database":"ok"`.

On Vercel the API closes its database connection after each request (it detects the `VERCEL` environment variable), so it doesn't run out of connections when many requests come in at once.

### 3. Vercel (web)

1. Import the same repo again as a second project, `patronly`.
2. Set **Root Directory** to `frontend`. Vercel picks up `frontend/vercel.json` for the rest.
3. Add `NG_APP_GRAPHQL_URL` = `https://<api-project>.vercel.app/graphql`.
4. Deploy and note the production URL.

### 4. Connect them

In the API project, set `CORS_ORIGINS` to the web app's URL (for example `https://patronly.vercel.app`) and, if you want previews to work, `CORS_ORIGIN_REGEX` to `https://patronly-.*\.vercel\.app`. Redeploy the API, then open the web app. The System status card should show the API and database as `ok`.

After this, every push to `main` redeploys both, and Vercel builds previews for each pull request.

Vercel's free Hobby plan is for non-commercial use. Move both projects to Pro before Patronly takes real payments.

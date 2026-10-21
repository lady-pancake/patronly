# Patronly

Patronly connects patrons with the artists they love. It starts as a website, with mobile apps to follow.

## Repository layout

```
patronly/
├── frontend/   Angular 21 + TypeScript + Tailwind CSS 4 + spartan/ui  → Vercel
├── backend/    FastAPI + Strawberry GraphQL + SQLAlchemy + Alembic      → Render
│                └── Postgres database                                  → Supabase
├── render.yaml            Render Blueprint for the API
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
python -m app.seed              # load the sample studios (safe to re-run)
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

### Database migrations

Schema changes live in `backend/alembic/versions`. After changing `backend/app/db/models.py`:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

On Render, migrations run automatically each time the API starts.

## Environment variables

| Where | Variable | Example | Notes |
| --- | --- | --- | --- |
| Render (API) | `DATABASE_URL` | `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres` | Supabase **Session pooler** string. `postgresql://` is switched to the async driver automatically. |
| Render (API) | `CORS_ORIGINS` | `https://patronly.vercel.app` | Comma separated. Your Vercel production URL (and custom domain later). |
| Render (API) | `CORS_ORIGIN_REGEX` | `https://patronly-.*\.vercel\.app` | Optional. Lets Vercel preview deployments call the API. |
| Render (API) | `ENVIRONMENT` | `production` | Set by `render.yaml`. Hides GraphiQL in production. |
| Vercel (web) | `NG_APP_GRAPHQL_URL` | `https://patronly-api.onrender.com/graphql` | Your Render service URL plus `/graphql`. |

Examples live in `backend/.env.example` and `frontend/.env.example`. Never commit real `.env` files.

## Deploying (one-time setup)

Do these in order, because each step needs a value from the one before.

### 1. Supabase (database)

1. Create a project at https://supabase.com/dashboard. Save the database password somewhere safe.
2. Open **Connect** at the top of the project and copy the **Session pooler** connection string. Put your password in place of `[YOUR-PASSWORD]`.
   Use the session pooler, not the direct connection: Render only speaks IPv4, and Supabase's direct connection is IPv6.

### 2. Render (API)

1. At https://dashboard.render.com choose **New → Blueprint** and connect the `lady-pancake/patronly` GitHub repo. Render reads `render.yaml` and proposes the `patronly-api` service.
2. When asked, fill in `DATABASE_URL` (from step 1). Leave `CORS_ORIGINS` as `http://localhost:4200` for now.
3. Deploy. When it is live, open `https://<your-service>.onrender.com/health`. You should see `"database":"ok"`.

The free plan sleeps after 15 minutes without traffic, so the first request after a quiet spell takes up to about a minute.

### 3. Vercel (web)

1. At https://vercel.com/new import the `lady-pancake/patronly` repo.
2. Set **Root Directory** to `frontend`. Vercel picks up `frontend/vercel.json` for the rest.
3. Add the environment variable `NG_APP_GRAPHQL_URL` = `https://<your-service>.onrender.com/graphql`.
4. Deploy and note the production URL.

### 4. Connect them

Back in Render, set `CORS_ORIGINS` to your Vercel URL (for example `https://patronly.vercel.app`) and, if you want previews to work, `CORS_ORIGIN_REGEX` to `https://patronly-.*\.vercel\.app`. Save, let it redeploy, then open the Vercel site. The System status card should show the API and database as `ok`.

After this, every push to `main` redeploys both, and Vercel builds a preview for each pull request.

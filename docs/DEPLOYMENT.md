# Deployment Guide

The system deploys as **three independent pieces**: backend (Render), frontend (Vercel), and an
optional Postgres/PostGIS data layer (Supabase). Everything also runs locally via Docker Compose.

> **Status:** infrastructure-as-code and Dockerfiles are committed and validated to build. Live
> cloud deployment requires the operator's own Render/Vercel/Supabase accounts and credentials
> (none were provisioned in the build environment). Steps below are the exact runbook.

## 0. Local (one command)
```bash
docker compose up --build
# backend  -> http://localhost:8000/docs
# frontend -> http://localhost:3000   (map is free, no token required)
# postgis  -> localhost:5432 (gridlock/gridlock)
```

## 1. Backend → Render
1. Push repo to GitHub (done: `Manshu555/gridlock-round2`).
2. In Render: **New → Blueprint**, point to the repo. `deployment/render.yaml` provisions a Docker
   web service building `deployment/Dockerfile.backend`, health check `/health`.
3. Set env vars (Blueprint pre-fills): `GRIDLOCK_CORS_ORIGINS` = your Vercel URL, `GRIDLOCK_LOG_LEVEL` = `INFO`.
4. Deploy → note the URL, e.g. `https://gridlock-backend.onrender.com`. Verify `…/health` and `…/docs`.

## 2. Frontend → Vercel
1. In Vercel: **Add New Project → Import** the repo, set **Root Directory = `frontend`**.
2. Environment variables:
   - `NEXT_PUBLIC_API_URL` = the Render backend URL
   - `NEXT_PUBLIC_MAP_STYLE` *(optional)* — basemap is free/no-token (MapLibre + CARTO); only set this to override the style
3. Deploy (`next build`). Vercel gives `https://<project>.vercel.app`.

## 3. Data layer → Supabase (optional, for persistence)
1. Create a Supabase project; open the SQL editor.
2. Run `deployment/supabase_schema.sql` (enables PostGIS, creates `hotspot_cells`, `forecasts`, `pipeline_runs`).
3. Load scored outputs (e.g. via a small loader or `ogr2ogr` from `outputs/priority_zones.geojson`).
4. Point the backend at it with `DATABASE_URL` (uncomment in `render.yaml`).

## 4. CI/CD → GitHub Actions
`.github/workflows/ci.yml` runs on push/PR: ruff lint + pytest (`--cov-fail-under=80`) for Python,
and `next build` for the frontend. Render/Vercel auto-deploy on push to `main`.

## 5. Monitoring
- **UptimeRobot**: HTTP monitor on `<backend>/health` (5-min interval) and the frontend root.
- **Structured logs**: backend emits JSON logs (method, path, status, duration_ms) to stdout —
  visible in Render logs and scrapeable.

## Regenerating data
```bash
pip install -r requirements.txt
python -m parking_intel.pipeline --input datasets/violations.csv --outdir outputs
git add -f outputs/*.geojson outputs/*.json outputs/priority_zones.parquet outputs/forecast_results.parquet
git commit -m "chore(data): refresh pipeline outputs" && git push
```

# 🚦 Gridlock — AI-Powered Parking Intelligence Platform

Transform raw parking-violation data into **actionable enforcement intelligence**: detect illegal
parking **hotspots**, quantify their **congestion impact**, **forecast** where they will form next,
**prioritize** enforcement, and **simulate** the impact of acting — all on an interactive GIS dashboard.

Built for **Traffic Police, Smart-City Command Centres, Municipal Corporations, and Transport Authorities.**

> Grounded in a real dataset of **298,450 Bengaluru traffic-police parking-violation records**
> (Nov 2023 – Apr 2024). Architecture spec: [`APPROACH.md`](APPROACH.md).

---

## What it does (5 ML/GIS modules)

| Module | Question answered | Method |
|---|---|---|
| **M1 Hotspot Detection** | *Where* are illegal-parking hotspots? | H3 hex aggregation + **Getis-Ord Gi\*** |
| **M2 Congestion Impact (PCII)** | *How much* do they degrade traffic? | OSM-grounded **Proxy Congestion Impact Index** (0–100) |
| **M3 Forecasting** | *When/where* next? | **LightGBM** hotspot-risk forecast |
| **M4 Enforcement Priority (EPS)** | *Where* to enforce first? | Weighted **Enforcement Priority Score** |
| **M5 What-If Simulator** | *What do we gain* by acting? | Hotspot-removal → projected city-impact reduction |

## Architecture

```
violations.csv ─► clean ─► H3 aggregation ─► Gi* hotspots ─► OSM enrichment
                                                                   │
   Dashboard ◄─ FastAPI ◄─ EPS priority ◄─ LightGBM forecast ◄─ PCII impact + what-if
```

Full diagram: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Repository layout

```
backend/      FastAPI service (REST + OpenAPI)
frontend/     Next.js + TypeScript + Tailwind + Mapbox GL dashboard
ml/           parking_intel core library (M1–M5) + pipeline runner
gis/          geospatial helpers (H3, GeoJSON)
notebooks/    profiling / EDA
docs/         ARCHITECTURE, API, DEPLOYMENT, DATA_DICTIONARY, MODEL_CARD, USER_GUIDE, HACKATHON_PITCH
deployment/   Dockerfiles, docker-compose, render.yaml, vercel.json, supabase schema
tests/        pytest unit + integration tests
outputs/      generated artifacts (geojson / parquet / metrics)
```

## Quickstart

### 1. Run the data → intelligence pipeline
```bash
pip install -r requirements.txt
python -m parking_intel.pipeline --input "datasets/violations.csv" --outdir outputs
# produces: data_profile.json, hex_grid.parquet, hotspots.geojson,
#           pcii_scores.parquet, forecast_results.parquet, priority_zones.geojson, metrics.json
```

### 2. Run the API
```bash
cd backend && uvicorn app.main:app --reload
# Swagger UI: http://localhost:8000/docs
```

### 3. Run the dashboard
```bash
cd frontend && npm install && npm run dev
# http://localhost:3000   (set NEXT_PUBLIC_MAPBOX_TOKEN and NEXT_PUBLIC_API_URL in .env.local)
```

Or everything at once: `docker compose up --build`.

## Tech stack

**Frontend** Next.js · TypeScript · TailwindCSS · Mapbox GL · Recharts · React Query
**Backend** FastAPI · Pydantic · SQLAlchemy
**GIS** GeoPandas · H3 · PySAL · OSMnx
**ML** Pandas · NumPy · LightGBM · SHAP · scikit-learn
**Data** PostgreSQL + PostGIS (Supabase)
**Infra** Docker · Docker Compose · GitHub Actions · Vercel · Render

## License

MIT — see `LICENSE`.

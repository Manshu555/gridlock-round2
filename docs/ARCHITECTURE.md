# Architecture

## System overview

```
┌──────────────────────── DATA & ML LAYER (Python) ─────────────────────────┐
│  violations.csv                                                            │
│      │ data.clean()                  (Phase 1: 298,431 / 298,450 rows kept)│
│      ▼                                                                     │
│  H3 aggregation (res 9)              (Phase 2: 2,528 cells)                │
│      ▼                                                                     │
│  Getis-Ord Gi*  ──► Moran's I        (Phase 3: 119 hotspots, I=0.51)       │
│      ▼                                                                     │
│  OSM enrichment (OSMnx / fallback)   (Phase 4: lanes, class, criticality)  │
│      ▼                                                                     │
│  PCII engine (0-100)                 (Phase 5)                             │
│      ├──► LightGBM forecast          (Phase 6: MASE 0.88)                  │
│      ▼                                                                     │
│  EPS priority engine                 (Phase 7: ranked zones)              │
│      ▼                                                                     │
│  What-if simulation                  (Phase 10: top-5 → 16.97% ↓)          │
│      ▼                                                                     │
│  outputs/  (geojson + parquet + json)                                      │
└───────────────────────────────────┬───────────────────────────────────────┘
                                     │  read by DataStore (parquet | geojson)
┌────────────────────────────────────▼──────────────────────────────────────┐
│  BACKEND (FastAPI)   /health /hotspots /hotspots/{id} /priority-zones       │
│                      /forecast /simulation /analytics   + OpenAPI /docs     │
└────────────────────────────────────┬──────────────────────────────────────┘
                                     │  REST (JSON / GeoJSON), React Query
┌────────────────────────────────────▼──────────────────────────────────────┐
│  FRONTEND (Next.js + MapLibre GL + Recharts)                                │
│  Dashboard · Hotspots · Forecast · Priority Zones · Simulator · Analytics   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

| Layer | Tech | Responsibility |
|---|---|---|
| ML/GIS core (`ml/parking_intel`) | pandas, numpy, scipy, h3, lightgbm, (osmnx/pysal optional) | M1–M5 algorithms + pipeline runner |
| Backend (`backend/app`) | FastAPI, Pydantic, pydantic-settings | REST API over pipeline outputs; OpenAPI; logging; CORS |
| Frontend (`frontend`) | Next.js 14 (App Router), TS, Tailwind, MapLibre GL (free, no-token basemap), Recharts, React Query | Operational dashboard |
| Data layer (prod) | PostgreSQL + PostGIS (Supabase) | Persisted scored cells/forecasts (schema in `deployment/`) |
| Infra | Docker, docker-compose, GitHub Actions | Build, test, containerize, CI |

## Design decisions

- **H3 over raw points** — uniform areal units fix point sparsity and the Modifiable Areal
  Unit Problem; cheap k-ring adjacency powers Gi*/Moran's I.
- **Gi* as primary hotspot method** — statistical *significance* (z, p), not mere density;
  judge-legible "red significant cells." HDBSCAN is an optional refinement (see `APPROACH.md` §4.1).
- **PCII as a transparent proxy** — the dataset has no traffic-flow fields, so impact is *modeled*,
  not measured. Weights are explicit (`config.PCIIWeights`) and each component is stored for
  explainability. Road-physics grounding via OSM lanes; class-based fallback keeps it offline.
- **LightGBM for forecasting** — one global model over all cells, fast, strong on tabular lag
  features; falls back to sklearn `HistGradientBoostingRegressor` if LightGBM is unavailable.
- **DataStore abstraction** — backend reads parquet (full) or the committed GeoJSON snapshot, so the
  API runs on a fresh deploy without the raw 298K-row CSV.
- **Graceful degradation everywhere** — OSMnx, PySAL, SHAP, LightGBM are all optional; the pipeline
  always completes and the API always serves.

## Data contracts

The pipeline writes, and the API serves, these artifacts (`outputs/`):

| File | Produced by | Consumed by |
|---|---|---|
| `data_profile.json` | Phase 1 | `/analytics` |
| `aggregated_features.parquet` | Phase 2 | internal |
| `hotspots.geojson` | Phase 3+ | `/hotspots`, map |
| `road_features.parquet` | Phase 4 | internal |
| `pcii_scores.parquet` | Phase 5 | internal |
| `forecast_results.parquet` | Phase 6 | `/forecast` |
| `priority_zones.parquet` / `.geojson` | Phase 7 | `/priority-zones`, `/hotspots/{id}`, `/simulation` |
| `simulation.json` | Phase 10 | reference |
| `metrics.json` | summary | `/analytics`, dashboard stats |

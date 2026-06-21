# Gridlock — AI-Powered Parking Intelligence Platform Context

This file provides a high-level technical overview of the Gridlock repository to help quickly understand the architecture, tech stack, and module separation for future development.

## 1. Project Overview
Gridlock transforms raw parking-violation data (specifically from Bengaluru traffic-police records) into actionable enforcement intelligence. It consists of 5 core ML/GIS modules:
- **M1 Hotspot Detection**: Uses H3 hex aggregation and Getis-Ord Gi* to find statistically significant illegal-parking hotspots.
- **M2 Congestion Impact (PCII)**: Computes a Proxy Congestion Impact Index (0–100) using OpenStreetMap (OSM) data to estimate how much these hotspots degrade traffic.
- **M3 Forecasting**: Uses LightGBM (with a future roadmap for Temporal Fusion Transformer) to forecast hotspot risks.
- **M4 Enforcement Priority (EPS)**: Ranks enforcement zones based on a multi-factor Weighted Enforcement Priority Score.
- **M5 What-If Simulator / Dashboard**: Simulates the impact of enforcement actions to visualize projected congestion reduction on a MapLibre GL dashboard.

## 2. Tech Stack
- **Frontend**: Next.js, TypeScript, TailwindCSS, MapLibre GL, Recharts, React Query.
- **Backend**: FastAPI, Pydantic, SQLAlchemy.
- **ML & GIS**: Pandas, NumPy, LightGBM, scikit-learn, GeoPandas, H3, PySAL, OSMnx.
- **Database**: PostgreSQL + PostGIS (hosted on Supabase).
- **Deployment**: Docker, Docker Compose, GitHub Actions, Vercel, Render.

## 3. Repository Structure
- `backend/`: FastAPI REST service and OpenAPI definitions.
- `frontend/`: Next.js web application for the interactive dashboard.
- `ml/`: Core machine learning and geospatial processing pipeline (Modules 1-5).
- `datasets/`: Input datasets (e.g., `violations.csv`).
- `outputs/`: Generated artifacts (GeoJSON, Parquet files, ML model metrics).
- `docs/`: In-depth documentation including architecture specs, API definitions, and user guides.
- `deployment/`: Dockerfiles, `docker-compose.yml`, and deployment configurations for cloud providers.
- `tests/`: Pytest unit and integration tests.
- `APPROACH.md`: The primary engineering source-of-truth document detailing design decisions, algorithms, and mathematical reasoning.

## 4. How to Run Locally
### Full Stack via Docker
```bash
docker compose up --build
```

### Manual Setup
**Data Pipeline:**
```bash
pip install -r requirements.txt
python -m parking_intel.pipeline --input "datasets/violations.csv" --outdir outputs
```

**Backend API:**
```bash
cd backend && uvicorn app.main:app --reload
```

**Frontend Dashboard:**
```bash
cd frontend && npm install && npm run dev
```

## 5. Key Design Principles
- **No Direct Congestion Sensing**: The platform compensates for the lack of direct speed/flow data by modelling impact (PCII) using OSM road data (lanes, width, function).
- **Separation of Concerns**: Each ML module expects clean inputs (typically GeoDataFrames) and produces clear outputs. Modules can be upgraded (e.g., from LightGBM to TFT) without affecting others.
- **Defensibility over Complexity**: Emphasizes statistically significant clustering (Gi*) and physically grounded metrics over opaque deep learning where explainability is crucial for city officials.

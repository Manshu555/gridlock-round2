-- Supabase / PostGIS schema for the Gridlock production data layer.
-- Run in the Supabase SQL editor, or auto-applied by docker-compose for local PostGIS.

CREATE EXTENSION IF NOT EXISTS postgis;

-- Per-cell scored output (M1-M5 results) -------------------------------------
CREATE TABLE IF NOT EXISTS hotspot_cells (
    h3                TEXT PRIMARY KEY,
    geom              GEOMETRY(Polygon, 4326),
    violations        INTEGER NOT NULL,
    gi_z              DOUBLE PRECISION,
    gi_p              DOUBLE PRECISION,
    hotspot_category  TEXT,
    hotspot_score     DOUBLE PRECISION,
    is_hotspot        SMALLINT,
    pcii              DOUBLE PRECISION,
    eps               DOUBLE PRECISION,
    priority_rank     INTEGER,
    police_station    TEXT,
    road_class        TEXT,
    road_criticality  DOUBLE PRECISION,
    top_violation     TEXT,
    updated_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotspot_geom ON hotspot_cells USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_hotspot_eps  ON hotspot_cells (eps DESC);
CREATE INDEX IF NOT EXISTS idx_hotspot_pcii ON hotspot_cells (pcii DESC);

-- Daily forecast per cell ----------------------------------------------------
CREATE TABLE IF NOT EXISTS forecasts (
    id          BIGSERIAL PRIMARY KEY,
    h3          TEXT NOT NULL,
    forecast_date DATE NOT NULL,
    violations  DOUBLE PRECISION,
    prediction  DOUBLE PRECISION,
    UNIQUE (h3, forecast_date)
);
CREATE INDEX IF NOT EXISTS idx_forecast_h3 ON forecasts (h3);

-- Run metadata / metrics -----------------------------------------------------
CREATE TABLE IF NOT EXISTS pipeline_runs (
    id          BIGSERIAL PRIMARY KEY,
    run_at      TIMESTAMPTZ DEFAULT now(),
    rows_clean  INTEGER,
    n_cells     INTEGER,
    n_hotspots  INTEGER,
    morans_i    DOUBLE PRECISION,
    forecast_mase DOUBLE PRECISION,
    metrics     JSONB
);

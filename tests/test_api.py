"""Integration tests for the FastAPI backend.

Builds a tiny outputs/ snapshot from synthetic data, points the data store at it,
and exercises every endpoint with FastAPI's TestClient.
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from parking_intel import data as data_mod
from parking_intel import eps as eps_mod
from parking_intel import hotspots as hotspots_mod
from parking_intel import osm as osm_mod
from parking_intel import pcii as pcii_mod
from parking_intel.config import SETTINGS
from parking_intel.geojson_utils import write_geojson
from parking_intel.h3_index import aggregate, assign_cells


@pytest.fixture(scope="module")
def client(tmp_path_factory, _synthetic):
    out = tmp_path_factory.mktemp("outputs")
    scored = _synthetic
    scored.to_parquet(out / "priority_zones.parquet", index=False)
    write_geojson(
        scored,
        ["h3", "violations", "gi_z", "hotspot_category", "hotspot_score", "is_hotspot", "pcii",
         "police_station", "top_violation"],
        out / "hotspots.geojson",
    )
    (out / "metrics.json").write_text(f'{{"n_cells": {len(scored)}}}')

    # point the data store at the temp outputs
    from app.core import config as backend_config
    from app.services import data_store

    backend_config.settings.outputs_dir = out
    data_store.get_store.cache_clear()
    data_store.get_store().dir = out
    data_store.get_store().reload()

    from app.main import app
    return TestClient(app)


@pytest.fixture(scope="module")
def _synthetic(synthetic_events):
    clean = data_mod.clean(synthetic_events)
    clean = assign_cells(clean, SETTINGS.h3_resolution)
    agg = aggregate(clean)
    agg = hotspots_mod.gi_star(agg)
    agg = osm_mod.enrich(agg)
    agg = pcii_mod.compute(agg)
    return eps_mod.compute(agg)


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["data_available"] is True


def test_root(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "/hotspots" in r.json()["endpoints"]


def test_hotspots_geojson(client):
    r = client.get("/hotspots")
    assert r.status_code == 200
    fc = r.json()
    assert fc["type"] == "FeatureCollection"
    assert len(fc["features"]) > 0
    assert "pcii" in fc["features"][0]["properties"]


def test_hotspots_significant_filter(client):
    r = client.get("/hotspots?significant_only=true")
    assert r.status_code == 200


def test_hotspot_detail_and_404(client):
    fc = client.get("/hotspots").json()
    h3_id = fc["features"][0]["properties"]["h3"]
    r = client.get(f"/hotspots/{h3_id}")
    assert r.status_code == 200
    assert r.json()["h3"] == h3_id
    assert client.get("/hotspots/does-not-exist").status_code == 404


def test_priority_zones(client):
    r = client.get("/priority-zones?limit=10")
    assert r.status_code == 200
    zones = r.json()
    assert len(zones) <= 10
    assert zones[0]["priority_rank"] == 1


def test_simulation(client):
    r = client.get("/simulation?k=3&compliance=0.85")
    assert r.status_code == 200
    body = r.json()
    assert body["reduction_pct"] > 0
    assert body["city_impact_after"] < body["city_impact_before"]


def test_analytics(client):
    r = client.get("/analytics")
    assert r.status_code == 200
    assert "metrics" in r.json()

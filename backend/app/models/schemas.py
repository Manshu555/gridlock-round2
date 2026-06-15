"""Pydantic response models (OpenAPI schemas + validation)."""
from __future__ import annotations

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str
    data_available: bool
    n_cells: int | None = None


class HotspotProperties(BaseModel):
    h3: str
    violations: int
    gi_z: float | None = None
    gi_p: float | None = None
    hotspot_category: str | None = None
    hotspot_score: float | None = None
    is_hotspot: int | None = None
    pcii: float | None = None
    police_station: str | None = None
    top_violation: str | None = None


class HotspotDetail(HotspotProperties):
    eps: float | None = None
    priority_rank: int | None = None
    road_class: str | None = None
    road_criticality: float | None = None
    pcii_breakdown: dict[str, float] | None = None


class PriorityZone(BaseModel):
    priority_rank: int
    h3: str
    police_station: str | None = None
    eps: float
    pcii: float
    violations: int
    hotspot_category: str | None = None
    road_class: str | None = None
    eps_pcii_component: float | None = None
    eps_freq_component: float | None = None
    eps_crit_component: float | None = None


class ForecastPoint(BaseModel):
    h3: str
    date: str
    violations: float
    prediction: float


class SimulationRequest(BaseModel):
    k: int = Field(5, ge=1, le=100, description="Number of top-EPS zones to enforce")
    compliance: float = Field(0.85, ge=0.0, le=1.0, description="Deterrence fraction 0..1")


class SimulationResponse(BaseModel):
    k: int
    ranked_by: str
    cells_cleared: int
    compliance_factor: float
    city_impact_before: float
    city_impact_after: float
    absolute_reduction: float
    reduction_pct: float
    violations_addressed: int
    cleared_cell_ids: list[str]

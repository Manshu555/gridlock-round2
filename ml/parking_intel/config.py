"""Central configuration: paths, H3 resolution, scoring weights, severity/footprint maps.

All tunable knobs live here so weights are auditable and reproducible (see APPROACH.md §11.2).
"""
from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
REPO_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_INPUT = REPO_ROOT / "datasets" / "violations.csv"
DEFAULT_OUTDIR = REPO_ROOT / "outputs"

# ---------------------------------------------------------------------------
# Spatial config
# ---------------------------------------------------------------------------
H3_RESOLUTION = 9          # ~175 m edge; primary analytical cell
H3_RESOLUTION_COARSE = 8   # ~460 m edge; reporting rollup
BENGALURU_BBOX = {"min_lat": 12.7, "max_lat": 13.25, "min_lon": 77.3, "max_lon": 77.85}

# ---------------------------------------------------------------------------
# Violation severity weights (congestion contribution), 0..1.  See APPROACH.md §5.2.
# ---------------------------------------------------------------------------
VIOLATION_SEVERITY: dict[str, float] = {
    "PARKING IN A MAIN ROAD": 1.00,
    "DOUBLE PARKING": 1.00,
    "PARKING NEAR ROAD CROSSING": 0.95,
    "PARKING NEAR TRAFFIC LIGHT OR ZEBRA CROSS": 0.95,
    "PARKING NEAR BUSTOP/SCHOOL/HOSPITAL ETC": 0.90,
    "WRONG PARKING": 0.80,
    "NO PARKING": 0.75,
    "PARKING ON FOOTPATH": 0.55,
    "PARKING OPPOSITE TO ANOTHER PARKED VEHICLE": 0.70,
    "PARKING OTHER THAN BUS STOP": 0.60,
    "DEFECTIVE NUMBER PLATE": 0.10,
    "USING BLACK FILM/OTHER MATERIALS": 0.05,
    "WITHOUT SIDE MIRROR": 0.05,
    "REFUSE TO GO FOR HIRE": 0.05,
    "DEMANDING EXCESS FARE": 0.05,
}
DEFAULT_SEVERITY = 0.60

# ---------------------------------------------------------------------------
# Vehicle footprint weights (carriageway occupied), 0..1.
# ---------------------------------------------------------------------------
VEHICLE_FOOTPRINT: dict[str, float] = {
    "LGV": 1.00, "PRIVATE BUS": 1.00, "BUS (BMTC/KSRTC)": 1.00, "TEMPO": 0.90,
    "MAXI-CAB": 0.85, "VAN": 0.80, "CAR": 0.75, "GOODS AUTO": 0.70,
    "PASSENGER AUTO": 0.55, "MOTOR CYCLE": 0.30, "SCOOTER": 0.28, "MOPED": 0.25,
}
DEFAULT_FOOTPRINT = 0.50

# ---------------------------------------------------------------------------
# Road functional class -> (default lanes per direction, criticality 0..1).
# Used by OSM enrichment and as the OFFLINE fallback when OSMnx is unavailable.
# ---------------------------------------------------------------------------
ROAD_CLASS_DEFAULTS: dict[str, dict[str, float]] = {
    "motorway":     {"lanes": 3, "criticality": 1.00},
    "trunk":        {"lanes": 3, "criticality": 0.95},
    "primary":      {"lanes": 2, "criticality": 0.85},
    "secondary":    {"lanes": 2, "criticality": 0.70},
    "tertiary":     {"lanes": 1, "criticality": 0.55},
    "residential":  {"lanes": 1, "criticality": 0.35},
    "unclassified": {"lanes": 1, "criticality": 0.40},
    "service":      {"lanes": 1, "criticality": 0.25},
}
DEFAULT_ROAD_CLASS = "secondary"


@dataclass(frozen=True)
class PCIIWeights:
    """Proxy Congestion Impact Index weights (must sum to 1.0). APPROACH.md §6.2 / Phase 5."""
    violation_density: float = 0.35
    road_capacity_reduction: float = 0.25
    junction_importance: float = 0.20
    vehicle_footprint: float = 0.10
    temporal_persistence: float = 0.10

    def as_dict(self) -> dict[str, float]:
        return {
            "violation_density": self.violation_density,
            "road_capacity_reduction": self.road_capacity_reduction,
            "junction_importance": self.junction_importance,
            "vehicle_footprint": self.vehicle_footprint,
            "temporal_persistence": self.temporal_persistence,
        }


@dataclass(frozen=True)
class EPSWeights:
    """Enforcement Priority Score weights (must sum to 1.0). APPROACH.md §6.2 / Phase 7."""
    pcii: float = 0.50
    violation_frequency: float = 0.30
    road_criticality: float = 0.20


@dataclass(frozen=True)
class Settings:
    h3_resolution: int = H3_RESOLUTION
    pcii_weights: PCIIWeights = field(default_factory=PCIIWeights)
    eps_weights: EPSWeights = field(default_factory=EPSWeights)
    hotspot_z_threshold: float = 1.96   # Gi* z-score for p<0.05
    forecast_horizon_days: int = 7


SETTINGS = Settings()

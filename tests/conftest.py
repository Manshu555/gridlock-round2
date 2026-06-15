"""Shared fixtures: a small synthetic violation dataset usable without the real CSV."""
from __future__ import annotations

import numpy as np
import pandas as pd
import pytest


@pytest.fixture(scope="session")
def synthetic_events() -> pd.DataFrame:
    """~2000 synthetic violations clustered around 3 Bengaluru centres."""
    rng = np.random.default_rng(42)
    centres = [(12.9766, 77.5993), (12.9719, 77.6412), (12.9081, 77.6476)]
    rows = []
    base = pd.Timestamp("2023-11-01", tz="UTC")
    vtypes = [["WRONG PARKING"], ["NO PARKING"], ["PARKING IN A MAIN ROAD"],
              ["PARKING ON FOOTPATH"], ["DOUBLE PARKING"]]
    vehicles = ["CAR", "SCOOTER", "MOTOR CYCLE", "LGV", "PASSENGER AUTO"]
    for i in range(2000):
        clat, clon = centres[i % len(centres)]
        lat = clat + rng.normal(0, 0.004)
        lon = clon + rng.normal(0, 0.004)
        ts = base + pd.Timedelta(days=int(rng.integers(0, 120)), hours=int(rng.integers(0, 24)))
        import json as _json
        rows.append(
            {
                "id": f"FKID{i:06d}",
                "latitude": lat,
                "longitude": lon,
                "vehicle_type": vehicles[i % len(vehicles)],
                "vehicle_number": f"FKN{i % 500:05d}",
                "violation_type": _json.dumps(vtypes[i % len(vtypes)]),
                "created_datetime": ts.strftime("%Y-%m-%d %H:%M:%S+00"),
                "police_station": ["Upparpet", "Shivajinagar", "City Market"][i % 3],
                "junction_name": "BTP051 - Test Jn" if i % 4 == 0 else "No Junction",
                "validation_status": "approved",
            }
        )
    return pd.DataFrame(rows)

"""Tests for displacement-aware enforcement simulation."""
from __future__ import annotations

import h3
import pandas as pd
import pytest

from parking_intel.simulate import simulate_enforcement


def _two_adjacent_cells() -> tuple[str, str]:
    c1 = h3.latlng_to_cell(12.9716, 77.5946, 9)
    neighbors = [n for n in h3.grid_disk(c1, 1) if n != c1]
    return c1, neighbors[0]


def test_displacement_reduces_net_impact():
    c1, c2 = _two_adjacent_cells()
    scored = pd.DataFrame([
        {"h3": c1, "pcii": 100.0, "violations": 10},
        {"h3": c2, "pcii": 50.0, "violations": 5},
    ])

    no_disp = simulate_enforcement(scored, [c1], compliance=1.0, displacement_rate=0.0)
    with_disp = simulate_enforcement(scored, [c1], compliance=1.0, displacement_rate=0.5)

    # Net reduction is smaller once displacement leakage is modelled.
    assert with_disp["reduction_pct"] < no_disp["reduction_pct"]
    assert with_disp["absolute_reduction"] < no_disp["absolute_reduction"]
    # Gross (ignoring displacement) matches the no-displacement reduction.
    assert with_disp["gross_reduction"] == pytest.approx(no_disp["absolute_reduction"])

# Data Dictionary

## Source dataset (`datasets/violations.csv`)

298,450 anonymized Bengaluru traffic-police parking-violation records, Nov 2023 – Apr 2024.

| Column | Type | Notes |
|---|---|---|
| `id` | string | Anonymized event id (`FKID######`) |
| `latitude`, `longitude` | float | WGS84; 100% populated |
| `location` | string | Free-text address |
| `vehicle_number` | string | Anonymized plate (`FKN#####`) |
| `vehicle_type` | string | CAR, SCOOTER, MOTOR CYCLE, PASSENGER AUTO, LGV, … |
| `violation_type` | JSON array | Multi-label, e.g. `["WRONG PARKING","NO PARKING"]` |
| `offence_code` | JSON array | Numeric codes paired with violation_type |
| `created_datetime` | datetime (UTC) | Event time; converted to IST for features |
| `closed_datetime`, `action_taken_timestamp`, `validation_timestamp` | datetime | Mostly NULL (enforcement lifecycle) |
| `police_station` | string | Enforcement zone (Upparpet, Shivajinagar, …) |
| `junction_name` | string | Named junction or "No Junction" |
| `validation_status` | string | approved / rejected / NULL / created1 / … |
| `device_id`, `created_by_id`, `center_code`, `data_sent_to_scita` | string/bool | Provenance/pipeline flags |

### Known data-quality notes
- Filename says "jan to may" but `created_datetime` spans **Nov 2023 → Apr 2024**.
- `validation_status` NULL on ~125K rows → analyses can run all-records or approved-only.
- Report-based ⇒ **patrol-sampled**: absence of records ≠ absence of violations.

## Engineered per-event fields (`data.clean`)
`date, hour, dayofweek, is_weekend, month, violation_types (list), primary_violation,
near_junction, severity (mean type weight), footprint (vehicle weight)`.

## Per-cell features (`h3_index.aggregate`, one row per H3 res-9 cell)

| Field | Meaning |
|---|---|
| `h3` | H3 res-9 index (primary key) |
| `violations` | Event count in cell |
| `severity_mean` | Mean violation-type severity (0–1) |
| `footprint_mean` | Mean vehicle footprint (0–1) |
| `near_junction_share` | Fraction of events near a junction |
| `active_days`, `temporal_persistence` | Days active / fraction of window active |
| `violations_per_day` | Intensity |
| `unique_vehicles` | Distinct anonymized plates |
| `police_station`, `top_violation` | Modal labels |
| `cell_lat`, `cell_lon` | Cell centroid |

## Scored fields (added by M1/M2/M4)

| Field | Module | Meaning |
|---|---|---|
| `gi_z`, `gi_p`, `hotspot_category`, `hotspot_score`, `is_hotspot` | M1 | Getis-Ord Gi* significance |
| `road_class`, `lanes`, `road_criticality`, `osm_source` | OSM | Road attributes (osmnx or fallback) |
| `pcii` + `pcii_density/capacity/junction/footprint/persistence` | M2 | Impact score 0–100 + components |
| `eps` + `eps_pcii/freq/crit_component`, `priority_rank` | M4 | Enforcement priority |

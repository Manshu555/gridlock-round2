# Datasets

The pipeline expects a single CSV of parking-violation events at
`datasets/violations.csv` (path configurable via `parking_intel.config.DEFAULT_INPUT`).

## Expected schema

The cleaner (`parking_intel.data.clean`) is robust to the anonymized export schema:

| column             | type            | notes                                                        |
|--------------------|-----------------|--------------------------------------------------------------|
| `id`               | string          | unique challan id                                            |
| `latitude`         | float           | WGS84; filtered to the Bengaluru bbox                        |
| `longitude`        | float           | WGS84                                                        |
| `location`         | string          | free-text address (display only)                             |
| `vehicle_number`   | string          | used for repeat-offender ratio                               |
| `vehicle_type`     | string          | mapped to carriageway footprint                              |
| `violation_type`   | JSON array str  | e.g. `["WRONG PARKING","NO PARKING"]` (multi-label)          |
| `offence_code`     | JSON array str  | optional                                                     |
| `created_datetime` | datetime        | parsed to UTC then converted to IST for temporal features    |
| `police_station`   | string          | dominant station per cell; exposure-proxy for de-bias        |
| `junction_name`    | string          | `No Junction` when absent                                    |
| `validation_status`| string          | `approved` / `rejected` / `duplicate` / NULL (unreviewed)    |

## Validation filtering

`clean()` drops rows whose `validation_status` is `rejected` or `duplicate`
(officially-invalid challans) so they never inflate hotspots. Unreviewed (NULL) rows
are kept by default (`keep_unreviewed=True`).

## Running without the real CSV

The test-suite generates a schema-accurate synthetic dataset in
`tests/conftest.py::synthetic_events` (~2000 rows clustered around three Bengaluru
centres). The end-to-end pipeline test (`tests/test_forecast_pipeline.py`) runs the
full pipeline on that synthetic data, so the project is reproducible without the
proprietary export.

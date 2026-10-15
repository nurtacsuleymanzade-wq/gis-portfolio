# NOVA Engineering Lab — three functional proof-of-concept demos

**Live demo:** https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/

**Author:** Nurtac Suleymanzade — AI Automation & Geospatial Engineer.

## What is implemented

| Demo | Real functionality | Boundary |
| --- | --- | --- |
| GPU Batch Planner | Multi-worker greedy scheduling, makespan, GPU-hour cost estimates, JSON job manifest export | Browser-side **simulation**, not a connected ComfyUI renderer. Preset timings are assumptions, not measured benchmarks. |
| ETL Automation | CSV parsing, completeness checks, deduplication, numeric threshold filtering, processing audit, CSV download | Browser-side ETL; a standalone Python implementation is included. |
| Spatial Site Selector | Haversine distance, normalized weighted multi-criteria scoring, live ranking, CSV export | **Synthetic** candidate coordinates and attributes, not real land-use recommendations. |

## Reproducible Python ETL

Requirements: Python 3.9+ (stdlib only).

```bash
cd demos
python3 -m unittest -v test_etl_pipeline.py
python3 etl_pipeline.py sample_input.csv --output cleaned.csv --audit audit.json
```

Expected input records: **7**. Expected output records: **4**. Expected rejected records: 1 missing, 1 duplicate, 1 below threshold.

## Why these demos?

These are **small testable client-style pilots**:
1. A video producer can compare render queue sizes and estimate scheduling cost before renting GPU capacity.
2. A data team can inspect the transformation logic and reproducible audit trail before building an API-connected ETL pipeline.
3. A site-selection client can inspect transparent suitability weights and spatial distance calculation before commissioning real geospatial analysis.

The interactive web prototypes run locally in the browser with no account, API keys, tracking or data uploads.

## Production extensions available on request

- ComfyUI/MiniMax/LTX deployment, real queue telemetry, GPU autoscaling and retry policies
- Scheduled ETL with schema contracts, APIs, PostGIS and observability
- Real OSM/DEM/geocoding datasets, QGIS validation, spatial statistics and map publishing

**Do not describe the browser GPU planner as an actual GPU render engine.** Real render outputs should be linked separately with measured hardware and logs.

[Upwork profile](https://www.upwork.com/freelancers/~0184687ebeea3486f2)

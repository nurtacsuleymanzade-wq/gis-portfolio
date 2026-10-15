# Upwork portfolio entries — ready for publishing

These are original, self-directed demonstration projects, **not client commissions**. Do not claim real customer outcomes or a live GPU-connected production system.

## 1. GPU Batch Planner — AI Video Production Queue & Cost Estimation

**Category:** AI automation / GPU workflow planning

**Description:**
Built an interactive GPU batch-planning prototype for AI video production. Users choose a model preset, clip count, clip duration, GPU worker count and hourly rate. The app produces an estimated makespan, GPU cost, throughput, a worker-by-worker job schedule and an exportable JSON manifest.

**Engineering concepts:** GPU scheduling, parallel processing, throughput estimation, queue planning, cost optimization, exportable job manifests.

**Honest limitation:** GPU timings are adjustable assumptions; this browser demo does not submit actual ComfyUI jobs.

**Live:** https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/?demo=gpu

## 2. Auditable Python ETL — CSV Cleaning & Reproducible Data Pipeline

**Category:** Python / data engineering / workflow automation

**Description:**
Created an auditable CSV data-cleaning pipeline with both an interactive browser demo and a standalone Python CLI implementation. Features include required-field checks, ID deduplication, numeric validation, threshold filtering, clean CSV export and a structured processing audit. Includes regression tests and sample data.

**Engineering concepts:** Python, CSV ETL, data quality, deterministic transformations, unit testing, audit logs.

**Verification:** Three Python regression tests passed. The 7-row sample dataset produces 4 valid output rows.

**Live:** https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/?demo=etl

**Code:** https://github.com/nurtacsuleymanzade-wq/gis-portfolio/blob/main/demos/etl_pipeline.py

## 3. Spatial Site Selector — Transparent GIS Multi-Criteria Ranking

**Category:** GIS / spatial analytics / location intelligence

**Description:**
Developed an interactive site-suitability decision-support prototype. It calculates Haversine distance from a service hub, applies configurable weights to demand, proximity and risk, and instantly ranks candidate sites. Users can export a scored CSV for review.

**Engineering concepts:** GIS, Haversine distance, weighted multi-criteria decision analysis, spatial decision support, interactive visualization.

**Honest limitation:** Candidate coordinates and attributes are fictional; this demonstrates the method, not a real-world site recommendation.

**Live:** https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/?demo=geo

---

**Recommended Upwork presentation:** Label each entry as *Personal project / technical demonstration*, attach a screenshot of the relevant tab and include its exact live URL in the portfolio entry where permitted. Do not upload these as examples of paid client work.

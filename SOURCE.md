# SOURCE — Portfolio map data provenance

One-page note for clients and for GitHub Pages visitors who want to know where the cartography data comes from.

## Portfolio images on this site

| Slot | File | Role |
|------|------|------|
| 1 | `maps/01_Tourism_Spatial_Density_ADM2.png` | Tourism spatial distribution (ADM2 choropleth) |
| 2 | `maps/02_Academic_Lodging_vs_Cultural.png` | Academic thematic (lodging vs cultural) |
| 3 | `maps/03_MultiLayer_Tourism_Reference.png` | Multi-layer tourism reference |
| 4 | `maps/04_Locator_Qusar_Detail_Inset.png` | Locator + Qusar detail inset |

These PNG exports were copied from the GIS project path:

`AZERBAIJAN_GIS/portfolio/maps/`

They are **real QGIS cartography** (not AI-generated map images), produced for freelancing samples. Layout CRS for print work in that project: **EPSG:32639** (WGS 84 / UTM zone 39N).

Project notes: `AZERBAIJAN_GIS/portfolio/README.md`  
Feature provenance registry: `AZERBAIJAN_GIS/portfolio/SOURCE_REGISTRY.csv`

## Upstream GIS data sources

Full layer-by-layer inventory (organization, path, CRS, license notes):

- **CSV registry:** `AZERBAIJAN_GIS/data_sources.csv`
- **Human-readable sources doc:** `AZERBAIJAN_GIS/README_sources.md`
- **Project README:** `AZERBAIJAN_GIS/README.md`

### Summary of major inputs (see CSV for details)

| Theme | Typical source | License / notes |
|-------|----------------|-----------------|
| Tourism points (lodging, food, cultural, etc.) | User-provided KML inventory | SOURCE_UNKNOWN (user file; no license text in KML) |
| Admin boundaries ADM0–ADM2 | geoBoundaries (wmgeolab) gbOpen AZE | See project SOURCE docs |
| Roads, hydro, places, peaks, tourism OSM | OpenStreetMap via Geofabrik Azerbaijan extract | **ODbL** — © OpenStreetMap contributors |
| DEM / hillshade / hypsometry | CGIAR-CSI SRTM (derived products) | Acknowledge CIAT / CGIAR terms |

Basemap XYZ / WMS / Esri tiles were **not** used in the AZERBAIJAN_GIS QGIS project build documented in `data_sources.csv`.

## Software

Maps produced in **QGIS** (layouts + PyQGIS export scripts under the portfolio project).

## Honesty label on the website

Gallery captions mark these maps as **sample cartography** so freelance clients understand they are portfolio examples from the Azerbaijan tourism GIS workstream.

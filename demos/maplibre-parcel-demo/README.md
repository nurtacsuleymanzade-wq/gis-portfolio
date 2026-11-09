# Lotline — Parcel Atlas

A browser-based parcel screening prototype built with MapLibre GL JS. It pairs a large interactive map with focused search, filters, parcel details and export controls.

## Live demo

[Open Lotline — Parcel Atlas](https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/maplibre-parcel-demo/?rev=lotline-20261110)

## Interface

The map remains the main workspace. A compact parcel panel holds search, land-use and availability filters, context layers, and a short result list. The cool mineral palette and boundary-grid mark are specific to land records; zoning colors are repeated in the map legend.

## Features

- MapLibre vector map with 1,147 generated parcel polygons, flood-context areas and utility-site points.
- Search by parcel ID, filters for land use/status/minimum area, and map/list selection.
- Parcel detail panel, browser-local shortlist, CSV export and filtered GeoJSON export.
- Responsive layout, visible keyboard focus and reduced-motion support.

## Run locally

Serve this directory over HTTP (opening the file directly may block map requests):

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Data and service limits

Parcel, flood-context and utility features are synthetic examples centered on Springfield, Missouri. They are not property records and must not be used for investment or permitting decisions. The base style uses MapLibre's public demo tiles; select a supported production style and data source before production use.

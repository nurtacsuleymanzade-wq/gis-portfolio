# ParcelScope — MapLibre demo

Static, browser-based parcel-screening prototype for a GIS portfolio. It uses MapLibre GL JS with a public demo vector style and locally generated **synthetic** parcel/context features around Springfield, Missouri.

## Live demo

[Open the interactive MapLibre demo](https://nurtacsuleymanzade-wq.github.io/gis-portfolio/demos/maplibre-parcel-demo/?rev=86befe1a3032b9c102efbc4fd7f20bca0ad33295).

## Run locally

Serve this directory over HTTP (opening the file directly may block map requests):

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Features

- Interactive MapLibre vector map with parcel polygons, flood-context polygons and utility-site points.
- Search by parcel ID, filters for zoning/status/minimum site area, and map/list selection.
- Detail card, browser-local shortlist, CSV export and filtered GeoJSON export.
- Responsive layout; no API key, account, or backend required.

## Data and service limits

Every parcel, flood-context shape, and utility point is fabricated for this demo. It is not a property dataset and must not be used for investment or permitting decisions. The base style is MapLibre's public demo style; replace it with a supported production tile/style service before production use.

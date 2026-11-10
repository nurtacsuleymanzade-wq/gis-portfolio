# Shahdag 3D resort map (GeoJSON)

Live: https://nurtacsuleymanzade-wq.github.io/gis-portfolio/samples/mapbox-geojson-3d/

Interactive MapLibre GL JS map (Mapbox GL JS style-spec and APIs) of Shahdag Mountain Resort, Qusar District, Azerbaijan. Features come only from OpenStreetMap; no amenities were invented.

## Data

- OpenStreetMap, extracted 10 November 2026 via the official OSM API (`/api/0.6/map`), clipped to lon 48.124–48.172, lat 41.278–41.338. © OpenStreetMap contributors, ODbL 1.0.
- Terrain: AWS Terrain Tiles (Terrarium encoding, SRTM-based).
- Imagery: Esri World Imagery (Esri, Maxar, Earthstar Geographics) or Sentinel-2 cloudless 2016 by EOX IT Services GmbH (contains modified Copernicus Sentinel data, CC BY 4.0).


## Honest limits

OSM has 12 lifts and 30 downhill segments here; the official resort site lists about 20 lifts and 37 slopes. Gaya Residences is not named in this extract and is not added. Building heights use OSM `height` or `building:levels` × 3.2 m, with a 9 m default on untagged footprints.

# Nurtac Suleymanzade — GIS Portfolio

Cinematic static portfolio for **Nurtac Suleymanzade** (GIS freelancer).  
Vanilla HTML / CSS / JS — **GitHub Pages** friendly. No build step, no API keys.

Inspired by immersive atmospheric sites (e.g. Árstraumur energy) — adapted for **GIS / cartography**, not music.

## Features

- **Three.js** full-viewport cosmic scene (starfield + stylized globe + dust), lazy-loaded after first paint; **Calm** button + `prefers-reduced-motion` fallback
- **Leaflet** interactive atlas: ADM2 choropleth (`n_total`), tourism points, Qusar highlight, ADM0 outline — Carto Dark Matter basemap
- **Studio stack**: QGIS, ArcGIS, MapInfo, Mapbox, Leaflet, PostGIS, Earth Engine, GeoServer/MapServer, Python, GDAL
- Services, print gallery (CRS QA note), contact

## Local preview

GeoJSON and modules need a local server (not `file://`):

```bash
cd gis-portfolio-site
python3 -m http.server 8080
# → http://localhost:8080
```

Verify:

1. Hero shows dark cosmic background; after ~1s the 3D globe/stars appear (Chromium). Click **Calm** to freeze to CSS gradient.
2. **Atlas** section: map tiles + rayons color by `n_total`; click a rayon for name + counts; atlas points and Qusar outline load.
3. Stack / Services / Print / Contact sections render; lightbox opens on print thumbs.
4. Mobile: hamburger nav; map legend stacks under the map.

## GitHub Pages

Live (when Pages enabled):  
**https://nurtacsuleymanzade-wq.github.io/gis-portfolio/**

1. Push this folder to the repo **root** (already: `nurtacsuleymanzade-wq/gis-portfolio`).
2. **Settings → Pages** → Source: Deploy from a branch → Branch: `main` → Folder: `/ (root)`.
3. Save. Wait a minute for the site to publish.

No Actions workflow required for plain static files.

## Structure

```
gis-portfolio-site/
├── index.html
├── css/styles.css
├── js/
│   ├── site.js      # nav, lightbox, calm, lazy Three
│   ├── map.js       # Leaflet + GeoJSON
│   └── scene.js     # Three.js procedural scene
├── data/
│   ├── adm2_tourism.geojson
│   ├── tourism_atlas.geojson
│   ├── qusar.geojson
│   └── adm0.geojson
├── maps/            # print PNG samples
├── SOURCE.md
├── README.md
└── .gitignore
```

## Contact

- Email: nurtac.suleymanzade@gmail.com  
- Instagram: [@nurtacsuleymanzadeh](https://instagram.com/nurtac.suleymanzadeh)  
- Pages: [nurtacsuleymanzade-wq.github.io/gis-portfolio](https://nurtacsuleymanzade-wq.github.io/gis-portfolio/)

## Attribution

Basemap © OpenStreetMap · © CARTO. Admin / tourism layers — see `SOURCE.md`.  
3D via [Three.js](https://threejs.org/); maps via [Leaflet](https://leafletjs.com/).

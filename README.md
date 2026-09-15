# Nurtac Suleymanzade — GIS Portfolio Site

Static portfolio for **Nurtac Suleymanzade** (GIS Specialist | QGIS cartography).  
HTML / CSS / JS only — no build step. Ready for **GitHub Pages**.

## Local preview

Open `index.html` in a browser, or serve the folder:

```bash
cd gis-portfolio-site
python3 -m http.server 8080
# → http://localhost:8080
```

## Enable GitHub Pages

1. Create a new GitHub repository (e.g. `gis-portfolio` or `nurtac-gis`).
2. Push this folder to the repo **root** (or put these files under `/docs`).
3. On GitHub: **Settings → Pages**.
4. Under **Build and deployment**:
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/ (root)` — or `/docs` if you keep the site in a `docs/` folder
5. Save. The site will be at `https://<username>.github.io/<repo>/` (or a custom domain if configured).

### Root vs `/docs`

| Layout | Pages folder setting |
|--------|----------------------|
| Repo root = this site (`index.html` at root) | `/ (root)` |
| Site lives in `docs/` | `/docs` |

No Actions workflow is required for plain static files.

## Structure

```
gis-portfolio-site/
├── index.html
├── css/styles.css
├── js/main.js
├── maps/                 # portfolio PNG exports
├── SOURCE.md             # data provenance pointer
├── README.md
└── .gitignore
```

## Portfolio maps

Images in `maps/` come from `/workspace/AZERBAIJAN_GIS/portfolio/maps/` (QGIS PNG exports).  
Captions label them as **sample cartography**. Replace anytime with newer exports — keep the same filenames or update `index.html`.

## Contact (on site)

- Email: nurtac.suleymanzade@gmail.com  
- Instagram: [@nurtac.suleymanzadeh](https://instagram.com/nurtac.suleymanzadeh)

## Attribution

Maps produced in **QGIS**.

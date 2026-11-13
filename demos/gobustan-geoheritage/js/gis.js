const GEOJSON_URL = "./data/gobustan_unesco_reference_points.geojson";
const LEAFLET_CSS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";

const words = {
  en: {
    open: "GIS MAP", openLong: "EXPLORE GIS MAP ↗", close: "CLOSE ✕", closeLabel: "Close geographic map",
    kicker: "UNESCO · GEOGRAPHIC OVERVIEW", title: "Gobustan on the map",
    intro: "Explore the three component areas using UNESCO's published reference coordinates.",
    sites: "component areas", area: "inscribed property", year: "World Heritage listing",
    list: "COMPONENT AREAS", detail: "SELECTED AREA", areaLabel: "Property area",
    coordinate: "Reference coordinate", disclaimer: "Points are UNESCO reference coordinates, not mapped boundaries or a walking route.",
    source: "View UNESCO geographic data ↗", footer: "Coordinates and areas: UNESCO World Heritage Centre. The 3D walk is an illustrative interpretation.",
    loading: "Loading geographic map…", noLibrary: "Basemap unavailable. The reference locations remain available in the list.",
    noTiles: "Basemap tiles unavailable. UNESCO reference points remain visible.",
    noData: "Reference data could not be loaded. Use the UNESCO source link below.",
    reset: "SHOW ALL", download: "GEOJSON ↓"
  },
  az: {
    open: "GIS XƏRİTƏ", openLong: "GIS XƏRİTƏNİ AÇ ↗", close: "BAĞLA ✕", closeLabel: "Coğrafi xəritəni bağla",
    kicker: "UNESCO · COĞRAFİ İCMAL", title: "Qobustan xəritədə",
    intro: "UNESCO-nun dərc etdiyi istinad koordinatları ilə üç komponent ərazini araşdırın.",
    sites: "komponent ərazi", area: "irsi ərazi", year: "Dünya İrsi siyahısına daxil edilib",
    list: "KOMPONENT ƏRAZİLƏR", detail: "SEÇİLMİŞ ƏRAZİ", areaLabel: "İrs ərazisi",
    coordinate: "İstinad koordinatı", disclaimer: "Nöqtələr UNESCO istinad koordinatlarıdır; ərazi sərhədi və ya piyada marşrutu deyil.",
    source: "UNESCO coğrafi məlumatına bax ↗", footer: "Koordinatlar və sahələr: UNESCO Ümumdünya İrs Mərkəzi. 3D gəzinti təsviri interpretasiyadır.",
    loading: "Coğrafi xəritə yüklənir…", noLibrary: "Baza xəritəsi açılmadı. İstinad məkanları siyahıda göstərilir.",
    noTiles: "Baza xəritəsi yüklənmədi. UNESCO istinad nöqtələri görünür.",
    noData: "İstinad məlumatı yüklənmədi. Aşağıdakı UNESCO mənbəsindən istifadə edin.",
    reset: "HAMISINI GÖSTƏR", download: "GEOJSON ↓"
  }
};

let leafletPromise;
let leafletCssReady = false;
function loadLeaflet() {
  if (window.L && leafletCssReady) return Promise.resolve(window.L);
  if (leafletPromise) return leafletPromise;
  leafletPromise = new Promise(function(resolve, reject) {
    let cssReady = leafletCssReady, jsReady = Boolean(window.L), settled = false;
    const timeout = setTimeout(function() { fail(new Error("Leaflet load timed out")); }, 12000);
    function finish() {
      if (!settled && cssReady && jsReady && window.L) {
        settled = true; clearTimeout(timeout); resolve(window.L);
      }
    }
    function fail(error) {
      if (!settled) { settled = true; clearTimeout(timeout); reject(error); }
    }
    if (!cssReady) {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = LEAFLET_CSS;
      css.onload = function() { cssReady = true; leafletCssReady = true; finish(); };
      css.onerror = function() { fail(new Error("Leaflet CSS unavailable")); };
      document.head.appendChild(css);
    }
    if (!jsReady) {
      const script = document.createElement("script");
      script.src = LEAFLET_JS; script.async = true;
      script.onload = function() { jsReady = true; finish(); };
      script.onerror = function() { fail(new Error("Leaflet JavaScript unavailable")); };
      document.head.appendChild(script);
    }
    finish();
  });
  return leafletPromise;
}

export function initGeoExplorer() {
  if (document.documentElement.dataset.geoReady === "true") return;
  document.documentElement.dataset.geoReady = "true";
  const byId = id => document.getElementById(id);
  const overlay = byId("geo-overlay");
  let language = document.documentElement.lang === "az" ? "az" : "en";
  let features = [], selected = 1, map = null, markers = [], opener = null;
  let dataPromise = null, mapPromise = null, status = "loading", open = false;

  function loadData() {
    if (!dataPromise) {
      dataPromise = fetch(GEOJSON_URL).then(function(response) {
        if (!response.ok) throw new Error("GeoJSON request failed");
        return response.json();
      }).then(function(data) {
        const valid = data.type === "FeatureCollection" && Array.isArray(data.features) && data.features.length === 3
          && data.features.every(function(feature) {
            const c = feature.geometry && feature.geometry.coordinates;
            return feature.geometry && feature.geometry.type === "Point" && Array.isArray(c)
              && c.length === 2 && c.every(Number.isFinite) && feature.properties
              && Number.isFinite(feature.properties.area_ha);
          });
        if (!valid) {
          throw new Error("Unexpected reference dataset");
        }
        return data.features;
      }).catch(function(error) {
        dataPromise = null;
        throw error;
      });
    }
    return dataPromise;
  }
  function siteName(feature) {
    return language === "az" ? feature.properties.name_az : feature.properties.name_en;
  }
  function updateStatus() {
    const el = byId("geo-status");
    const t = words[language];
    const messages = { loading: t.loading, noLibrary: t.noLibrary, noTiles: t.noTiles, noData: t.noData };
    if (status === "ready") { el.style.display = "none"; return; }
    el.style.display = "block";
    el.textContent = messages[status] || t.loading;
  }
  function renderList() {
    const list = byId("geo-list");
    list.replaceChildren();
    features.forEach(function(feature, index) {
      const button = document.createElement("button");
      button.type = "button"; button.className = "geo-site";
      button.setAttribute("aria-pressed", index === selected ? "true" : "false");
      const number = document.createElement("span"); number.className = "geo-site-number";
      number.textContent = String(index + 1).padStart(2, "0");
      const name = document.createElement("span"); name.className = "geo-site-name"; name.textContent = siteName(feature);
      const area = document.createElement("span"); area.className = "geo-site-area";
      area.textContent = Number(feature.properties.area_ha).toFixed(2) + " ha";
      button.append(number, name, area);
      button.addEventListener("click", function() { select(index, true); });
      list.appendChild(button);
    });
  }
  function render() {
    const t = words[language];
    document.querySelectorAll(".geo-open").forEach(el => { el.textContent = el.dataset.long === "true" ? t.openLong : t.open; });
    byId("geo-kicker").textContent = t.kicker;
    byId("geo-title").textContent = t.title;
    byId("geo-intro").textContent = t.intro;
    byId("geo-metric-sites").textContent = t.sites;
    byId("geo-metric-area").textContent = t.area;
    byId("geo-metric-year").textContent = t.year;
    byId("geo-list-label").textContent = t.list;
    byId("geo-detail-label").textContent = t.detail;
    byId("geo-area-label").textContent = t.areaLabel;
    byId("geo-coordinate-label").textContent = t.coordinate;
    byId("geo-disclaimer").textContent = t.disclaimer;
    byId("geo-source").textContent = t.source;
    byId("geo-footer").textContent = t.footer;
    byId("geo-reset").textContent = t.reset;
    byId("geo-download").textContent = t.download;
    byId("geo-close").textContent = t.close;
    byId("geo-close").setAttribute("aria-label", t.closeLabel);
    byId("geo-lang").textContent = language === "en" ? "EN / AZ" : "AZ / EN";
    if (features.length) {
      renderList();
      const feature = features[selected], coords = feature.geometry.coordinates;
      byId("geo-name").textContent = siteName(feature);
      byId("geo-area").textContent = Number(feature.properties.area_ha).toFixed(2) + " ha";
      byId("geo-coordinates").textContent = coords[1].toFixed(5) + "° N, " + coords[0].toFixed(5) + "° E";
      markers.forEach(function(marker, index) {
        marker.setStyle({ radius: index === selected ? 10 : 7, fillColor: index === selected ? "#f5c561" : "#fff1cc" });
        marker.setTooltipContent(String(index + 1).padStart(2, "0") + " · " + siteName(features[index]));
      });
    }
    updateStatus();
  }
  function select(index, pan) {
    selected = index;
    render();
    if (pan && byId("geo-list").children[index]) {
      byId("geo-list").children[index].focus({ preventScroll: true });
    }
    if (map && pan) {
      const coords = features[index].geometry.coordinates;
      map.setView([coords[1], coords[0]], Math.max(map.getZoom(), 12), { animate: false });
    }
  }
  function fitAll() {
    if (!map || !features.length) return;
    const points = features.map(feature => [feature.geometry.coordinates[1], feature.geometry.coordinates[0]]);
    map.fitBounds(points, { padding: [30, 30], maxZoom: 12, animate: false });
  }
  function setupMap() {
    if (map) {
      requestAnimationFrame(function() { map.invalidateSize(); });
      return Promise.resolve();
    }
    if (mapPromise) return mapPromise;
    mapPromise = loadLeaflet().then(function(L) {
      if (!open) { mapPromise = null; return; }
      byId("geo-map").style.display = "block";
      byId("geo-static").style.display = "none";
      map = L.map("geo-map", { scrollWheelZoom: false, zoomControl: true });
      let loadedTiles = 0, failedTiles = 0;
      const tiles = L.tileLayer(OSM_TILES, {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
      });
      tiles.on("tileload", function() { loadedTiles++; status = "ready"; updateStatus(); });
      tiles.on("tileerror", function() {
        failedTiles++;
        if (!loadedTiles && failedTiles >= 3) { status = "noTiles"; updateStatus(); }
      });
      tiles.addTo(map);
      markers = features.map(function(feature, index) {
        const coords = feature.geometry.coordinates;
        const marker = L.circleMarker([coords[1], coords[0]], {
          radius: index === selected ? 10 : 7, color: "#1d4534", weight: 3,
          fillColor: index === selected ? "#f5c561" : "#fff1cc", fillOpacity: 1
        }).addTo(map);
        marker.bindTooltip(String(index + 1).padStart(2, "0") + " · " + siteName(feature), { direction: "top" });
        marker.on("click", function() { select(index, false); });
        return marker;
      });
      L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
      fitAll();
      requestAnimationFrame(function() { map.invalidateSize(); fitAll(); });
      render();
    }).catch(function(error) {
      console.warn("Geographic basemap unavailable", error);
      mapPromise = null;
      leafletPromise = null;
      status = "noLibrary"; updateStatus();
    });
    return mapPromise;
  }
  function show(event) {
    opener = event.currentTarget;
    language = document.documentElement.lang === "az" ? "az" : "en";
    open = true; overlay.style.display = "block"; overlay.setAttribute("aria-hidden", "false");
    document.dispatchEvent(new CustomEvent("gobustan:map-state", { detail: { open: true } }));
    status = map ? "ready" : "loading";
    render();
    byId("geo-close").focus();
    loadData().then(function(data) {
      features = data; render();
      if (open) setupMap();
    }).catch(function(error) {
      console.warn("UNESCO reference data unavailable", error);
      status = "noData"; updateStatus();
    });
  }
  function close() {
    open = false; overlay.style.display = "none"; overlay.setAttribute("aria-hidden", "true");
    document.dispatchEvent(new CustomEvent("gobustan:map-state", { detail: { open: false } }));
    if (opener && opener.isConnected) opener.focus();
  }
  document.querySelectorAll(".geo-open").forEach(button => button.addEventListener("click", show));
  byId("geo-close").addEventListener("click", close);
  byId("geo-reset").addEventListener("click", fitAll);
  byId("geo-lang").addEventListener("click", function() {
    language = language === "en" ? "az" : "en";
    document.documentElement.lang = language;
    document.dispatchEvent(new CustomEvent("gobustan:set-language", { detail: language }));
    render();
  });
  document.addEventListener("gobustan:language-changed", function(event) {
    language = event.detail === "az" ? "az" : "en";
    render();
  });
  document.addEventListener("keydown", function(event) {
    if (open && event.key === "Escape") { event.preventDefault(); event.stopPropagation(); close(); }
  });
  render();
}

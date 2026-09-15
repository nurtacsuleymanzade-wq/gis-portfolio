/**
 * Leaflet interactive atlas — choropleth + points + Qusar + ADM0 outline.
 * Uses Carto Dark Matter (no API key). GeoJSON from ./data/
 */
(function () {
  "use strict";

  var mapEl = document.getElementById("atlas-map");
  var statusEl = document.getElementById("mapStatus");
  if (!mapEl || typeof L === "undefined") return;

  function setStatus(msg, ready) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.classList.toggle("is-ready", !!ready);
  }

  var map = L.map(mapEl, {
    zoomControl: true,
    attributionControl: true,
    scrollWheelZoom: false,
  }).setView([40.4, 47.8], 7);

  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: "abcd",
    maxZoom: 19,
  }).addTo(map);

  // Enable scroll zoom only when map is focused / clicked
  map.on("click", function () {
    map.scrollWheelZoom.enable();
  });
  map.on("mouseout", function () {
    map.scrollWheelZoom.disable();
  });

  var CATEGORY_COLORS = {
    natural: "#2e7d32",
    cultural: "#8e24aa",
    lodging: "#1565c0",
    food: "#ef6c00",
    transport: "#546e7a",
  };

  function choroplethColor(n) {
    n = Number(n) || 0;
    if (n <= 0) return "#1a2744";
    if (n <= 2) return "#2a4a6e";
    if (n <= 8) return "#3d7ea6";
    if (n <= 25) return "#5bb8c4";
    return "#c9eef0";
  }

  function rayonPopup(props) {
    var name = props.shapeName || "Rayon";
    var n = props.n_total != null ? props.n_total : "—";
    var rows = [
      ["Total", props.n_total],
      ["Lodging", props.n_lodging],
      ["Food", props.n_food],
      ["Cultural", props.n_cultural],
      ["Natural", props.n_natural],
      ["Beach", props.n_beach],
      ["Eco", props.n_eco],
      ["Camping", props.n_camping],
    ];
    var list = rows
      .filter(function (r) {
        return r[1] != null;
      })
      .map(function (r) {
        return "<li><span>" + r[0] + "</span><span>" + r[1] + "</span></li>";
      })
      .join("");
    return (
      "<strong>" +
      name +
      "</strong><br/>n_total: <strong>" +
      n +
      "</strong><ul class='popup-counts'>" +
      list +
      "</ul>"
    );
  }

  function pointPopup(props) {
    var name = props.legend_name || props.source_name || "Site";
    var cat = props.category || "";
    return "<strong>" + name + "</strong><br/><span style='color:#9aadc4'>" + cat + "</span>";
  }

  var DATA = {
    adm2: "data/adm2_tourism.geojson",
    points: "data/tourism_atlas.geojson",
    qusar: "data/qusar.geojson",
    adm0: "data/adm0.geojson",
  };

  function fetchJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  setStatus("Loading layers…");

  Promise.all([
    fetchJson(DATA.adm2),
    fetchJson(DATA.points),
    fetchJson(DATA.qusar),
    fetchJson(DATA.adm0).catch(function () {
      return null;
    }),
  ])
    .then(function (results) {
      var adm2 = results[0];
      var points = results[1];
      var qusar = results[2];
      var adm0 = results[3];

      if (adm0) {
        L.geoJSON(adm0, {
          style: {
            color: "#7ec8c4",
            weight: 1.25,
            opacity: 0.55,
            fill: false,
          },
          interactive: false,
        }).addTo(map);
      }

      var choropleth = L.geoJSON(adm2, {
        style: function (feature) {
          var n = feature.properties && feature.properties.n_total;
          return {
            fillColor: choroplethColor(n),
            weight: 0.6,
            opacity: 0.9,
            color: "#0a1520",
            fillOpacity: 0.72,
          };
        },
        onEachFeature: function (feature, layer) {
          var p = feature.properties || {};
          layer.bindPopup(rayonPopup(p));
          layer.on({
            mouseover: function (e) {
              e.target.setStyle({ weight: 1.5, color: "#c9eef0", fillOpacity: 0.85 });
            },
            mouseout: function (e) {
              choropleth.resetStyle(e.target);
            },
          });
        },
      }).addTo(map);

      L.geoJSON(qusar, {
        style: {
          color: "#f0c674",
          weight: 2.5,
          opacity: 0.95,
          fillColor: "#f0c674",
          fillOpacity: 0.12,
        },
        onEachFeature: function (feature, layer) {
          var name = (feature.properties && feature.properties.shapeName) || "Qusar";
          layer.bindPopup("<strong>" + name + "</strong><br/>Highlight district");
        },
      }).addTo(map);

      L.geoJSON(points, {
        pointToLayer: function (feature, latlng) {
          var cat = (feature.properties && feature.properties.category) || "";
          var color =
            (feature.properties && feature.properties.color_hex) ||
            CATEGORY_COLORS[cat] ||
            "#7ec8c4";
          return L.circleMarker(latlng, {
            radius: 5,
            fillColor: color,
            color: "#04060c",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.9,
          });
        },
        onEachFeature: function (feature, layer) {
          layer.bindPopup(pointPopup(feature.properties || {}));
        },
      }).addTo(map);

      try {
        map.fitBounds(choropleth.getBounds(), { padding: [24, 24], maxZoom: 8 });
      } catch (e) {
        /* keep default view */
      }

      setStatus("Layers ready", true);

      // Fix tile sizing if section was hidden / late layout
      setTimeout(function () {
        map.invalidateSize();
      }, 200);
    })
    .catch(function (err) {
      console.error("[map]", err);
      setStatus("Could not load GeoJSON — serve via http.server");
    });

  // Invalidate when atlas scrolls into view (layout settle)
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            map.invalidateSize();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(mapEl);
  }
})();

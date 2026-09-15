/**
 * Site chrome: nav, lightbox, year, calm mode, lazy-load Three.js scene.
 */
(function () {
  "use strict";

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* —— Mobile nav —— */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("siteNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", "Open menu");
      });
    });
  }

  /* —— Calm / reduced motion —— */
  var calmBtn = document.getElementById("calmBtn");
  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function setCalm(on) {
    document.body.classList.toggle("calm-mode", on);
    if (calmBtn) {
      calmBtn.setAttribute("aria-pressed", on ? "true" : "false");
      calmBtn.textContent = on ? "Motion" : "Calm";
    }
    try {
      localStorage.setItem("gis-calm", on ? "1" : "0");
    } catch (e) { /* ignore */ }
    window.dispatchEvent(new Event("gis-calm-toggle"));
    // If motion is re-enabled and the scene never loaded, load it now
    if (!on && !window.__gisSceneLoaded) {
      loadScene();
    }
  }

  var storedCalm = null;
  try {
    storedCalm = localStorage.getItem("gis-calm");
  } catch (e) { /* ignore */ }

  if (prefersReduced || storedCalm === "1") {
    setCalm(true);
  }

  if (calmBtn) {
    calmBtn.addEventListener("click", function () {
      setCalm(!document.body.classList.contains("calm-mode"));
    });
  }

  /* —— Lightbox —— */
  var lightbox = document.getElementById("lightbox");
  var lightboxImg = document.getElementById("lightboxImg");
  var lightboxCaption = document.getElementById("lightboxCaption");
  var lightboxClose = document.getElementById("lightboxClose");
  var lastFocus = null;

  function openLightbox(src, caption, alt) {
    if (!lightbox || !lightboxImg) return;
    lastFocus = document.activeElement;
    lightboxImg.src = src;
    lightboxImg.alt = alt || caption || "Enlarged map";
    if (lightboxCaption) lightboxCaption.textContent = caption || "";
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxImg) {
      lightboxImg.removeAttribute("src");
      lightboxImg.alt = "";
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  document.querySelectorAll(".portfolio-thumb").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var src = btn.getAttribute("data-full");
      var caption = btn.getAttribute("data-caption") || "";
      var img = btn.querySelector("img");
      var alt = img ? img.getAttribute("alt") : "";
      if (src) openLightbox(src, caption, alt);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightbox) {
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeLightbox();
  });

  /* —— Lazy-load Three.js after first paint —— */
  function loadScene() {
    if (document.body.classList.contains("calm-mode")) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.__gisSceneLoading || window.__gisSceneLoaded) return;
    window.__gisSceneLoading = true;

    var s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js";
    s.async = true;
    s.onload = function () {
      var sceneScript = document.createElement("script");
      sceneScript.src = "js/scene.js";
      sceneScript.async = true;
      sceneScript.onload = function () {
        window.__gisSceneLoaded = true;
      };
      document.body.appendChild(sceneScript);
    };
    s.onerror = function () {
      window.__gisSceneLoading = false;
      console.warn("[site] Three.js CDN failed — static fallback remains");
    };
    document.body.appendChild(s);
  }

  function scheduleScene() {
    var run = function () {
      setTimeout(loadScene, 80);
    };
    if ("requestIdleCallback" in window) {
      requestIdleCallback(run, { timeout: 1200 });
    } else {
      setTimeout(run, 400);
    }
  }

  if (document.readyState === "complete") {
    scheduleScene();
  } else {
    window.addEventListener("load", scheduleScene);
  }
})();

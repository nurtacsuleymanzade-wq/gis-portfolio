/**
 * Procedural cosmic scene: starfield + stylized globe + dust.
 * Loaded lazily after first paint. Respects calm-mode / reduced-motion.
 */
(function () {
  "use strict";

  var canvas = document.getElementById("scene-canvas");
  if (!canvas) return;

  var reduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    document.body.classList.contains("calm-mode");
  if (reduced) return;

  var THREE = window.THREE;
  if (!THREE) {
    console.warn("[scene] THREE not available");
    return;
  }

  var renderer, scene, camera, globe, atmosphere, stars, dust;
  var mouse = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var clock = new THREE.Clock();
  var running = true;
  var raf = 0;

  function init() {
    var w = window.innerWidth;
    var h = window.innerHeight;

    renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
    renderer.setClearColor(0x000000, 0);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(48, w / h, 0.1, 200);
    camera.position.set(0, 0.15, 5.2);

    scene.add(new THREE.AmbientLight(0x6a7aaa, 0.55));
    var key = new THREE.DirectionalLight(0xb8d4ff, 1.1);
    key.position.set(4, 2, 3);
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x7ec8c4, 0.45);
    rim.position.set(-3, -1, -2);
    scene.add(rim);

    stars = makeStars(1800);
    scene.add(stars);

    dust = makeDust(280);
    scene.add(dust);

    globe = makeGlobe();
    globe.position.set(1.35, -0.15, -0.4);
    scene.add(globe);

    atmosphere = makeAtmosphere();
    atmosphere.position.copy(globe.position);
    scene.add(atmosphere);

    canvas.classList.add("is-ready");
    document.body.classList.add("scene-active");

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });

    document.addEventListener("visibilitychange", function () {
      running = !document.hidden && !document.body.classList.contains("calm-mode");
      if (running && !raf) loop();
    });

    window.addEventListener("gis-calm-toggle", function () {
      running = !document.body.classList.contains("calm-mode");
      if (running && !raf) loop();
    });

    loop();
  }

  function makeStars(count) {
    var positions = new Float32Array(count * 3);
    var colors = new Float32Array(count * 3);
    var i, r, theta, phi, c;
    for (i = 0; i < count; i++) {
      r = 18 + Math.random() * 55;
      theta = Math.random() * Math.PI * 2;
      phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      c = 0.7 + Math.random() * 0.3;
      colors[i * 3] = c * (0.85 + Math.random() * 0.15);
      colors[i * 3 + 1] = c * (0.9 + Math.random() * 0.1);
      colors[i * 3 + 2] = c;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.045,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      sizeAttenuation: true,
    });
    return new THREE.Points(geo, mat);
  }

  function makeDust(count) {
    var positions = new Float32Array(count * 3);
    var i;
    for (i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 1;
    }
    var geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    var mat = new THREE.PointsMaterial({
      size: 0.028,
      color: 0x7ec8c4,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return new THREE.Points(geo, mat);
  }

  function makeGlobe() {
    var group = new THREE.Group();

    var sphereGeo = new THREE.SphereGeometry(1.15, 48, 48);
    var sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0c1a2e,
      metalness: 0.35,
      roughness: 0.55,
      emissive: 0x061018,
      emissiveIntensity: 0.4,
    });
    group.add(new THREE.Mesh(sphereGeo, sphereMat));

    // Stylized terrain / latitude bands (procedural “cartography” look)
    var wireGeo = new THREE.SphereGeometry(1.165, 28, 18);
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0x5bb8c4,
      wireframe: true,
      transparent: true,
      opacity: 0.18,
    });
    group.add(new THREE.Mesh(wireGeo, wireMat));

    // Meridians / parallels as thin rings for cartographic feel
    var i, ring, mat;
    mat = new THREE.MeshBasicMaterial({
      color: 0x7ec8c4,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide,
    });
    for (i = 0; i < 6; i++) {
      ring = new THREE.Mesh(
        new THREE.RingGeometry(1.17, 1.178, 64),
        mat
      );
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = (i / 6) * Math.PI;
      group.add(ring);
    }

    // Soft continent-ish blobs via canvas texture (procedural)
    var tex = makeContinentTexture();
    var overlay = new THREE.Mesh(
      new THREE.SphereGeometry(1.152, 48, 48),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    group.add(overlay);

    return group;
  }

  function makeContinentTexture() {
    var size = 512;
    var c = document.createElement("canvas");
    c.width = c.height = size;
    var ctx = c.getContext("2d");
    ctx.fillStyle = "rgba(0,0,0,0)";
    ctx.fillRect(0, 0, size, size);

    // Soft land-like patches
    var patches = [
      [0.28, 0.42, 0.14, 0.2],
      [0.52, 0.38, 0.1, 0.12],
      [0.62, 0.55, 0.18, 0.14],
      [0.4, 0.62, 0.09, 0.1],
      [0.75, 0.45, 0.12, 0.16],
      [0.22, 0.58, 0.08, 0.11],
    ];
    patches.forEach(function (p) {
      var g = ctx.createRadialGradient(
        p[0] * size, p[1] * size, 0,
        p[0] * size, p[1] * size, p[2] * size
      );
      g.addColorStop(0, "rgba(126, 200, 196, 0.55)");
      g.addColorStop(0.5, "rgba(91, 140, 255, 0.25)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(p[0] * size, p[1] * size, p[2] * size, p[3] * size, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Subtle grid
    ctx.strokeStyle = "rgba(100, 160, 200, 0.12)";
    ctx.lineWidth = 1;
    var g;
    for (g = 0; g < 12; g++) {
      var y = ((g + 0.5) / 12) * size;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(size, y);
      ctx.stroke();
    }
    for (g = 0; g < 24; g++) {
      var x = ((g + 0.5) / 24) * size;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, size);
      ctx.stroke();
    }

    var texture = new THREE.CanvasTexture(c);
    if (THREE.SRGBColorSpace) texture.colorSpace = THREE.SRGBColorSpace; else if (THREE.sRGBEncoding) texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  function makeAtmosphere() {
    return new THREE.Mesh(
      new THREE.SphereGeometry(1.32, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x5b8cff,
        transparent: true,
        opacity: 0.07,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
  }

  function onPointer(e) {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
  }

  function onResize() {
    if (!renderer || !camera) return;
    var w = window.innerWidth;
    var h = window.innerHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.setSize(w, h, false);
  }

  function loop() {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(loop);

    var t = clock.getElapsedTime();
    target.x += (mouse.x * 0.35 - target.x) * 0.04;
    target.y += (mouse.y * 0.25 - target.y) * 0.04;

    if (globe) {
      globe.rotation.y = t * 0.08;
      globe.rotation.x = 0.25 + target.y * 0.15;
      globe.position.x = 1.35 + target.x * 0.25;
      if (atmosphere) {
        atmosphere.position.copy(globe.position);
        atmosphere.rotation.y = -t * 0.03;
      }
    }
    if (stars) stars.rotation.y = t * 0.008;
    if (dust) {
      dust.rotation.y = t * 0.02;
      dust.rotation.x = t * 0.01;
    }

    camera.position.x = target.x * 0.35;
    camera.position.y = 0.15 + target.y * 0.2;
    camera.lookAt(0.4, 0, 0);

    renderer.render(scene, camera);
  }

  try {
    init();
  } catch (err) {
    console.warn("[scene] init failed", err);
    canvas.style.display = "none";
  }
})();

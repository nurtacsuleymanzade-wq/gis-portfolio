/**
 * Cosmic scene: starfield + earth-like globe + dust.
 * Scroll from hero → #atlas drives camera toward Azerbaijan (lat 40.4, lon 47.5).
 * Respects calm-mode / prefers-reduced-motion.
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

  // Azerbaijan focus
  var AZ_LAT = 40.4;
  var AZ_LON = 47.5;
  var DEG = Math.PI / 180;

  var renderer, scene, camera, globe, atmosphere, stars, dust;
  var mouse = { x: 0, y: 0 };
  var target = { x: 0, y: 0 };
  var clock = new THREE.Clock();
  var running = true;
  var raf = 0;
  var scrollProgress = 0;
  var scrollSmoothed = 0;
  var atlasEl = document.getElementById("atlas");
  var heroEl = document.getElementById("hero");

  // Camera / globe bookends (progress 0 → 1)
  var CAM_FAR = { x: 0, y: 0.2, z: 5.6 };
  var CAM_NEAR = { x: 0.05, y: 0.08, z: 2.15 };
  var GLOBE_FAR = { x: 1.2, y: -0.1, z: -0.35 };
  var GLOBE_NEAR = { x: 0, y: 0, z: 0 };

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
    camera.position.set(CAM_FAR.x, CAM_FAR.y, CAM_FAR.z);

    scene.add(new THREE.AmbientLight(0x7a8aaa, 0.5));
    var key = new THREE.DirectionalLight(0xe8f0ff, 1.15);
    key.position.set(5, 2.5, 4);
    scene.add(key);
    var fill = new THREE.DirectionalLight(0x4a90a8, 0.4);
    fill.position.set(-4, -1, 2);
    scene.add(fill);
    var rim = new THREE.DirectionalLight(0x7ec8c4, 0.35);
    rim.position.set(-2, 1, -3);
    scene.add(rim);

    stars = makeStars(1800);
    scene.add(stars);

    dust = makeDust(280);
    scene.add(dust);

    globe = makeGlobe();
    globe.position.set(GLOBE_FAR.x, GLOBE_FAR.y, GLOBE_FAR.z);
    scene.add(globe);

    atmosphere = makeAtmosphere();
    atmosphere.position.copy(globe.position);
    scene.add(atmosphere);

    canvas.classList.add("is-ready");
    document.body.classList.add("scene-active");

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

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

  /**
   * Progress 0 at top of hero; 1 when atlas section is well into view.
   */
  function onScroll() {
    if (!heroEl || !atlasEl) {
      var y = window.scrollY || window.pageYOffset || 0;
      var max = Math.max(1, window.innerHeight * 1.1);
      scrollProgress = Math.min(1, Math.max(0, y / max));
      return;
    }
    var heroTop = heroEl.getBoundingClientRect().top + (window.scrollY || 0);
    var atlasRect = atlasEl.getBoundingClientRect();
    var atlasTop = atlasRect.top + (window.scrollY || 0);
    var start = heroTop;
    // Reach progress 1 when atlas top is near the upper third of the viewport
    var end = atlasTop - window.innerHeight * 0.35;
    var range = Math.max(1, end - start);
    var y = window.scrollY || window.pageYOffset || 0;
    scrollProgress = Math.min(1, Math.max(0, (y - start) / range));
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Target globe euler so AZ_LAT/AZ_LON faces the camera (+Z look-at origin).
   * Sphere point: x = cos(lat)*sin(lon), y = sin(lat), z = cos(lat)*cos(lon)
   * Rotating Y by -lon then X by -lat brings that point toward +Z.
   */
  function azerbaijanRotation() {
    return {
      x: -AZ_LAT * DEG,
      y: -AZ_LON * DEG,
    };
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

    var sphereGeo = new THREE.SphereGeometry(1.15, 64, 48);
    var sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0b1e33,
      metalness: 0.05,
      roughness: 0.85,
      emissive: 0x020810,
      emissiveIntensity: 0.08,
    });
    var earthMesh = new THREE.Mesh(sphereGeo, sphereMat);
    group.add(earthMesh);

    // Real Earth (NASA Blue Marble) — local asset, no API key
    var loader = new THREE.TextureLoader();
    loader.load(
      "assets/earth-day.jpg",
      function (tex) {
        if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
        else if (THREE.sRGBEncoding != null) tex.encoding = THREE.sRGBEncoding;
        tex.anisotropy = 4;
        sphereMat.map = tex;
        sphereMat.color.set(0xffffff);
        sphereMat.needsUpdate = true;
      },
      undefined,
      function () {
        console.warn("[scene] earth texture failed to load");
      }
    );

    // Soft cartographic grid
    var wireGeo = new THREE.SphereGeometry(1.162, 32, 20);
    var wireMat = new THREE.MeshBasicMaterial({
      color: 0x8ec8d0,
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    group.add(new THREE.Mesh(wireGeo, wireMat));

    // Subtle marker glow near Azerbaijan (local coords before group rotation)
    var marker = makeAzMarker();
    group.add(marker);

    return group;
  }

  function latLonToLocal(lat, lon, radius) {
    var phi = lat * DEG;
    var theta = lon * DEG;
    return new THREE.Vector3(
      radius * Math.cos(phi) * Math.sin(theta),
      radius * Math.sin(phi),
      radius * Math.cos(phi) * Math.cos(theta)
    );
  }

  function makeAzMarker() {
    var g = new THREE.Group();
    var pos = latLonToLocal(AZ_LAT, AZ_LON, 1.17);
    var dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.018, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0x7ec8c4,
        transparent: true,
        opacity: 0.9,
      })
    );
    dot.position.copy(pos);
    g.add(dot);
    var halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 12, 12),
      new THREE.MeshBasicMaterial({
        color: 0x5bb8c4,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
    );
    halo.position.copy(pos);
    g.add(halo);
    return g;
  }

  /**
   * Procedural earth-like texture: ocean blues + land greens/tans.
   * Approximate continents; Azerbaijan region gets a slightly warmer land patch.
   */


  function makeAtmosphere() {
    return new THREE.Mesh(
      new THREE.SphereGeometry(1.32, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x5b8cff,
        transparent: true,
        opacity: 0.08,
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
    onScroll();
  }

  function loop() {
    raf = 0;
    if (!running) return;
    raf = requestAnimationFrame(loop);

    var t = clock.getElapsedTime();
    target.x += (mouse.x * 0.28 - target.x) * 0.04;
    target.y += (mouse.y * 0.2 - target.y) * 0.04;

    // Smooth scroll progress
    scrollSmoothed += (scrollProgress - scrollSmoothed) * 0.06;
    var p = easeInOutCubic(scrollSmoothed);
    var az = azerbaijanRotation();

    if (globe) {
      // Idle spin fades out as we approach Azerbaijan
      var spin = (1 - p) * t * 0.07;
      var baseY = lerp(spin, az.y, p);
      var baseX = lerp(0.18, az.x, p);

      // Subtle mouse parallax fades when zoomed in
      var parallax = 1 - p * 0.75;
      globe.rotation.y = baseY + target.x * 0.12 * parallax;
      globe.rotation.x = baseX + target.y * 0.1 * parallax;

      globe.position.x = lerp(GLOBE_FAR.x, GLOBE_NEAR.x, p) + target.x * 0.18 * parallax;
      globe.position.y = lerp(GLOBE_FAR.y, GLOBE_NEAR.y, p);
      globe.position.z = lerp(GLOBE_FAR.z, GLOBE_NEAR.z, p);

      if (atmosphere) {
        atmosphere.position.copy(globe.position);
        atmosphere.scale.setScalar(lerp(1, 1.02, p));
      }
    }

    if (stars) stars.rotation.y = t * 0.008;
    if (dust) {
      dust.rotation.y = t * 0.02;
      dust.rotation.x = t * 0.01;
      dust.material.opacity = 0.35 * (1 - p * 0.6);
    }

    camera.position.x = lerp(CAM_FAR.x, CAM_NEAR.x, p) + target.x * 0.25 * (1 - p * 0.5);
    camera.position.y = lerp(CAM_FAR.y, CAM_NEAR.y, p) + target.y * 0.15 * (1 - p * 0.5);
    camera.position.z = lerp(CAM_FAR.z, CAM_NEAR.z, p);

    var lookX = lerp(0.35, 0, p);
    var lookY = lerp(0, 0.02, p);
    camera.lookAt(lookX, lookY, 0);

    // Narrow FOV slightly on approach for cinematic zoom feel
    var fov = lerp(48, 38, p);
    if (Math.abs(camera.fov - fov) > 0.05) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
  }

  try {
    init();
  } catch (err) {
    console.warn("[scene] init failed", err);
    canvas.style.display = "none";
  }
})();

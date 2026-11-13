import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
renderer.setSize(window.innerWidth, window.innerHeight, false);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc9aa7b);
scene.fog = new THREE.Fog(0xc9aa7b, 42, 115);
const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 150);
const hemi = new THREE.HemisphereLight(0xffe7bf, 0x51422e, 2.0);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffd29a, 3.0);
sun.position.set(-18, 28, 12);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -36;
sun.shadow.camera.right = 36;
sun.shadow.camera.top = 36;
sun.shadow.camera.bottom = -36;
sun.shadow.camera.near = 1;
sun.shadow.camera.far = 80;
sun.shadow.bias = -0.00045;
sun.shadow.normalBias = 0.025;
scene.add(sun);
scene.add(sun.target);

const player = { x: 0, z: 9, yaw: 0, pitch: -0.04 };
const keys = new Set();
const touchMove = { x: 0, y: 0 };
let started = false;
let infoOpen = false;
let activeInfoIndex = -1;
let fallbackActive = false;
let mapOpen = false;
let language = document.documentElement.lang === "az" ? "az" : "en";
let nearbyIndex = -1;
let lastFrame = 0;
let accumulator = 0;
let frameCount = 0;
let lastHudAt = 0;
let lookPointer = null;
let lastLookX = 0;
let lastLookY = 0;
let joyPointer = null;
let joyCenterX = 0;
let joyCenterY = 0;
let audioContext = null;
const fixedDt = 1 / 60;
const lookPoint = new THREE.Vector3();
const sceneClock = { elapsed: 0 };

const copy = {
  en: {
    stats: "FIELD LOG · ROUTE SKETCH", stops: "stops explored", map: "EXPEDITION MAP", quick: "GO TO A STOP", quickTo: "Go to",
    mapNote: "Concept route · illustrative, not an official trail", startEyebrow: "AZERBAIJAN · CULTURAL LANDSCAPE",
    startTitle: "Layers of<br>the Landscape",
    startCopy: "Explore a stylized geotourism landscape, or open the GIS map for UNESCO's geographic reference points.",
    startButton: "START EXPEDITION", loading: "LOADING LANDSCAPE…", controls: "<b>WASD</b> move · <b>drag</b> look · <b>SPACE</b> inspect",
    explore: "EXPLORE", inspect: "SPACE · INSPECT SITE", continue: "CONTINUE ROUTE", restart: "RESTART",
    near: "SPACE · INSPECT SITE", nearTouch: "TAP EXPLORE", routeDone: "ROUTE COMPLETE · 3 FIELD STOPS",
    stopTitles: ["Rock engravings", "The resonant stone", "A landscape in layers"],
    stopKickers: ["FIELD NOTE 01 · ROCK ART", "FIELD NOTE 02 · SOUND & STONE", "FIELD NOTE 03 · SPATIAL CONTEXT"],
    stopCopy: [
      "UNESCO describes more than 6,000 engravings across Gobustan, bearing testimony to 40,000 years of rock art. The figures record changing lives, landscapes, and ways of seeing.",
      "Azerbaijan Travel describes Gobustan’s resonant stone as a natural percussion instrument. This short tone is synthesized for the demo; it is not a field recording.",
      "The UNESCO property includes three areas: Jinghirdagh–Yazylytepe, Boyukdash, and Kichikdash. This small route is a spatial interpretation, not the official site plan."
    ],
    source: ["Source: UNESCO World Heritage Centre · Gobustan 1076", "Source: Azerbaijan Travel · Gobustan stone-age visit (AZ)", "Source: UNESCO World Heritage Centre · property map"],
    sourceLink: "Open source ↗", loaded: "START EXPEDITION", localGrid: "LOCAL GRID"
  },
  az: {
    stats: "SAHƏ QEYDİ · MARŞRUT SXEMİ", stops: "dayanacaq araşdırılıb", map: "KƏŞFİYYAT XƏRİTƏSİ", quick: "DAYANACAĞA KEÇ", quickTo: "Keç",
    mapNote: "Konsept marşrutu · sxematikdir, rəsmi cığır deyil", startEyebrow: "AZƏRBAYCAN · MƏDƏNİ LANDŞAFT",
    startTitle: "Landşaftın<br>qatları",
    startCopy: "Stilizə edilmiş geoturizm landşaftını kəşf edin və ya UNESCO-nun coğrafi istinad nöqtələri üçün GIS xəritəsini açın.",
    startButton: "SƏFƏRƏ BAŞLA", loading: "LANDŞAFT YÜKLƏNİR…", controls: "<b>WASD</b> hərəkət · <b>sürüklə</b> baxış · <b>SPACE</b> araşdır",
    explore: "ARAŞDIR", inspect: "SPACE · MƏKANI ARAŞDIR", continue: "MARŞRUTA DAVAM ET", restart: "YENİDƏN",
    near: "SPACE · MƏKANI ARAŞDIR", nearTouch: "ARAŞDIR DÜYMƏSİNƏ TOXUN", routeDone: "MARŞRUT TAMAMLANDI · 3 DAYANACAQ",
    stopTitles: ["Qayaüstü təsvirlər", "Səslənən daş", "Landşaftın qatları"],
    stopKickers: ["SAHƏ QEYDİ 01 · QAYA SƏNƏTİ", "SAHƏ QEYDİ 02 · SƏS VƏ DAŞ", "SAHƏ QEYDİ 03 · MƏKAN KONTEKSTİ"],
    stopCopy: [
      "UNESCO Qobustanda 6 000-dən çox qayaüstü təsvirin olduğunu bildirir; onlar 40 000 illik qaya sənətinə şahidlik edir. Təsvirlər dəyişən həyat tərzini, landşaftı və dünyagörüşünü əks etdirir.",
      "Azerbaijan Travel Qobustanın səslənən daşını təbii zərb aləti kimi təsvir edir. Bu qısa səs demo üçün sintez olunub; sahə yazısı deyil.",
      "UNESCO ərazisinə üç hissə daxildir: Cingirdağ–Yazılıtəpə, Böyükdaş və Kiçikdaş. Bu kiçik marşrut məkan interpretasiyasıdır, rəsmi sahə planı deyil."
    ],
    source: ["Mənbə: UNESCO Ümumdünya İrs Mərkəzi · Qobustan 1076", "Mənbə: Azerbaijan Travel · Qobustan", "Mənbə: UNESCO Ümumdünya İrs Mərkəzi · ərazi xəritəsi"],
    sourceLink: "Mənbəyə bax ↗", loaded: "SƏFƏRƏ BAŞLA", localGrid: "YERLİ ŞƏBƏKƏ"
  }
};
const visited = [false, false, false];
const stops = [
  { x: 0, z: -7, model: "stela" },
  { x: 12, z: -17, model: "sound" },
  { x: -10, z: -26, model: "outlook" }
];

function terrainHeight(x, z) {
  const broad = 0.22 * Math.sin(x * 0.14) + 0.24 * Math.cos(z * 0.12);
  const folds = 0.13 * Math.sin((x + z) * 0.22) + 0.1 * Math.cos((x - z) * 0.17);
  const ridgeA = 1.1 * Math.exp(-(((x - 30) * (x - 30)) + ((z + 34) * (z + 34))) / 330);
  const ridgeB = 1.35 * Math.exp(-(((x + 31) * (x + 31)) + ((z + 23) * (z + 23))) / 410);
  return broad + folds + ridgeA + ridgeB;
}
function seeded(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
function makeGroundTexture() {
  const c = document.createElement("canvas");
  c.width = 256; c.height = 256;
  const g = c.getContext("2d");
  g.fillStyle = "#a5865d"; g.fillRect(0, 0, 256, 256);
  const rand = seeded(48017);
  for (let i = 0; i < 2100; i++) {
    const x = rand() * 256, y = rand() * 256, r = 0.35 + rand() * 1.8;
    g.fillStyle = rand() > 0.48 ? "rgba(64,47,31,0.12)" : "rgba(238,204,151,0.12)";
    g.beginPath(); g.ellipse(x, y, r * 1.6, r, rand() * 3, 0, Math.PI * 2); g.fill();
  }
  for (let i = 0; i < 80; i++) {
    const x = rand() * 256, y = rand() * 256;
    g.strokeStyle = "rgba(83,63,42,0.08)"; g.lineWidth = 0.5 + rand();
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + rand() * 18, y + rand() * 8); g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(16, 16); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 4);
  return t;
}
function addSky() {
  const c = document.createElement("canvas");
  c.width = 32; c.height = 512;
  const g = c.getContext("2d");
  const gradient = g.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, "#698896");
  gradient.addColorStop(0.42, "#a5b4ac");
  gradient.addColorStop(0.7, "#d9c39c");
  gradient.addColorStop(1, "#b99a70");
  g.fillStyle = gradient; g.fillRect(0, 0, 32, 512);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 16),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false, depthWrite: false })
  );
  sky.renderOrder = -100;
  scene.add(sky);
}
function buildTerrain() {
  const segments = 100, size = 100, half = size * 0.5, row = segments + 1;
  const count = row * row;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const uvs = new Float32Array(count * 2);
  const indices = new Uint32Array(segments * segments * 6);
  let k = 0;
  for (let j = 0; j <= segments; j++) {
    const z = -half + (j / segments) * size;
    for (let i = 0; i <= segments; i++) {
      const x = -half + (i / segments) * size;
      const h = terrainHeight(x, z);
      const p = (j * row + i) * 3;
      positions[p] = x; positions[p + 1] = h; positions[p + 2] = z;
      const uv = (j * row + i) * 2;
      uvs[uv] = i / segments; uvs[uv + 1] = j / segments;
      const tint = 0.92 + 0.045 * Math.sin(x * 0.51) * Math.cos(z * 0.39);
      colors[p] = 0.74 * tint; colors[p + 1] = 0.62 * tint; colors[p + 2] = 0.46 * tint;
      if (i < segments && j < segments) {
        const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
        indices[k++] = a; indices[k++] = c; indices[k++] = b;
        indices[k++] = b; indices[k++] = c; indices[k++] = d;
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(new THREE.BufferAttribute(indices, 1));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ map: makeGroundTexture(), vertexColors: true, roughness: 0.98 });
  const ground = new THREE.Mesh(geo, mat);
  ground.receiveShadow = true;
  scene.add(ground);
}
function makeSign(number, title) {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 192;
  const g = c.getContext("2d");
  g.fillStyle = "#22302b"; g.fillRect(0, 0, 512, 192);
  g.strokeStyle = "#d1a85f"; g.lineWidth = 4; g.strokeRect(10, 10, 492, 172);
  g.fillStyle = "#e9b95c"; g.font = "600 24px sans-serif"; g.fillText("FIELD STOP 0" + number, 30, 56);
  g.fillStyle = "#f4ecd9"; g.font = "600 34px sans-serif"; g.fillText(title, 30, 111);
  g.fillStyle = "#b8b19f"; g.font = "18px sans-serif"; g.fillText("GOBUSTAN · AZERBAIJAN", 30, 152);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(2.35, 0.88), mat);
}
function addBeacon(index, x, z) {
  const y = terrainHeight(x, z);
  const group = new THREE.Group();
  group.position.set(x, y + 0.04, z);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.035, 8, 36), new THREE.MeshBasicMaterial({ color: 0xf0c56a }));
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.04;
  group.add(ring);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.055, 1.05, 8), new THREE.MeshStandardMaterial({ color: 0xe2ad51, roughness: 0.55 }));
  stem.position.y = 0.55; stem.castShadow = true; group.add(stem);
  const orb = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe7a1 }));
  orb.position.y = 1.12; group.add(orb);
  const titles = ["ROCK ART", "SOUND STONE", "LANDSCAPE"];
  const sign = makeSign(index + 1, titles[index]);
  sign.position.set(1.45, 1.05, 0.16);
  group.add(sign);
  scene.add(group);
}
function addTrail() {
  const points = [
    [0, 9], [0, 1], [0, -7], [5, -12], [12, -17], [6, -22], [-10, -26]
  ].map(function(p) { return new THREE.Vector3(p[0], terrainHeight(p[0], p[1]) + 0.09, p[1]); });
  const curve = new THREE.CatmullRomCurve3(points);
  const count = 120, positions = new Float32Array((count + 1) * 6), indices = new Uint16Array(count * 6);
  for (let i = 0; i <= count; i++) {
    const t = i / count, p = curve.getPoint(t), tangent = curve.getTangent(t);
    const length = Math.max(0.001, Math.hypot(tangent.x, tangent.z));
    const nx = -tangent.z / length, nz = tangent.x / length, width = 0.9;
    const ax = p.x + nx * width, az = p.z + nz * width;
    const bx = p.x - nx * width, bz = p.z - nz * width;
    const v = i * 6;
    positions[v] = ax; positions[v + 1] = terrainHeight(ax, az) + 0.045; positions[v + 2] = az;
    positions[v + 3] = bx; positions[v + 4] = terrainHeight(bx, bz) + 0.045; positions[v + 5] = bz;
    if (i < count) {
      const k = i * 6, a = i * 2;
      indices[k] = a; indices[k + 1] = a + 2; indices[k + 2] = a + 1;
      indices[k + 3] = a + 1; indices[k + 4] = a + 2; indices[k + 5] = a + 3;
    }
  }
  const ribbon = new THREE.BufferGeometry();
  ribbon.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  ribbon.setIndex(new THREE.BufferAttribute(indices, 1));
  ribbon.computeVertexNormals();
  const surface = new THREE.Mesh(ribbon, new THREE.MeshStandardMaterial({ color: 0xb08a59, roughness: 1, side: THREE.DoubleSide }));
  surface.receiveShadow = true; scene.add(surface);
  const path = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 100, 0.045, 8, false),
    new THREE.MeshStandardMaterial({ color: 0xc6843e, roughness: 0.9, emissive: 0x281507, emissiveIntensity: 0.15 })
  );
  path.castShadow = false; scene.add(path);
}
function addShrubs() {
  const rand = seeded(9142);
  const geo = new THREE.ConeGeometry(0.14, 0.42, 4);
  const mat = new THREE.MeshStandardMaterial({ color: 0x5b5b39, roughness: 1 });
  const count = 96;
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const dummy = new THREE.Object3D();
  let placed = 0;
  for (let tries = 0; tries < 320 && placed < count; tries++) {
    const x = (rand() * 2 - 1) * 39, z = (rand() * 2 - 1) * 39;
    let close = false;
    for (let n = 0; n < stops.length; n++) {
      const dx = x - stops[n].x, dz = z - stops[n].z;
      if (dx * dx + dz * dz < 32) close = true;
    }
    if (close || (Math.abs(x) < 2.2 && z > -2 && z < 12)) continue;
    dummy.position.set(x, terrainHeight(x, z) + 0.14, z);
    const scale = 0.55 + rand() * 1.25;
    dummy.scale.set(scale, scale, scale);
    dummy.rotation.y = rand() * Math.PI * 2;
    dummy.updateMatrix(); mesh.setMatrixAt(placed++, dummy.matrix);
  }
  mesh.count = placed; mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false; scene.add(mesh);
}
function addHorizon() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x846b4c, roughness: 1 });
  const ridge = [
    [-42, -36, 8, 3.2, 6], [-34, -48, 9, 4.6, 7], [-19, -48, 11, 3.4, 8],
    [21, -49, 13, 5.5, 9], [39, -36, 8, 3.5, 6], [40, 4, 7, 2.8, 6],
    [-40, 3, 8, 3.8, 7]
  ];
  for (const p of ridge) {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 1), mat);
    m.position.set(p[0], p[3], p[1]); m.scale.set(p[2], p[3], p[4]);
    m.rotation.set(0.15, p[0] * 0.015, 0.06); m.receiveShadow = true; scene.add(m);
  }
}
function setModelShadows(root) {
  root.traverse(function(o) {
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; }
  });
}
function addRockInstances(root, placements) {
  for (const p of placements) {
    const m = root.clone(true);
    m.position.set(p[0], terrainHeight(p[0], p[1]), p[1]);
    m.scale.set(p[2], p[2], p[2]);
    m.rotation.y = p[3];
    scene.add(m);
  }
}
function addMapMarkers() {
  for (let i = 0; i < stops.length; i++) addBeacon(i, stops[i].x, stops[i].z);
}
function resize() {
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h; camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(w, h, false);
}
window.addEventListener("resize", resize, { passive: true });

const loader = new GLTFLoader();
async function loadAssets() {
  const [rock, stela, sound] = await Promise.all([
    loader.loadAsync("models/gobustan-rock.glb"),
    loader.loadAsync("models/petroglyph-stela.glb"),
    loader.loadAsync("models/qaval-dash.glb")
  ]);
  if (fallbackActive) return;
  const rockRoot = rock.scene;
  const stelaRoot = stela.scene;
  const soundRoot = sound.scene;
  setModelShadows(rockRoot); setModelShadows(stelaRoot); setModelShadows(soundRoot);
  const stelaX = stops[0].x, stelaZ = stops[0].z;
  stelaRoot.position.set(stelaX, terrainHeight(stelaX, stelaZ) + 0.02, stelaZ);
  stelaRoot.rotation.y = 0;
  scene.add(stelaRoot);
  soundRoot.position.set(stops[1].x, terrainHeight(stops[1].x, stops[1].z) + 0.03, stops[1].z);
  soundRoot.rotation.y = 0.7;
  scene.add(soundRoot);
  addRockInstances(rockRoot, [
    [-2.5, -8.5, 1.45, 0.3], [2.4, -11.2, 1.05, 1.1],
    [-15, -16, 2.5, 0.4], [20, -27, 3.2, 0.8],
    [15, -8, 1.8, 0.9], [-8.8, -27, 1.6, 1.9],
    [-25, -33, 3.4, 2.2], [30, -40, 4.0, 0.2]
  ]);
  const lookout = rockRoot.clone(true);
  lookout.position.set(stops[2].x + 1, terrainHeight(stops[2].x + 1, stops[2].z), stops[2].z);
  lookout.scale.set(1.6, 1.6, 1.6);
  scene.add(lookout);
}

function buildWorld() {
  addSky();
  buildTerrain();
  addHorizon();
  addTrail();
  addShrubs();
  addMapMarkers();
}
function showLoadError(err) {
  fallbackActive = true;
  console.error("Gobustan asset loading failed", err);
  import("./fallback.js?v=20261113a").then(function(fallback) {
    fallback.initFallback("asset-error");
  }).catch(function(error) {
    const box = document.getElementById("load-error");
    box.style.display = "block";
    box.textContent = "The experience could not start. Please refresh the page or try another browser.";
    console.error("Fallback could not start", error);
  });
}
function setLanguage() {
  const t = copy[language];
  document.documentElement.lang = language;
  document.getElementById("stats-label").textContent = t.stats;
  document.getElementById("progress-label").textContent = t.stops;
  document.getElementById("map-title").textContent = t.map;
  document.getElementById("map-note").textContent = t.mapNote;
  document.getElementById("quick-label").textContent = t.quick;
  document.querySelectorAll("#quick-stops button").forEach(function(button, index) {
    const label = t.quickTo + " " + t.stopTitles[index];
    button.setAttribute("aria-label", label); button.title = label;
  });
  document.getElementById("start-eyebrow").textContent = t.startEyebrow;
  document.getElementById("start-title").innerHTML = t.startTitle;
  document.getElementById("start-copy").textContent = t.startCopy;
  document.getElementById("controls").innerHTML = t.controls;
  document.getElementById("inspect").textContent = t.explore;
  document.getElementById("near-prompt").textContent = t.near;
  document.getElementById("close-info").textContent = t.continue;
  document.getElementById("reset").textContent = t.restart;
  document.getElementById("lang").textContent = language === "en" ? "EN / AZ" : "AZ / EN";
  if (!started) document.getElementById("start-btn").textContent = t.startButton;
  if (infoOpen && activeInfoIndex >= 0) fillInfo(activeInfoIndex);
  document.dispatchEvent(new CustomEvent("gobustan:language-changed", { detail: language }));
}
function updateProgress() {
  const total = visited.filter(Boolean).length;
  document.getElementById("progress").textContent = total + " / 3";
  if (total === 3) {
    const t = copy[language];
    document.getElementById("near-prompt").style.display = "block";
    document.getElementById("near-prompt").textContent = t.routeDone;
  }
  for (let i = 0; i < 3; i++) {
    document.getElementById("stop-" + i).setAttribute("fill", visited[i] ? "#b9ead1" : "#e9b95c");
  }
}
function fillInfo(i) {
  const t = copy[language];
  document.getElementById("info-kicker").textContent = t.stopKickers[i];
  document.getElementById("info-title").textContent = t.stopTitles[i];
  document.getElementById("info-copy").textContent = t.stopCopy[i];
  const source = document.getElementById("info-source");
  const url = i === 1 ? "https://azerbaijan.travel/qobustanda-das-dovrune-seyahet" : "https://whc.unesco.org/en/list/1076/";
  source.innerHTML = t.source[i] + " · <a href='" + url + "' target='_blank' rel='noopener'>" + t.sourceLink + "</a>";
}
function openInfo(i) {
  if (i < 0) return;
  visited[i] = true;
  nearbyIndex = i;
  activeInfoIndex = i;
  infoOpen = true;
  fillInfo(i);
  document.getElementById("info").style.display = "block";
  document.getElementById("near-prompt").style.display = "none";
  updateProgress();
  if (i === 1) playStoneTone();
}
function closeInfo() {
  infoOpen = false;
  activeInfoIndex = -1;
  document.getElementById("info").style.display = "none";
  updateProgress();
}
function playStoneTone() {
  try {
    if (!audioContext) audioContext = new AudioContext();
    if (audioContext.state === "suspended") audioContext.resume();
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    osc.type = "sine"; osc.frequency.value = 196;
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.55);
    osc.connect(gain); gain.connect(audioContext.destination);
    osc.start(); osc.stop(audioContext.currentTime + 0.57);
  } catch (_) {}
}
function interact() {
  if (!started || mapOpen) return;
  if (infoOpen) { closeInfo(); return; }
  if (nearbyIndex >= 0) openInfo(nearbyIndex);
}
document.getElementById("start-btn").addEventListener("click", function() {
  started = true;
  document.getElementById("start").style.display = "none";
});
document.getElementById("lang").addEventListener("click", function() {
  language = language === "en" ? "az" : "en"; setLanguage();
});
document.addEventListener("gobustan:set-language", function(event) {
  language = event.detail === "az" ? "az" : "en";
  setLanguage();
});
document.addEventListener("gobustan:map-state", function(event) {
  mapOpen = Boolean(event.detail && event.detail.open);
  keys.clear(); touchMove.x = 0; touchMove.y = 0;
});
document.getElementById("reset").addEventListener("click", function() {
  player.x = 0; player.z = 9; player.yaw = 0; player.pitch = -0.04;
  visited[0] = false; visited[1] = false; visited[2] = false;
  nearbyIndex = -1; closeInfo(); updateProgress();
  started = false; document.getElementById("start").style.display = "grid";
  updateCamera();
  document.getElementById("start-btn").textContent = copy[language].startButton;
});
document.getElementById("inspect").addEventListener("pointerdown", function(e) {
  e.preventDefault(); interact();
});
document.getElementById("close-info").addEventListener("click", closeInfo);
document.querySelectorAll("#quick-stops button").forEach(function(button) {
  button.addEventListener("click", function() {
    if (!started || mapOpen) return;
    const index = Number(button.dataset.stop), stop = stops[index];
    if (!stop) return;
    player.x = stop.x; player.z = stop.z + 3; player.yaw = 0; player.pitch = -0.06;
    updateCamera(); updateMapAndNearby(); openInfo(index);
  });
});
window.addEventListener("keydown", function(e) {
  if (mapOpen) return;
  if (e.code === "Escape" && infoOpen) { e.preventDefault(); closeInfo(); return; }
  if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (["Space", "KeyE", "Enter"].includes(e.code) && !e.repeat) interact();
});
window.addEventListener("keyup", function(e) { keys.delete(e.code); });
window.addEventListener("blur", function() { keys.clear(); touchMove.x = 0; touchMove.y = 0; });

const joy = document.getElementById("joy");
const knob = document.getElementById("knob");
joy.addEventListener("pointerdown", function(e) {
  e.preventDefault(); joyPointer = e.pointerId; joy.setPointerCapture(e.pointerId);
  const r = joy.getBoundingClientRect(); joyCenterX = r.left + r.width * 0.5; joyCenterY = r.top + r.height * 0.5;
  moveJoy(e.clientX, e.clientY);
});
joy.addEventListener("pointermove", function(e) { if (e.pointerId === joyPointer) moveJoy(e.clientX, e.clientY); });
function releaseJoy(e) {
  if (e.pointerId !== joyPointer) return;
  joyPointer = null; touchMove.x = 0; touchMove.y = 0; knob.style.transform = "translate(0px,0px)";
}
joy.addEventListener("pointerup", releaseJoy);
joy.addEventListener("pointercancel", releaseJoy);
function moveJoy(x, y) {
  const dx = x - joyCenterX, dy = y - joyCenterY;
  const max = 33, len = Math.max(1, Math.hypot(dx, dy)), scale = Math.min(1, max / len);
  const px = dx * scale, py = dy * scale;
  touchMove.x = px / max; touchMove.y = py / max;
  knob.style.transform = "translate(" + px + "px," + py + "px)";
}
canvas.addEventListener("pointerdown", function(e) {
  if (!started || e.pointerType === "mouse" && e.button !== 0) return;
  if (e.pointerType !== "mouse" && e.clientX < window.innerWidth * 0.42) return;
  lookPointer = e.pointerId; lastLookX = e.clientX; lastLookY = e.clientY;
  try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
});
canvas.addEventListener("pointermove", function(e) {
  if (e.pointerId !== lookPointer) return;
  const dx = e.clientX - lastLookX, dy = e.clientY - lastLookY;
  lastLookX = e.clientX; lastLookY = e.clientY;
  player.yaw -= dx * 0.004;
  player.pitch = Math.max(-0.65, Math.min(0.65, player.pitch - dy * 0.003));
});
function releaseLook(e) { if (e.pointerId === lookPointer) lookPointer = null; }
canvas.addEventListener("pointerup", releaseLook);
canvas.addEventListener("pointercancel", releaseLook);

function updateMapAndNearby() {
  const mapX = Math.max(7, Math.min(173, (player.x + 24) / 48 * 180));
  const mapY = Math.max(7, Math.min(105, (14 - player.z) / 50 * 112));
  const dot = document.getElementById("map-player");
  dot.setAttribute("cx", mapX.toFixed(1)); dot.setAttribute("cy", mapY.toFixed(1));
  const easting = Math.round(player.x + 50), northing = Math.round(50 - player.z);
  document.getElementById("coords").textContent = copy[language].localGrid + " · E " + String(easting).padStart(3,"0") + "m · N " + String(northing).padStart(3,"0") + "m";
  let found = -1, best = 5.2 * 5.2;
  for (let i = 0; i < stops.length; i++) {
    const dx = player.x - stops[i].x, dz = player.z - stops[i].z;
    const d2 = dx * dx + dz * dz;
    if (d2 < best) { best = d2; found = i; }
  }
  nearbyIndex = found;
  const prompt = document.getElementById("near-prompt");
  if (found >= 0 && !infoOpen) {
    prompt.style.display = "block";
    const action = window.matchMedia("(pointer: coarse)").matches ? copy[language].nearTouch : copy[language].near;
    prompt.textContent = action + " · " + copy[language].stopTitles[found].toUpperCase();
  } else if (visited.every(Boolean) && !infoOpen) {
    prompt.style.display = "block";
    prompt.textContent = copy[language].routeDone;
  } else if (!infoOpen) {
    prompt.style.display = "none";
  }
}
function updateCamera() {
  const gy = terrainHeight(player.x, player.z);
  camera.position.set(player.x, gy + 1.62, player.z);
  const cp = Math.cos(player.pitch), sp = Math.sin(player.pitch);
  lookPoint.set(player.x + Math.sin(player.yaw) * cp, gy + 1.62 + sp, player.z - Math.cos(player.yaw) * cp);
  camera.lookAt(lookPoint);
}
function fixedUpdate(dt) {
  if (!started || infoOpen || mapOpen) return;
  const forward = (keys.has("KeyW") ? 1 : 0) - (keys.has("KeyS") ? 1 : 0) - touchMove.y;
  const side = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0) + touchMove.x;
  let fx = Math.sin(player.yaw) * forward + Math.cos(player.yaw) * side;
  let fz = -Math.cos(player.yaw) * forward + Math.sin(player.yaw) * side;
  const len = Math.hypot(fx, fz);
  if (len > 1) { fx /= len; fz /= len; }
  player.x += fx * 4.0 * dt; player.z += fz * 4.0 * dt;
  player.x = Math.max(-39, Math.min(39, player.x));
  player.z = Math.max(-43, Math.min(17, player.z));
  const turn = 1.45 * dt;
  if (keys.has("ArrowLeft")) player.yaw += turn;
  if (keys.has("ArrowRight")) player.yaw -= turn;
  if (keys.has("ArrowUp")) player.pitch = Math.max(-0.65, player.pitch + turn * 0.55);
  if (keys.has("ArrowDown")) player.pitch = Math.min(0.65, player.pitch - turn * 0.55);
  updateCamera();
  sceneClock.elapsed += dt;
}
function animate(ts) {
  if (fallbackActive) return;
  requestAnimationFrame(animate);
  const dt = lastFrame ? Math.min(0.05, Math.max(0, (ts - lastFrame) / 1000)) : 0;
  lastFrame = ts; accumulator += dt;
  while (accumulator >= fixedDt) { fixedUpdate(fixedDt); accumulator -= fixedDt; }
  frameCount++;
  if (frameCount % 8 === 0) updateMapAndNearby();
  renderer.render(scene, camera);
}
function init() {
  buildWorld();
  updateCamera();
  let loadTimer;
  const timeout = new Promise(function(_, reject) {
    loadTimer = setTimeout(function() { reject(new Error("3D assets timed out")); }, 30000);
  });
  Promise.race([loadAssets(), timeout]).then(function() {
    clearTimeout(loadTimer);
    document.getElementById("start-btn").disabled = false;
    document.getElementById("start-btn").textContent = copy[language].loaded;
  }).catch(function(error) { clearTimeout(loadTimer); showLoadError(error); });
  setLanguage();
  updateProgress();
  requestAnimationFrame(animate);
}
init();

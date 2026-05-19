import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const loadingScreen = document.querySelector("#loadingScreen");
const percent = document.querySelector("#percent");
const progressBar = document.querySelector("#progressBar");
const earthMount = document.querySelector("#earthMount");
const countryTooltip = document.querySelector("#countryTooltip");
const snowCanvas = document.querySelector("#snowCanvas");
const snowCtx = snowCanvas.getContext("2d");
const mailboxButton = document.querySelector("#mailboxButton");
const unreadCount = document.querySelector("#unreadCount");
const memoryDialog = document.querySelector("#memoryDialog");
const memoryForm = document.querySelector("#memoryForm");
const memoryDialogTitle = document.querySelector("#memoryDialogTitle");
const saveMemoryButton = document.querySelector("#saveMemoryButton");
const stampImage = document.querySelector("#stampImage");
const closeDialog = document.querySelector("#closeDialog");
const bookDialog = document.querySelector("#bookDialog");
const book = document.querySelector("#book");
const closeBook = document.querySelector("#closeBook");
const prevPage = document.querySelector("#prevPage");
const nextPage = document.querySelector("#nextPage");
const editPage = document.querySelector("#editPage");
const deletePage = document.querySelector("#deletePage");
const clearMemories = document.querySelector("#clearMemories");
const pageText = document.querySelector("#pageText");

const memoryKey = "future-memories-v2";
const unreadKey = "future-unread-v2";
const typeColor = {
  want: "#f5bf42",
  done: "#6bb8ff",
  dream: "#f59ac4"
};
const typeLabel = {
  want: "想去",
  done: "意愿已",
  dream: "梦想清单"
};
const stampImages = [
  { test: /China|中国/i, url: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=240&q=70" },
  { test: /Japan|日本/i, url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=240&q=70" },
  { test: /France|法国/i, url: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=240&q=70" },
  { test: /United States|美国/i, url: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=240&q=70" },
  { test: /United Kingdom|英国/i, url: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=240&q=70" },
  { test: /Australia|澳大利亚/i, url: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=240&q=70" },
  { test: /Brazil|巴西/i, url: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?auto=format&fit=crop&w=240&q=70" },
  { test: /Egypt|埃及/i, url: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?auto=format&fit=crop&w=240&q=70" }
];
const fallbackStamp = "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=240&q=70";

let memories = JSON.parse(localStorage.getItem(memoryKey) || "[]");
let unread = Number(localStorage.getItem(unreadKey) || memories.length || 0);
let selectedPoint = null;
let editingId = null;
let pageIndex = 0;
let snowflakes = [];

let scene;
let camera;
let renderer;
let earth;
let controls;
let responsiveCameraMode = "";
let markerGroup;
let starGroup;
let borderGroup;
let highlightGroup;
let labelGroup;
let countryFeatures = [];
let hoveredCountry = null;
let isEarthHovered = false;
let isEarthInteracting = false;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

const countryLabels = [
  { name: "中国", lat: 35, lon: 104 },
  { name: "俄罗斯", lat: 61, lon: 95 },
  { name: "美国", lat: 39, lon: -98 },
  { name: "加拿大", lat: 57, lon: -106 },
  { name: "巴西", lat: -10, lon: -55 },
  { name: "澳大利亚", lat: -25, lon: 134 },
  { name: "印度", lat: 22, lon: 79 },
  { name: "法国", lat: 47, lon: 2 },
  { name: "英国", lat: 54, lon: -2 },
  { name: "日本", lat: 37, lon: 138 },
  { name: "韩国", lat: 36, lon: 128 },
  { name: "泰国", lat: 15, lon: 101 },
  { name: "埃及", lat: 27, lon: 30 },
  { name: "南非", lat: -30, lon: 25 },
  { name: "墨西哥", lat: 23, lon: -102 },
  { name: "阿根廷", lat: -34, lon: -64 },
  { name: "印度尼西亚", lat: -2, lon: 118 },
  { name: "沙特阿拉伯", lat: 24, lon: 45 }
];

function beginLoading() {
  let value = 0;
  const timer = setInterval(() => {
    value = Math.min(100, value + 2);
    percent.textContent = `${value}%`;
    progressBar.style.width = `${value}%`;
    if (value === 100) {
      clearInterval(timer);
      setTimeout(() => {
        loadingScreen.classList.remove("active");
        loadingScreen.classList.add("hidden");
      }, 500);
    }
  }, 50);
}

function toDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function getViewportHeight() {
  return window.visualViewport?.height || window.innerHeight;
}

function syncViewportSize() {
  document.documentElement.style.setProperty("--app-height", `${getViewportHeight()}px`);
}

function getViewportMode() {
  if (window.innerWidth <= 480) return "phone";
  if (window.innerWidth <= 768) return "compact";
  return "desktop";
}

function getEarthCameraDistance() {
  const mode = getViewportMode();
  if (mode === "phone") return 6.1;
  if (mode === "compact") return 5.35;
  return 4.2;
}

function syncResponsiveCamera(force = false) {
  if (!camera) return;
  const mode = getViewportMode();
  if (!force && mode === responsiveCameraMode) return;
  responsiveCameraMode = mode;
  camera.position.set(0, mode === "desktop" ? 0.1 : 0.04, getEarthCameraDistance());
  camera.updateProjectionMatrix();
  if (!controls) return;
  controls.minDistance = mode === "phone" ? 4.6 : mode === "compact" ? 3.8 : 2.8;
  controls.maxDistance = mode === "desktop" ? 6 : 7.5;
  controls.update();
}

function initEarth() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / getViewportHeight(), 0.1, 100);
  camera.position.set(0, 0.1, getEarthCameraDistance());

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, getViewportHeight());
  earthMount.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 2.8;
  controls.maxDistance = 6;
  syncResponsiveCamera(true);

  scene.add(new THREE.AmbientLight(0xffffff, 1.7));
  const sun = new THREE.DirectionalLight(0xffffff, 2.1);
  sun.position.set(4, 2.5, 5);
  scene.add(sun);

  const textureLoader = new THREE.TextureLoader();
  const earthTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg");
  const bumpTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_bump_2048.jpg");
  const specTexture = textureLoader.load("https://threejs.org/examples/textures/planets/earth_specular_2048.jpg");

  earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.45, 96, 96),
    new THREE.MeshPhongMaterial({
      map: earthTexture,
      bumpMap: bumpTexture,
      bumpScale: 0.035,
      specularMap: specTexture,
      specular: new THREE.Color("#8ab1d6"),
      shininess: 18
    })
  );
  scene.add(earth);

  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(1.49, 96, 96),
    new THREE.MeshBasicMaterial({
      color: "#b9eaff",
      transparent: true,
      opacity: 0.18,
      side: THREE.BackSide
    })
  );
  scene.add(atmosphere);

  markerGroup = new THREE.Group();
  starGroup = new THREE.Group();
  borderGroup = new THREE.Group();
  highlightGroup = new THREE.Group();
  labelGroup = new THREE.Group();
  earth.add(borderGroup, highlightGroup, labelGroup, markerGroup, starGroup);
  renderMarkers();
  loadCountryBoundaries();
  renderCountryLabels();
}

async function loadCountryBoundaries() {
  try {
    const response = await fetch("https://cdn.jsdelivr.net/gh/datasets/geo-countries@master/data/countries.geojson");
    const geojson = await response.json();
    countryFeatures = geojson.features || [];
    drawCountryBorders(countryFeatures, borderGroup, "#ffffff", 0.006, 0.34);
  } catch (error) {
    console.warn("Country GeoJSON failed to load", error);
  }
}

function drawCountryBorders(features, targetGroup, color, lineWidth, opacity) {
  targetGroup.clear();
  const material = new THREE.LineBasicMaterial({
    color,
    transparent: true,
    opacity,
    linewidth: lineWidth
  });
  features.forEach((feature) => {
    getPolygonRings(feature.geometry).forEach((ring) => {
      const points = ringToVectors(ring, 1.462);
      if (points.length < 2) return;
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, material.clone());
      targetGroup.add(line);
    });
  });
}

function drawCountryHighlight(feature) {
  highlightGroup.clear();
  if (!feature) return;
  drawCountryBorders([feature], highlightGroup, "#ffe27a", 0.012, 0.95);
}

function getPolygonRings(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return geometry.coordinates;
  if (geometry.type === "MultiPolygon") return geometry.coordinates.flat();
  return [];
}

function ringToVectors(ring, radius) {
  const points = [];
  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const previous = ring[i - 1];
    if (previous && Math.abs(lon - previous[0]) > 180) {
      if (points.length > 1) break;
    }
    points.push(latLonToVector(lat, lon, radius));
  }
  return points;
}

function makeStarTexture(color) {
  const canvas = document.createElement("canvas");
  canvas.width = 96;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.translate(48, 48);
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? 34 : 14;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
  }
  ctx.closePath();
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function latLonToVector(lat, lon, radius = 1.51) {
  const phi = THREE.MathUtils.degToRad(90 - lat);
  const theta = THREE.MathUtils.degToRad(lon + 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

function vectorToLatLon(vector) {
  const v = vector.clone().normalize();
  return {
    lat: THREE.MathUtils.radToDeg(Math.asin(v.y)),
    lon: normalizeLon(THREE.MathUtils.radToDeg(Math.atan2(v.z, -v.x)) - 180)
  };
}

function hitToLatLon(hit) {
  const inverseWorld = earth.matrixWorld.clone().invert();
  const localPoint = hit.point.clone().applyMatrix4(inverseWorld);
  return vectorToLatLon(localPoint);
}

function stampForPlace(place) {
  return stampImages.find((item) => item.test.test(place))?.url || fallbackStamp;
}

function normalizeLon(lon) {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function createTextSprite(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.font = "700 26px Segoe UI, Microsoft YaHei, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(32, 45, 62, 0.58)";
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";
  ctx.strokeText(text, 128, 48);
  ctx.fillText(text, 128, 48);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    })
  );
  sprite.scale.set(0.42, 0.16, 1);
  return sprite;
}

function renderCountryLabels() {
  if (!labelGroup) return;
  labelGroup.clear();
  countryLabels.forEach((country) => {
    const sprite = createTextSprite(country.name);
    sprite.position.copy(latLonToVector(country.lat, country.lon, 1.535));
    labelGroup.add(sprite);
  });
}

function renderMarkers() {
  if (!markerGroup || !starGroup) return;
  markerGroup.clear();
  starGroup.clear();
  memories.forEach((memory) => {
    const position = latLonToVector(memory.lat, memory.lon);
    const marker = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 16, 16),
      new THREE.MeshBasicMaterial({ color: typeColor[memory.type] || typeColor.want })
    );
    marker.position.copy(position);
    markerGroup.add(marker);

    for (let i = 0; i < Math.min(5, 1 + Math.floor(memories.length / 2)); i++) {
      const star = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: makeStarTexture(typeColor[memory.type] || typeColor.want),
          transparent: true,
          opacity: 0.88
        })
      );
      const lift = 1.62 + i * 0.035;
      star.position.copy(latLonToVector(memory.lat + i * 0.6, memory.lon + i * 0.9, lift));
      star.scale.setScalar(0.13 - i * 0.01);
      starGroup.add(star);
    }
  });
}

function animate() {
  requestAnimationFrame(animate);
  if (earth && !isEarthHovered && !isEarthInteracting) earth.rotation.y += 0.0014;
  if (starGroup) {
    starGroup.children.forEach((star, index) => {
      star.material.rotation += 0.01 + index * 0.0008;
    });
  }
  controls?.update();
  drawSnow();
  renderer?.render(scene, camera);
}

function onEarthClick(event) {
  const hit = getEarthHit(event);
  if (!hit) return;
  selectedPoint = hitToLatLon(hit);
  const country = findCountryAt(selectedPoint.lat, selectedPoint.lon);
  openMemoryForm();
  const place = country ? getCountryName(country) : "海洋区域";
  document.querySelector("#placeInput").value = place;
  stampImage.src = stampForPlace(place);
}

function getEarthHit(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  return raycaster.intersectObject(earth)[0] || null;
}

function installEarthClickGuard() {
  let down = null;
  earthMount.addEventListener("pointerdown", (event) => {
    isEarthInteracting = true;
    down = { x: event.clientX, y: event.clientY };
  });
  earthMount.addEventListener("pointerup", (event) => {
    isEarthInteracting = false;
    if (!down) return;
    const moved = Math.hypot(event.clientX - down.x, event.clientY - down.y);
    down = null;
    if (moved < 6) onEarthClick(event);
  });
  earthMount.addEventListener("pointermove", handleEarthHover);
  earthMount.addEventListener("pointerleave", () => {
    isEarthHovered = false;
    isEarthInteracting = false;
    hoveredCountry = null;
    drawCountryHighlight(null);
    countryTooltip.classList.remove("visible");
  });
}

function handleEarthHover(event) {
  const hit = getEarthHit(event);
  if (!hit) {
    isEarthHovered = false;
    countryTooltip.classList.remove("visible");
    hoveredCountry = null;
    drawCountryHighlight(null);
    return;
  }
  isEarthHovered = true;
  const latLon = hitToLatLon(hit);
  const country = findCountryAt(latLon.lat, latLon.lon);
  if (!country) {
    countryTooltip.classList.remove("visible");
    hoveredCountry = null;
    drawCountryHighlight(null);
    return;
  }
  const name = getCountryName(country);
  if (hoveredCountry !== country) {
    hoveredCountry = country;
    drawCountryHighlight(country);
  }
  countryTooltip.textContent = name;
  countryTooltip.style.left = `${event.clientX}px`;
  countryTooltip.style.top = `${event.clientY}px`;
  countryTooltip.classList.add("visible");
}

function getCountryName(feature) {
  const props = feature?.properties || {};
  return props.ADMIN || props.NAME || props.name || props.NAME_LONG || "未知地区";
}

function findCountryAt(lat, lon) {
  const normalizedLon = normalizeLon(lon);
  for (const feature of countryFeatures) {
    const bbox = feature.bbox;
    if (bbox && (normalizedLon < bbox[0] || lat < bbox[1] || normalizedLon > bbox[2] || lat > bbox[3])) continue;
    if (geometryContains(feature.geometry, normalizedLon, lat)) return feature;
  }
  return null;
}

function geometryContains(geometry, lon, lat) {
  if (!geometry) return false;
  if (geometry.type === "Polygon") return polygonContains(geometry.coordinates, lon, lat);
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => polygonContains(polygon, lon, lat));
  }
  return false;
}

function polygonContains(polygon, lon, lat) {
  if (!polygon.length || !pointInRing(polygon[0], lon, lat)) return false;
  for (let i = 1; i < polygon.length; i++) {
    if (pointInRing(polygon[i], lon, lat)) return false;
  }
  return true;
}

function pointInRing(ring, lon, lat) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi + Number.EPSILON) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

function openMemoryForm(memory = null) {
  editingId = memory?.id || null;
  memoryForm.reset();
  memoryDialogTitle.textContent = memory ? "修改这条记忆" : "添加一颗记忆星";
  saveMemoryButton.textContent = memory ? "保存修改" : "保存到地球";
  if (memory) {
    selectedPoint = { lat: memory.lat, lon: memory.lon };
    document.querySelector("#placeInput").value = memory.place;
    document.querySelector("#dateInput").value = memory.date || "";
    document.querySelector("#typeInput").value = memory.type;
    document.querySelector("#noteInput").value = memory.note || "";
    stampImage.src = stampForPlace(memory.place);
  } else {
    stampImage.src = fallbackStamp;
  }
  memoryDialog.showModal();
}

memoryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!selectedPoint) return;
  const photo = document.querySelector("#photoInput").files[0];
  const existing = editingId ? memories.find((memory) => memory.id === editingId) : null;
  const image = photo ? await toDataUrl(photo) : existing?.image || "";
  const memory = {
    id: editingId || crypto.randomUUID(),
    lat: selectedPoint.lat,
    lon: selectedPoint.lon,
    place: document.querySelector("#placeInput").value.trim(),
    date: document.querySelector("#dateInput").value,
    type: document.querySelector("#typeInput").value,
    note: document.querySelector("#noteInput").value.trim(),
    image
  };

  if (editingId) {
    memories = memories.map((item) => (item.id === editingId ? memory : item));
  } else {
    memories.unshift(memory);
    unread += 1;
    flyEnvelope(memory);
  }

  editingId = null;
  saveState();
  renderMarkers();
  renderBook();
  updateUnread();
  memoryDialog.close();
});

closeDialog.addEventListener("click", () => memoryDialog.close());

mailboxButton.addEventListener("click", () => {
  unread = 0;
  saveState();
  updateUnread();
  pageIndex = 0;
  renderBook();
  bookDialog.showModal();
});

closeBook.addEventListener("click", () => bookDialog.close());
prevPage.addEventListener("click", () => {
  pageIndex = Math.max(0, pageIndex - 1);
  updateBookPages();
});
nextPage.addEventListener("click", () => {
  pageIndex = Math.min(memories.length, pageIndex + 1);
  updateBookPages();
});
editPage.addEventListener("click", () => {
  const memory = memories[pageIndex - 1];
  if (!memory) return;
  bookDialog.close();
  openMemoryForm(memory);
});
deletePage.addEventListener("click", () => {
  const memory = memories[pageIndex - 1];
  if (!memory || !confirm("删除当前这条记忆吗？")) return;
  memories = memories.filter((item) => item.id !== memory.id);
  pageIndex = Math.min(pageIndex, memories.length);
  saveState();
  renderMarkers();
  renderBook();
});
clearMemories.addEventListener("click", () => {
  if (!confirm("确定要清空所有记忆吗？这个操作不能撤销。")) return;
  memories = [];
  unread = 0;
  pageIndex = 0;
  saveState();
  renderMarkers();
  renderBook();
  updateUnread();
});

function saveState() {
  localStorage.setItem(memoryKey, JSON.stringify(memories));
  localStorage.setItem(unreadKey, String(unread));
}

function updateUnread() {
  unreadCount.textContent = unread ? String(unread) : "";
  unreadCount.dataset.count = String(unread);
}

function renderBook() {
  const pages = [
    `<article class="book-page" data-page="0">
      <section class="page-side">
        <h2>Memory Book</h2>
      </section>
      <section class="page-side">
        <p>这里会收集她去过的地方、想去的地方，和还没说出口的梦想。</p>
        <p>点击地球添加记忆，也可以在这里修改、删除或清空。</p>
      </section>
    </article>`,
    ...memories.map((memory, index) => {
      const color = typeColor[memory.type] || typeColor.want;
      return `<article class="book-page" data-page="${index + 1}">
        <section class="page-side">
          ${memory.image ? `<img src="${memory.image}" alt="${escapeHtml(memory.place)}" />` : `<h3>${escapeHtml(memory.place)}</h3>`}
        </section>
        <section class="page-side">
          <span class="type-chip"><i class="type-dot" style="background:${color}"></i>${typeLabel[memory.type]}</span>
          <h3>${escapeHtml(memory.place)}</h3>
          <p>${memory.date || "某一天"}</p>
          <p>${escapeHtml(memory.note || "这颗星星还在等她补上故事。")}</p>
        </section>
      </article>`;
    })
  ];
  book.innerHTML = pages.join("");
  updateBookPages();
}

function updateBookPages() {
  const pages = [...book.querySelectorAll(".book-page")];
  pages.forEach((page, index) => {
    page.classList.toggle("flipped", index < pageIndex);
    page.classList.toggle("hidden", index > pageIndex);
    page.style.zIndex = String(100 - index);
  });
  pageText.textContent = pageIndex === 0 ? "封面" : `${pageIndex} / ${memories.length}`;
  prevPage.disabled = pageIndex === 0;
  nextPage.disabled = pageIndex >= memories.length;
  editPage.disabled = pageIndex === 0 || memories.length === 0;
  deletePage.disabled = pageIndex === 0 || memories.length === 0;
  clearMemories.disabled = memories.length === 0;
}

function flyEnvelope(memory) {
  const start = latLonToVector(memory.lat, memory.lon, 1.65);
  const world = earth.localToWorld(start);
  const screen = world.project(camera);
  const fromX = (screen.x * 0.5 + 0.5) * window.innerWidth;
  const fromY = (-screen.y * 0.5 + 0.5) * getViewportHeight();
  const mailboxRect = mailboxButton.getBoundingClientRect();
  const toX = mailboxRect.left + mailboxRect.width / 2;
  const toY = mailboxRect.top + mailboxRect.height / 2;
  const envelope = document.createElement("div");
  envelope.className = "flying-envelope";
  envelope.style.left = `${fromX}px`;
  envelope.style.top = `${fromY}px`;
  document.body.appendChild(envelope);
  requestAnimationFrame(() => {
    envelope.style.transform = `translate(${toX - fromX}px, ${toY - fromY}px) scale(0.35) rotate(-18deg)`;
    envelope.style.opacity = "0";
  });
  setTimeout(() => envelope.remove(), 980);
}

function escapeHtml(value = "") {
  return value.replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function resizeSnow() {
  const dpr = window.devicePixelRatio || 1;
  const viewportHeight = getViewportHeight();
  snowCanvas.width = window.innerWidth * dpr;
  snowCanvas.height = viewportHeight * dpr;
  snowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  snowflakes = Array.from({ length: Math.max(70, Math.floor(window.innerWidth / 12)) }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * viewportHeight,
    size: Math.random() * 3 + 1,
    speed: Math.random() * 0.8 + 0.15,
    drift: Math.random() * 0.6 - 0.3
  }));
}

function drawSnow() {
  const viewportHeight = getViewportHeight();
  snowCtx.clearRect(0, 0, window.innerWidth, viewportHeight);
  snowCtx.fillStyle = "rgba(255,255,255,0.78)";
  snowflakes.forEach((flake) => {
    snowCtx.fillRect(flake.x, flake.y, flake.size, flake.size);
    flake.y += flake.speed;
    flake.x += flake.drift;
    if (flake.y > viewportHeight) {
      flake.y = -8;
      flake.x = Math.random() * window.innerWidth;
    }
  });
}

function handleResize() {
  syncViewportSize();
  if (!camera || !renderer) {
    resizeSnow();
    return;
  }
  camera.aspect = window.innerWidth / getViewportHeight();
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, getViewportHeight());
  syncResponsiveCamera();
  resizeSnow();
}

window.addEventListener("resize", handleResize);
window.visualViewport?.addEventListener("resize", handleResize);

syncViewportSize();
resizeSnow();
initEarth();
installEarthClickGuard();
renderBook();
updateUnread();
beginLoading();
animate();

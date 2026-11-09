(() => {
  const center = [-93.2923, 37.2153];
  const zones = ['Residential', 'Commercial', 'Industrial', 'Mixed Use'];
  const statuses = ['Available', 'Under Review', 'On Hold'];
  const parcels = [];
  let seed = 120481;
  const random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);

  for (let row = 0; row < 31; row++) {
    for (let col = 0; col < 37; col++) {
      const idNum = 10001 + row * 37 + col;
      const width = 0.00083 + random() * 0.00014;
      const height = 0.00064 + random() * 0.00012;
      const lng = center[0] + (col - 18) * 0.00108;
      const lat = center[1] + (row - 15) * 0.00087;
      const acres = +(0.18 + random() * 6.7).toFixed(2);
      const zone = zones[Math.floor(random() * zones.length)];
      const status = statuses[Math.floor(random() * statuses.length)];
      const price = Math.round((acres * (zone === 'Commercial' ? 73000 : zone === 'Industrial' ? 41000 : 52000)) / 1000) * 1000;
      const id = `SPR-${idNum}`;
      parcels.push({
        type: 'Feature',
        id,
        properties: { parcel_id: id, zone, status, acres, asking_price: price, county: 'Greene', source: 'Synthetic demo data' },
        geometry: { type: 'Polygon', coordinates: [[[lng, lat], [lng + width, lat], [lng + width, lat + height], [lng, lat + height], [lng, lat]]] }
      });
    }
  }
  const parcelData = { type: 'FeatureCollection', features: parcels };
  const floodData = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', properties: { name: 'Synthetic flood context A' }, geometry: { type: 'Polygon', coordinates: [[[-93.300,37.219],[-93.296,37.219],[-93.292,37.221],[-93.291,37.224],[-93.298,37.225],[-93.300,37.219]]] } },
      { type: 'Feature', properties: { name: 'Synthetic flood context B' }, geometry: { type: 'Polygon', coordinates: [[[-93.286,37.207],[-93.281,37.208],[-93.280,37.211],[-93.284,37.213],[-93.287,37.210],[-93.286,37.207]]] } }
    ]
  };
  const utilityData = {
    type: 'FeatureCollection',
    features: [[-93.297,37.214],[-93.288,37.217],[-93.279,37.213],[-93.284,37.205],[-93.300,37.207]].map((coordinates, i) => ({ type: 'Feature', id: `UTIL-${i+1}`, properties: { name: `Utility site ${i+1}` }, geometry: { type: 'Point', coordinates } }))
  };

  const el = (id) => document.getElementById(id);
  const ui = {
    search: el('search'), zone: el('zoneFilter'), status: el('statusFilter'), acres: el('acreFilter'),
    acreValue: el('acreValue'), list: el('parcelList'), count: el('resultCount'), detail: el('detailCard'), error: el('mapError')
  };
  let map;
  let selectedId = null;
  let shortlisted = new Set();
  let current = parcels;
  let remoteStyleLoading = false;
  let localFallbackRestoring = false;
  let interactionsBound = false;
  const localStyle = {
    version: 8,
    sources: {},
    layers: [{ id: 'lotline-background', type: 'background', paint: { 'background-color': '#e5ece9' } }]
  };
  const zoneColors = { Residential: '#3c8b7d', Commercial: '#527eb2', Industrial: '#bd8a2d', 'Mixed Use': '#8a6aa2' };

  function matches(feature) {
    const p = feature.properties;
    return (ui.zone.value === 'all' || p.zone === ui.zone.value) &&
      (ui.status.value === 'all' || p.status === ui.status.value) &&
      p.acres >= Number(ui.acres.value);
  }
  function filtered() { return parcels.filter(matches); }
  function updateFilters() {
    ui.acreValue.textContent = `${Number(ui.acres.value).toFixed(1)} ac`;
    current = filtered();
    const expression = ['all'];
    if (ui.zone.value !== 'all') expression.push(['==', ['get', 'zone'], ui.zone.value]);
    if (ui.status.value !== 'all') expression.push(['==', ['get', 'status'], ui.status.value]);
    if (Number(ui.acres.value) > 0) expression.push(['>=', ['get', 'acres'], Number(ui.acres.value)]);
    if (map?.getLayer('parcel-fill')) map.setFilter('parcel-fill', expression);
    if (map?.getLayer('parcel-line')) map.setFilter('parcel-line', expression);
    ui.count.textContent = current.length.toLocaleString('en-US');
    renderList();
    if (!map) renderFallbackPreview();
    if (selectedId && !current.some(f => f.id === selectedId)) clearSelection();
  }
  function renderList() {
    const items = current.slice(0, 8);
    ui.list.innerHTML = items.length ? items.map(f => {
      const p = f.properties;
      const statusClass = p.status === 'On Hold' ? 'hold' : p.status === 'Under Review' ? 'review' : '';
      return `<button class="parcel-row ${selectedId === f.id ? 'active' : ''}" data-id="${f.id}" type="button"><span><span class="parcel-id">${p.parcel_id}</span><span class="parcel-meta">${p.zone} · ${Number(p.acres).toFixed(2)} ac</span></span><span class="status ${statusClass}">${p.status === 'Under Review' ? 'In review' : p.status === 'On Hold' ? 'On hold' : 'Available'}</span></button>`;
    }).join('') : '<div class="empty-state">No parcels match these filters.</div>';
  }
  function renderFallbackPreview() {
    const width = 1100, height = 760, pad = 44;
    const minLng = Math.min(...parcels.map(f => f.geometry.coordinates[0][0][0]));
    const maxLng = Math.max(...parcels.map(f => f.geometry.coordinates[0][2][0]));
    const minLat = Math.min(...parcels.map(f => f.geometry.coordinates[0][0][1]));
    const maxLat = Math.max(...parcels.map(f => f.geometry.coordinates[0][2][1]));
    const px = lng => pad + ((lng - minLng) / (maxLng - minLng)) * (width - pad * 2);
    const py = lat => height - pad - ((lat - minLat) / (maxLat - minLat)) * (height - pad * 2);
    const shapes = current.map(f => {
      const ring = f.geometry.coordinates[0];
      const points = ring.slice(0, -1).map(([lng, lat]) => `${px(lng).toFixed(1)},${py(lat).toFixed(1)}`).join(' ');
      const fill = zoneColors[f.properties.zone] || zoneColors.Residential;
      const active = selectedId === f.id;
      return `<polygon class="fallback-parcel" data-fallback-id="${f.id}" points="${points}" fill="${fill}" fill-opacity=".48" stroke="${active ? '#153f3d' : '#627d77'}" stroke-width="${active ? '3' : '.8'}" />`;
    }).join('');
    const flood = el('floodToggle')?.checked ? `<g fill="#77b6c9" fill-opacity=".24" stroke="#438aa0" stroke-dasharray="5 4"><polygon points="${[[-93.300,37.219],[-93.296,37.219],[-93.292,37.221],[-93.291,37.224],[-93.298,37.225]].map(([lng,lat])=>`${px(lng)},${py(lat)}`).join(' ')}"/><polygon points="${[[-93.286,37.207],[-93.281,37.208],[-93.280,37.211],[-93.284,37.213],[-93.287,37.210]].map(([lng,lat])=>`${px(lng)},${py(lat)}`).join(' ')}"/></g>` : '';
    const utilities = el('stationToggle')?.checked ? `<g fill="#f1cd76" stroke="#725a28" stroke-width="2">${[[-93.297,37.214],[-93.288,37.217],[-93.279,37.213],[-93.284,37.205],[-93.300,37.207]].map(([lng,lat])=>`<circle cx="${px(lng)}" cy="${py(lat)}" r="6"/>`).join('')}</g>` : '';
    el('map').innerHTML = `<svg class="local-map-fallback" viewBox="0 0 ${width} ${height}" role="img" aria-label="Local preview of synthetic Springfield parcels"><rect width="${width}" height="${height}" fill="#e5ece9"/><path d="M0 160H1100M0 380H1100M0 600H1100M240 0V760M560 0V760M880 0V760" stroke="#d6e1dd" stroke-width="1"/>${flood}<g>${shapes}</g>${utilities}<g font-family="sans-serif" fill="#284944"><text x="38" y="54" font-size="18" font-weight="700">Springfield · Greene County</text><text x="38" y="80" font-size="12">Local parcel preview · ${current.length.toLocaleString('en-US')} matching sample features</text></g></svg>`;
  }
  function selectParcel(feature, zoom = true) {
    if (!feature) return;
    if (selectedId && map?.getSource('parcels')) map.setFeatureState({ source: 'parcels', id: selectedId }, { selected: false });
    selectedId = feature.id;
    if (map?.getSource('parcels')) map.setFeatureState({ source: 'parcels', id: selectedId }, { selected: true });
    const p = feature.properties;
    renderList();
    if (!map) renderFallbackPreview();
    ui.detail.hidden = false;
    ui.detail.innerHTML = `<div class="detail-top"><div><div class="detail-id">${p.parcel_id}</div><div class="detail-zone">${p.zone} · ${p.status}</div></div><button class="close-detail" aria-label="Close details" type="button">×</button></div><div class="detail-grid"><div><div class="detail-label">Site area</div><div class="detail-value">${Number(p.acres).toFixed(2)} ac</div></div><div><div class="detail-label">Asking price</div><div class="detail-value">$${Number(p.asking_price).toLocaleString('en-US')}</div></div><div><div class="detail-label">County</div><div class="detail-value">${p.county}</div></div><div><div class="detail-label">Data type</div><div class="detail-value">Synthetic</div></div></div><div class="detail-actions"><button class="primary-btn" id="shortlistBtn" type="button">${shortlisted.has(p.parcel_id) ? '✓ Shortlisted' : '+ Add to shortlist'}</button><button class="secondary-btn" id="copyIdBtn" type="button">Copy ID</button></div>`;
    ui.detail.querySelector('.close-detail').addEventListener('click', clearSelection);
    ui.detail.querySelector('#shortlistBtn').addEventListener('click', () => {
      if (shortlisted.has(p.parcel_id)) shortlisted.delete(p.parcel_id); else shortlisted.add(p.parcel_id);
      selectParcel(feature, false);
    });
    ui.detail.querySelector('#copyIdBtn').addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(p.parcel_id); ui.detail.querySelector('#copyIdBtn').textContent = 'Copied'; }
      catch { ui.detail.querySelector('#copyIdBtn').textContent = p.parcel_id; }
    });
    if (zoom && map?.loaded()) map.flyTo({ center: [feature.geometry.coordinates[0][0][0], feature.geometry.coordinates[0][0][1]], zoom: 15.5, duration: 650 });
  }
  function clearSelection() {
    if (selectedId && map?.getSource('parcels')) map.setFeatureState({ source: 'parcels', id: selectedId }, { selected: false });
    selectedId = null;
    ui.detail.hidden = true;
    renderList();
    if (!map) renderFallbackPreview();
  }
  function findParcel() {
    const query = ui.search.value.trim().toUpperCase();
    if (!query) return;
    const feature = parcels.find(f => f.properties.parcel_id.includes(query));
    if (feature) selectParcel(feature);
    else { ui.search.setCustomValidity('No matching parcel ID. Try SPR-10042.'); ui.search.reportValidity(); }
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a'); a.href = url; a.download = name; a.click(); URL.revokeObjectURL(url);
  }

  function bindControls() {
    if (interactionsBound) return;
    interactionsBound = true;
    document.querySelectorAll('#zoneFilter,#statusFilter,#acreFilter').forEach(node => node.addEventListener('input', updateFilters));
    ui.search.addEventListener('input', () => ui.search.setCustomValidity(''));
    ui.search.addEventListener('keydown', e => { if (e.key === 'Enter') findParcel(); });
    el('searchBtn').addEventListener('click', findParcel);
    el('resetBtn').addEventListener('click', () => { ui.zone.value = 'all'; ui.status.value = 'all'; ui.acres.value = 0; ui.search.value = ''; updateFilters(); clearSelection(); });
    el('floodToggle').addEventListener('change', e => { ['flood-fill','flood-line'].forEach(id => map?.getLayer(id) && map.setLayoutProperty(id, 'visibility', e.target.checked ? 'visible' : 'none')); if (!map) renderFallbackPreview(); });
    el('stationToggle').addEventListener('change', e => { if (map?.getLayer('utility-points')) map.setLayoutProperty('utility-points', 'visibility', e.target.checked ? 'visible' : 'none'); if (!map) renderFallbackPreview(); });
    ui.list.addEventListener('click', e => { const button = e.target.closest('[data-id]'); if (button) selectParcel(parcels.find(f => f.id === button.dataset.id)); });
    el('map').addEventListener('click', e => { const shape = e.target.closest('[data-fallback-id]'); if (shape) selectParcel(parcels.find(f => f.id === shape.dataset.fallbackId)); });
    el('exportGeojson').addEventListener('click', () => download('parcels-synthetic.geojson', JSON.stringify({ type:'FeatureCollection', features:current }, null, 2), 'application/geo+json'));
    el('exportCsv').addEventListener('click', () => {
      const cols = ['parcel_id','zone','status','acres','asking_price','county'];
      const csv = [cols.join(','), ...current.map(f => cols.map(k => `"${String(f.properties[k]).replaceAll('"','""')}"`).join(','))].join('\n');
      download('parcels-synthetic.csv', csv, 'text/csv');
    });
  }

  const maplibregl = window.maplibregl;
  if (!maplibregl?.Map) {
    ui.error.hidden = false;
    ui.error.textContent = 'MapLibre could not load; showing the local parcel preview instead.';
    bindControls();
    updateFilters();
    return;
  }

  map = new maplibregl.Map({ container: 'map', style: localStyle, center, zoom: 13.5, attributionControl: true });
  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
  map.on('error', (event) => {
    if (remoteStyleLoading && !map.getLayer('parcel-fill') && !localFallbackRestoring) {
      localFallbackRestoring = true;
      map.setStyle(localStyle);
      map.once('style.load', () => { remoteStyleLoading = false; localFallbackRestoring = false; installDataLayers(); });
    }
  });
  map.on('load', () => {
    installDataLayers();
    map.fitBounds([[-93.313,37.198],[-93.273,37.233]], { padding: 35, duration: 0 });
    fetch('https://demotiles.maplibre.org/style.json').then(response => {
      if (!response.ok) throw new Error('Basemap style unavailable');
      return response.json();
    }).then(style => {
      remoteStyleLoading = true;
      map.once('style.load', () => { remoteStyleLoading = false; installDataLayers(); });
      map.setStyle(style);
    }).catch(() => { /* Keep the local MapLibre parcel map visible. */ });
  });
  function installDataLayers() {
    if (!map.getSource('parcels')) map.addSource('parcels', { type: 'geojson', data: parcelData, promoteId: 'parcel_id' });
    if (!map.getLayer('parcel-fill')) map.addLayer({ id: 'parcel-fill', type: 'fill', source: 'parcels', paint: { 'fill-color': ['match', ['get', 'zone'], 'Residential', '#3c8b7d', 'Commercial', '#527eb2', 'Industrial', '#bd8a2d', 'Mixed Use', '#8a6aa2', '#3c8b7d'], 'fill-opacity': 0.32 } });
    if (!map.getLayer('parcel-line')) map.addLayer({ id: 'parcel-line', type: 'line', source: 'parcels', paint: { 'line-color': ['case', ['boolean', ['feature-state', 'selected'], false], '#193a43', '#56746e'], 'line-width': ['case', ['boolean', ['feature-state', 'selected'], false], 2.4, 0.75], 'line-opacity': 0.82 } });
    if (!map.getSource('flood')) map.addSource('flood', { type: 'geojson', data: floodData });
    if (!map.getLayer('flood-fill')) map.addLayer({ id: 'flood-fill', type: 'fill', source: 'flood', paint: { 'fill-color': '#77b6c9', 'fill-opacity': 0.18 } });
    if (!map.getLayer('flood-line')) map.addLayer({ id: 'flood-line', type: 'line', source: 'flood', paint: { 'line-color': '#438aa0', 'line-width': 1.5, 'line-dasharray': [2, 2] } });
    if (!map.getSource('utilities')) map.addSource('utilities', { type: 'geojson', data: utilityData });
    if (!map.getLayer('utility-points')) map.addLayer({ id: 'utility-points', type: 'circle', source: 'utilities', paint: { 'circle-radius': 5, 'circle-color': '#f1cd76', 'circle-stroke-color': '#725a28', 'circle-stroke-width': 1.5 } });
    if (!mapHandlersBound) {
      map.on('click', 'parcel-fill', e => selectParcel(e.features?.[0]));
      map.on('mouseenter', 'parcel-fill', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'parcel-fill', () => { map.getCanvas().style.cursor = ''; });
      mapHandlersBound = true;
    }
    updateFilters();
  }
  bindControls();
  updateFilters();
})();

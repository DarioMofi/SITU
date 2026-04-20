/* ═══════════════════════════════════════════════════════════
   UI.js - Eventos del DOM e Interfaz de Usuario
   ════════════════════════════════════════════════════════ */


function initializeLayerSwatches() {
  document.querySelectorAll('.layer-item').forEach(item => {
    const chk = item.querySelector('.layer-toggle');
    const swatch = item.querySelector('.layer-swatch');
    if (chk && swatch) {
      const layerId = chk.dataset.layer;
      const cfg = LAYER_CONFIG[layerId];
      if (cfg && cfg.color) {
        swatch.style.backgroundColor = cfg.color;
      }
    }
  });
}

function showAttributePanel(feature, layerId) {
  // Función desactivada para el panel lateral según requerimiento.
  // Los atributos ahora solo se consultan vía Popups en el mapa.
  /*
  const cfg = LAYER_CONFIG[layerId];
  const props = feature.properties || {};
  ...
  switchPanelTab('info');
  */
}


function downloadData(format) {
  const activeIds = Object.keys(AppState.activeLayers);
  if (!activeIds.length) { showToast('Activa al menos una capa para descargar'); return; }
  const allFeatures = activeIds.flatMap(id => { const data = generateMockGeoJSON(id); return data.features.map(f => ({ ...f, properties: { ...f.properties, _capa: id } })); });
  const geojson = { type: 'FeatureCollection', features: allFeatures };
  let content, mimeType, ext;
  if (format === 'geojson') { content = JSON.stringify(geojson, null, 2); mimeType = 'application/geo+json'; ext = 'geojson'; }
  else if (format === 'csv') {
    const keys = [...new Set(allFeatures.flatMap(f => Object.keys(f.properties)))];
    const header = keys.join(',');
    const rows = allFeatures.map(f => keys.map(k => { const v = f.properties[k]; return typeof v === 'string' && v.includes(',') ? `"${v}"` : (v !== undefined ? v : ''); }).join(','));
    content = [header, ...rows].join('\n'); mimeType = 'text/csv'; ext = 'csv';
  } else if (format === 'kml') {
    const placemarks = allFeatures.filter(f => f.geometry?.type === 'Point').map(f => { const [lon, lat] = f.geometry.coordinates; return `<Placemark><name>${f.properties.nombre || f.properties.municipio || ''}</name><Point><coordinates>${lon},${lat},0</coordinates></Point></Placemark>`; }).join('\n');
    content = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document>${placemarks}</Document></kml>`; mimeType = 'application/vnd.google-earth.kml+xml'; ext = 'kml';
  } else if (format === 'wkt') {
    content = allFeatures.map(f => { const g = f.geometry; if (g?.type === 'Point') return `POINT (${g.coordinates[0]} ${g.coordinates[1]})`; if (g?.type === 'Polygon') return `POLYGON ((${g.coordinates[0].map(c => `${c[0]} ${c[1]}`).join(', ')}))`; if (g?.type === 'LineString') return `LINESTRING (${g.coordinates.map(c => `${c[0]} ${c[1]}`).join(', ')})`; return ''; }).filter(Boolean).join('\n');
    mimeType = 'text/plain'; ext = 'wkt';
  }
  const blob = new Blob([content], { type: mimeType }); const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `geointeligencia_campeche_${new Date().toISOString().slice(0, 10)}.${ext}`; a.click(); URL.revokeObjectURL(url);
  showToast(`Descarga iniciada (${format.toUpperCase()})`);
  const st = document.getElementById('download-status'); st.classList.remove('hidden'); st.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${allFeatures.length} registros exportados en ${format.toUpperCase()}`;
}

function switchPanelTab(tabId) {
  document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.panel-tab[data-panel="${tabId}"]`).classList.add('active');
  document.getElementById(`tab-${tabId}`).classList.add('active');
}

function showModal(id) { document.getElementById(id).classList.remove('hidden'); }
function hideModal(id) { document.getElementById(id).classList.add('hidden'); }

let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-msg').textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 3200);
}

function bindEvents() {
  document.querySelectorAll('.instruction-pop').forEach(pop => {
    pop.addEventListener('click', () => { pop.classList.add('hidden'); });
    
    // El popup izquierdo no desaparece automáticamente
    if (!pop.classList.contains('pop-left')) {
      setTimeout(() => { pop.classList.add('hidden'); }, 6000);
    }
  });

  document.querySelectorAll('.module-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const mod = btn.dataset.module;
      const targetPanel = document.getElementById(`panel-${mod}`);
      const isActive = targetPanel.classList.contains('active');
      const panelRight = document.getElementById('panel-right');

      document.querySelectorAll('.module-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.module-panel').forEach(p => p.classList.remove('active'));

      if (!isActive) {
        btn.classList.add('active'); targetPanel.classList.add('active'); AppState.activeModule = mod;
        const exp = document.getElementById('module-explanation'); const pop = document.getElementById('pop-modules');
        if (exp) exp.classList.add('hidden'); if (pop) pop.classList.add('hidden');
        
        // Abrir panel derecho
        panelRight.classList.remove('collapsed');
        document.body.classList.add('panel-right-open');
      } else { 
        AppState.activeModule = null; 
        // Cerrar panel derecho
        panelRight.classList.add('collapsed');
        document.body.classList.remove('panel-right-open');
      }
      
      // Ajustar mapa tras la transición lateral
      setTimeout(() => { if (AppState.map) AppState.map.invalidateSize(); }, 300);
    });
  });

  document.querySelectorAll('.layer-toggle').forEach(chk => {
    chk.addEventListener('change', async () => {
      const layerId = chk.dataset.layer;
      if (chk.checked) { 
        await addLayer(layerId); 
      } else { 
        removeLayer(layerId); 
        showToast(`Capa desactivada: ${LAYER_CONFIG[layerId].name}`); 
      }
    });
  });

  document.querySelectorAll('.layer-info-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation(); e.preventDefault();
      const layerId = btn.dataset.layer; const cfg = LAYER_CONFIG[layerId]; const meta = cfg.metadata;
      document.getElementById('modal-title').textContent = cfg.name;
      document.getElementById('modal-desc').textContent = meta['Descripción'] || '';
      document.getElementById('modal-meta').innerHTML = Object.entries(meta).filter(([k]) => k !== 'Descripción').map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
      const badgeMap = { ambiental: 'mod-ambiental', sociedad: 'mod-sociedad', infraestructura: 'mod-infraestructura', aptitud: 'mod-aptitud' };
      const badge = document.getElementById('modal-badge'); badge.className = `modal-badge ${badgeMap[cfg.module]}`; badge.textContent = cfg.metadata['Normativa'] || cfg.module;
      showModal('layer-info-modal');
    });
  });

  document.querySelectorAll('.panel-tab').forEach(btn => { btn.addEventListener('click', () => switchPanelTab(btn.dataset.panel)); });

  const mapCtrlGrp = document.querySelector('.map-controls');
  if (mapCtrlGrp) { mapCtrlGrp.addEventListener('mouseenter', () => { const p = document.getElementById('pop-map-controls'); if (p) p.classList.add('hidden'); }); }

  document.getElementById('ctrl-zoom-in').addEventListener('click', () => AppState.map.zoomIn());
  document.getElementById('ctrl-zoom-out').addEventListener('click', () => AppState.map.zoomOut());
  document.getElementById('ctrl-extent').addEventListener('click', () => { AppState.map.setView([19.0, -90.5], 8); });
  document.getElementById('ctrl-basemap').addEventListener('click', () => {
    AppState.basemapIndex = (AppState.basemapIndex + 1) % BASEMAPS.length;
    const bm = BASEMAPS[AppState.basemapIndex]; AppState.map.removeLayer(AppState.baseTile);
    AppState.baseTile = L.tileLayer(bm.url, { attribution: bm.attribution, maxZoom: 19 }).addTo(AppState.map);
    Object.values(AppState.activeLayers).forEach(l => l.bringToFront());
    showToast(`Mapa base: ${bm.name}`);
  });

  document.getElementById('btn-fullscreen').addEventListener('click', () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen(); } else { document.exitFullscreen(); } });
  document.getElementById('sidebar-toggle').addEventListener('click', () => { 
    document.getElementById('sidebar').classList.toggle('collapsed'); 
  });

  document.getElementById('btn-render-chart').addEventListener('click', () => { const key = document.getElementById('chart-select').value; renderChart(key); });
  document.getElementById('btn-download-chart').addEventListener('click', () => {
    const canvas = document.getElementById('main-chart'); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `grafica_geointeligencia_${Date.now()}.png`; a.click(); showToast('Gráfica exportada como PNG');
  });

  document.querySelectorAll('.btn-download-format').forEach(btn => { btn.addEventListener('click', () => downloadData(btn.dataset.format)); });
  document.getElementById('btn-execute-download').addEventListener('click', () => { const scope = document.querySelector('input[name="scope"]:checked').value; downloadData('geojson'); });
  document.getElementById('btn-download-layer').addEventListener('click', () => { downloadData('geojson'); });

  document.getElementById('modal-close').addEventListener('click', () => hideModal('layer-info-modal'));
  document.getElementById('btn-help').addEventListener('click', () => showModal('help-modal'));
  document.getElementById('help-modal-close').addEventListener('click', () => hideModal('help-modal'));
  document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')); } });
}

document.addEventListener('DOMContentLoaded', () => {
  initMap(); bindEvents(); updateLegend(); updateActiveLayerCount();
  initializeLayerSwatches();
  renderChart('vulnerabilidad');
  window.addEventListener('resize', () => AppState.map.invalidateSize());
  
  const btnComenzar = document.getElementById('btn-comenzar');
  const introScreen = document.getElementById('intro-screen');
  if (btnComenzar && introScreen) {
    btnComenzar.addEventListener('click', () => {
      introScreen.classList.add('hidden');
      setTimeout(() => { document.body.classList.add('app-ready'); AppState.map.invalidateSize(); }, 400);
    });
  } else { document.body.classList.add('app-ready'); }
});

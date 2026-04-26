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


function downloadData(format, scope = 'active') {
  const activeIds = Object.keys(AppState.activeLayers);
  let targetIds = activeIds;

  if (scope === 'all' && AppState.activeModule) {
    // Obtener todas las IDs de capas que pertenecen al módulo activo
    targetIds = Object.keys(LAYER_CONFIG).filter(id => LAYER_CONFIG[id].module === AppState.activeModule);
  }

  if (!targetIds.length) { 
    showToast(scope === 'all' ? 'No hay capas en este módulo' : 'Activa al menos una capa para descargar'); 
    return; 
  }

  const allFeatures = [];
  const bounds = scope === 'extent' ? AppState.map.getBounds() : null;

  const processLayerData = (id, geo) => {
    const features = geo.type === 'FeatureCollection' ? geo.features : [geo];
    features.forEach(f => {
      // Filtrar por extensión si es necesario
      if (scope === 'extent' && f.geometry) {
        // Simplificación: si es punto, check contains. Si es otro, check bounds overlap.
        // Usaremos turf para mayor precisión si está disponible
        try {
          if (f.geometry.type === 'Point') {
            const pt = L.latLng(f.geometry.coordinates[1], f.geometry.coordinates[0]);
            if (!bounds.contains(pt)) return;
          } else {
            // Para polígonos/líneas, un check simple de bounds de Leaflet si existe la capa
            const layer = AppState.activeLayers[id];
            if (layer && layer.getBounds && !bounds.intersects(layer.getBounds())) return;
          }
        } catch (e) { /* ignore filtering error */ }
      }

      allFeatures.push({
        ...f,
        properties: {
          ...f.properties,
          _layer_id: id,
          _layer_name: LAYER_CONFIG[id]?.name || id
        }
      });
    });
  };

  const promises = targetIds.map(async id => {
    const layer = AppState.activeLayers[id];
    if (layer && typeof layer.toGeoJSON === 'function') {
      processLayerData(id, layer.toGeoJSON());
    } else if (scope === 'all') {
      // Si el scope es 'all', tenemos que cargar los datos de las capas que NO están activas
      try {
        const geo = await loadRealGeoJSON(id);
        if (geo) processLayerData(id, geo);
      } catch (e) { console.error(`Error cargando capa ${id} para descarga`, e); }
    }
  });

  Promise.all(promises).then(() => {
    if (!allFeatures.length) {
      showToast('No se encontraron registros que coincidan con los criterios de descarga');
      return;
    }
    executeDownload(allFeatures, format);
  });
}

function executeDownload(allFeatures, format) {
  const filename = `situ_campeche_${new Date().toISOString().slice(0, 10)}`;

  if (format === 'geojson') {
    content = JSON.stringify({ type: 'FeatureCollection', features: allFeatures }, null, 2);
    mimeType = 'application/geo+json';
    ext = 'geojson';
  } else if (format === 'csv') {
    const keys = [...new Set(allFeatures.flatMap(f => Object.keys(f.properties)))];
    const header = [...keys, 'geometry_type', 'longitude', 'latitude'].join(',');
    const rows = allFeatures.map(f => {
      const props = keys.map(k => {
        let v = f.properties[k];
        if (v === null || v === undefined) return '';
        v = v.toString().replace(/"/g, '""');
        return v.includes(',') || v.includes('"') || v.includes('\n') ? `"${v}"` : v;
      }).join(',');
      
      let geomInfo = '';
      if (f.geometry?.type === 'Point') {
        geomInfo = `Point,${f.geometry.coordinates[0]},${f.geometry.coordinates[1]}`;
      } else {
        geomInfo = `${f.geometry?.type || 'Unknown'},,`;
      }
      return `${props},${geomInfo}`;
    });
    content = [header, ...rows].join('\n');
    mimeType = 'text/csv';
    ext = 'csv';
  } else if (format === 'kml') {
    const placemarks = allFeatures.map(f => {
      const props = Object.entries(f.properties)
        .map(([k, v]) => `<Data name="${k}"><value>${v}</value></Data>`).join('');
      
      let geomKML = '';
      if (f.geometry?.type === 'Point') {
        geomKML = `<Point><coordinates>${f.geometry.coordinates[0]},${f.geometry.coordinates[1]},0</coordinates></Point>`;
      } else if (f.geometry?.type === 'LineString') {
        const coords = f.geometry.coordinates.map(c => `${c[0]},${c[1]},0`).join(' ');
        geomKML = `<LineString><coordinates>${coords}</coordinates></LineString>`;
      } else if (f.geometry?.type === 'Polygon') {
        const rings = f.geometry.coordinates.map(ring => 
          `<LinearRing><coordinates>${ring.map(c => `${c[0]},${c[1]},0`).join(' ')}</coordinates></LinearRing>`
        ).join('');
        geomKML = `<Polygon><outerBoundaryIs>${rings}</outerBoundaryIs></Polygon>`;
      }

      return `<Placemark><name>${f.properties.nombre || f.properties.NOMGEO || f.properties._layer_name}</name><ExtendedData>${props}</ExtendedData>${geomKML}</Placemark>`;
    }).join('\n');

    content = `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2"><Document><name>SITU Campeche Export</name>${placemarks}</Document></kml>`;
    mimeType = 'application/vnd.google-earth.kml+xml';
    ext = 'kml';
  } else if (format === 'wkt') {
    content = allFeatures.map(f => {
      if (!f.geometry) return null;
      try {
        const wkt = Terraformer.WKT.convert(f.geometry); 
        return `${wkt}\t${JSON.stringify(f.properties)}`;
      } catch (e) {
        if (f.geometry.type === 'Point') return `POINT(${f.geometry.coordinates[0]} ${f.geometry.coordinates[1]})`;
        return null;
      }
    }).filter(Boolean).join('\n');
    mimeType = 'text/plain';
    ext = 'wkt';
  }

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.${ext}`;
  a.click();
  URL.revokeObjectURL(url);

  showToast(`Descarga iniciada (${format.toUpperCase()})`);
  const st = document.getElementById('download-status');
  if (st) {
    st.classList.remove('hidden');
    st.innerHTML = `<i class="fa-solid fa-circle-check"></i> ${allFeatures.length} registros exportados en ${format.toUpperCase()}`;
  }
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
    
    // El popup izquierdo y el de análisis no desaparecen automáticamente
    if (!pop.classList.contains('pop-left') && pop.id !== 'pop-analysis') {
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
        // LÓGICA DE ANÁLISIS MULTICRITERIO: Limpiar capas si el modo está bloqueado
        if (!AppState.multiCriteriaMode) {
          const activeIds = Object.keys(AppState.activeLayers);
          activeIds.forEach(id => {
            if (LAYER_CONFIG[id].module !== mod) {
              removeLayer(id);
              // Desmarcar checkbox en la UI
              const chk = document.querySelector(`.layer-toggle[data-layer="${id}"]`);
              if (chk) chk.checked = false;
            }
          });
        }

        btn.classList.add('active'); targetPanel.classList.add('active'); AppState.activeModule = mod;
        const exp = document.getElementById('module-explanation');
        if (exp) exp.classList.add('hidden');
        document.querySelectorAll('.pop-left').forEach(p => p.classList.add('hidden'));
        
        // Actualizar selector de gráficas para el módulo actual
        updateChartSelector(mod);
        
        // Abrir panel derecho y mostrar pop-up de guía
        panelRight.classList.remove('collapsed');
        document.body.classList.add('panel-right-open');
        
        const popAnalysis = document.getElementById('pop-analysis');
        if (popAnalysis) popAnalysis.classList.remove('hidden');
      } else { 
        AppState.activeModule = null; 
        // Cerrar panel derecho y ocultar pop-up
        panelRight.classList.add('collapsed');
        document.body.classList.remove('panel-right-open');
        
        const popAnalysis = document.getElementById('pop-analysis');
        if (popAnalysis) popAnalysis.classList.add('hidden');
        
        // Si cerramos el módulo y estamos en modo bloqueado, opcionalmente podríamos limpiar todo
        if (!AppState.multiCriteriaMode) {
          Object.keys(AppState.activeLayers).forEach(id => {
            removeLayer(id);
            const chk = document.querySelector(`.layer-toggle[data-layer="${id}"]`);
            if (chk) chk.checked = false;
          });
        }
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
      document.getElementById('modal-meta').innerHTML = Object.entries(meta)
        .filter(([k]) => k !== 'Descripción')
        .map(([k, v]) => {
          const content = (typeof v === 'string' && v.startsWith('http')) 
            ? `<a href="${v}" target="_blank" class="meta-link">${v}</a>` 
            : v;
          return `<tr><td>${k}</td><td>${content}</td></tr>`;
        }).join('');
      const badgeMap = { ambiental: 'mod-ambiental', sociedad: 'mod-sociedad', infraestructura: 'mod-infraestructura', aptitud: 'mod-aptitud' };
      const badge = document.getElementById('modal-badge'); badge.className = `modal-badge ${badgeMap[cfg.module]}`; badge.textContent = cfg.metadata['Normativa'] || cfg.module;
      showModal('layer-info-modal');
    });
  });

  document.querySelectorAll('.panel-tab').forEach(btn => { btn.addEventListener('click', () => switchPanelTab(btn.dataset.panel)); });

  const mapCtrlGrp = document.querySelector('.map-controls');
  if (mapCtrlGrp) { mapCtrlGrp.addEventListener('mouseenter', () => { const p = document.getElementById('pop-map-controls'); if (p) p.classList.add('hidden'); }); }

  const panelRight = document.getElementById('panel-right');
  if (panelRight) {
    panelRight.addEventListener('mouseenter', () => {
      const p = document.getElementById('pop-analysis');
      if (p) p.classList.add('hidden');
    });
  }

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

  // Selector de escala de análisis
  const scaleSelect = document.getElementById('analysis-scale-select');
  if (scaleSelect) {
    scaleSelect.value = AppState.analysisScale;
    scaleSelect.addEventListener('change', async (e) => {
      AppState.analysisScale = e.target.value;
      showToast(`Escala cambiada a: ${e.target.value === 'estatal' ? 'Estatal (Municipios)' : 'Municipal (Manzanas)'}`);
      
      const popScale = document.getElementById('pop-scale');
      if (popScale) popScale.classList.add('hidden');
      
      // Recargar capas activas que dependen de la escala
      const activeIds = Object.keys(AppState.activeLayers);
      for (const layerId of activeIds) {
        const cfg = LAYER_CONFIG[layerId];
        if (cfg && cfg.scale_type === 'multi') {
          removeLayer(layerId);
          await addLayer(layerId);
        }
      }
    });
  }

  document.getElementById('btn-render-chart').addEventListener('click', () => { const key = document.getElementById('chart-select').value; renderChart(key); });
  document.getElementById('btn-download-chart').addEventListener('click', () => {
    const canvas = document.getElementById('main-chart'); const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `grafica_geointeligencia_${Date.now()}.png`; a.click(); showToast('Gráfica exportada como PNG');
  });

  document.querySelectorAll('.btn-download-format').forEach(btn => {
    btn.addEventListener('click', () => {
      const format = btn.dataset.format;
      AppState.selectedDownloadFormat = format;
      
      // Actualizar UI de botones
      document.querySelectorAll('.btn-download-format').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      showToast(`Formato de exportación: ${format.toUpperCase()}`);
    });
  });

  document.getElementById('btn-execute-download').addEventListener('click', () => {
    const scope = document.querySelector('input[name="scope"]:checked')?.value || 'active';
    downloadData(AppState.selectedDownloadFormat, scope);
  });

  document.getElementById('btn-download-layer').addEventListener('click', () => {
    downloadData('geojson');
  });

  document.getElementById('modal-close').addEventListener('click', () => hideModal('layer-info-modal'));
  document.getElementById('btn-help').addEventListener('click', () => showModal('help-modal'));
  document.getElementById('help-modal-close').addEventListener('click', () => hideModal('help-modal'));
  document.querySelectorAll('.modal-overlay').forEach(overlay => { overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.add('hidden'); }); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden')); } });

  // Evento para el botón de Análisis Multicriterio (Candado)
  const btnMulti = document.getElementById('btn-multi-criteria');
  if (btnMulti) {
    btnMulti.addEventListener('click', () => {
      // Ocultar el pop-up de guía al activar por primera vez
      const popMulti = document.getElementById('pop-multi-criteria');
      if (popMulti) popMulti.classList.add('hidden');

      AppState.multiCriteriaMode = !AppState.multiCriteriaMode;
      btnMulti.classList.toggle('unlocked', AppState.multiCriteriaMode);
      
      const icon = AppState.multiCriteriaMode ? 'fa-lock-open' : 'fa-lock';
      btnMulti.innerHTML = `<i class="fa-solid ${icon}"></i> Análisis Multicriterio`;
      
      if (!AppState.multiCriteriaMode && AppState.activeModule) {
        // Al bloquear, eliminar capas que no pertenezcan al módulo activo
        Object.keys(AppState.activeLayers).forEach(id => {
          if (LAYER_CONFIG[id].module !== AppState.activeModule) {
            removeLayer(id);
            const chk = document.querySelector(`.layer-toggle[data-layer="${id}"]`);
            if (chk) chk.checked = false;
          }
        });
      }
      
      showToast(AppState.multiCriteriaMode 
        ? 'Análisis Multicriterio Habilitado: Superposición libre permitida' 
        : 'Análisis Multicriterio Deshabilitado: Modo de módulo único activo');
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    initMap(); bindEvents(); updateLegend(); updateActiveLayerCount();
    initializeLayerSwatches();
    // renderChart('vulnerabilidad'); 
    window.addEventListener('resize', () => AppState.map.invalidateSize());
    
    const btnComenzar = document.getElementById('btn-comenzar');
    const introScreen = document.getElementById('intro-screen');
    if (btnComenzar && introScreen) {
      btnComenzar.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        setTimeout(() => { document.body.classList.add('app-ready'); AppState.map.invalidateSize(); }, 400);
      });
    } else { document.body.classList.add('app-ready'); }
  } catch (error) {
    console.error("Error crítico durante la inicialización:", error);
    // Intentar mostrar la plataforma de todos modos si el error no es fatal para la UI básica
    const introScreen = document.getElementById('intro-screen');
    if (introScreen) introScreen.classList.add('hidden');
    document.body.classList.add('app-ready');
  }
});

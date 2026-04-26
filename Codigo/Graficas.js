/* ═══════════════════════════════════════════════════════════
   Graficas.js - Lógica de Visualización Analítica (Chart.js)
   ════════════════════════════════════════════════════════ */

const MODULE_CHARTS = {
  ambiental: [
    { 
      id: 'cuerpos_agua_area', 
      name: 'Superficie de Cuerpos de Agua (m²)', 
      layer: null,
      desc: 'Superficie total de cuerpos de agua (lagunas, ríos y depósitos) por municipio, calculada mediante análisis geoespacial de alta precisión y nos indica la concentración del recurso hídrico.'
    }
  ],
  sociedad: [
    { 
      id: 'densidad_pob', 
      name: 'Densidad Poblacional', 
      layer: 'densidad_pob',
      desc: 'Relación de habitantes por kilómetro cuadrado. Permite visualizar las zonas de mayor presión demográfica.'
    },
    { 
      id: 'poblacion_indigena', 
      name: 'Población Indígena', 
      layer: 'poblacion_indigena',
      desc: 'Total de personas que se autoidentifican como indígenas, reflejando la diversidad cultural del territorio.'
    },
    { 
      id: 'adultos_mayores', 
      name: 'Adultos Mayores (60+)', 
      layer: 'adultos_mayores',
      desc: 'Distribución de la población de la tercera edad, fundamental para la planeación de servicios de salud y cuidados.'
    },
    { 
      id: 'infancias', 
      name: 'Infancias (0-14 años)', 
      layer: 'infancias',
      desc: 'Distribución de población infantil, indicando la demanda potencial de infraestructura educativa y recreativa.'
    },
    { 
      id: 'discapacidad', 
      name: 'Población con Discapacidad', 
      layer: 'discapacidad',
      desc: 'Personas con alguna limitación física o mental, esencial para diseñar políticas de accesibilidad universal.'
    },
    { 
      id: 'loc_rur_count', 
      name: 'Localidades Rurales (Total)', 
      layer: 'loc_rur',
      desc: 'Conteo de asentamientos clasificados como rurales, mostrando el grado de dispersión poblacional en el municipio.'
    },
    { 
      id: 'marginacion_pie', 
      name: 'Distribución de Marginación (%)', 
      layer: 'marginacion', 
      chartType: 'pie',
      desc: 'Proporción de los grados de marginación según CONAPO, identificando zonas con mayores carencias sociales.'
    },
    { 
      id: 'pobreza_pie', 
      name: 'Distribución de Pobreza (%)', 
      layer: 'pobreza', 
      chartType: 'pie',
      desc: 'Distribución porcentual de la población en situación de pobreza multidimensional según datos de CONEVAL.'
    }
  ],
  infraestructura: [
    { 
      id: 'traslado_avg', 
      name: 'Promedio Tiempo Traslado (min)', 
      layer: 'tiempo_traslado', 
      op: 'avg',
      desc: 'Tiempo medio de viaje desde las localidades hacia la cabecera municipal; mide la conectividad territorial.'
    },
    { 
      id: 'salud_count', 
      name: 'Equipamiento de Salud (Unidades)', 
      layer: 'equipamiento_salud',
      desc: 'Número de clínicas y hospitales disponibles, evaluando la capacidad de cobertura médica instalada.'
    },
    { 
      id: 'educacion_count', 
      name: 'Equipamiento Educativo (Unidades)', 
      layer: 'equipamiento_educacion',
      desc: 'Cantidad de planteles escolares, reflejando la oferta educativa física en los diferentes niveles académicos.'
    }
  ],
  aptitud: [
    { 
      id: 'crecimiento_line', 
      name: 'Evolución de Mancha Urbana (m²)', 
      layer: 'crecimiento_urbano', 
      chartType: 'line',
      desc: 'Seguimiento histórico de la expansión urbana. Muestra el ritmo de crecimiento de las superficies construidas.'
    }
  ]
};

// Sistema de caché para evitar re-cálculos costosos
const ANALYSIS_CACHE = new Map();

const CHART_DATA = {
  vulnerabilidad: {
    labels: ['Calakmul', 'Calkiní', 'Campeche', 'Candelaria', 'Carmen', 'Champotón', 'Escárcega', 'Hecelchakán', 'Hopelchén', 'Palizada', 'Tenabo'],
    desc: 'Distribución municipal del índice de vulnerabilidad socio-ambiental. Los valores más altos indican mayor susceptibilidad ante eventos climáticos.',
    type: 'bar',
    datasets: [{
      label: 'Índice 2024',
      data: [72, 45, 38, 65, 52, 58, 61, 41, 68, 70, 43],
      backgroundColor: '#7B1D2E',
      borderColor: '#C4973A',
      borderWidth: 1
    }]
  },
  marginacion: {
    labels: ['Muy Alta', 'Alta', 'Media', 'Baja', 'Muy Baja'],
    desc: 'Porcentaje de población según el grado de marginación de CONAPO (2020). Refleja carencias en educación, vivienda e ingresos.',
    type: 'doughnut',
    datasets: [{
      data: [12, 18, 25, 30, 15],
      backgroundColor: ['#4E0F1B', '#7B1D2E', '#A63248', '#C4973A', '#E2B95A'],
      borderWidth: 0
    }]
  },
  servicios: {
    labels: ['Agua', 'Drenaje', 'Electricidad', 'Internet', 'Salud'],
    desc: 'Cobertura efectiva de servicios básicos infraestructurales comparativa en el territorio estatal.',
    type: 'radar',
    datasets: [{
      label: 'Promedio Estatal %',
      data: [82, 75, 96, 45, 68],
      backgroundColor: 'rgba(196, 151, 58, 0.2)',
      borderColor: '#C4973A',
      pointBackgroundColor: '#C4973A'
    }]
  },
  crecimiento: {
    labels: ['2019', '2020', '2021', '2022', '2023', '2024'],
    desc: 'Evolución de la mancha urbana histórica detectada mediante clasificación satelital (Superficie en Ha).',
    type: 'line',
    datasets: [{
      label: 'Hectáreas Urbanizadas',
      data: [12500, 12850, 13100, 13600, 14200, 14950],
      borderColor: '#7B1D2E',
      tension: 0.3,
      fill: true,
      backgroundColor: 'rgba(123, 29, 46, 0.1)'
    }]
  },
  cuerpos_agua_area: {
    labels: ['Carmen', 'Champotón', 'Palizada', 'Candelaria', 'Campeche', 'Calakmul', 'Escárcega', 'Calkiní', 'Dzitbalché', 'Hopelchén', 'Tenabo'],
    desc: 'Superficie total de cuerpos de agua (lagunas, ríos y depósitos) por municipio, calculada mediante análisis geoespacial de alta precisión y nos indica la concentración del recurso hídrico.',
    type: 'bar',
    datasets: [{
      label: 'Superficie (m²)',
      data: [720450000, 145200000, 110800000, 92300000, 48150000, 32400000, 28900000, 38700000, 12400000, 8200000, 4100000],
      backgroundColor: '#0277BD',
      borderColor: '#01579B',
      borderWidth: 1
    }]
  }
};

const CHART_DEFAULTS = {
  animation: false, // Desactivar animaciones para carga instantánea
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9E8070', font: { family: 'DM Sans', size: 9 }, boxWidth: 10 } },
    tooltip: {
      backgroundColor: '#251018', borderColor: 'rgba(196,151,58,.3)', borderWidth: 1,
      titleColor: '#F5EDE0', bodyColor: '#9E8070', titleFont: { family: 'Cormorant Garamond', size: 12 }
    }
  },
  scales: {
    x: { 
      ticks: { color: '#9E8070', font: { size: 8 }, padding: 0 }, 
      grid: { display: false } 
    },
    y: { 
      ticks: { 
        color: '#9E8070', 
        font: { size: 8 },
        padding: 4,
        callback: function(value) {
          if (value >= 1e9) return (value / 1e9).toFixed(1) + 'B';
          if (value >= 1e6) return (value / 1e6).toFixed(1) + 'M';
          if (value >= 1e3) return (value / 1e3).toFixed(1) + 'k';
          return value;
        }
      }, 
      grid: { color: 'rgba(255,255,255,.05)' } 
    }
  }
};

function updateChartSelector(moduleId) {
  const select = document.getElementById('chart-select');
  if (!select) return;
  
  const options = MODULE_CHARTS[moduleId] || [];
  select.innerHTML = options.map(opt => `<option value="${opt.id}">${opt.name}</option>`).join('');
  
  // Eliminamos el renderChart automático para evitar bloqueos al cambiar de módulo
  // El usuario deberá presionar el botón "Generar"
}

async function calculateSpatialData(layerId, chartType = 'bar') {
  if (!AppState.layerMunicipal) return null;

  // 1. Verificar Caché
  const cacheKey = `${layerId}_${chartType}_${AppState.analysisScale}`;
  if (ANALYSIS_CACHE.has(cacheKey)) {
    console.log(`>>> Recuperando datos de caché para: ${layerId}`);
    return ANALYSIS_CACHE.get(cacheKey);
  }

  try {
    const envGeojson = await loadRealGeoJSON(layerId);
    if (!envGeojson || !envGeojson.features || envGeojson.features.length === 0) return null;

    const munFeatures = AppState.layerMunicipal.toGeoJSON().features;
    const cfg = LAYER_CONFIG[layerId];
    const results = {};
    
    // 1. Caso Especial: Gráficas de Pastel (Distribución Estatal)
    if (chartType === 'pie' || chartType === 'doughnut') {
      const col = cfg.styleConfig.column;
      envGeojson.features.forEach(f => {
        const val = f.properties[col] || 'Sin Dato';
        results[val] = (results[val] || 0) + 1;
      });
      return {
        labels: Object.keys(results),
        data: Object.values(results),
        label: 'Número de Municipios'
      };
    }

    // 1. Caso Especial: Crecimiento Urbano Histórico (Agrupar por Año)
    if (cfg.id === 'crecimiento_line') {
      console.log(">>> Generando serie histórica de crecimiento urbano...");
      envGeojson.features.forEach(f => {
        const year = f.properties.layer || f.properties.año || 'Sin Año';
        if (!results[year]) results[year] = 0;
        results[year] += turf.area(f);
      });
      // Ordenar por año
      const years = Object.keys(results).sort((a, b) => parseInt(a) - parseInt(b));
      return {
        labels: years,
        data: years.map(y => results[y]),
        label: 'Superficie Urbana (m²)'
      };
    }

    // 2. Caso Especial: Atributos ya agregados por municipio (Capa Sociedad escala Estatal)
    const isAggregated = envGeojson.features.length <= munFeatures.length + 2 && 
                         envGeojson.features.some(f => f.properties.CVEGEO || f.properties.NOMGEO);

    // Creamos un mapa de Clave -> Nombre Real usando la capa municipal del AppState
    const munMap = {};
    munFeatures.forEach(f => {
      const clave = f.properties.CVEGEO || f.properties.NOMGEO;
      const nombre = f.properties.NOMGEO || f.properties.municipio || clave;
      // Si la clave es numérica, la guardamos para traducir
      if (clave) munMap[clave] = nombre;
    });

    if (isAggregated) {
      console.log(`>>> Extrayendo atributos directos para: ${layerId}`);
      const col = cfg.styleConfig.column;
      envGeojson.features.forEach(f => {
        const key = f.properties.CVEGEO || f.properties.NOMGEO || 'Desconocido';
        const name = munMap[key] || key; // Traducimos si existe en el mapa
        results[name] = parseFloat(f.properties[col]) || 0;
      });
      return {
        labels: Object.keys(results),
        data: Object.values(results),
        label: cfg.name
      };
    }

    // 3. Caso General: Análisis Espacial (Puntos o Polígonos complejos)
    const isLine = cfg.type === 'line';
    const isPoint = cfg.type === 'point';
    
    const munData = munFeatures.map(f => ({
      feature: f,
      bbox: turf.bbox(f),
      name: f.properties.NOMGEO || f.properties.municipio || 'Sin Nombre'
    }));
    munData.forEach(m => results[m.name] = 0);

    // OPTIMIZACIÓN: Si es punto y tiene propiedad de municipio, saltar análisis espacial
    if (isPoint) {
      const op = cfg.op || 'count';
      const col = cfg.styleConfig?.column || 'tiempo_tra';
      const points = envGeojson.features.filter(f => f.properties);
      const hasMunProp = points.some(f => f.properties.municipio || f.properties.NOM_MUN || f.properties.MUNICIPIO);

      if (hasMunProp) {
        console.log(">>> Usando propiedad de municipio optimizada");
        const counts = {};
        const sums = {};
        points.forEach(f => {
          const mRaw = f.properties.municipio || f.properties.NOM_MUN || f.properties.MUNICIPIO;
          const mName = Object.keys(results).find(k => k.toLowerCase() === mRaw.toLowerCase()) || mRaw;
          counts[mName] = (counts[mName] || 0) + 1;
          if (op === 'avg') sums[mName] = (sums[mName] || 0) + (parseFloat(f.properties[col]) || 0);
        });
        Object.keys(results).forEach(name => {
          results[name] = op === 'avg' ? (counts[name] ? sums[name] / counts[name] : 0) : (counts[name] || 0);
        });
        return { labels: Object.keys(results), data: Object.values(results), label: cfg.name };
      }
    }

    console.log(`>>> Realizando análisis espacial para: ${layerId} (${envGeojson.features.length} features)...`);
    const op = cfg.op || 'count';
    const col = cfg.styleConfig?.column || 'tiempo_tra';
    const sums = {};
    const counts = {};

    for (let i = 0; i < envGeojson.features.length; i++) {
      const envFeature = envGeojson.features[i];
      if (!envFeature.geometry) continue;
      if (i % 200 === 0) await new Promise(r => setTimeout(r, 0));

      const b1 = turf.bbox(envFeature);
      
      munData.forEach(m => {
        const b2 = m.bbox;
        const overlaps = (b1[0] <= b2[2] && b1[2] >= b2[0] && b1[1] <= b2[3] && b1[3] >= b2[1]);

        if (overlaps) {
          try {
            if (isPoint) {
              if (turf.booleanPointInPolygon(envFeature, m.feature)) {
                counts[m.name] = (counts[m.name] || 0) + 1;
                if (op === 'avg') sums[m.name] = (sums[m.name] || 0) + (parseFloat(envFeature.properties[col]) || 0);
                results[m.name] = op === 'avg' ? sums[m.name] / counts[m.name] : counts[m.name];
              }
            } else if (isLine) {
              if (turf.booleanIntersects(m.feature, envFeature)) {
                results[m.name] += turf.length(envFeature, { units: 'meters' });
              }
            } else {
              const intersection = turf.intersect(turf.featureCollection([m.feature, envFeature]));
              if (intersection) {
                results[m.name] += turf.area(intersection);
              }
            }
          } catch (e) {}
        }
      });
    }

    const finalResult = {
      labels: Object.keys(results),
      data: Object.values(results),
      label: cfg.name
    };

    // 4. Guardar en Caché
    ANALYSIS_CACHE.set(cacheKey, finalResult);
    return finalResult;
  } catch (err) {
    console.error("Error en análisis:", err);
    return null;
  }
}

async function renderChart(key) {
  const moduleId = AppState.activeModule;
  const chartInfo = moduleId ? (MODULE_CHARTS[moduleId] || []).find(opt => opt.id === key) : null;
  
  const canvas = document.getElementById('main-chart');
  if (!canvas) return;

  if (AppState.currentChart) AppState.currentChart.destroy();
  document.getElementById('chart-description').innerHTML = `
    <span>Procesando datos del módulo ${moduleId}...</span>
    <div class="analysis-spinner"></div>
  `;

  await new Promise(resolve => setTimeout(resolve, 100));

  let data = null;
  let desc = '';
  let chartType = (chartInfo && chartInfo.chartType) ? chartInfo.chartType : 'bar';

  try {
    // 1. Priorizar Datos Pre-calculados (Instantáneos)
    if (CHART_DATA[key]) {
      data = CHART_DATA[key];
      desc = CHART_DATA[key].desc || '';
      chartType = CHART_DATA[key].type || 'bar';
    } 
    // 2. Si no hay datos pre-calculados, realizar análisis espacial
    else if (chartInfo && chartInfo.layer) {
      const spatial = await calculateSpatialData(chartInfo.layer, chartType);
      if (spatial) {
        const isLineChart = chartType === 'line';
        const bgColors = (chartType === 'pie' || chartType === 'doughnut')
          ? ['#7B1D2E', '#A63248', '#C4973A', '#E2B95A', '#4E0F1B', '#9E8070']
          : (LAYER_CONFIG[chartInfo.layer].color || '#7B1D2E');

        data = {
          labels: spatial.labels,
          datasets: [{
            label: spatial.label,
            data: spatial.data,
            backgroundColor: isLineChart ? 'rgba(123, 29, 46, 0.2)' : bgColors,
            borderColor: isLineChart ? '#7B1D2E' : (chartType === 'bar' ? '#C4973A' : '#fff'),
            borderWidth: isLineChart ? 3 : 1,
            fill: isLineChart,
            tension: 0.4, // Curva suave
            pointRadius: isLineChart ? 5 : 0,
            pointBackgroundColor: '#C4973A'
          }]
        };
        desc = chartInfo.desc || `Análisis territorial de ${LAYER_CONFIG[chartInfo.layer].name}.`;
      }
    } 

    if (data) {
      const ctx = canvas.getContext('2d');
      let options = { 
        ...CHART_DEFAULTS,
        plugins: { ...CHART_DEFAULTS.plugins },
        scales: { ...CHART_DEFAULTS.scales }
      };
      
      if (chartType === 'pie' || chartType === 'doughnut' || chartType === 'radar') {
        delete options.scales;
      }

      AppState.currentChart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
      });
      document.getElementById('chart-description').textContent = desc;
    } else {
      document.getElementById('chart-description').textContent = "Seleccione un análisis y presione Generar.";
    }
  } catch (err) {
    console.error("Error al renderizar:", err);
    document.getElementById('chart-description').textContent = "Error al generar la gráfica.";
  }
}


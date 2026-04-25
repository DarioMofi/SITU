/* ═══════════════════════════════════════════════════════════
   Layers.js - Configuración de Capas y Lógica de Mapa
   ════════════════════════════════════════════════════════ */

const USO_SUELO_COLORS = {
  'Habitacional Baja Densidad (H-b)': '#e6e215',
  'Habitacional Mixto Media Densidad (HM-m)': '#FFCC80',
  'Equipamiento (E)': '#116db9',
  'Mixto Especializado (M)': '#c46e28',
  'Deporte, Recreación y Área Verde (AV)': '#00ff08'
};

const USO_SUELO_VEG_COLORS = {
  'Agrícola': '#CDDC39',
  'Agricultura': '#F0F4C3',
  'Agua': '#0288D1',
  'Area desprovista de vegetación': '#BDBDBD',
  'Bosque Cultivado': '#2E7D32',
  'Manglar': '#004D40',
  'Palmar': '#FFB300',
  'Pastizal': '#C5E1A5',
  'Popal': '#4DB6AC',
  'Sabana': '#FFD54F',
  'Selva Alta': '#1B5E20',
  'Selva Media': '#388E3C',
  'Selva Baja': '#81C784',
  'Sin vegetación Aparente': '#E0E0E0',
  'Tular': '#A1887F',
  'Urbano Construido': '#2c2b2bff',
  'Vegetación Secundaria': '#8BC34A',
  'Otro': '#90A4AE'
};

const SALUD_COLORS = {
  'Equipamiento de Salud Publico': '#1573c0ff',
  'Equipamiento de Salud Privado': '#421a9eff'
};

const ELECTRICA_COLORS = {
  'Red eléctrica': '#ffe66aff',
  'Subestaciones': '#fbff03ff'
};

const EDUCACION_COLORS = {
  'Superior': '#0f1986ff',       // Azul Indigo Oscuro
  'Media_superior': '#0288d1ff', // Azul Brillante
  'Secundaria': '#1270bdff',     // Verde Azulado (Teal)
  'Primaria': '#0aa5ccff',       // Amarillo Ámbar
  'Preescolar': '#42eefaff'      // Rojo Intenso
};

const EDUCACION_SIZES = {
  'superior': 8,
  'media_superior': 7,
  'secundaria': 6,
  'primaria': 5.5,
  'preescolar': 5
};

const CUERPOS_AGUA_COLORS = {
  'Laguna': '#4fc3f7',
  'Lago': '#039be5',
  'Río': '#0288d1',
  'Canal': '#81d4fa',
  'Cenote': '#006064',
  'Arroyo': '#4dd0e1',
  'Estero': '#26a69a',
  'Marisma': '#80cbc4',
  'Pantano': '#4db6ac',
  'Poza': '#00acc1',
  'Estanque': '#00acc1',
  'Marina': '#0097a7',
  'Vaso del Bordo': '#00838f',
  'Otro': '#0277bd'
};

function classifyVegetacion(props) {
  // Intentar obtener el valor de varias claves posibles
  const desc = props.DESCRIPCIO || props.DESCRIPCI || props.descripcion || props.UES || props.ues || '';
  if (!desc) return 'Otro';
  
  // Normalización: Mayúsculas y eliminar acentos
  const clean = desc.toString().toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim();
  
  // 1. Grupos de Vegetación Secundaria (Prioridad Alta para evitar falsos positivos con Selvas)
  if (clean.includes('VEGETACION SECUNDARIA') || clean.includes('PETEN') || clean.includes('HALOFILA')) {
    return 'Vegetación Secundaria';
  }

  // 2. Grupos de Selvas
  if (clean.includes('SELVA ALTA')) return 'Selva Alta';
  if (clean.includes('SELVA MEDIA')) return 'Selva Media';
  if (clean.includes('SELVA BAJA')) return 'Selva Baja';

  // 3. Agricultura y Pastizales
  if (clean.includes('AGRICULTURA')) return 'Agricultura';
  if (clean.includes('PASTIZAL')) return 'Pastizal';
  if (clean.includes('AGRICOLA') || clean.includes('ACUICOLA')) return 'Agrícola';

  // 4. Otros tipos específicos
  if (clean.includes('AGUA')) return 'Agua';
  if (clean.includes('DESPROVISTA')) return 'Area desprovista de vegetación';
  if (clean.includes('BOSQUE CULTIVADO')) return 'Bosque Cultivado';
  if (clean.includes('MANGLAR')) return 'Manglar';
  if (clean.includes('PALMAR')) return 'Palmar';
  if (clean.includes('POPAL')) return 'Popal';
  if (clean.includes('SABANA')) return 'Sabana';
  if (clean.includes('SIN VEGETACION')) return 'Sin vegetación Aparente';
  if (clean.includes('TULAR')) return 'Tular';
  if (clean.includes('URBANO') || clean.includes('CONSTRUIDO')) return 'Urbano Construido';

  return 'Otro';
}

const RED_VIAL_STYLES = {
  'Carretera': { color: '#b60c0c', weight: 2.5 },
  'Avenida':   { color: '#f5892b', weight: 2 },
  'Calle':     { color: '#66360f', weight: 1.3 },
  'Camino':    { color: '#af9753', weight: 0.9, dashArray: '5, 5' },
  'Otro':      { color: '#7f8c8d', weight: .5 }
};

const VIA_FERREA_STYLES = {
  'Tren Maya': { color: '#057431ff', weight: 4 },
  'Vía Corta Mayab': { color: '#1dda55ff', weight: 3.5, dashArray: '5, 5' }
};

/* ── CONFIGURACIÓN TEMÁTICA (COROPLETAS) ── */
const INDICATOR_STYLES = {
  ramps: {
    Purples: ['#b39ceeff', '#6c65bbff', '#8056b8ff', '#5d368fff', '#360c6dff'],
    Greens: ['#a0fd7eff', '#5acf45ff', '#319c65ff', '#10742eff', '#02421cff'],
    Oranges: ['#f3b77cff', '#f58f35ff', '#d86716ff', '#ac3f08ff', '#692505ff'],
    Blues: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
    Teals: ['#f0f9e8', '#bae4bc', '#7bccc4', '#43a2ca', '#0868ac'],
    YlOrRd: ['#f0f04cff', '#fecc5c', '#fd8d3c', '#f03b20', '#bd0026']
  },
  grades: {
    'Muy bajo': '#26a69a',
    'Bajo': '#d4e157',
    'Medio': '#ffca28',
    'Alto': '#fb8c00',
    'Muy alto': '#e53935'
  }
};

function getChoroplethColor(val, cfg) {
  if (cfg.type === 'categorical') {
    if (cfg.mapping) {
      // Búsqueda robusta (insensible a mayúsculas y guiones bajos)
      const lookup = (v) => v.toString().toLowerCase().replace(/_/g, ' ');
      const target = lookup(val);
      const key = Object.keys(cfg.mapping).find(k => lookup(k) === target);
      const style = key ? cfg.mapping[key] : null;
      return style?.color || style || '#ccc';
    }
    return INDICATOR_STYLES.grades[val] || '#ccc';
  }
  
  const bins = cfg.bins || [0, 10, 50, 100, 500];
  const colors = INDICATOR_STYLES.ramps[cfg.ramp] || INDICATOR_STYLES.ramps.Purples;
  
  for (let i = bins.length - 1; i >= 0; i--) {
    if (val >= bins[i]) return colors[i] || colors[colors.length - 1];
  }
  return colors[0];
}

function calculateProportionalRadius(val, sCfg) {
  const minV = sCfg.minValue || 0;
  const maxV = sCfg.maxValue || 100;
  const minR = sCfg.minRadius || 3;
  const maxR = sCfg.maxRadius || 15;
  
  if (val === null || val === undefined) return minR;
  if (val <= minV) return minR;
  if (val >= maxV) return maxR;
  
  const ratio = (val - minV) / (maxV - minV);
  return minR + (ratio * (maxR - minR));
}

function getChoroplethStyle(feature, layerId) {
  const cfg = LAYER_CONFIG[layerId];
  if (!cfg.styleConfig) return getLayerStyle(layerId);
  
  // Lógica especial para Uso de Suelo (Escala Dual)
  if (layerId === 'uso_suelo') {
    let fillColor = '#ccc';
    let pane = AppState.analysisScale === 'estatal' ? 'panePolygonsBottom' : 'panePolygonsTop';

    if (AppState.analysisScale === 'estatal') {
      const cat = classifyVegetacion(feature.properties);
      fillColor = USO_SUELO_VEG_COLORS[cat] || '#ccc';
    } else {
      fillColor = USO_SUELO_COLORS[feature.properties.ues] || '#ccc';
    }

    return { fillColor, fillOpacity: 0.8, weight: 0.2, color: '#fff', opacity: 0.5, pane };
  }

  const prop = cfg.styleConfig.column || (AppState.analysisScale === 'estatal' ? cfg.styleConfig.column_estatal : cfg.styleConfig.column_municipal);
  const valRaw = feature.properties[prop];
  const val = (typeof valRaw === 'string') ? valRaw.trim() : valRaw;
  
  // Resolver bins según la escala actual
  const styleCfg = { ...cfg.styleConfig };
  
  if (AppState.analysisScale === 'estatal' && cfg.styleConfig.bins_estatal) {
    styleCfg.bins = cfg.styleConfig.bins_estatal;
  } else if (AppState.analysisScale === 'municipal' && cfg.styleConfig.bins_municipal) {
    styleCfg.bins = cfg.styleConfig.bins_municipal;
  }
  
  if (cfg.type === 'line') {
    const roadStyle = styleCfg.mapping ? styleCfg.mapping[val] : null;
    return {
      color: roadStyle?.color || cfg.color,
      weight: roadStyle?.weight || 2.5,
      opacity: 0.85,
      pane: 'paneLines',
      dashArray: roadStyle?.dashArray || null
    };
  }

  const fillColor = getChoroplethColor(val, styleCfg);
  
  let radius = 7;
  if (styleCfg.radiusMapping) {
    const lookup = (v) => v.toString().toLowerCase().replace(/_/g, ' ');
    const target = lookup(val);
    const key = Object.keys(styleCfg.radiusMapping).find(k => lookup(k) === target);
    radius = key ? styleCfg.radiusMapping[key] : 7;
  }
  
  let pane = 'panePolygonsBottom';
  if (cfg.scale_type === 'inter') pane = 'panePolygonsMiddle';
  else if (cfg.scale_type === 'multi') pane = AppState.analysisScale === 'estatal' ? 'panePolygonsBottom' : 'panePolygonsTop';

  return {
    fillColor: fillColor,
    radius: radius,
    fillOpacity: 0.8,
    weight: 0,
    opacity: 0,
    pane: pane
  };
}

/* ── RENDERIZADO DE SIMBOLOGÍA ── */
function renderLayerLegend(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  if (!cfg) return '';

  let legendHTML = `
    <div class="legend-block" data-layer="${layerId}">
      <div class="legend-block__header">
        <div class="legend-block__subtitle">${cfg.module}</div>
        <div class="legend-block__title">${cfg.name}</div>
      </div>
      <div class="legend-items">
  `;

  if (cfg.legendType === 'gradient') {
    legendHTML += `
      <div class="legend-gradient-container">
        <div class="legend-gradient-bar" style="background: ${cfg.gradient || 'linear-gradient(to bottom, #ccc, #fff)'}"></div>
        <div class="legend-gradient-labels">
          <div class="legend-gradient-label">${cfg.max.toLocaleString()}</div>
          <div class="legend-gradient-label">${cfg.min.toLocaleString()}</div>
        </div>
      </div>`;
  } else if (cfg.styleConfig) {
    if (cfg.styleConfig.type === 'categorical') {
      let mapping = cfg.styleConfig.mapping || INDICATOR_STYLES.grades;
      
      // Soporte para mappings por escala (Uso de Suelo)
      if (AppState.analysisScale === 'estatal' && cfg.styleConfig.mapping_estatal) {
        mapping = cfg.styleConfig.mapping_estatal;
      } else if (AppState.analysisScale === 'municipal' && cfg.styleConfig.mapping_municipal) {
        mapping = cfg.styleConfig.mapping_municipal;
      }

      Object.entries(mapping).forEach(([label, style]) => {
        const color = style.color || style;
        const isLine = cfg.type === 'line';
        const weight = style.weight || 2;

        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background:${color}; height:${isLine ? weight + 'px' : '14px'}; width:${isLine ? '28px' : '24px'}; border-radius:${isLine ? '0' : '3px'}"></div>
            <div class="legend-label">${label}</div>
          </div>`;
      });
    } else {
      let bins = cfg.styleConfig.bins || [0, 10, 50, 100, 500];
      if (AppState.analysisScale === 'estatal' && cfg.styleConfig.bins_estatal) {
        bins = cfg.styleConfig.bins_estatal;
      } else if (AppState.analysisScale === 'municipal' && cfg.styleConfig.bins_municipal) {
        bins = cfg.styleConfig.bins_municipal;
      }

      const colors = INDICATOR_STYLES.ramps[cfg.styleConfig.ramp] || INDICATOR_STYLES.ramps.Purples;
      bins.forEach((bin, i) => {
        const nextBin = bins[i + 1] ? `– ${bins[i + 1]}` : '+';
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background:${colors[i]}"></div>
            <div class="legend-label">${bin.toLocaleString()} ${nextBin.toLocaleString()}</div>
          </div>`;
      });
    }
  } else {
    // Capa simple
    legendHTML += `
      <div class="legend-item">
        <div class="legend-color" style="background:${cfg.color || '#ccc'}"></div>
        <div class="legend-label">Presencia / Área</div>
      </div>`;
  }

  legendHTML += `</div>`; // Cierra legend-items

  if (cfg.fuente_url) {
    legendHTML += `
      <div class="legend-source">
        <i class="fa-solid fa-link"></i>
        <span>Fuente: <a href="${cfg.fuente_url}" target="_blank">Consultar dataset oficial</a></span>
      </div>`;
  } else if (cfg.metadata && cfg.metadata['Fuente']) {
    legendHTML += `
      <div class="legend-source">
        <i class="fa-solid fa-database"></i>
        <span>Fuente: ${cfg.metadata['Fuente']}</span>
      </div>`;
  }

  legendHTML += `</div>`; // Cierra legend-block
  return legendHTML;
}

const LAYER_CONFIG = {
  /* ── MÓDULO I: Ambiental ── */
  inundacion: {
    name: 'Zonas de Inundación',
    module: 'ambiental',
    color: '#062b55ff',
    file: 'Datos/Ambiental/Inundacion.geojson',
    scale_type: 'inter',
    type: 'polygon',
    metadata: {
      'Fuente': 'CENAPRED · CONAGUA',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Delimitación de zonas con riesgo de inundación por desbordamiento de cuerpos de agua o lluvia extrema.',
      'Atributos clave': 'grado_riesgo, periodo_retorno, superficie_ha'
    }
  },

  anp: {
    name: 'Áreas Naturales Protegidas',
    module: 'ambiental',
    color: '#216e24ff',
    file: 'Datos/Ambiental/anp.geojson',
    scale_type: 'inter',
    type: 'polygon',
    metadata: {
      'Fuente': 'CONANP',
      'Url': '',
      'Fecha': '2024',
      'Escala': '1:250,000',
      'Normativa': 'NOM-003-SEDATU-2017 · LGEEPA',
      'Descripción': 'Polígonos de áreas naturales protegidas de carácter federal y estatal.',
      'Atributos clave': 'nombre_anp, categoria, decreto, superficie_ha'
    }
  },
  cobertura_vegetal: {
    name: 'Cobertura Vegetal',
    module: 'ambiental',
    color: '#558B2F',
    file: 'Datos/Ambiental/Vegetacion.png?v=' + new Date().getTime(),
    type: 'image',
    legendType: 'gradient',
    min: 0,
    max: 36,
    gradient: 'linear-gradient(to bottom, #1b5e20, #f1f8e9)',
    bounds: [[17.809459834, -92.470599054], [20.959941367, -89.012175041]],
    metadata: {
      'Fuente': 'INEGI · Procesado MBTiles',
      'Url': '',
      'Fecha': '2024',
      'Escala': 'Local',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Capa ráster de cobertura vegetal en formato MBTiles.',
      'Atributos clave': 'Valores ráster'
    },
    pane: 'paneClipped'
  },
  cuerpos_agua: {
    name: 'Cuerpos de Agua',
    module: 'ambiental',
    color: '#0277BD',
    file: 'Datos/Ambiental/cuerpos_agua.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'O_ESPACIAL', 
      type: 'categorical',
      mapping: CUERPOS_AGUA_COLORS
    },
    metadata: {
      'Fuente': 'INEGI',
      'Url': 'https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=889463598435',
      'Fecha': '2023',
      'Escala': '1:250,000',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Lagos, lagunas, ríos y embalses del estado clasificados por tipo de objeto espacial.',
      'Atributos clave': 'O_ESPACIAL, nombre, subcuenca'
    }
  },
  red_hidrica: {
    name: 'Red Hídrica',
    module: 'ambiental',
    color: '#0288d1',
    file: 'Datos/Ambiental/red_hid.geojson',
    type: 'line',
    styleConfig: { 
      column: 'Ter_Gen', 
      type: 'categorical',
      mapping: {
        'Arroyo': { color: '#4fc3f7', weight: 1.5 },
        'Río': { color: '#0288d1', weight: 2.5 },
        'Otro': { color: '#90a4ae', weight: 1.0 }
      }
    },
    metadata: {
      'Fuente': 'INEGI',
      'Url': '',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Red de drenaje superficial que incluye ríos y arroyos clasificados por su importancia.',
      'Atributos clave': 'Ter_Gen, nombre'
    }
  },
  temperatura: {
    name: 'Temperatura',
    module: 'ambiental',
    color: '#FF5722',
    file: 'Datos/Ambiental/Temperatura.png?v=' + new Date().getTime(),
    type: 'image',
    legendType: 'gradient',
    min: 25.07,
    max: 37.299909,
    gradient: 'linear-gradient(to bottom, #67000d, #fff5f0)',
    bounds: [[17.804608931, -92.472575347], [20.966678731, -89.005078351]],
    metadata: {
      'Fuente': 'Desarrollo Propio con informacion de INEGI',
      'Url': '',
      'Fecha': '2024',
      'Escala': 'Local',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Distribución de temperatura superficial terrestre captada mediante sensores remotos (LST).',
      'Atributos clave': 'temperatura_c, clasificacion, zona'
    },
    pane: 'paneClipped'
  },

  /* ── MÓDULO II: Sociedad ── */
  densidad_pob: {
    name: 'Densidad Poblacional',
    module: 'sociedad',
    color: '#4A148C',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'DENS_HAB_x', 
      ramp: 'Purples', 
      bins_estatal: [0, 5, 15, 40, 70],
      bins_municipal: [0, 10, 50, 150, 300] 
    },
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONAPO',
      'Descripción': 'Densidad de población por unidad territorial (hab/km²).',
      'Atributos clave': 'DENS_HAB_x, POBTOT'
    }
  },
  poblacion_indigena: {
    name: 'Población Indígena',
    module: 'sociedad',
    color: '#880E4F',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'INDI1', 
      ramp: 'Greens', 
      bins_estatal: [0, 1000, 5000, 10000, 25000],
      bins_municipal: [0, 5, 20, 50, 100] 
    },
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONAPO · CDI',
      'Descripción': 'Concentración de población indígena por unidad territorial.',
      'Atributos clave': 'INDI1, POBTOT'
    }
  },
  adultos_mayores: {
    name: 'Adultos Mayores (60+)',
    module: 'sociedad',
    color: '#E65100',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'POB24', 
      ramp: 'Oranges', 
      bins_estatal: [0, 2000, 5000, 10000, 20000],
      bins_municipal: [0, 10, 30, 70, 150] 
    },
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONAPO',
      'Descripción': 'Población de 60 años o más por unidad territorial.',
      'Atributos clave': 'POB24, POBTOT'
    }
  },
  infancias: {
    name: 'Infancias (0–14 años)',
    module: 'sociedad',
    color: '#00838F',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'POB8', 
      ramp: 'Blues', 
      bins_estatal: [0, 5000, 15000, 30000, 50000],
      bins_municipal: [0, 50, 150, 300, 600] 
    },
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'UNICEF · CONAPO',
      'Descripción': 'Población de 0 a 14 años. Indicador de demanda de servicios de cuidado y educación.',
      'Atributos clave': 'POB8, POBTOT'
    }
  },
  loc_rur: {
    name: 'Localidades Rurales',
    module: 'sociedad',
    color: '#5c3529ff',
    file: 'Datos/Sociedad/Loc_rur.geojson',
    type: 'point',
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'Localidad',
      'Normativa': 'CONAPO',
      'Descripción': 'Ubicación de localidades rurales.',
      'Atributos clave': 'nombre, municipio'
    }
  },
  marginacion: {
    name: 'Índice de Marginación',
    module: 'sociedad',
    color: '#D84315',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'G_INDICE', type: 'categorical' },
    metadata: {
      'Fuente': 'Desarrollo Propio con informacion de INEGI',
      'Url': '',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONAPO',
      'Descripción': 'Índice de marginación por unidad territorial.',
      'Atributos clave': 'G_INDICE, IM_2020'
    }
  },
  pobreza: {
    name: 'Pobreza Multidimensional',
    module: 'sociedad',
    color: '#B71C1C',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'g_socioeco', type: 'categorical' },
    metadata: {
      'Fuente': 'Desarrollo Propio con informacion de INEGI',
      'Url': '',
      'Fecha': '2022',
      'Escala': 'Municipal',
      'Normativa': 'CONEVAL',
      'Descripción': 'Estimación de pobreza multidimensional por carencias sociales y bienestar económico.',
      'Atributos clave': 'g_socioeco, pct_pobreza'
    }
  },
  discapacidad: {
    name: 'Población con Discapacidad',
    module: 'sociedad',
    color: '#1B5E20',
    scale_type: 'multi',
    file_estatal: 'Datos/Sociedad/Indicadores_municipal.geojson',
    file_municipal: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { 
      column: 'DISC1', 
      ramp: 'Teals', 
      bins_estatal: [0, 1000, 3000, 6000, 10000],
      bins_municipal: [0, 5, 20, 50, 100] 
    },
    metadata: {
      'Fuente': 'Inegi SCINCE 2020',
      'Url': 'https://gaia.inegi.org.mx/scince2020/',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONADIS',
      'Descripción': 'Población con alguna limitación o discapacidad declarada.',
      'Atributos clave': 'DISC1, POBTOT'
    }
  },


  /* ── MÓDULO III: Infraestructura ── */
  red_vial: {
    name: 'Red Vial Principal',
    module: 'infraestructura',
    color: '#6b1515ff',
    file: 'Datos/Infraestructura/Red_vial.geojson',
    type: 'line',
    styleConfig: { 
      column: 'TIPO_VIAL', 
      type: 'categorical', 
      mapping: RED_VIAL_STYLES 
    },
    metadata: {
      'Fuente': 'SCT · INEGI',
      'Url': '',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Red de carreteras federales, estatales y caminos rurales clasificados por orden vial.',
      'Atributos clave': 'tipo_vial, longitud_km, estado_fis'
    }
  },
  vias_ferreas: {
    name: 'Vías Férreas',
    module: 'infraestructura',
    color: '#333333ff',
    file: 'Datos/Infraestructura/Via_Ferrea.geojson',
    type: 'line',
    styleConfig: { 
      column: 'VIA', 
      type: 'categorical', 
      mapping: VIA_FERREA_STYLES 
    },
    metadata: {
      'Fuente': 'SICT · ARTF',
      'Url': '',
      'Fecha': '2025',
      'Escala': 'Local',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Red ferroviaria clasificada por tipo de vía y operador.',
      'Atributos clave': 'VIA, SERVICIO, ENTIDAD'
    }
  },
  tiempo_traslado: {
    name: 'Tiempo de Traslado a Cabecera Municipal',
    module: 'infraestructura',
    color: '#b83b1cff',
    file: 'Datos/Infraestructura/Tiempo_tras.geojson',
    type: 'point',
    styleConfig: {
      column: 'tiempo_tra',
      type: 'proportional',
      minRadius: 4,
      maxRadius: 22,
      minValue: 3,
      maxValue: 450
    },
    metadata: {
      'Fuente': 'SITU · SEDATU',
      'Url': 'https://situ.sedatu.gob.mx/descargas/',
      'Fecha': '2024',
      'Escala': 'Regional',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Tiempo estimado de traslado en minutos desde las localidades hasta la cabecera municipal más cercana.',
      'Atributos clave': 'nombre, tiempo_tra, municipio'
    }
  },
  cobertura_electrica: {
    name: 'Cobertura Eléctrica',
    module: 'infraestructura',
    color: '#dfc12eff',
    file: ['Datos/Infraestructura/Linea_trans.geojson', 'Datos/Infraestructura/Subestaciones.geojson'],
    type: 'mixed',
    multi_file_tag: 'tipo_electrica',
    styleConfig: {
      column: 'tipo_electrica',
      type: 'categorical',
      mapping: ELECTRICA_COLORS
    },
    metadata: {
      'Fuente': 'IDEA UNAM',
      'Url': 'https://www.gits.igg.unam.mx/idea/descarga',
      'Fecha': '2023',
      'Escala': 'Nacional · Estatal',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Red de transmisión eléctrica y subestaciones de energía.',
      'Atributos clave': 'nombre, tipo, capacidad_kv'
    }
  },
  equipamiento_salud: {
    name: 'Equipamiento de Salud',
    module: 'infraestructura',
    color: '#1573c0ff',
    file: ['Datos/Infraestructura/salud_pub.geojson', 'Datos/Infraestructura/salud_priv.geojson'],
    type: 'point',
    multi_file_tag: 'origen_salud',
    styleConfig: { 
      column: 'origen_salud', 
      type: 'categorical',
      mapping: SALUD_COLORS
    },
    metadata: {
      'Fuente': 'SITU',
      'Url': 'https://situ.sedatu.gob.mx/descargas/',
      'Fecha': '2023',
      'Escala': '1:10,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Hospitales, clínicas y unidades de salud georreferenciados, clasificados en servicios públicos y privados.',
      'Atributos clave': 'nom_comerc, origen_salud, municipio'
    }
  },
  equipamiento_educacion: {
    name: 'Equipamiento Educativo',
    module: 'infraestructura',
    color: '#1A237E',
    file: 'Datos/Infraestructura/educacion.json',
    type: 'point',
    styleConfig: { 
      column: 'tipo_edu', 
      type: 'categorical',
      mapping: EDUCACION_COLORS,
      radiusMapping: EDUCACION_SIZES
    },
    metadata: {
      'Fuente': '911 SEP · DENUE',
      'Url': 'https://situ.sedatu.gob.mx/descargas/',
      'Fecha': '2023',
      'Escala': '1:10,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Localización geográfica de centros educativos clasificados por nivel: preescolar, primaria, secundaria, media superior y superior.',
      'Atributos clave': 'tipo_edu, municipio'
    }
  },

  /* ── MÓDULO IV: Aptitud ── */
  uso_suelo: {
    name: 'Uso de Suelo y Vegetación',
    module: 'aptitud',
    color: '#33691E',
    scale_type: 'multi',
    file_estatal: 'Datos/Aptitud/Uso_prim.geojson',
    file_municipal: 'Datos/Aptitud/manzanas.geojson',
    type: 'polygon',
    styleConfig: { 
      type: 'categorical',
      column_estatal: 'DESCRIPCIO',
      column_municipal: 'ues',
      mapping_estatal: USO_SUELO_VEG_COLORS,
      mapping_municipal: USO_SUELO_COLORS
    },
    metadata: {
      'Fuente': 'INEGI · Serie VII',
      'Url': 'https://www.inegi.org.mx/temas/usosuelo/',
      'Fecha': '2021',
      'Escala': '1:250,000 / 1:10,000',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Clasificación de uso de suelo y tipos de vegetación. En escala estatal muestra vegetación primaria; en municipal muestra usos de suelo urbanos por manzana.',
      'Atributos clave': 'DESCRIPCIO, ues, superficie_ha'
    }
  },
  crecimiento_urbano: {
    name: 'Crecimiento Urbano Histórico',
    module: 'aptitud',
    color: '#757575',
    file: 'Datos/Crec_Urb_1980_2020.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'INEGI',
      'Url': '',
      'Fecha': '1980 - 2020',
      'Escala': 'Regional',
      'Normativa': 'SEDATU',
      'Descripción': 'Polígonos de crecimiento urbano clasificados por año.',
      'Atributos clave': 'layer, Area'
    }
  }
};

/* ── FUNCIONES DE MAPA Y CAPAS ── */
function initMap() {
  // Se utiliza AppState.basemapIndex definido en Config.js
  AppState.map = L.map('map', {
    center: [19.0, -90.5],
    zoom: 8,
    zoomControl: false,
    attributionControl: true,
    preferCanvas: true // Renderizado mucho más rápido para grandes volúmenes de datos
  });

  // ── Paneles de Jerarquía ──
  // Z-Index para asegurar que polígonos grandes no tapen a pequeños
  AppState.map.createPane('panePolygonsBottom');
  AppState.map.getPane('panePolygonsBottom').style.zIndex = 380; // Municipal
  
  AppState.map.createPane('panePolygonsMiddle');
  AppState.map.getPane('panePolygonsMiddle').style.zIndex = 400; // Intermedio (Inundaciones)
  
  AppState.map.createPane('panePolygonsTop');
  AppState.map.getPane('panePolygonsTop').style.zIndex = 420; // Manzanas
  
  AppState.map.createPane('paneLines');
  AppState.map.getPane('paneLines').style.zIndex = 500;
  AppState.map.createPane('panePoints');
  AppState.map.getPane('panePoints').style.zIndex = 600;
  
  // ── Panel Municipal (Prioridad de Interacción) ──
  AppState.map.createPane('paneMunicipal');
  AppState.map.getPane('paneMunicipal').style.zIndex = 350;
  
  // ── Panel con Recorte (Clipping) ──
  AppState.map.createPane('paneClipped');
  AppState.map.getPane('paneClipped').style.zIndex = 250;
  AppState.map.getPane('paneClipped').classList.add('clipped-pane');

  AppState.baseTile = L.tileLayer(BASEMAPS[AppState.basemapIndex].url, {
    attribution: BASEMAPS[AppState.basemapIndex].attribution,
    maxZoom: 19
  }).addTo(AppState.map);

  AppState.map.on('mousemove', (e) => {
    document.getElementById('map-coords').textContent =
      `Lat: ${e.latlng.lat.toFixed(5)} | Lon: ${e.latlng.lng.toFixed(5)}`;
  });

  AppState.map.on('zoomend', () => {
    const z = AppState.map.getZoom();
    document.getElementById('map-zoom').textContent = `Zoom: ${z}`;
    const scale = Math.round(591657550.5 / Math.pow(2, z));
    document.getElementById('map-scale').textContent = `Escala: 1:${scale.toLocaleString()}`;
  });

  AppState.map.fire('zoomend');

  // Eventos para actualizar la máscara de recorte
  AppState.map.on('move zoom', updateClippedMask);

  /* ── Capas base: Límite Estatal + División Municipal ── */
  loadBaseLayers();
}

async function loadBaseLayers() {
  try {
    // ── Límite Estatal para el Recorte (Simplificado) ──
    const resEst = await fetch('Datos/Lim_Est_Base.json');
    if (resEst.ok) {
      AppState.stateBoundary = await resEst.json();
      updateClippedMask(); 
    }

    // ── División Municipal (Simplificado) ──
    const resMun = await fetch('Datos/Lim_Mun_Base.json');
    if (resMun.ok) {
      const dataMun = await resMun.json();
      let hoverTimer = null;

      AppState.layerMunicipal = L.geoJSON(dataMun, {
        style: {
          color: '#161616ff', // Dorado institucional para los bordes
          weight: 1.5,
          opacity: 0.8,
          fillColor: 'rgba(255, 255, 255, 0.01)', // Color casi invisible
          fillOpacity: 1, // Opacidad total para atrapar el cursor en todo el interior
          pane: 'paneMunicipal'
        },
        onEachFeature: (feature, layer) => {
          const nombre = feature.properties.NOMGEO || 'Sin nombre';

          layer.on('mouseover', function () {
            this.setStyle({ fillOpacity: 0.15, fillColor: '#8d2727ff', weight: 2.5, color: '#383737ff' });
            hoverTimer = setTimeout(() => {
              this.bindTooltip(nombre, {
                permanent: false,
                direction: 'top',
                className: 'mun-tooltip'
              }).openTooltip();
            }, 900);
          });

          layer.on('mouseout', function () {
            clearTimeout(hoverTimer);
            AppState.layerMunicipal.resetStyle(this);
            this.unbindTooltip();
          });

          // Zoom al municipio al hacer clic
          layer.on('click', function () {
            if (AppState.map) {
              AppState.map.fitBounds(layer.getBounds(), {
                padding: [20, 20],
                maxZoom: 13, // Un nivel de zoom adecuado para ver manzanas
                animate: true,
                duration: 0.8
              });
            }
          });
        }
      }).addTo(AppState.map);
    }
  } catch (err) {
    console.warn('Error cargando capas base:', err);
  }
}

// Nueva función para encontrar el municipio debajo de un clic y hacer zoom
function zoomToMunicipalityByLatLng(latlng) {
  if (!AppState.layerMunicipal) return;
  const pt = [latlng.lng, latlng.lat];
  let targetLayer = null;
  
  AppState.layerMunicipal.eachLayer(l => {
    if (targetLayer) return;
    if (window.d3 && d3.geoContains(l.feature, pt)) {
      targetLayer = l;
    }
  });

  if (targetLayer && AppState.map) {
    AppState.map.fitBounds(targetLayer.getBounds(), {
      padding: [20, 20],
      maxZoom: 13,
      animate: true,
      duration: 0.8
    });
    return true; // Exito
  }
  return false;
}

function getLayerStyle(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const color = cfg.color;
  
  let pane = 'overlayPane';
  if (cfg.type === 'polygon') {
    if (cfg.scale_type === 'inter') pane = 'panePolygonsMiddle';
    else if (cfg.scale_type === 'multi') pane = AppState.analysisScale === 'estatal' ? 'panePolygonsBottom' : 'panePolygonsTop';
    else pane = 'panePolygonsBottom';
    
    return { color, fillColor: color, fillOpacity: 0.35, weight: 1.5, opacity: 0.8, pane };
  }
  
  if (cfg.type === 'line') return { color, weight: 2.5, opacity: 0.85, pane: 'paneLines' };
  if (cfg.type === 'point') return { pane: 'panePoints' };
  
  return { pane };
}

function buildPopupHTML(feature, layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const props = feature.properties || {};
  
  let rows = '';
  
  if (cfg.styleConfig && cfg.styleConfig.column) {
    // Si la capa tiene una columna de datos proyectada, mostrar solo esa
    const col = cfg.styleConfig.column;
    const val = props[col];
    const formattedVal = (typeof val === 'number') ? val.toLocaleString() : (val !== null && val !== undefined ? val : '—');
    
    rows = `
      <div class="geo-popup__row">
        <span class="geo-popup__key">${cfg.name}</span>
        <span class="geo-popup__val">${formattedVal}</span>
      </div>`;
  } else {
    // Para capas sin styleConfig (puntos, líneas o polígonos simples), mostrar atributos descriptivos básicos
    const keys = ['nombre', 'municipio', 'NOMGEO'].filter(k => props[k]);
    if (keys.length === 0) keys.push(...Object.keys(props).slice(0, 2));
    
    rows = keys.map(k => `
      <div class="geo-popup__row">
        <span class="geo-popup__key">${k.replace(/_/g, ' ')}</span>
        <span class="geo-popup__val">${props[k] || '—'}</span>
      </div>`).join('');
  }

  return `
    <div class="geo-popup">
      <div class="geo-popup__header">
        <h4>${props.nom_comerc || props.NOMGEO || props.nombre || props.municipio || cfg.name}</h4>
        <span>${cfg.module.toUpperCase()} · ${cfg.name}</span>
      </div>
      <div class="geo-popup__body">
        ${rows}
      </div>
    </div>`;
}

async function addLayer(layerId) {
  if (AppState.activeLayers[layerId]) return;
  const cfg = LAYER_CONFIG[layerId];
  
  showToast(`Cargando capa: ${cfg.name}...`);
  
  let leafletLayer;

  if (cfg.type === 'image') {
    leafletLayer = L.imageOverlay(cfg.file, cfg.bounds, {
      opacity: 0.8,
      pane: cfg.pane || 'tilePane',
      interactive: false,
      className: 'layer-multiply'
    });
  } else {
    const geojson = await loadRealGeoJSON(layerId);

    if (layerId === 'crecimiento_urbano') {
      const ctrls = document.getElementById('crecimiento-controls');
      ctrls.style.display = 'block';

      const sliderBase = document.getElementById('slider-base');
      const sliderFinal = document.getElementById('slider-final');

      const availableYears = [...new Set(geojson.features.map(f => f.properties.layer))].filter(Boolean).sort();
      sliderBase.max = availableYears.length - 1;
      sliderFinal.max = availableYears.length - 1;

      leafletLayer = L.featureGroup();

      const renderCrecimiento = (e) => {
        let idxBase = parseInt(sliderBase.value);
        let idxFinal = parseInt(sliderFinal.value);

        if (idxBase >= idxFinal) {
          if (e && e.target === sliderBase) {
            sliderFinal.value = idxBase;
            idxFinal = idxBase;
          } else if (e && e.target === sliderFinal) {
            sliderBase.value = idxFinal;
            idxBase = idxFinal;
          } else {
            idxBase = 0;
            sliderBase.value = 0;
          }
        }

        const yBase = availableYears[idxBase];
        const yFinal = availableYears[idxFinal];

        document.getElementById('label-base').textContent = yBase;
        document.getElementById('label-final').textContent = yFinal;

        leafletLayer.clearLayers();
        const featuresFinal = geojson.features.filter(f => f.properties.layer == yFinal);
        const featuresBase = geojson.features.filter(f => f.properties.layer == yBase);

        if (featuresFinal.length > 0) {
          L.geoJSON({ type: 'FeatureCollection', features: featuresFinal }, {
            style: { color: '#B0B0B0', fillColor: '#B0B0B0', fillOpacity: 0.7, weight: 1, pane: 'panePolygonsTop' },
            onEachFeature: (f, l) => {
              l.bindPopup(buildPopupHTML(f, layerId), { maxWidth: 300 });
              l.on('click', (e) => {
                showAttributePanel(f, layerId);
                const zoomed = e.latlng ? zoomToMunicipalityByLatLng(e.latlng) : false;
                if (!zoomed && AppState.map && l.getBounds) {
                  AppState.map.fitBounds(l.getBounds(), { padding: [20, 20], maxZoom: 13, animate: true, duration: 0.8 });
                }
              });
            }
          }).addTo(leafletLayer);
        }

        if (featuresBase.length > 0) {
          L.geoJSON({ type: 'FeatureCollection', features: featuresBase }, {
            style: { color: '#757575', fillColor: '#757575', fillOpacity: 0.9, weight: 1.5, pane: 'panePolygonsTop' },
            onEachFeature: (f, l) => {
              l.bindPopup(buildPopupHTML(f, layerId), { maxWidth: 300 });
              l.on('click', (e) => {
                showAttributePanel(f, layerId);
                const zoomed = e.latlng ? zoomToMunicipalityByLatLng(e.latlng) : false;
                if (!zoomed && AppState.map && l.getBounds) {
                  AppState.map.fitBounds(l.getBounds(), { padding: [20, 20], maxZoom: 13, animate: true, duration: 0.8 });
                }
              });
            }
          }).addTo(leafletLayer);
        }
      };

      sliderBase.oninput = renderCrecimiento;
      sliderFinal.oninput = renderCrecimiento;
      renderCrecimiento();

    } else if (cfg.type === 'point') {
      leafletLayer = L.geoJSON(geojson, {
        pointToLayer: (f, latlng) => {
          const style = cfg.styleConfig ? getChoroplethStyle(f, layerId) : { fillColor: cfg.color, radius: 7 };
          return L.circleMarker(latlng, {
            radius: (cfg.styleConfig && cfg.styleConfig.type === 'proportional') ? 
                    calculateProportionalRadius(f.properties[cfg.styleConfig.column], cfg.styleConfig) : (style.radius || 7),
            fillColor: style.fillColor || cfg.color,
            color: 'rgba(0, 0, 0, 0.4)',
            weight: 0.8,
            opacity: 1,
            fillOpacity: 0.85,
            pane: 'panePoints'
          });
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopupHTML(feature, layerId), { maxWidth: 300 });
          layer.on('click', (e) => {
            showAttributePanel(feature, layerId);
            const zoomed = e.latlng ? zoomToMunicipalityByLatLng(e.latlng) : false;
            if (!zoomed && AppState.map && layer.getBounds) {
              AppState.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 13, animate: true, duration: 0.8 });
            } else if (!zoomed && AppState.map && layer.getLatLng) {
              AppState.map.setView(layer.getLatLng(), 13, { animate: true, duration: 0.8 });
            }
          });
        }
      });
    } else if (cfg.type === 'mixed') {
      leafletLayer = L.geoJSON(geojson, {
        pointToLayer: (f, latlng) => {
          let style = { radius: 8, fillColor: cfg.color_point || '#f3bf57ff', color: 'rgba(0, 0, 0, 0.3)', weight: 0.7, opacity: 1, fillOpacity: 0.9, pane: 'panePoints' };
          if (cfg.styleConfig) {
             const s = getChoroplethStyle(f, layerId);
             style.fillColor = s.fillColor;
          }
          return L.circleMarker(latlng, style);
        },
        style: (f) => {
          if (f.geometry.type.includes('Line')) {
            let color = cfg.color_line || '#e4cd5dff';
            if (cfg.styleConfig) {
               color = getChoroplethStyle(f, layerId).fillColor;
            }
            return { color: color, weight: 3, opacity: 0.8, pane: 'paneLines' };
          }
          return { color: cfg.color || '#ccc', weight: 1, fillOpacity: 0.5, pane: 'panePolygonsTop' };
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopupHTML(feature, layerId), { maxWidth: 300 });
          layer.on('click', (e) => {
            showAttributePanel(feature, layerId);
            const zoomed = e.latlng ? zoomToMunicipalityByLatLng(e.latlng) : false;
            if (!zoomed && AppState.map && layer.getBounds) {
              AppState.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 13, animate: true, duration: 0.8 });
            } else if (!zoomed && AppState.map && layer.getLatLng) {
              AppState.map.setView(layer.getLatLng(), 13, { animate: true, duration: 0.8 });
            }
          });
        }
      });
    } else {
      leafletLayer = L.geoJSON(geojson, {
        style: (feature) => {
          if (cfg.styleConfig) {
            return getChoroplethStyle(feature, layerId);
          }
          return getLayerStyle(layerId);
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopupHTML(feature, layerId), { maxWidth: 300 });
          layer.on('click', (e) => {
            showAttributePanel(feature, layerId);
            const zoomed = e.latlng ? zoomToMunicipalityByLatLng(e.latlng) : false;
            if (!zoomed && AppState.map && layer.getBounds) {
              AppState.map.fitBounds(layer.getBounds(), { padding: [20, 20], maxZoom: 13, animate: true, duration: 0.8 });
            } else if (!zoomed && AppState.map && layer.getLatLng) {
              AppState.map.setView(layer.getLatLng(), 13, { animate: true, duration: 0.8 });
            }
          });
          layer.on('mouseover', function () {
            if (cfg.type === 'polygon') this.setStyle({ fillOpacity: 0.9, weight: 1.5 });
          });
          layer.on('mouseout', function () { leafletLayer.resetStyle(this); });
        }
      });
    }
  }

  leafletLayer.addTo(AppState.map);
  AppState.activeLayers[layerId] = leafletLayer;
  updateLegend();
  updateSimbologiaPanel(); // Actualizar el nuevo panel derecho
  updateActiveLayerCount();
  showMetadata(layerId);
}
function removeLayer(layerId) {
  if (!AppState.activeLayers[layerId]) return;
  AppState.map.removeLayer(AppState.activeLayers[layerId]);
  delete AppState.activeLayers[layerId];
  if (layerId === 'crecimiento_urbano') {
    document.getElementById('crecimiento-controls').style.display = 'none';
  }
  updateLegend();
  updateSimbologiaPanel(); // Actualizar el nuevo panel derecho
  updateActiveLayerCount();
}

function updateLegend() {
  // Mantener la leyenda pequeña del sidebar si es necesaria, 
  // pero el contenido principal ahora va al panel derecho.
}

function updateSimbologiaPanel() {
  const container = document.getElementById('legend-container');
  const empty = document.getElementById('info-empty');
  const activeIds = Object.keys(AppState.activeLayers);

  if (activeIds.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  container.classList.remove('hidden');
  
  // Renderizar leyendas de forma inversa (la última activada arriba)
  container.innerHTML = activeIds.reverse().map(id => renderLayerLegend(id)).join('');
}

function updateActiveLayerCount() {
  const n = Object.keys(AppState.activeLayers).length;
  const pill = document.getElementById('active-layers-pill');
  const cnt = document.getElementById('pill-count');
  cnt.textContent = n;
  pill.style.display = n > 0 ? 'flex' : 'none';
}

function showMetadata(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const meta = cfg.metadata;
  document.getElementById('meta-empty').classList.add('hidden');
  document.getElementById('metadata-content').classList.remove('hidden');
  document.getElementById('meta-title').textContent = cfg.name;
  const moduleLabels = { ambiental: 'NOM-003-SEDATU', sociedad: 'INEGI · CONAPO', infraestructura: 'NOM-001 & 002-SEDATU', aptitud: 'NOM-005-SEDATU' };
  document.getElementById('meta-body').innerHTML = Object.entries(meta).map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join('');
  document.getElementById('meta-norm').innerHTML = `<strong>Marco normativo:</strong> ${moduleLabels[cfg.module]} · Propuesta de Geointeligencia para la Equidad Territorial, Campeche 2024.`;
}

function generateMockGeoJSON(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const features = [];
  if (cfg.type === 'point') {
    const pts = [[19.83, -90.53], [18.65, -91.82], [19.35, -90.72], [18.92, -90.15], [19.08, -90.99], [19.62, -90.38]];
    pts.forEach((p, i) => { features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [p[1], p[0]] }, properties: { nombre: `${cfg.name} ${i + 1}`, municipio: ['Campeche', 'Carmen', 'Champotón', 'Escárcega', 'Hopelchén', 'Calkiní'][i], valor_idx: (Math.random() * 100).toFixed(1) } }); });
  } else if (cfg.type === 'line') {
    const lines = [[[19.83, -90.53], [19.62, -90.38], [19.35, -90.72]], [[18.65, -91.82], [18.92, -90.15], [19.08, -90.99]]];
    lines.forEach((coords, i) => { features.push({ type: 'Feature', geometry: { type: 'LineString', coordinates: coords.map(c => [c[1], c[0]]) }, properties: { nombre: `${cfg.name} ${i + 1}`, longitud_km: (Math.random() * 150 + 20).toFixed(1) } }); });
  } else {
    const polygons = [{ name: 'Campeche', coords: [[19.6, -90.8], [20.1, -90.8], [20.1, -90.0], [19.6, -90.0], [19.6, -90.8]] }, { name: 'Carmen', coords: [[18.4, -91.9], [18.4, -91.3], [18.9, -91.3], [18.9, -91.9], [18.4, -91.9]] }, { name: 'Champotón', coords: [[19.0, -90.7], [19.5, -90.7], [19.5, -90.2], [19.0, -90.2], [19.0, -90.7]] }, { name: 'Hopelchén', coords: [[19.7, -89.8], [20.2, -89.8], [20.2, -89.2], [19.7, -89.2], [19.7, -89.8]] }];
    polygons.forEach((p, i) => { features.push({ type: 'Feature', geometry: { type: 'Polygon', coordinates: [p.coords.map(c => [c[1], c[0]])] }, properties: { municipio: p.name, valor_idx: (Math.random() * 100).toFixed(1) } }); });
  }
  return { type: 'FeatureCollection', features };
}

async function loadRealGeoJSON(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  let targetFiles = cfg.file;
  
  if (cfg.scale_type === 'multi') {
    targetFiles = AppState.analysisScale === 'estatal' ? cfg.file_estatal : cfg.file_municipal;
  }

  // Convertir a array si no lo es
  if (!Array.isArray(targetFiles)) targetFiles = [targetFiles];

  try {
    const results = await Promise.all(targetFiles.map(async (file) => {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`HTTP ${res.status} - No se pudo encontrar el archivo ${file}`);
      const data = await res.json();
      
      // Inyectar etiqueta de origen si se solicita
      if (cfg.multi_file_tag) {
         const fileName = file.split('/').pop().replace('.geojson', '');
         let tagName = fileName;
         // Mapeo específico para Salud
         if (layerId === 'equipamiento_salud') {
           tagName = fileName === 'salud_pub' ? 'Equipamiento de Salud Publico' : 'Equipamiento de Salud Privado';
         } else if (layerId === 'cobertura_electrica') {
           tagName = fileName === 'Linea_trans' ? 'Red eléctrica' : 'Subestaciones';
         }
         (data.features || []).forEach(f => {
           f.properties = f.properties || {};
           f.properties[cfg.multi_file_tag] = tagName;
         });
      }
      return data.features || [];
    }));

    const allFeatures = results.flat();
    const data = { type: 'FeatureCollection', features: allFeatures };

    // Limpieza de propiedades para liberar memoria
    if (data.features) {
      const sCfg = cfg.styleConfig || {};
      const col = sCfg.column || sCfg.column_estatal || sCfg.column_municipal || null;
      data.features.forEach(f => {
        const p = f.properties || {};
        const clean = {};
        // Solo conservamos lo estrictamente necesario
        const keep = ['NOMGEO', 'nombre', 'municipio', 'NOM_ENT', 'layer', 'ues', 'DESCRIPCIO', 'DESCRIPCI', 'descripcion', 'nom_comerc', col].filter(Boolean);
        keep.forEach(k => { if (p.hasOwnProperty(k)) clean[k] = p[k]; });
        f.properties = clean;
      });
    }
    return data;
  } catch (err) {
    console.error(`Error cargando capas:`, err);
    showToast(`Error: No se pudo cargar la capa ${cfg.name}.`);
    // Fallback opcional a mock data para propósitos de demo si el archivo no existe
    return generateMockGeoJSON(layerId);
  }
}

function updateClippedMask() {
  if (!AppState.stateBoundary || !AppState.map) return;
  const maskPath = document.getElementById('mask-path');
  if (!maskPath) return;

  let d = "";
  const processPolygon = (coords) => {
    let path = "";
    coords.forEach((ring) => {
      const points = ring.map(coord => {
        const pt = AppState.map.latLngToLayerPoint([coord[1], coord[0]]);
        return `${pt.x},${pt.y}`;
      });
      path += " M " + points.join(" L ") + " Z ";
    });
    return path;
  };

  AppState.stateBoundary.features.forEach(feature => {
    const geom = feature.geometry;
    if (geom.type === "Polygon") {
      d += processPolygon(geom.coordinates);
    } else if (geom.type === "MultiPolygon") {
      geom.coordinates.forEach(poly => {
        d += processPolygon(poly);
      });
    }
  });

  maskPath.setAttribute('d', d);
}

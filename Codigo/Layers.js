/* ═══════════════════════════════════════════════════════════
   Layers.js - Configuración de Capas y Lógica de Mapa
   ════════════════════════════════════════════════════════ */

const USO_SUELO_COLORS = {
  'Habitacional Baja Densidad (H-b)': '#e6e215ff',
  'Habitacional Mixto Media Densidad (HM-m)': '#FFCC80',
  'Equipamiento (E)': '#116db9ff',
  'Mixto Especializado (M)': '#c46e28ff',
  'Deporte, Recreación y Área Verde (AV)': '#00ff08ff'
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
    return INDICATOR_STYLES.grades[val] || '#ccc';
  }
  
  const bins = cfg.bins || [0, 10, 50, 100, 500];
  const colors = INDICATOR_STYLES.ramps[cfg.ramp] || INDICATOR_STYLES.ramps.Purples;
  
  for (let i = bins.length - 1; i >= 0; i--) {
    if (val >= bins[i]) return colors[i] || colors[colors.length - 1];
  }
  return colors[0];
}

function getChoroplethStyle(feature, layerId) {
  const cfg = LAYER_CONFIG[layerId];
  if (!cfg.styleConfig) return getLayerStyle(layerId);
  
  const prop = cfg.styleConfig.column;
  const val = feature.properties[prop];
  const fillColor = getChoroplethColor(val, cfg.styleConfig);
  
  return {
    fillColor: fillColor,
    fillOpacity: 0.8,
    weight: 0,
    opacity: 0,
    pane: 'panePolygons'
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

  if (cfg.styleConfig) {
    if (cfg.styleConfig.type === 'categorical') {
      Object.entries(INDICATOR_STYLES.grades).forEach(([label, color]) => {
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background:${color}"></div>
            <div class="legend-label">${label}</div>
          </div>`;
      });
    } else {
      const bins = cfg.styleConfig.bins || [0, 10, 50, 100, 500];
      const colors = INDICATOR_STYLES.ramps[cfg.styleConfig.ramp] || INDICATOR_STYLES.ramps.Purples;
      bins.forEach((bin, i) => {
        const nextBin = bins[i + 1] ? `– ${bins[i + 1]}` : '+';
        legendHTML += `
          <div class="legend-item">
            <div class="legend-color" style="background:${colors[i]}"></div>
            <div class="legend-label">${bin} ${nextBin}</div>
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
    color: '#1565C0',
    file: 'Datos/Ambiental/Inundacion.geojson',
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
  deslizamiento: {
    name: 'Deslizamientos',
    module: 'ambiental',
    color: '#BF360C',
    file: 'Datos/deslizamiento.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'SGM · CENAPRED',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Susceptibilidad territorial a movimientos de masa y deslizamientos.',
      'Atributos clave': 'susceptibilidad, litologia, pendiente_grados'
    }
  },
  sequia: {
    name: 'Índice de Sequía',
    module: 'ambiental',
    color: '#F57F17',
    file: 'Datos/sequia.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'SMN · CONAGUA',
      'Fecha': '2022–2023',
      'Escala': 'Municipal',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Monitor de sequía mensual. Clasifica el territorio en D0–D4.',
      'Atributos clave': 'categoria_sequia, spi_3m, spi_6m'
    }
  },
  anp: {
    name: 'Áreas Naturales Protegidas',
    module: 'ambiental',
    color: '#216e24ff',
    file: 'Datos/Ambiental/anp.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'CONANP',
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
    file: 'Datos/Ambiental/Cobertura/tiles/{z}/{x}/{y}.png',
    type: 'tile',
    metadata: {
      'Fuente': 'INEGI · Procesado MBTiles',
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
    file: 'Datos/cuerpos_agua.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'CONAGUA · INEGI',
      'Fecha': '2023',
      'Escala': '1:250,000',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Lagos, lagunas, ríos y embalses del estado.',
      'Atributos clave': 'nombre, tipo, subcuenca'
    }
  },
  vulnerabilidad_ambiental: {
    name: 'Índice de Vulnerabilidad Ambiental',
    module: 'ambiental',
    color: '#AD1457',
    file: 'Datos/vulnerabilidad_ambiental.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'Elaboración propia · Modelado multicriterio',
      'Fecha': '2024',
      'Escala': 'Municipal',
      'Normativa': 'NOM-003-SEDATU-2017',
      'Descripción': 'Índice compuesto que integra exposición a inundación, sequía y degradación ecosistémica.',
      'Atributos clave': 'iva_score, categoria, municipio'
    }
  },
  temperatura: {
    name: 'Temperatura',
    module: 'ambiental',
    color: '#FF5722',
    file: 'Datos/Ambiental/Temp/{z}/{x}/{y}.png',
    type: 'tile',
    metadata: {
      'Fuente': 'Elaboración propia · Análisis de Islas de Calor',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'DENS_HAB_x', ramp: 'Purples', bins: [0, 10, 50, 150, 300] },
    fuente_url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'INDI1', ramp: 'Greens', bins: [0, 5, 20, 50, 100] },
    fuente_url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'POB24', ramp: 'Oranges', bins: [0, 10, 30, 70, 150] },
    fuente_url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'POB8', ramp: 'Blues', bins: [0, 50, 150, 300, 600] },
    fuente_url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
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
    color: '#5D4037',
    file: 'Datos/Sociedad/Loc_rur.geojson',
    type: 'point',
    metadata: {
      'Fuente': 'INEGI',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'G_INDICE', type: 'categorical' },
    fuente_url: 'https://www.gob.mx/conapo/acciones-y-programas/indices-de-marginacion-2020-284372',
    metadata: {
      'Fuente': 'CONAPO · 2020',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'g_socioeco', type: 'categorical' },
    fuente_url: 'https://www.coneval.org.mx/Medicion/MP/Paginas/Pobreza_Municipal_2020.aspx',
    metadata: {
      'Fuente': 'CONEVAL · 2022',
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
    file: 'Datos/Sociedad/Indicadores.geojson',
    type: 'polygon',
    styleConfig: { column: 'DISC1', ramp: 'Teals', bins: [0, 5, 20, 50, 100] },
    fuente_url: 'https://www.inegi.org.mx/programas/ccpv/2020/',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'CONADIS',
      'Descripción': 'Población con alguna limitación o discapacidad declarada.',
      'Atributos clave': 'DISC1, POBTOT'
    }
  },
  jefatura_femenina: {
    name: 'Jefatura de Hogar Femenina',
    module: 'sociedad',
    color: '#6A1B9A',
    file: 'Datos/jefatura_femenina.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'INEGI · Censo 2020',
      'Fecha': '2020',
      'Escala': 'AGEB',
      'Normativa': 'INMUJERES',
      'Descripción': 'Proporción de hogares con jefatura femenina. Indicador de vulnerabilidad de género.',
      'Atributos clave': 'phog_jef_f, pct_jef_f, tot_hogares'
    }
  },
  equipamiento_cuidados: {
    name: 'Equipamiento de Cuidados',
    module: 'sociedad',
    color: '#00695C',
    file: 'Datos/equipamiento_cuidados.geojson',
    type: 'point',
    metadata: {
      'Fuente': 'DENUE · IMSS · DIF',
      'Fecha': '2023',
      'Escala': '1:10,000',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Ubicación de guarderías, estancias infantiles, centros de día para adultos mayores y DIF.',
      'Atributos clave': 'nombre, tipo, capacidad, horario, municipio'
    }
  },

  /* ── MÓDULO III: Infraestructura ── */
  red_vial: {
    name: 'Red Vial Principal',
    module: 'infraestructura',
    color: '#6b1515ff',
    file: 'Datos/Infraestructura/Red_vial.geojson',
    type: 'line',
    metadata: {
      'Fuente': 'SCT · INEGI',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Red de carreteras federales, estatales y caminos rurales clasificados por orden vial.',
      'Atributos clave': 'tipo_vial, longitud_km, estado_fis'
    }
  },
  transporte_publico: {
    name: 'Rutas de Transporte Público',
    module: 'infraestructura',
    color: '#0D47A1',
    file: 'Datos/transporte_publico.geojson',
    type: 'line',
    metadata: {
      'Fuente': 'Gobierno del Estado · Municipios',
      'Fecha': '2023',
      'Escala': '1:25,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Trayectos de rutas de transporte público urbano y suburbano.',
      'Atributos clave': 'num_ruta, concesionario, frecuencia, municipio'
    }
  },
  accesibilidad: {
    name: 'Índice de Accesibilidad',
    module: 'infraestructura',
    color: '#E91E63',
    file: 'Datos/accesibilidad.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'Elaboración propia · isocronas de tiempo',
      'Fecha': '2024',
      'Escala': 'AGEB',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Tiempo de traslado en minutos al servicio urbano más cercano (hospital, escuela, mercado).',
      'Atributos clave': 'min_acceso, categoria, tipo_servicio'
    }
  },
  cobertura_agua: {
    name: 'Cobertura de Agua Potable',
    module: 'infraestructura',
    color: '#1565C0',
    file: 'Datos/cobertura_agua.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'CONAGUA · INEGI Censo 2020',
      'Fecha': '2020',
      'Escala': 'Localidad',
      'Normativa': 'NOM-001-SEDATU · NOM-127-SSA',
      'Descripción': 'Porcentaje de viviendas con acceso a agua entubada dentro de la vivienda.',
      'Atributos clave': 'vph_aguadv, pct_cobertura'
    }
  },
  cobertura_saneamiento: {
    name: 'Cobertura de Saneamiento',
    module: 'infraestructura',
    color: '#558B2F',
    file: 'Datos/cobertura_saneamiento.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'CONAGUA · INEGI Censo 2020',
      'Fecha': '2020',
      'Escala': 'Localidad',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Cobertura de drenaje y alcantarillado. Porcentaje de viviendas conectadas.',
      'Atributos clave': 'vph_drenaj, pct_drenaje'
    }
  },
  conectividad_digital: {
    name: 'Conectividad Digital',
    module: 'infraestructura',
    color: '#F57F17',
    file: 'Datos/conectividad_digital.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'IFT · INEGI Censo 2020',
      'Fecha': '2020–2023',
      'Escala': 'Localidad · AGEB',
      'Normativa': 'NOM-001-SEDATU',
      'Descripción': 'Penetración de internet en hogares y cobertura de red móvil.',
      'Atributos clave': 'vph_inter, pct_internet, cobertura_4g'
    }
  },
  equipamiento_salud: {
    name: 'Equipamiento de Salud',
    module: 'infraestructura',
    color: '#C62828',
    file: 'Datos/equipamiento_salud.geojson',
    type: 'point',
    metadata: {
      'Fuente': 'CLUES · SINAIS · SSA',
      'Fecha': '2023',
      'Escala': '1:10,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Hospitales, clínicas, consultorios y unidades de salud georreferenciados.',
      'Atributos clave': 'nombre, nivel_atencion, clues, camas, municipio'
    }
  },
  equipamiento_educacion: {
    name: 'Equipamiento Educativo',
    module: 'infraestructura',
    color: '#1A237E',
    file: 'Datos/equipamiento_educacion.geojson',
    type: 'point',
    metadata: {
      'Fuente': '911 SEP · DENUE',
      'Fecha': '2023',
      'Escala': '1:10,000',
      'Normativa': 'NOM-001-SEDATU · NOM-002-SEDATU',
      'Descripción': 'Escuelas de todos los niveles educativos: preescolar, primaria, secundaria, media superior y superior.',
      'Atributos clave': 'nombre, nivel, cct, alumnos, municipio'
    }
  },

  /* ── MÓDULO IV: Aptitud ── */
  uso_suelo: {
    name: 'Uso de Suelo y Vegetación',
    module: 'aptitud',
    color: '#33691E',
    file: 'Datos/Aptitud/manzanas.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'INEGI · Serie VII',
      'Fecha': '2021',
      'Escala': '1:250,000',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Clasificación de uso de suelo y tipos de vegetación según la serie más reciente de INEGI.',
      'Atributos clave': 'clave_usv, descripcion, superficie_ha'
    }
  },
  aptitud_urbana: {
    name: 'Aptitud para Desarrollo Urbano',
    module: 'aptitud',
    color: '#BF360C',
    file: 'Datos/aptitud_urbana.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'Elaboración propia · Modelado multicriterio',
      'Fecha': '2024',
      'Escala': '1:50,000',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Índice de aptitud para uso urbano con base en pendiente, riesgo, infraestructura y tenencia.',
      'Atributos clave': 'iau_score, categoria, restricciones'
    }
  },
  aptitud_agricola: {
    name: 'Aptitud Agrícola',
    module: 'aptitud',
    color: '#827717',
    file: 'Datos/aptitud_agricola.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'SIAP · INIFAP · INEGI',
      'Fecha': '2022',
      'Escala': '1:250,000',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Capacidad productiva agrícola del suelo por tipo y calidad edafológica.',
      'Atributos clave': 'clase_cap, unidad_suelo, lim_uso'
    }
  },
  restricciones: {
    name: 'Restricciones al Desarrollo',
    module: 'aptitud',
    color: '#880E4F',
    file: 'Datos/restricciones.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'SEMARNAT · CONANP · RAN',
      'Fecha': '2023',
      'Escala': '1:50,000',
      'Normativa': 'NOM-005-SEDATU · LGEEPA',
      'Descripción': 'Zonas de restricción: ANP, zonas federales, bienes comunales, derechos de vía.',
      'Atributos clave': 'tipo_rest, fundamento, superficie_ha'
    }
  },
  actividad_economica: {
    name: 'Actividad Económica Dominante',
    module: 'aptitud',
    color: '#C4973A',
    file: 'Datos/actividad_economica.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'DENUE · INEGI · SIEM',
      'Fecha': '2023',
      'Escala': 'Municipal · AGEB',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Actividad económica dominante por sector (primario, secundario, terciario) según SCIAN.',
      'Atributos clave': 'sector_dom, pct_empleo, num_unidades, municipio'
    }
  },
  zonas_industriales: {
    name: 'Zonas Industriales',
    module: 'aptitud',
    color: '#455A64',
    file: 'Datos/zonas_industriales.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'SEDECO · INEGI',
      'Fecha': '2023',
      'Escala': '1:25,000',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Parques, corredores y zonas industriales delimitadas en el estado.',
      'Atributos clave': 'nombre, tipo, superficie_ha, ha_disponibles'
    }
  },
  indice_aptitud: {
    name: 'Índice de Aptitud Compuesto',
    module: 'aptitud',
    color: '#C4973A',
    file: 'Datos/indice_aptitud.geojson',
    type: 'polygon',
    metadata: {
      'Fuente': 'Elaboración propia · Multicriterio ponderado',
      'Fecha': '2024',
      'Escala': 'Municipal',
      'Normativa': 'NOM-005-SEDATU',
      'Descripción': 'Integración de aptitud urbana, agrícola, ambiental y económica en un índice de ordenamiento.',
      'Atributos clave': 'iac_score, vocacion_primaria, vocacion_secundaria, municipio'
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
    preferCanvas: true
  });

  // ── Paneles de Jerarquía ──
  AppState.map.createPane('panePolygons');
  AppState.map.getPane('panePolygons').style.zIndex = 400;
  AppState.map.createPane('paneLines');
  AppState.map.getPane('paneLines').style.zIndex = 500;
  AppState.map.createPane('panePoints');
  AppState.map.getPane('panePoints').style.zIndex = 600;
  
  // ── Panel Municipal (Prioridad de Interacción) ──
  AppState.map.createPane('paneMunicipal');
  AppState.map.getPane('paneMunicipal').style.zIndex = 350;
  
  // ── Panel con Recorte (Clipping) ──
  AppState.map.createPane('paneClipped');
  AppState.map.getPane('paneClipped').style.zIndex = 450;
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
    // ── Límite Estatal para el Recorte ──
    const resEst = await fetch('Datos/Lim_Est.geojson');
    if (resEst.ok) {
      AppState.stateBoundary = await resEst.json();
      updateClippedMask(); // Inicializar máscara
    }

    // ── División Municipal (borde + polígono) ──
    const resMun = await fetch('Datos/Lim_Mun.geojson');
    if (resMun.ok) {
      const dataMun = await resMun.json();
      let hoverTimer = null;

      AppState.layerMunicipal = L.geoJSON(dataMun, {
        style: {
          color: '#161616ff', // Dorado institucional para los bordes
          weight: 1.5,
          opacity: 0.8,
          fillColor: 'transparent',
          fillOpacity: 0,
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
        }
      }).addTo(AppState.map);
    }
  } catch (err) {
    console.warn('Error cargando capas base:', err);
  }
}

function getLayerStyle(layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const color = cfg.color;
  const pane = cfg.type === 'polygon' ? 'panePolygons' : (cfg.type === 'line' ? 'paneLines' : 'overlayPane');
  
  if (cfg.type === 'polygon') return { color, fillColor: color, fillOpacity: 0.35, weight: 1.5, opacity: 0.8, pane };
  if (cfg.type === 'line') return { color, weight: 2.5, opacity: 0.85, pane };
  return { pane };
}

function buildPopupHTML(feature, layerId) {
  const cfg = LAYER_CONFIG[layerId];
  const props = feature.properties || {};
  const keys = Object.keys(props).slice(0, 8);
  const rows = keys.map(k => `
    <div class="geo-popup__row">
      <span class="geo-popup__key">${k.replace(/_/g, ' ')}</span>
      <span class="geo-popup__val">${props[k] !== null && props[k] !== undefined ? props[k] : '—'}</span>
    </div>`).join('');
  return `<div class="geo-popup"><div class="geo-popup__header"><h4>${props.nombre || props.municipio || cfg.name}</h4><span>${cfg.module.toUpperCase()} · ${cfg.name}</span></div><div class="geo-popup__body">${rows}</div></div>`;
}

async function addLayer(layerId) {
  if (AppState.activeLayers[layerId]) return;
  const cfg = LAYER_CONFIG[layerId];
  
  showToast(`Cargando capa: ${cfg.name}...`);
  
  let leafletLayer;

  if (cfg.type === 'tile') {
    leafletLayer = L.tileLayer(cfg.file, {
      minZoom: 8,
      maxZoom: 18,
      minNativeZoom: 11,
      maxNativeZoom: 14,
      opacity: 0.7,
      attribution: cfg.metadata['Fuente'],
      pane: cfg.pane || 'tilePane'
    });
  } else if (cfg.type === 'mbtiles') {
    if (typeof L.tileLayer.mbTiles === 'function') {
      leafletLayer = L.tileLayer.mbTiles(cfg.file, {
        minZoom: 8,
        maxZoom: 18,
        minNativeZoom: 11,
        maxNativeZoom: 14,
        opacity: 0.8,
        attribution: cfg.metadata['Fuente'] || '',
        pane: cfg.pane || 'tilePane'
      });
      leafletLayer.on('databaseloaded', function (ev) {
        console.log('MBTiles cargado exitosamente:', cfg.file);
      });
      leafletLayer.on('databaseerror', function (ev) {
        console.warn('Error leyendo MBTiles:', ev);
        showToast('Error al cargar la base de datos MBTiles');
      });
    } else {
      console.error('El plugin Leaflet.TileLayer.MBTiles no está disponible.');
      throw new Error('Plugin MBTiles no encontrado.');
    }
  } else {
    const geojson = await loadRealGeoJSON(layerId);

    if (layerId === 'crecimiento_urbano') {
      const ctrls = document.getElementById('crecimiento-controls');
      ctrls.style.display = 'block';
      const sliderBase = document.getElementById('slider-base');
      const sliderFinal = document.getElementById('slider-final');
      const lblBase = document.getElementById('label-base');
      const lblFinal = document.getElementById('label-final');

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

        lblBase.textContent = yBase;
        lblFinal.textContent = yFinal;

        leafletLayer.clearLayers();
        const featuresFinal = geojson.features.filter(f => f.properties.layer == yFinal);
        const featuresBase = geojson.features.filter(f => f.properties.layer == yBase);

        if (featuresFinal.length > 0) {
          L.geoJSON({ type: 'FeatureCollection', features: featuresFinal }, {
            style: { color: '#B0B0B0', fillColor: '#B0B0B0', fillOpacity: 0.7, weight: 1, pane: 'panePolygons' },
            onEachFeature: (f, l) => {
              l.bindPopup(buildPopupHTML(f, layerId), { maxWidth: 300 });
              l.on('click', () => showAttributePanel(f, layerId));
            }
          }).addTo(leafletLayer);
        }

        if (featuresBase.length > 0) {
          L.geoJSON({ type: 'FeatureCollection', features: featuresBase }, {
            style: { color: '#757575', fillColor: '#757575', fillOpacity: 0.9, weight: 1.5, pane: 'panePolygons' },
            onEachFeature: (f, l) => {
              l.bindPopup(buildPopupHTML(f, layerId), { maxWidth: 300 });
              l.on('click', () => showAttributePanel(f, layerId));
            }
          }).addTo(leafletLayer);
        }
      };

      renderCrecimiento();
      sliderBase.oninput = renderCrecimiento;
      sliderFinal.oninput = renderCrecimiento;

    } else if (cfg.type === 'point') {
      leafletLayer = L.geoJSON(geojson, {
        pointToLayer: (f, latlng) => L.circleMarker(latlng, {
          radius: 7,
          fillColor: cfg.color,
          color: '#fff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
          pane: 'panePoints'
        }),
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopupHTML(feature, layerId), { maxWidth: 300 });
          layer.on('click', () => showAttributePanel(feature, layerId));
        }
      });
    } else {
      leafletLayer = L.geoJSON(geojson, {
        style: (feature) => {
          if (layerId === 'uso_suelo') {
            const ues = feature.properties.ues;
            const color = USO_SUELO_COLORS[ues] || cfg.color;
            return { fillColor: color, fillOpacity: 0.7, weight: 0, opacity: 0, pane: 'panePolygons' };
          }
          if (cfg.styleConfig) {
            return getChoroplethStyle(feature, layerId);
          }
          return getLayerStyle(layerId);
        },
        onEachFeature: (feature, layer) => {
          layer.bindPopup(buildPopupHTML(feature, layerId), { maxWidth: 300 });
          layer.on('click', () => showAttributePanel(feature, layerId));
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
  try {
    const res = await fetch(cfg.file);
    if (!res.ok) throw new Error(`HTTP ${res.status} - No se pudo encontrar el archivo ${cfg.file}`);
    return await res.json();
  } catch (err) {
    console.error(`Error cargando ${cfg.file}:`, err);
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
        const pt = AppState.map.latLngToContainerPoint([coord[1], coord[0]]);
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

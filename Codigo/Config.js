/* ═══════════════════════════════════════════════════════════
   GEOINTELIGENCIA · EQUIDAD TERRITORIAL
   Config.js - Estado Global y Configuración Base
   ════════════════════════════════════════════════════════ */

'use strict';

/* ── ESTADO GLOBAL DE LA APLICACIÓN ── */
const AppState = {
  map: null,
  activeLayers: {},      // { layerId: L.geoJSON }
  activeModule: null,
  currentChart: null,
  selectedFeature: null,
  basemapIndex: 0,
  stateBoundary: null,   // Almacenará el GeoJSON de Lim_Est
  analysisScale: 'estatal', // 'estatal' (municipal polygons) o 'municipal' (manzana polygons)
  selectedDownloadFormat: 'geojson'
};

/* ── CONFIGURACIÓN DE INTERFAZ ── */
const UI_SETTINGS = {
  fixedMap: true,        // Evita que el mapa se mueva al abrir paneles (Overlay mode)
  solidPanels: true      // Fondos opacos para máxima legibilidad
};

/* ── MAPAS BASE ── */
const BASEMAPS = [
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  },
  {
    name: 'Esri Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri'
  }
];

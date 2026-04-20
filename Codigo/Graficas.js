/* ═══════════════════════════════════════════════════════════
   Graficas.js - Lógica de Visualización Analítica (Chart.js)
   ════════════════════════════════════════════════════════ */

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
  }
};

const CHART_DEFAULTS = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { labels: { color: '#9E8070', font: { family: 'DM Sans', size: 11 } } },
    tooltip: {
      backgroundColor: '#251018', borderColor: 'rgba(196,151,58,.3)', borderWidth: 1,
      titleColor: '#F5EDE0', bodyColor: '#9E8070', titleFont: { family: 'Cormorant Garamond', size: 14 }
    }
  },
  scales: {
    x: { ticks: { color: '#9E8070', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } },
    y: { ticks: { color: '#9E8070', font: { size: 10 } }, grid: { color: 'rgba(255,255,255,.05)' } }
  }
};

function renderChart(key) {
  const data = CHART_DATA[key];
  if (!data) return;
  if (AppState.currentChart) { AppState.currentChart.destroy(); AppState.currentChart = null; }
  const canvas = document.getElementById('main-chart');
  const ctx = canvas.getContext('2d');
  let type = data.type;
  let options = JSON.parse(JSON.stringify(CHART_DEFAULTS));
  if (type === 'horizontalBar') { type = 'bar'; options.indexAxis = 'y'; }
  if (type === 'doughnut' || type === 'radar') { delete options.scales; }
  AppState.currentChart = new Chart(ctx, { type, data: { labels: data.labels, datasets: data.datasets }, options: { ...options, plugins: { ...options.plugins } } });
  document.getElementById('chart-description').textContent = data.desc;
}

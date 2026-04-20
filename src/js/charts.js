import { Chart, registerables } from 'chart.js';
import { getRegionName } from '../utils/regions.js';

Chart.register(...registerables);

Chart.defaults.color = '#8d96aa';
Chart.defaults.borderColor = 'rgba(255, 255, 255, 0.07)';
Chart.defaults.font.family = "'Inter', system-ui, sans-serif";

const PALETTE = ['#22d3ee', '#a3e635', '#a78bfa', '#fbbf24', '#fb7185', '#34d399', '#60a5fa', '#f472b6', '#fcd34d', '#4ade80'];

const chartInstances = {};

export function renderCharts(leads) {
  renderTrend(leads);
  renderIndustry(leads);
  renderRegion(leads);
  renderStatus(leads);
}

function destroy(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function renderTrend(leads) {
  const ctx = document.getElementById('trendChart');
  if (!ctx) return;
  destroy('trend');

  const days = 30;
  const buckets = Array.from({ length: days }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (days - 1 - i));
    d.setHours(0, 0, 0, 0);
    return { date: d, count: 0 };
  });

  leads.forEach((l) => {
    const created = new Date(l.created_at);
    const b = buckets.find(
      (b) => b.date.toDateString() === new Date(created.toDateString()).toDateString()
    );
    if (b) b.count++;
  });

  chartInstances.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: buckets.map((b) => b.date.toLocaleDateString('fi-FI', { day: 'numeric', month: 'short' })),
      datasets: [{
        label: 'Uudet liidit',
        data: buckets.map((b) => b.count),
        borderColor: '#22d3ee',
        backgroundColor: 'rgba(34, 211, 238, 0.1)',
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointHoverRadius: 6,
        pointBackgroundColor: '#22d3ee',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxTicksLimit: 8 }, grid: { display: false } },
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function renderIndustry(leads) {
  const ctx = document.getElementById('industryChart');
  if (!ctx) return;
  destroy('industry');

  const counts = {};
  leads.forEach((l) => {
    const key = l.industry_label || 'Tuntematon';
    counts[key] = (counts[key] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);

  chartInstances.industry = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: entries.map(([k]) => shorten(k, 30)),
      datasets: [{
        data: entries.map(([, v]) => v),
        backgroundColor: PALETTE,
        borderColor: '#141820',
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } },
      },
      cutout: '62%',
    },
  });
}

function renderRegion(leads) {
  const ctx = document.getElementById('regionChart');
  if (!ctx) return;
  destroy('region');

  const counts = {};
  leads.forEach((l) => {
    const key = getRegionName(l.region) || 'Tuntematon';
    counts[key] = (counts[key] || 0) + 1;
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10);

  chartInstances.region = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: entries.map(([k]) => k),
      datasets: [{
        label: 'Liidit',
        data: entries.map(([, v]) => v),
        backgroundColor: 'rgba(163, 230, 53, 0.6)',
        borderColor: '#a3e635',
        borderWidth: 1,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: { legend: { display: false } },
      scales: {
        x: { beginAtZero: true, ticks: { precision: 0 } },
        y: { grid: { display: false } },
      },
    },
  });
}

function renderStatus(leads) {
  const ctx = document.getElementById('statusChart');
  if (!ctx) return;
  destroy('status');

  const labels = { new: 'Uusi', contacted: 'Yhteydenotettu', qualified: 'Karsittu', archived: 'Arkistoitu' };
  const counts = { new: 0, contacted: 0, qualified: 0, archived: 0 };
  leads.forEach((l) => {
    counts[l.status || 'new'] = (counts[l.status || 'new'] || 0) + 1;
  });

  chartInstances.status = new Chart(ctx, {
    type: 'polarArea',
    data: {
      labels: Object.values(labels),
      datasets: [{
        data: Object.keys(labels).map((k) => counts[k]),
        backgroundColor: ['rgba(34, 211, 238, 0.6)', 'rgba(251, 191, 36, 0.6)', 'rgba(52, 211, 153, 0.6)', 'rgba(141, 150, 170, 0.6)'],
        borderColor: ['#22d3ee', '#fbbf24', '#34d399', '#8d96aa'],
        borderWidth: 1,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'right', labels: { boxWidth: 12, padding: 10, font: { size: 11 } } } },
    },
  });
}

function shorten(s, n) {
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

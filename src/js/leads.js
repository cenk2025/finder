import { supabase } from '../utils/supabase.js';
import { getRegionName } from '../utils/regions.js';
import { toast } from '../utils/toast.js';
import { enrichLead, enrichBatch } from '../utils/enrichment.js';

let cachedLeads = [];
let currentUser = null;
let filterText = '';
let filterStatus = '';

const STATUS_LABELS = {
  new: 'Uusi',
  contacted: 'Yhteydenotettu',
  qualified: 'Karsittu',
  archived: 'Arkistoitu',
};

export function initLeads(user) {
  currentUser = user;

  document.getElementById('leadsSearch')?.addEventListener('input', (e) => {
    filterText = e.target.value.toLowerCase();
    render();
  });

  document.getElementById('leadsStatusFilter')?.addEventListener('change', (e) => {
    filterStatus = e.target.value;
    render();
  });

  document.getElementById('exportCsv')?.addEventListener('click', exportCsv);
  document.getElementById('enrichAll')?.addEventListener('click', handleEnrichAll);

  document.getElementById('drawerClose')?.addEventListener('click', closeDrawer);
}

export async function loadLeads() {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    toast('Liidien lataus epäonnistui', 'error');
    return [];
  }
  cachedLeads = data || [];
  render();
  return cachedLeads;
}

export function getCachedLeads() {
  return cachedLeads;
}

function render() {
  const container = document.getElementById('leadsTableContainer');
  if (!container) return;

  const filtered = cachedLeads.filter((l) => {
    if (filterStatus && l.status !== filterStatus) return false;
    if (!filterText) return true;
    const hay = `${l.business_name} ${l.city} ${l.industry_label} ${l.email || ''}`.toLowerCase();
    return hay.includes(filterText);
  });

  document.getElementById('leadsCount').textContent = `${filtered.length} / ${cachedLeads.length} liidiä`;

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Ei liidejä vielä</h4>
        <p>Aloita keruu valitsemalla "Uusi haku" sivupalkista.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="lead-table">
      <thead>
        <tr>
          <th>Yritys</th>
          <th>Kaupunki</th>
          <th>Toimiala</th>
          <th>Y-tunnus</th>
          <th>Sopivuus</th>
          <th>Status</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${filtered
          .map(
            (l) => `
          <tr data-id="${l.id}" style="cursor: pointer;">
            <td>
              <strong>${escapeHtml(l.business_name)}</strong>
              ${l.website ? `<div class="muted">${escapeHtml(l.website)}</div>` : ''}
            </td>
            <td>${escapeHtml(l.city || '—')}<div class="muted">${escapeHtml(l.postal_code || '')}</div></td>
            <td class="muted">${escapeHtml(l.industry_label || '—')}</td>
            <td class="muted">${escapeHtml(l.business_id || '—')}</td>
            <td><strong>${l.score ?? 0}</strong></td>
            <td><span class="badge badge-${l.status || 'new'}">${STATUS_LABELS[l.status] || 'Uusi'}</span></td>
            <td>→</td>
          </tr>`
          )
          .join('')}
      </tbody>
    </table>
  `;

  container.querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', () => openDrawer(tr.dataset.id));
  });
}

function openDrawer(id) {
  const lead = cachedLeads.find((l) => l.id === id);
  if (!lead) return;

  const drawer = document.getElementById('leadDrawer');
  const content = document.getElementById('drawerContent');

  const enrichedLabel = lead.enriched_at
    ? `Rikastettu ${new Date(lead.enriched_at).toLocaleDateString('fi-FI')}`
    : 'Ei vielä rikastettu';

  content.innerHTML = `
    <h3>${escapeHtml(lead.business_name)}</h3>
    <p class="meta">
      ${escapeHtml(lead.industry_label || '')} · ${getRegionName(lead.region)}
      · Sopivuus ${lead.score ?? 0} / 100
      · <span style="color: ${lead.enriched_at ? 'var(--green)' : 'var(--text-3)'};">${enrichedLabel}</span>
    </p>

    <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
      <button class="btn btn-secondary btn-sm" id="drawerEnrich">
        <span>✨</span> ${lead.enriched_at ? 'Rikastuta uudelleen' : 'Rikastuta (Google + web)'}
      </button>
      ${lead.google_maps_url ? `<a class="btn btn-ghost btn-sm" href="${escapeHtml(lead.google_maps_url)}" target="_blank" rel="noopener">Google Maps ↗</a>` : ''}
    </div>

    <div class="info-row"><span class="k">Y-tunnus</span><span class="v">${escapeHtml(lead.business_id) || '—'}</span></div>
    <div class="info-row"><span class="k">Osoite</span><span class="v">${escapeHtml(lead.address) || '—'}<br/>${escapeHtml(lead.postal_code || '')} ${escapeHtml(lead.city || '')}</span></div>
    <div class="info-row"><span class="k">Puhelin</span><span class="v">${lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Sähköposti</span><span class="v">${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Verkkosivu</span><span class="v">${lead.website ? `<a href="${escapeHtml(lead.website)}" target="_blank" rel="noopener">${escapeHtml(lead.website)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Google-arvio</span><span class="v">${lead.google_rating ? `⭐ ${lead.google_rating} (${lead.google_reviews_count || 0} arviota)` : '—'}</span></div>
    <div class="info-row"><span class="k">LinkedIn</span><span class="v">${lead.linkedin ? `<a href="${escapeHtml(lead.linkedin)}" target="_blank" rel="noopener">Profiili ↗</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Facebook</span><span class="v">${lead.facebook ? `<a href="${escapeHtml(lead.facebook)}" target="_blank" rel="noopener">Profiili ↗</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Instagram</span><span class="v">${lead.instagram ? `<a href="${escapeHtml(lead.instagram)}" target="_blank" rel="noopener">Profiili ↗</a>` : '—'}</span></div>

    <div class="form-group" style="margin-top: 1.5rem;">
      <label class="form-label" for="drawerStatus">Status</label>
      <select class="form-select" id="drawerStatus">
        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>Uusi</option>
        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Yhteydenotettu</option>
        <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Karsittu</option>
        <option value="archived" ${lead.status === 'archived' ? 'selected' : ''}>Arkistoitu</option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label" for="drawerNotes">Muistiinpanot</label>
      <textarea class="form-textarea" id="drawerNotes" rows="5" placeholder="Lisää omia havaintoja tai kontaktitietoja…">${escapeHtml(lead.notes || '')}</textarea>
    </div>

    <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
      <button class="btn btn-primary" id="drawerSave">Tallenna</button>
      <button class="btn btn-danger" id="drawerDelete">Poista liidi</button>
    </div>
  `;

  drawer.classList.add('open');

  document.getElementById('drawerEnrich').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Rikastutetaan…';
    try {
      const enrichment = await enrichLead(lead.id);
      Object.assign(lead, enrichment, { enriched_at: new Date().toISOString() });
      const idx = cachedLeads.findIndex((l) => l.id === lead.id);
      if (idx >= 0) cachedLeads[idx] = lead;
      render();
      openDrawer(lead.id);
      toast('Rikastus valmis', 'success');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = original;
      toast(err.message || 'Rikastus epäonnistui', 'error');
    }
  });

  document.getElementById('drawerSave').addEventListener('click', async () => {
    const notes = document.getElementById('drawerNotes').value;
    const status = document.getElementById('drawerStatus').value;
    const { error } = await supabase.from('leads').update({ notes, status }).eq('id', lead.id);
    if (error) return toast('Tallennus epäonnistui', 'error');
    lead.notes = notes;
    lead.status = status;
    render();
    toast('Tallennettu', 'success');
    closeDrawer();
  });

  document.getElementById('drawerDelete').addEventListener('click', async () => {
    if (!confirm(`Poista liidi "${lead.business_name}"?`)) return;
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) return toast('Poisto epäonnistui', 'error');
    cachedLeads = cachedLeads.filter((l) => l.id !== lead.id);
    render();
    toast('Liidi poistettu', 'success');
    closeDrawer();
  });
}

function closeDrawer() {
  document.getElementById('leadDrawer')?.classList.remove('open');
}

async function handleEnrichAll() {
  const unenriched = cachedLeads.filter((l) => !l.enriched_at);
  if (unenriched.length === 0) {
    toast('Kaikki liidit on jo rikastettu', 'info');
    return;
  }
  const topN = unenriched
    .slice()
    .sort((a, b) => (b.score || 0) - (a.score || 0))
    .slice(0, 10);

  if (!confirm(`Rikastuta ${topN.length} liidiä (Google Places + web)? Tämä voi kestää ~30 sekuntia.`)) return;

  const btn = document.getElementById('enrichAll');
  btn.disabled = true;
  const original = btn.innerHTML;

  try {
    const result = await enrichBatch(
      topN.map((l) => l.id),
      {
        concurrency: 3,
        onProgress: ({ done, total }) => {
          btn.innerHTML = `<span class="spinner"></span> ${done}/${total}`;
        },
      }
    );
    toast(`Rikastus valmis: ${result.ok} onnistui, ${result.failed} epäonnistui`, result.failed ? 'info' : 'success');
    await reloadAfterEnrich();
  } catch (err) {
    toast(err.message || 'Rikastus epäonnistui', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

async function reloadAfterEnrich() {
  const { data } = await supabase
    .from('leads')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });
  cachedLeads = data || [];
  render();
}

function exportCsv() {
  if (cachedLeads.length === 0) {
    toast('Ei liidejä vietäväksi', 'error');
    return;
  }
  const headers = [
    'Yritys', 'Y-tunnus', 'Toimiala', 'Osoite', 'Postinumero', 'Kaupunki', 'Maakunta',
    'Puhelin', 'Sähköposti', 'Verkkosivu', 'LinkedIn', 'Facebook', 'Instagram',
    'Google-arvio', 'Google-arviot', 'Google Maps', 'Sopivuus', 'Status', 'Muistiinpanot',
  ];
  const rows = cachedLeads.map((l) => [
    l.business_name, l.business_id, l.industry_label, l.address, l.postal_code, l.city,
    getRegionName(l.region), l.phone, l.email, l.website, l.linkedin, l.facebook, l.instagram,
    l.google_rating, l.google_reviews_count, l.google_maps_url,
    l.score, STATUS_LABELS[l.status] || l.status, l.notes,
  ].map(csvCell).join(','));
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `voon-liidit-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV ladattu', 'success');
}

function csvCell(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

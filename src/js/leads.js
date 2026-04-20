import { supabase } from '../utils/supabase.js';
import { getRegionName } from '../utils/regions.js';
import { toast } from '../utils/toast.js';

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

  content.innerHTML = `
    <h3>${escapeHtml(lead.business_name)}</h3>
    <p class="meta">
      ${escapeHtml(lead.industry_label || '')} · ${getRegionName(lead.region)}
      · Sopivuus ${lead.score ?? 0} / 100
    </p>

    <div class="info-row"><span class="k">Y-tunnus</span><span class="v">${escapeHtml(lead.business_id) || '—'}</span></div>
    <div class="info-row"><span class="k">Osoite</span><span class="v">${escapeHtml(lead.address) || '—'}<br/>${escapeHtml(lead.postal_code || '')} ${escapeHtml(lead.city || '')}</span></div>
    <div class="info-row"><span class="k">Puhelin</span><span class="v">${lead.phone ? `<a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(lead.phone)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Sähköposti</span><span class="v">${lead.email ? `<a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Verkkosivu</span><span class="v">${lead.website ? `<a href="${escapeHtml(lead.website)}" target="_blank" rel="noopener">${escapeHtml(lead.website)}</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">LinkedIn</span><span class="v">${lead.linkedin ? `<a href="${escapeHtml(lead.linkedin)}" target="_blank" rel="noopener">Profiili</a>` : '—'}</span></div>
    <div class="info-row"><span class="k">Facebook</span><span class="v">${lead.facebook || '—'}</span></div>
    <div class="info-row"><span class="k">Instagram</span><span class="v">${lead.instagram || '—'}</span></div>

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

function exportCsv() {
  if (cachedLeads.length === 0) {
    toast('Ei liidejä vietäväksi', 'error');
    return;
  }
  const headers = [
    'Yritys', 'Y-tunnus', 'Toimiala', 'Osoite', 'Postinumero', 'Kaupunki', 'Maakunta',
    'Puhelin', 'Sähköposti', 'Verkkosivu', 'LinkedIn', 'Facebook', 'Instagram',
    'Sopivuus', 'Status', 'Muistiinpanot',
  ];
  const rows = cachedLeads.map((l) => [
    l.business_name, l.business_id, l.industry_label, l.address, l.postal_code, l.city,
    getRegionName(l.region), l.phone, l.email, l.website, l.linkedin, l.facebook, l.instagram,
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

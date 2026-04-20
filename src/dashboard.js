import './styles/main.css';
import { supabase, requireAuth, signOut } from './utils/supabase.js';
import { getRegionName } from './utils/regions.js';
import { initSearch } from './js/search.js';
import { initLeads, loadLeads, getCachedLeads } from './js/leads.js';
import { renderCharts } from './js/charts.js';
import { toast } from './utils/toast.js';

let user = null;

document.addEventListener('DOMContentLoaded', async () => {
  user = await requireAuth();
  if (!user) return;

  await loadProfile();
  initNav();
  initSearch(user, refreshData);
  initLeads(user);
  initSettings();
  initMobileMenu();

  await refreshData();
});

async function loadProfile() {
  document.getElementById('userEmail').textContent = user.email;

  const { data } = await supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
  const companyName = data?.company_name || user.user_metadata?.company_name || 'Käyttäjä';
  document.getElementById('userCompany').textContent = companyName;
  document.getElementById('profileEmail').value = user.email;
  document.getElementById('profileCompany').value = companyName;

  // Upsert profile if missing
  if (!data) {
    await supabase.from('profiles').insert({ user_id: user.id, company_name: companyName });
  }
}

function initNav() {
  const buttons = document.querySelectorAll('[data-nav]');
  const pages = document.querySelectorAll('.page');

  const go = (target) => {
    buttons.forEach((b) => b.classList.toggle('active', b.dataset.nav === target));
    pages.forEach((p) => p.classList.toggle('active', p.dataset.page === target));
    // Close mobile sidebar
    document.getElementById('sidebar')?.classList.remove('open');
    // URL hash for deep linking
    history.replaceState(null, '', `#${target}`);
  };

  buttons.forEach((btn) => btn.addEventListener('click', () => go(btn.dataset.nav)));
  document.querySelectorAll('[data-nav-btn]').forEach((btn) => {
    btn.addEventListener('click', () => go(btn.dataset.navBtn));
  });

  // Deep-link via hash
  const hash = window.location.hash.slice(1);
  if (hash && document.querySelector(`[data-page="${hash}"]`)) go(hash);

  document.getElementById('logoutBtn')?.addEventListener('click', signOut);
  document.getElementById('logoutBtn2')?.addEventListener('click', signOut);
}

function initSettings() {
  document.getElementById('profileForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const company = document.getElementById('profileCompany').value.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ company_name: company })
      .eq('user_id', user.id);
    if (error) return toast('Tallennus epäonnistui', 'error');
    document.getElementById('userCompany').textContent = company;
    toast('Profiili päivitetty', 'success');
  });
}

function initMobileMenu() {
  document.getElementById('menuToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar')?.classList.toggle('open');
  });
}

async function refreshData() {
  const leads = await loadLeads();
  updateKpis(leads);
  renderCharts(leads);
  await renderHistory();
}

function updateKpis(leads) {
  const total = leads.length;
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const lastWeek = leads.filter((l) => new Date(l.created_at).getTime() >= weekAgo).length;
  const avgScore = total ? Math.round(leads.reduce((s, l) => s + (l.score || 0), 0) / total) : 0;

  document.getElementById('kpiTotal').textContent = total;
  document.getElementById('kpiWeek').textContent = lastWeek;
  document.getElementById('kpiScore').textContent = avgScore;

  document.getElementById('kpiTotalDelta').textContent = total > 0 ? `${lastWeek} uutta viikon aikana` : 'Ei vielä liidejä';
  document.getElementById('kpiWeekDelta').textContent = lastWeek > 0 ? 'Aktiivinen viikko' : 'Ei uusia tällä viikolla';
}

async function renderHistory() {
  const container = document.getElementById('historyContainer');
  if (!container) return;

  const { data } = await supabase
    .from('searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  document.getElementById('kpiSearches').textContent = data?.length || 0;

  if (!data || data.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>Ei hakuhistoriaa</h4>
        <p>Suorita ensimmäinen hakusi "Uusi haku" -sivulta.</p>
      </div>`;
    return;
  }

  container.innerHTML = `
    <table class="lead-table">
      <thead>
        <tr>
          <th>Päivämäärä</th>
          <th>Alue</th>
          <th>Toimiala</th>
          <th>Tulokset</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data
          .map((s) => {
            const d = new Date(s.created_at).toLocaleString('fi-FI', {
              day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });
            const statusLabels = {
              pending: 'Odottaa', running: 'Käynnissä', completed: 'Valmis', empty: 'Ei tuloksia',
            };
            return `
              <tr>
                <td>${d}</td>
                <td>${getRegionName(s.region) || '—'}</td>
                <td class="muted">${escapeHtml(s.industry_label || '—')}</td>
                <td><strong>${s.result_count}</strong></td>
                <td><span class="badge badge-${s.status === 'completed' ? 'qualified' : s.status === 'empty' ? 'archived' : 'new'}">${statusLabels[s.status] || s.status}</span></td>
              </tr>`;
          })
          .join('')}
      </tbody>
    </table>`;
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

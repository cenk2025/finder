import { supabase } from '../utils/supabase.js';
import { REGIONS, getRegionName } from '../utils/regions.js';
import { INDUSTRIES, TARGET_AUDIENCES, getIndustryLabel } from '../utils/industries.js';
import { searchCompanies, scoreLead } from '../utils/ytj.js';
import { toast } from '../utils/toast.js';

let currentUser = null;

export function initSearch(user, onComplete) {
  currentUser = user;
  populateSelects();
  const form = document.getElementById('searchForm');
  form?.addEventListener('submit', (e) => handleSearch(e, onComplete));
}

function populateSelects() {
  const regionSel = document.getElementById('searchRegion');
  const industrySel = document.getElementById('searchIndustry');
  const audienceSel = document.getElementById('searchAudience');

  if (regionSel && regionSel.options.length <= 1) {
    REGIONS.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.code;
      opt.textContent = r.name;
      regionSel.appendChild(opt);
    });
  }

  if (industrySel && industrySel.options.length <= 1) {
    // Group by category
    const byCat = INDUSTRIES.reduce((acc, i) => {
      (acc[i.category] = acc[i.category] || []).push(i);
      return acc;
    }, {});
    Object.entries(byCat).forEach(([cat, items]) => {
      const group = document.createElement('optgroup');
      group.label = cat;
      items.forEach((i) => {
        const opt = document.createElement('option');
        opt.value = i.code;
        opt.textContent = `${i.code} — ${i.label}`;
        group.appendChild(opt);
      });
      industrySel.appendChild(group);
    });
  }

  if (audienceSel && audienceSel.options.length <= 1) {
    TARGET_AUDIENCES.forEach((a) => {
      if (a.code === 'any') return;
      const opt = document.createElement('option');
      opt.value = a.code;
      opt.textContent = a.label;
      audienceSel.appendChild(opt);
    });
  }
}

async function handleSearch(e, onComplete) {
  e.preventDefault();
  const errEl = document.getElementById('searchError');
  const resultEl = document.getElementById('searchResult');
  const btn = document.getElementById('searchSubmit');
  errEl.textContent = '';
  resultEl.innerHTML = '';

  const region = document.getElementById('searchRegion').value;
  const industryCode = document.getElementById('searchIndustry').value;
  const audience = document.getElementById('searchAudience').value;
  const limit = parseInt(document.getElementById('searchLimit').value, 10) || 50;

  if (!region || !industryCode) {
    errEl.textContent = 'Valitse sekä alue että toimiala.';
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Haetaan liidejä…';

  try {
    // 1. Save search record
    const { data: searchRow, error: searchErr } = await supabase
      .from('searches')
      .insert({
        user_id: currentUser.id,
        region,
        industry_code: industryCode,
        industry_label: getIndustryLabel(industryCode),
        target_audience: audience,
        status: 'running',
      })
      .select()
      .single();

    if (searchErr) throw searchErr;

    // 2. Fetch from YTJ
    const rawLeads = await searchCompanies({ industryCode, region, limit });

    if (rawLeads.length === 0) {
      await supabase.from('searches').update({ status: 'empty', result_count: 0 }).eq('id', searchRow.id);
      resultEl.innerHTML = `
        <div class="card">
          <h4>Ei tuloksia</h4>
          <p style="color: var(--text-2); margin-top: 0.5rem;">
            Valitulla yhdistelmällä ei löytynyt yrityksiä. Kokeile toista aluetta tai toimialaa.
          </p>
        </div>`;
      return;
    }

    // 3. Score and persist leads
    const leadsToInsert = rawLeads.map((l) => ({
      ...l,
      user_id: currentUser.id,
      search_id: searchRow.id,
      region,
      score: scoreLead(l, audience),
    }));

    const { error: insertErr } = await supabase.from('leads').insert(leadsToInsert);
    if (insertErr) throw insertErr;

    await supabase
      .from('searches')
      .update({ status: 'completed', result_count: leadsToInsert.length })
      .eq('id', searchRow.id);

    resultEl.innerHTML = `
      <div class="card" style="border-color: var(--brand-border);">
        <h4>✓ Haku valmis — ${leadsToInsert.length} liidiä löytyi</h4>
        <p style="color: var(--text-2); margin: 0.5rem 0 1rem;">
          Alue: <strong style="color: var(--text);">${getRegionName(region)}</strong> ·
          Toimiala: <strong style="color: var(--text);">${getIndustryLabel(industryCode)}</strong>
        </p>
        <button class="btn btn-primary" data-nav-btn="leads">Näytä liidit →</button>
      </div>`;

    toast(`${leadsToInsert.length} uutta liidiä lisätty`, 'success');
    onComplete?.();
  } catch (err) {
    console.error(err);
    errEl.textContent = err.message || 'Haku epäonnistui.';
    toast('Haku epäonnistui', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>🔎</span> Kerää liidit';
  }
}

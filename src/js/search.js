import { supabase } from '../utils/supabase.js';
import { REGIONS, getRegionName } from '../utils/regions.js';
import { CATEGORIES, getCategoryByCode, scoreFromRating } from '../utils/categories.js';
import { toast } from '../utils/toast.js';

let currentUser = null;

export function initSearch(user, onComplete) {
  currentUser = user;
  populateSelects();
  document.getElementById('searchForm')?.addEventListener('submit', (e) => handleSearch(e, onComplete));
  document.getElementById('searchRegion')?.addEventListener('change', updateCityOptions);
}

function populateSelects() {
  const regionSel = document.getElementById('searchRegion');
  const categorySel = document.getElementById('searchCategory');

  if (regionSel && regionSel.options.length <= 1) {
    REGIONS.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.code;
      opt.textContent = r.name;
      regionSel.appendChild(opt);
    });
  }

  if (categorySel && categorySel.options.length <= 1) {
    const byGroup = CATEGORIES.reduce((acc, c) => {
      (acc[c.group] = acc[c.group] || []).push(c);
      return acc;
    }, {});
    Object.entries(byGroup).forEach(([group, items]) => {
      const og = document.createElement('optgroup');
      og.label = group;
      items.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.code;
        opt.textContent = c.label;
        og.appendChild(opt);
      });
      categorySel.appendChild(og);
    });
  }
}

function updateCityOptions() {
  const regionCode = document.getElementById('searchRegion').value;
  const citySel = document.getElementById('searchCity');
  if (!citySel) return;

  citySel.innerHTML = '<option value="">Koko maakunta</option>';

  if (!regionCode) {
    citySel.disabled = true;
    return;
  }

  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) {
    citySel.disabled = true;
    return;
  }

  region.cities.forEach((city) => {
    const opt = document.createElement('option');
    opt.value = city;
    opt.textContent = city;
    citySel.appendChild(opt);
  });
  citySel.disabled = false;
}

async function handleSearch(e, onComplete) {
  e.preventDefault();
  const errEl = document.getElementById('searchError');
  const resultEl = document.getElementById('searchResult');
  const btn = document.getElementById('searchSubmit');
  errEl.textContent = '';
  resultEl.innerHTML = '';

  const categoryCode = document.getElementById('searchCategory').value;
  const region = document.getElementById('searchRegion').value;
  const city = document.getElementById('searchCity').value;
  const limit = parseInt(document.getElementById('searchLimit').value, 10) || 40;

  if (!categoryCode || !region) {
    errEl.textContent = 'Valitse sekä toimiala että maakunta.';
    return;
  }

  const category = getCategoryByCode(categoryCode);
  if (!category) {
    errEl.textContent = 'Tuntematon toimiala.';
    return;
  }

  const regionName = getRegionName(region);
  const locationLabel = city || regionName;
  const queryTerm = category.queryHint || category.label;
  const query = `${queryTerm} ${locationLabel}`;

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> Haetaan liidejä…';

  try {
    // 1. Save search record
    const { data: searchRow, error: searchErr } = await supabase
      .from('searches')
      .insert({
        user_id: currentUser.id,
        region,
        industry_code: category.code,
        industry_label: category.label,
        target_audience: city || null,
        status: 'running',
      })
      .select()
      .single();

    if (searchErr) throw searchErr;

    // 2. Call Google Places via edge function
    const { data, error: fnErr } = await supabase.functions.invoke('search-places', {
      body: {
        query,
        placeType: category.placeType,
        regionLabel: regionName,
        cityLabel: city,
        limit,
      },
    });

    if (fnErr) throw new Error(fnErr.message || 'Hakupalvelu ei vastannut');
    if (data?.error) throw new Error(data.error);

    const rawLeads = data?.leads || [];

    if (rawLeads.length === 0) {
      await supabase.from('searches').update({ status: 'empty', result_count: 0 }).eq('id', searchRow.id);
      resultEl.innerHTML = `
        <div class="card">
          <h4>Ei tuloksia</h4>
          <p style="color: var(--text-2); margin-top: 0.5rem;">
            Valitulla yhdistelmällä ei löytynyt yrityksiä Google Placesista. Kokeile toista
            kaupunkia tai laajempaa toimialaa.
          </p>
        </div>`;
      return;
    }

    // 3. Persist leads with scoring + dedup against existing google_place_id
    const placeIds = rawLeads.map((l) => l.google_place_id).filter(Boolean);
    const { data: existing } = await supabase
      .from('leads')
      .select('google_place_id')
      .eq('user_id', currentUser.id)
      .in('google_place_id', placeIds);

    const existingIds = new Set((existing || []).map((l) => l.google_place_id));

    const leadsToInsert = rawLeads
      .filter((l) => !existingIds.has(l.google_place_id))
      .map((l) => ({
        user_id: currentUser.id,
        search_id: searchRow.id,
        business_name: l.business_name,
        business_id: '',
        address: l.address || '',
        city: l.city || '',
        postal_code: l.postal_code || '',
        region,
        industry_code: category.code,
        industry_label: category.label,
        google_place_id: l.google_place_id,
        google_rating: l.google_rating,
        google_reviews_count: l.google_reviews_count,
        google_maps_url: l.google_maps_url,
        score: scoreFromRating(l.google_rating, l.google_reviews_count),
        status: 'new',
      }));

    let inserted = 0;
    if (leadsToInsert.length > 0) {
      const { error: insertErr } = await supabase.from('leads').insert(leadsToInsert);
      if (insertErr) throw insertErr;
      inserted = leadsToInsert.length;
    }

    await supabase
      .from('searches')
      .update({ status: 'completed', result_count: inserted })
      .eq('id', searchRow.id);

    const dupCount = rawLeads.length - inserted;
    resultEl.innerHTML = `
      <div class="card" style="border-color: var(--brand-border);">
        <h4>✓ Haku valmis — ${inserted} uutta liidiä lisätty</h4>
        <p style="color: var(--text-2); margin: 0.5rem 0 1rem;">
          Toimiala: <strong style="color: var(--text);">${category.label}</strong> ·
          Sijainti: <strong style="color: var(--text);">${locationLabel}</strong>
          ${dupCount > 0 ? `<br/><span style="color: var(--text-3);">${dupCount} duplikaattia ohitettu (jo listallasi).</span>` : ''}
        </p>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary" data-nav-btn="leads">Näytä liidit →</button>
          <button class="btn btn-secondary" data-nav-btn="leads" data-trigger-enrich="true">
            ✨ Rikastuta heti (Google Details + web)
          </button>
        </div>
      </div>`;

    toast(`${inserted} uutta liidiä lisätty${dupCount > 0 ? ` (${dupCount} duplikaattia)` : ''}`, 'success');
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

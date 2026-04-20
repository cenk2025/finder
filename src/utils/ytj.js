// YTJ / PRH Avoin data API wrapper
// Docs: https://avoindata.prh.fi/ytj.html
// v3 endpoint returns JSON: { companies: [...], totalResults, ... }

import { REGION_POSTAL_PREFIXES, getRegionByPostal } from './regions.js';
import { getIndustryLabel } from './industries.js';

const API_BASE = 'https://avoindata.prh.fi/opendata-ytj-api/v3';

/**
 * Search YTJ for Finnish companies.
 * @param {Object} opts
 * @param {string} opts.industryCode - TOL 2008 main business line (e.g. "62")
 * @param {string} opts.region - Region code (maps to postal code prefixes)
 * @param {number} opts.limit - Max rows to return
 * @returns {Promise<Array>} normalized leads
 */
export async function searchCompanies({ industryCode, region, limit = 50 }) {
  const params = new URLSearchParams();
  if (industryCode) params.set('mainBusinessLine', industryCode);
  params.set('companyRegistrationFrom', '2015-01-01');
  params.set('page', '1');

  const url = `${API_BASE}/companies?${params.toString()}`;

  let companies = [];
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(`YTJ HTTP ${res.status}`);
    const data = await res.json();
    companies = data.companies || [];
  } catch (err) {
    console.error('[YTJ] fetch failed:', err);
    throw new Error('Yritystietojen haku epäonnistui. Yritä hetken kuluttua uudelleen.');
  }

  const normalized = companies.map((c) => normalizeCompany(c, industryCode));

  // Region filter via postal code
  const filtered = region
    ? normalized.filter((c) => {
        const detectedRegion = getRegionByPostal(c.postal_code);
        return detectedRegion === region;
      })
    : normalized;

  return filtered.slice(0, limit);
}

function normalizeCompany(c, industryCode) {
  const name = pickLatest(c.names)?.name || c.companyForm || 'Tuntematon';
  const addr = pickLatest(c.addresses) || {};
  const addrLine = [addr.street, addr.buildingNumber, addr.entrance, addr.apartmentNumber]
    .filter(Boolean)
    .join(' ');
  const industryLabel = pickLatest(c.mainBusinessLine)?.descriptions?.find((d) => d.languageCode === '1')?.description
    || getIndustryLabel(industryCode);

  return {
    business_name: name,
    business_id: c.businessId?.value || '',
    address: addrLine || '',
    postal_code: addr.postCode || '',
    city: addr.postOffices?.find((p) => p.languageCode === '1')?.city || addr.postOffices?.[0]?.city || '',
    industry_code: industryCode || pickLatest(c.mainBusinessLine)?.typeCode || '',
    industry_label: industryLabel,
    website: extractWebsite(c),
    phone: '',
    email: '',
    linkedin: '',
    facebook: '',
    instagram: '',
    notes: c.status === 'Active' ? 'Aktiivinen yritys YTJ:ssä' : '',
  };
}

function pickLatest(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  // Prefer entries without endDate (still active)
  const active = arr.filter((x) => !x.endDate);
  return (active[0] || arr[0]);
}

function extractWebsite(c) {
  // YTJ doesn't provide website directly, but we can derive a guess from business name
  return '';
}

/**
 * Score a lead based on how well it fits Voon's ideal customer profile.
 * Higher score = better fit.
 */
export function scoreLead(lead, targetAudience) {
  let score = 50;
  // Active business with complete address
  if (lead.business_id) score += 10;
  if (lead.city) score += 5;
  // Industry match — Voon's sweet spots
  const sweetSpots = ['62', '63', '69', '70', '73', '78', '46', '47', '64', '66', '86'];
  if (sweetSpots.includes(lead.industry_code)) score += 20;
  // Urban areas are more likely to adopt AI
  const urbanPrefixes = ['00', '01', '02', '20', '33', '40', '70', '90'];
  if (urbanPrefixes.includes(String(lead.postal_code).slice(0, 2))) score += 10;
  return Math.min(100, Math.max(0, score));
}

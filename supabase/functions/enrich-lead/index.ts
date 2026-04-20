// Supabase Edge Function: enrich-lead
// Enriches a single lead via Google Places + website scraping
//
// Deploy:  supabase functions deploy enrich-lead
// Secrets: supabase secrets set GOOGLE_PLACES_API_KEY=xxx
//
// Invoke (frontend):
//   supabase.functions.invoke('enrich-lead', { body: { lead_id } })

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const PLACES_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401);

    const { lead_id } = await req.json();
    if (!lead_id) return json({ error: 'lead_id required' }, 400);

    const { data: lead, error: leadErr } = await supabase
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .maybeSingle();

    if (leadErr || !lead) return json({ error: 'Lead not found' }, 404);

    const enrichment = await enrich(lead);

    const { error: updateErr } = await supabase
      .from('leads')
      .update({ ...enrichment, enriched_at: new Date().toISOString() })
      .eq('id', lead_id);

    if (updateErr) return json({ error: updateErr.message }, 500);

    return json({ success: true, enrichment });
  } catch (err) {
    console.error('enrich-lead error:', err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

async function enrich(lead: Record<string, any>) {
  const result: Record<string, any> = {};

  // 1) Google Places: Find Place
  const query = [lead.business_name, lead.city, 'Finland'].filter(Boolean).join(' ');
  const place = await findPlace(query);

  if (place) {
    result.google_place_id = place.place_id;
    result.google_maps_url = place.url || null;
    result.google_rating = place.rating ?? null;
    result.google_reviews_count = place.user_ratings_total ?? null;
    if (place.formatted_phone_number && !lead.phone) result.phone = place.formatted_phone_number;
    if (place.international_phone_number && !result.phone) result.phone = place.international_phone_number;
    if (place.website && !lead.website) result.website = place.website;
  }

  // 2) Website scraping (email + socials)
  const websiteUrl = result.website || lead.website;
  if (websiteUrl) {
    const scraped = await scrapeContactInfo(websiteUrl);
    if (scraped.email && !lead.email) result.email = scraped.email;
    if (scraped.linkedin && !lead.linkedin) result.linkedin = scraped.linkedin;
    if (scraped.facebook && !lead.facebook) result.facebook = scraped.facebook;
    if (scraped.instagram && !lead.instagram) result.instagram = scraped.instagram;
  }

  return result;
}

async function findPlace(query: string) {
  try {
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&region=fi&key=${PLACES_KEY}`;
    const sRes = await fetch(searchUrl);
    const sData = await sRes.json();
    const first = sData.results?.[0];
    if (!first?.place_id) return null;

    const fields = [
      'place_id', 'name', 'formatted_address', 'formatted_phone_number',
      'international_phone_number', 'website', 'url', 'rating',
      'user_ratings_total', 'business_status',
    ].join(',');

    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${first.place_id}&fields=${fields}&key=${PLACES_KEY}`;
    const dRes = await fetch(detailsUrl);
    const dData = await dRes.json();
    return dData.result || null;
  } catch (err) {
    console.error('findPlace failed:', err);
    return null;
  }
}

async function scrapeContactInfo(url: string) {
  const result = { email: '', linkedin: '', facebook: '', instagram: '' };
  const pages = [url, joinUrl(url, '/yhteystiedot'), joinUrl(url, '/yhteys'), joinUrl(url, '/contact')];

  for (const page of pages) {
    try {
      const res = await fetch(page, {
        signal: AbortSignal.timeout(6000),
        headers: { 'User-Agent': 'VoonLeadFinder/1.0 (+https://voon.fi)' },
        redirect: 'follow',
      });
      if (!res.ok) continue;
      const html = await res.text();
      mergeScraped(result, extractFromHtml(html));
      if (result.email && result.linkedin && result.facebook && result.instagram) break;
    } catch {
      // skip failed page
    }
  }
  return result;
}

function extractFromHtml(html: string) {
  const out = { email: '', linkedin: '', facebook: '', instagram: '' };

  // Email: prefer mailto: links first
  const mailto = html.match(/mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (mailto) {
    out.email = mailto[1].toLowerCase();
  } else {
    const m = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (m && !isJunkEmail(m[0])) out.email = m[0].toLowerCase();
  }

  out.linkedin = firstMatch(html, /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in|school)\/[a-zA-Z0-9._-]+/i);
  out.facebook = firstMatch(html, /https?:\/\/(?:www\.)?facebook\.com\/[a-zA-Z0-9.][a-zA-Z0-9._-]{2,}/i);
  out.instagram = firstMatch(html, /https?:\/\/(?:www\.)?instagram\.com\/[a-zA-Z0-9._][a-zA-Z0-9._-]{1,}/i);

  // Clean trailing punctuation
  ['linkedin', 'facebook', 'instagram'].forEach((k) => {
    out[k] = (out[k] || '').replace(/[\)\]"'>]+$/, '').replace(/\/$/, '');
  });

  return out;
}

function firstMatch(s: string, re: RegExp) {
  return s.match(re)?.[0] || '';
}

function mergeScraped(acc: any, next: any) {
  for (const k of Object.keys(acc)) if (!acc[k] && next[k]) acc[k] = next[k];
}

function isJunkEmail(e: string) {
  const low = e.toLowerCase();
  return (
    low.endsWith('@sentry.io') ||
    low.endsWith('@example.com') ||
    low.endsWith('@wixpress.com') ||
    low.includes('@your') ||
    low.includes('noreply') ||
    low.startsWith('u003')
  );
}

function joinUrl(base: string, path: string) {
  try {
    return new URL(path, base).toString();
  } catch {
    return base;
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

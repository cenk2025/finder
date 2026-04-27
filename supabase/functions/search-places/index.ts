// Supabase Edge Function: search-places
// Searches Google Places (Text Search) for businesses by category + location.
// Returns normalized lead candidates; frontend persists them to the leads table.
//
// Deploy:  supabase functions deploy search-places
// Secret:  GOOGLE_PLACES_API_KEY (already set for enrich-lead)
//
// Invoke (frontend):
//   supabase.functions.invoke('search-places', {
//     body: { query, placeType, regionLabel, cityLabel, limit }
//   })

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

const TEXT_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
const MAX_PAGES = 3;       // Google Places caps Text Search at 60 results (3 pages × 20)
const PAGE_DELAY_MS = 2100; // next_page_token requires ~2s warm-up

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization') || '';
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json();
    const { query, placeType, regionLabel, cityLabel, limit = 50 } = body || {};

    if (!query) return json({ error: 'query required' }, 400);

    const places = await searchAllPages({
      query,
      placeType,
      maxResults: Math.min(limit, MAX_PAGES * 20),
    });

    const leads = places.map((p) => normalize(p, regionLabel, cityLabel));
    return json({ count: leads.length, leads });
  } catch (err) {
    console.error('search-places error:', err);
    return json({ error: String(err?.message || err) }, 500);
  }
});

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  business_status?: string;
}

async function searchAllPages(opts: { query: string; placeType?: string; maxResults: number }) {
  const all: PlaceResult[] = [];
  let nextPageToken: string | undefined;
  let pageCount = 0;

  while (pageCount < MAX_PAGES && all.length < opts.maxResults) {
    if (nextPageToken) {
      // Google requires a short delay before next_page_token becomes valid
      await sleep(PAGE_DELAY_MS);
    }

    const params = new URLSearchParams();
    if (nextPageToken) {
      params.set('pagetoken', nextPageToken);
    } else {
      params.set('query', opts.query);
      if (opts.placeType) params.set('type', opts.placeType);
      params.set('region', 'fi');
    }
    params.set('key', PLACES_KEY);
    params.set('language', 'fi');

    const res = await fetch(`${TEXT_SEARCH_URL}?${params.toString()}`);
    const data = await res.json();

    if (data.status && data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places: ${data.status}${data.error_message ? ' — ' + data.error_message : ''}`);
    }

    const results: PlaceResult[] = data.results || [];
    all.push(...results);

    nextPageToken = data.next_page_token;
    pageCount++;
    if (!nextPageToken) break;
  }

  return all.slice(0, opts.maxResults);
}

function normalize(p: PlaceResult, regionLabel?: string, cityLabel?: string) {
  // Parse city + postal_code from formatted_address, e.g. "Aleksanterinkatu 7, 00100 Helsinki, Suomi"
  const addr = p.formatted_address || '';
  const cityMatch = addr.match(/(\d{5})\s+([^,]+)/);
  const postalCode = cityMatch?.[1] || '';
  const detectedCity = cityMatch?.[2]?.trim() || '';
  const street = addr.split(',')[0]?.trim() || '';

  return {
    business_name: p.name,
    business_id: '',
    address: street,
    postal_code: postalCode,
    city: cityLabel || detectedCity || '',
    google_place_id: p.place_id,
    google_rating: p.rating ?? null,
    google_reviews_count: p.user_ratings_total ?? null,
    google_maps_url: p.place_id ? `https://www.google.com/maps/place/?q=place_id:${p.place_id}` : null,
    types: p.types || [],
    business_status: p.business_status || null,
  };
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

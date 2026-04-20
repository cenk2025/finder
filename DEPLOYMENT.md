# Deployment Guide

## 1. Tietokantamuutokset (Supabase)

Aja Supabase **SQL Editor**issa:

```sql
-- Aja tämä tiedosto: supabase-migration-enrichment.sql
alter table public.leads
  add column if not exists google_place_id text,
  add column if not exists google_rating numeric(3,2),
  add column if not exists google_reviews_count int,
  add column if not exists google_maps_url text,
  add column if not exists enriched_at timestamptz;
```

## 2. Edge Functionin deployment

### Asenna Supabase CLI

```bash
npm install -g supabase
# tai macOS: brew install supabase/tap/supabase
```

### Kirjaudu ja linkitä projekti

```bash
cd finder
supabase login
supabase link --project-ref <sinun-project-ref>
# project-ref löytyy Supabase Dashboard → Settings → General → Reference ID
```

### Aseta salainen avain

```bash
supabase secrets set GOOGLE_PLACES_API_KEY=<sinun-avain>
```

### Deploy funktio

```bash
supabase functions deploy enrich-lead
```

Tämän jälkeen funktio on saatavilla URL-osoitteessa:
`https://<project-ref>.supabase.co/functions/v1/enrich-lead`

## 3. Google Cloud -asetukset

Varmista, että Google Cloud -projektissa on aktivoitu:
- **Places API** (legacy, käyttää `/maps/api/place/textsearch` ja `/details` endpointteja)

Ilman aktivointia funktio palauttaa `REQUEST_DENIED`.

### Billing

- Places API vaatii laskutustilin (Google antaa $200/kk ilmaista kiintiötä)
- ~5800 rikastusta/kk ilmaiseksi (Text Search + Details = $0.034/lead)

### API-avaimen rajoitukset (suositellaan)

Google Cloud Console → APIs & Services → Credentials → avaimesi → **Application restrictions**:
- Jätä tyhjäksi (Edge Function kutsuu palvelimelta)

**API restrictions:** Rajaa vain `Places API` -päätepisteisiin.

## 4. Vercel

Ympäristömuuttujat (Settings → Environment Variables):
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Uudelleendeployauksen jälkeen rikastus toimii.

## 5. Testaus

1. Kirjaudu appiin → suorita YTJ-haku
2. Avaa liidi drawer → klikkaa **Rikastuta (Google + web)**
3. Kentät (puhelin, verkkosivu, Google-arvio) täyttyvät sekunneissa
4. Liidit-näkymässä **Rikastuta top 10** käsittelee 10 parasta skooria

## Vianmääritys

| Oire | Syy | Korjaus |
|---|---|---|
| `Unauthorized` | JWT puuttuu kutsusta | Varmista että käyttäjä on kirjautunut |
| `GOOGLE_PLACES_API_KEY is not defined` | Secret ei asetettu | `supabase secrets set GOOGLE_PLACES_API_KEY=...` |
| `REQUEST_DENIED` Google-vastauksessa | Places API ei aktivoitu tai billing puuttuu | Google Cloud Console → Places API → Enable + billing |
| Ei e-posta/some | Sivusto blokkaa scraperin tai sivu on JS-pohjainen | Normaali — ~30-40% sivuista ei anna dataa |
| Timeout | Hidas sivusto | Funktio odottaa 6s per sivu; lisää hitaampia tarvittaessa |

# Voon Lead Finder

AI-avusteinen B2B-liidien hankinta suomalaisille yrityksille. Kerää potentiaalisten asiakkaiden tiedot YTJ-yritysrekisteristä, rikastaa ne sopivuusarvioinnilla ja tarjoaa visuaalisen dashboardin myyntiputken hallintaan.

## Tech stack

- **Vite 5** + Vanilla JS (ES6 modules)
- **Supabase** (Auth + Postgres + RLS)
- **Chart.js** grafiikoille
- **YTJ / PRH Avoin data API** liidien lähteenä
- Oma CSS-design-järjestelmä (deep space + electric cyan/lime)

## Setup

1. Asenna riippuvuudet:
   ```bash
   npm install
   ```

2. Luo Supabase-projekti osoitteessa [supabase.com](https://supabase.com) ja aja SQL:
   ```sql
   -- Avaa supabase-schema.sql Supabase SQL Editorissa ja suorita
   ```

3. Kopioi ympäristömuuttujat:
   ```bash
   cp .env.example .env
   ```
   Täytä `VITE_SUPABASE_URL` ja `VITE_SUPABASE_ANON_KEY`.

4. Käynnistä dev-serveri:
   ```bash
   npm run dev
   ```
   → http://localhost:5174

## Rakenne

```
finder/
├── index.html              # Aloitussivu + auth-modal
├── dashboard.html          # Kirjautuneen käyttäjän dashboard
├── supabase-schema.sql     # DB-taulut + RLS-politiikat
└── src/
    ├── main.js             # Landing entry
    ├── dashboard.js        # Dashboard entry & router
    ├── styles/main.css     # Design-järjestelmä
    ├── js/                 # Näkymäkohtainen logiikka
    │   ├── auth.js
    │   ├── cookie-consent.js
    │   ├── search.js
    │   ├── leads.js
    │   └── charts.js
    └── utils/              # Jaetut apurit
        ├── supabase.js
        ├── ytj.js          # YTJ API-käärö
        ├── regions.js      # Suomen 19 maakuntaa
        ├── industries.js   # TOL 2008
        └── toast.js
```

## Tietolähteet

- **YTJ / PRH Avoin data** — yritystiedot (nimi, Y-tunnus, osoite, toimiala)
  - https://avoindata.prh.fi/ytj.html
  - Ei vaadi API-avainta, ilmainen
- **Google Places API** (valinnainen) — puhelin, verkkosivu, Google-arvio
  - Edge Function hoitaa kutsut, API-avain palvelinpuolella
  - Ks. [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Web scraping** — sähköposti + some-tilit yritysten verkkosivuilta
  - Yksinkertainen regex-pohjainen ekstraktio

## Roadmap (MVP jälkeen)

- Google Places -integraatio (puhelin, verkkosivu, some)
- Sähköpostiosoitteiden päättely (pattern-matching toimialueesta)
- LinkedIn-yrityssivujen haku
- Automaattinen sähköpostien validointi
- Team workspaces
- Monikielisyys (englanti)

## Lisenssi

© 2026 Voon IQ Oy

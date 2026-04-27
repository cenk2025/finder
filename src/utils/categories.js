// Finnish-friendly business categories mapped to Google Places types.
// Used as the primary lookup taxonomy for lead search.
//
// placeType: Google Places "type" parameter (legacy API). Null = pure text search.
// queryHint: extra keyword(s) appended to the search query (defaults to label).

export const CATEGORIES = [
  // Ravintolat & kahvilat
  { code: 'restaurant',     label: 'Ravintolat',                group: 'Ravintolat & kahvilat', placeType: 'restaurant' },
  { code: 'cafe',           label: 'Kahvilat',                  group: 'Ravintolat & kahvilat', placeType: 'cafe' },
  { code: 'bakery',         label: 'Leipomot',                  group: 'Ravintolat & kahvilat', placeType: 'bakery' },
  { code: 'bar',            label: 'Baarit ja yökerhot',        group: 'Ravintolat & kahvilat', placeType: 'bar' },
  { code: 'fast-food',      label: 'Pikaruokaravintolat',       group: 'Ravintolat & kahvilat', placeType: 'meal_takeaway' },

  // Terveys & hyvinvointi
  { code: 'hospital',       label: 'Sairaalat',                 group: 'Terveys ja hyvinvointi', placeType: 'hospital' },
  { code: 'doctor',         label: 'Lääkäriasemat',             group: 'Terveys ja hyvinvointi', placeType: 'doctor' },
  { code: 'dentist',        label: 'Hammaslääkärit',            group: 'Terveys ja hyvinvointi', placeType: 'dentist' },
  { code: 'pharmacy',       label: 'Apteekit',                  group: 'Terveys ja hyvinvointi', placeType: 'pharmacy' },
  { code: 'physio',         label: 'Fysioterapia',              group: 'Terveys ja hyvinvointi', placeType: 'physiotherapist' },
  { code: 'vet',            label: 'Eläinlääkärit',             group: 'Terveys ja hyvinvointi', placeType: 'veterinary_care' },
  { code: 'optician',       label: 'Optikot',                   group: 'Terveys ja hyvinvointi', placeType: null, queryHint: 'optikko' },

  // Kauneus & kunto
  { code: 'hairdresser',    label: 'Kampaamot ja parturit',     group: 'Kauneus ja kunto',      placeType: 'hair_care' },
  { code: 'beauty',         label: 'Kauneushoitolat',           group: 'Kauneus ja kunto',      placeType: 'beauty_salon' },
  { code: 'gym',            label: 'Kuntosalit',                group: 'Kauneus ja kunto',      placeType: 'gym' },
  { code: 'spa',            label: 'Kylpylät ja hieronta',      group: 'Kauneus ja kunto',      placeType: 'spa' },

  // Majoitus
  { code: 'hotel',          label: 'Hotellit',                  group: 'Majoitus',              placeType: 'lodging', queryHint: 'hotelli' },
  { code: 'hostel',         label: 'Hostellit ja mökit',        group: 'Majoitus',              placeType: 'lodging', queryHint: 'hostelli mökki' },

  // Vähittäiskauppa
  { code: 'supermarket',    label: 'Päivittäistavarakaupat',    group: 'Vähittäiskauppa',       placeType: 'supermarket' },
  { code: 'clothing',       label: 'Vaatekaupat',               group: 'Vähittäiskauppa',       placeType: 'clothing_store' },
  { code: 'shopping-mall',  label: 'Kauppakeskukset',           group: 'Vähittäiskauppa',       placeType: 'shopping_mall' },
  { code: 'furniture',      label: 'Huonekaluliikkeet',         group: 'Vähittäiskauppa',       placeType: 'furniture_store' },
  { code: 'electronics',    label: 'Elektroniikkaliikkeet',     group: 'Vähittäiskauppa',       placeType: 'electronics_store' },
  { code: 'florist',        label: 'Kukkakaupat',               group: 'Vähittäiskauppa',       placeType: 'florist' },

  // Auto & liikenne
  { code: 'car-dealer',     label: 'Autoliikkeet',              group: 'Auto ja liikenne',      placeType: 'car_dealer' },
  { code: 'car-repair',     label: 'Autokorjaamot',             group: 'Auto ja liikenne',      placeType: 'car_repair' },
  { code: 'car-wash',       label: 'Autopesut',                 group: 'Auto ja liikenne',      placeType: 'car_wash' },
  { code: 'gas-station',    label: 'Huoltoasemat',              group: 'Auto ja liikenne',      placeType: 'gas_station' },
  { code: 'taxi',           label: 'Taksipalvelut',             group: 'Auto ja liikenne',      placeType: 'taxi_stand' },

  // Koti & rakennus
  { code: 'electrician',    label: 'Sähköasentajat',            group: 'Koti ja rakennus',      placeType: 'electrician' },
  { code: 'plumber',        label: 'Putkimiehet (LVI)',         group: 'Koti ja rakennus',      placeType: 'plumber' },
  { code: 'painter',        label: 'Maalarit',                  group: 'Koti ja rakennus',      placeType: 'painter' },
  { code: 'roofing',        label: 'Kattourakointi',            group: 'Koti ja rakennus',      placeType: 'roofing_contractor' },
  { code: 'construction',   label: 'Rakennusliikkeet',          group: 'Koti ja rakennus',      placeType: 'general_contractor' },
  { code: 'cleaning',       label: 'Siivouspalvelut',           group: 'Koti ja rakennus',      placeType: null, queryHint: 'siivouspalvelu' },

  // Ammatilliset palvelut
  { code: 'lawyer',         label: 'Asianajotoimistot',         group: 'Ammatilliset palvelut', placeType: 'lawyer' },
  { code: 'accounting',     label: 'Tilitoimistot',             group: 'Ammatilliset palvelut', placeType: 'accounting' },
  { code: 'real-estate',    label: 'Kiinteistönvälitys',        group: 'Ammatilliset palvelut', placeType: 'real_estate_agency' },
  { code: 'insurance',      label: 'Vakuutusyhtiöt',            group: 'Ammatilliset palvelut', placeType: 'insurance_agency' },
  { code: 'bank',           label: 'Pankit',                    group: 'Ammatilliset palvelut', placeType: 'bank' },
  { code: 'marketing',      label: 'Markkinointitoimistot',     group: 'Ammatilliset palvelut', placeType: null, queryHint: 'mainostoimisto markkinointitoimisto' },
  { code: 'consulting',     label: 'Konsulttitoimistot',        group: 'Ammatilliset palvelut', placeType: null, queryHint: 'konsulttitoimisto' },
  { code: 'translation',    label: 'Käännöstoimistot',          group: 'Ammatilliset palvelut', placeType: null, queryHint: 'käännöstoimisto' },

  // B2B & teknologia
  { code: 'it-company',     label: 'IT-yritykset',              group: 'B2B ja teknologia',     placeType: null, queryHint: 'IT-yritys ohjelmistoyritys' },
  { code: 'software',       label: 'Ohjelmistotalot',           group: 'B2B ja teknologia',     placeType: null, queryHint: 'ohjelmistotalo' },
  { code: 'web-agency',     label: 'Verkkopalveluyritykset',    group: 'B2B ja teknologia',     placeType: null, queryHint: 'web-toimisto digitoimisto' },
  { code: 'logistics',      label: 'Logistiikkayritykset',      group: 'B2B ja teknologia',     placeType: null, queryHint: 'logistiikkayritys kuljetusliike' },
  { code: 'recruiting',     label: 'Rekrytointitoimistot',      group: 'B2B ja teknologia',     placeType: null, queryHint: 'rekrytointitoimisto henkilöstöpalvelu' },

  // Koulutus
  { code: 'preschool',      label: 'Päiväkodit',                group: 'Koulutus',              placeType: 'preschool' },
  { code: 'school',         label: 'Peruskoulut ja lukiot',     group: 'Koulutus',              placeType: 'school' },
  { code: 'university',     label: 'Korkeakoulut',              group: 'Koulutus',              placeType: 'university' },
  { code: 'library',        label: 'Kirjastot',                 group: 'Koulutus',              placeType: 'library' },
  { code: 'language-school',label: 'Kielikoulut',               group: 'Koulutus',              placeType: null, queryHint: 'kielikoulu' },
  { code: 'driving-school', label: 'Autokoulut',                group: 'Koulutus',              placeType: null, queryHint: 'autokoulu' },

  // Julkinen sektori
  { code: 'city-hall',      label: 'Kaupungintalot',            group: 'Julkinen sektori',      placeType: 'city_hall' },
  { code: 'government',     label: 'Kunnat ja virastot',        group: 'Julkinen sektori',      placeType: 'local_government_office' },
  { code: 'police',         label: 'Poliisiasemat',             group: 'Julkinen sektori',      placeType: 'police' },
  { code: 'fire-station',   label: 'Paloasemat',                group: 'Julkinen sektori',      placeType: 'fire_station' },
  { code: 'post',           label: 'Postit',                    group: 'Julkinen sektori',      placeType: 'post_office' },
  { code: 'embassy',        label: 'Suurlähetystöt',            group: 'Julkinen sektori',      placeType: 'embassy' },

  // Kulttuuri & vapaa-aika
  { code: 'museum',         label: 'Museot',                    group: 'Kulttuuri ja vapaa-aika', placeType: 'museum' },
  { code: 'art-gallery',    label: 'Taidegalleriat',            group: 'Kulttuuri ja vapaa-aika', placeType: 'art_gallery' },
  { code: 'cinema',         label: 'Elokuvateatterit',          group: 'Kulttuuri ja vapaa-aika', placeType: 'movie_theater' },
  { code: 'church',         label: 'Kirkot ja seurakunnat',     group: 'Kulttuuri ja vapaa-aika', placeType: 'church' },
  { code: 'park',           label: 'Puistot ja luontokohteet',  group: 'Kulttuuri ja vapaa-aika', placeType: 'park' },
  { code: 'tourist',        label: 'Matkailukohteet',           group: 'Kulttuuri ja vapaa-aika', placeType: 'tourist_attraction' },
];

export function getCategoryByCode(code) {
  return CATEGORIES.find((c) => c.code === code) || null;
}

export function getCategoryLabel(code) {
  return getCategoryByCode(code)?.label || code;
}

/**
 * Lead score based on Google rating + review count.
 * Higher rating + more reviews = higher score.
 */
export function scoreFromRating(rating, reviewsCount) {
  if (!rating) return 50;
  const ratingScore = rating * 14;       // 4.5 → 63
  const volumeScore = Math.min(35, Math.log10((reviewsCount || 0) + 1) * 14); // 100 reviews → 28
  return Math.min(100, Math.round(ratingScore + volumeScore));
}

// Suomen maakunnat (Finnish regions) — 19 regions + major cities per region
// Used for YTJ search filtering via postCode prefix or location

export const REGIONS = [
  { code: 'uusimaa', name: 'Uusimaa', cities: ['Helsinki', 'Espoo', 'Vantaa', 'Kauniainen', 'Hyvinkää', 'Järvenpää', 'Kerava', 'Kirkkonummi', 'Lohja', 'Nurmijärvi', 'Porvoo', 'Tuusula', 'Vihti'] },
  { code: 'varsinais-suomi', name: 'Varsinais-Suomi', cities: ['Turku', 'Kaarina', 'Raisio', 'Naantali', 'Salo', 'Uusikaupunki', 'Paimio'] },
  { code: 'satakunta', name: 'Satakunta', cities: ['Pori', 'Rauma', 'Ulvila', 'Kankaanpää', 'Harjavalta'] },
  { code: 'kanta-hame', name: 'Kanta-Häme', cities: ['Hämeenlinna', 'Riihimäki', 'Forssa', 'Janakkala'] },
  { code: 'pirkanmaa', name: 'Pirkanmaa', cities: ['Tampere', 'Nokia', 'Ylöjärvi', 'Kangasala', 'Lempäälä', 'Pirkkala', 'Valkeakoski', 'Sastamala'] },
  { code: 'paijat-hame', name: 'Päijät-Häme', cities: ['Lahti', 'Heinola', 'Orimattila', 'Hollola'] },
  { code: 'kymenlaakso', name: 'Kymenlaakso', cities: ['Kotka', 'Kouvola', 'Hamina'] },
  { code: 'etela-karjala', name: 'Etelä-Karjala', cities: ['Lappeenranta', 'Imatra'] },
  { code: 'etela-savo', name: 'Etelä-Savo', cities: ['Mikkeli', 'Savonlinna', 'Pieksämäki'] },
  { code: 'pohjois-savo', name: 'Pohjois-Savo', cities: ['Kuopio', 'Iisalmi', 'Varkaus', 'Siilinjärvi'] },
  { code: 'pohjois-karjala', name: 'Pohjois-Karjala', cities: ['Joensuu', 'Kitee', 'Lieksa'] },
  { code: 'keski-suomi', name: 'Keski-Suomi', cities: ['Jyväskylä', 'Jämsä', 'Äänekoski', 'Laukaa', 'Muurame'] },
  { code: 'etela-pohjanmaa', name: 'Etelä-Pohjanmaa', cities: ['Seinäjoki', 'Kauhajoki', 'Lapua', 'Ilmajoki', 'Kurikka'] },
  { code: 'pohjanmaa', name: 'Pohjanmaa', cities: ['Vaasa', 'Pietarsaari', 'Kokkola (osa)', 'Mustasaari'] },
  { code: 'keski-pohjanmaa', name: 'Keski-Pohjanmaa', cities: ['Kokkola', 'Kannus'] },
  { code: 'pohjois-pohjanmaa', name: 'Pohjois-Pohjanmaa', cities: ['Oulu', 'Raahe', 'Kempele', 'Ylivieska', 'Kuusamo', 'Haukipudas'] },
  { code: 'kainuu', name: 'Kainuu', cities: ['Kajaani', 'Sotkamo', 'Kuhmo'] },
  { code: 'lappi', name: 'Lappi', cities: ['Rovaniemi', 'Kemi', 'Tornio', 'Sodankylä', 'Kittilä'] },
  { code: 'ahvenanmaa', name: 'Ahvenanmaa', cities: ['Maarianhamina'] },
];

// Map region → approximate postal code prefixes (used for YTJ filtering)
export const REGION_POSTAL_PREFIXES = {
  'uusimaa': ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'],
  'varsinais-suomi': ['20', '21', '23', '25'],
  'satakunta': ['26', '27', '28', '29', '38'],
  'kanta-hame': ['11', '12', '13', '14', '30'],
  'pirkanmaa': ['31', '33', '34', '35', '36', '37', '39'],
  'paijat-hame': ['15', '16', '17', '19'],
  'kymenlaakso': ['45', '46', '47', '48', '49'],
  'etela-karjala': ['53', '54', '55', '56'],
  'etela-savo': ['50', '51', '52', '57', '58'],
  'pohjois-savo': ['70', '71', '72', '73', '74', '77', '78'],
  'pohjois-karjala': ['80', '81', '82', '83'],
  'keski-suomi': ['40', '41', '42', '43', '44'],
  'etela-pohjanmaa': ['60', '61', '62', '63', '64'],
  'pohjanmaa': ['65', '66', '67', '68'],
  'keski-pohjanmaa': ['69'],
  'pohjois-pohjanmaa': ['84', '85', '86', '90', '91', '92', '93'],
  'kainuu': ['87', '88', '89'],
  'lappi': ['94', '95', '96', '97', '98', '99'],
  'ahvenanmaa': ['22'],
};

export function getRegionName(code) {
  return REGIONS.find((r) => r.code === code)?.name || code;
}

export function getRegionByPostal(postalCode) {
  if (!postalCode) return null;
  const prefix = String(postalCode).slice(0, 2);
  for (const [code, prefixes] of Object.entries(REGION_POSTAL_PREFIXES)) {
    if (prefixes.includes(prefix)) return code;
  }
  return null;
}

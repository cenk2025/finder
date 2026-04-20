// TOL 2008 toimialaluokitus — yleisimmät B2B-tavoitettavat sektorit
// Source: Tilastokeskus TOL 2008

export const INDUSTRIES = [
  // Palvelut & ammatilliset palvelut
  { code: '62', label: 'Ohjelmistoala ja IT-konsultointi', category: 'IT' },
  { code: '63', label: 'Tietopalvelutoiminta', category: 'IT' },
  { code: '58', label: 'Kustannustoiminta', category: 'Media' },
  { code: '59', label: 'Elokuva-, video- ja tv-tuotanto', category: 'Media' },
  { code: '69', label: 'Lakiasiain- ja laskentatoimipalvelut', category: 'Ammatilliset palvelut' },
  { code: '70', label: 'Liikkeenjohdon konsultointi', category: 'Ammatilliset palvelut' },
  { code: '71', label: 'Tekninen suunnittelu ja testaus', category: 'Ammatilliset palvelut' },
  { code: '73', label: 'Mainonta ja markkinatutkimus', category: 'Markkinointi' },
  { code: '74', label: 'Muut erikoistuneet palvelut', category: 'Ammatilliset palvelut' },
  { code: '78', label: 'Työllistämis- ja rekrytointipalvelut', category: 'HR' },

  // Kauppa
  { code: '45', label: 'Moottoriajoneuvojen kauppa ja korjaus', category: 'Kauppa' },
  { code: '46', label: 'Tukkukauppa', category: 'Kauppa' },
  { code: '47', label: 'Vähittäiskauppa', category: 'Kauppa' },

  // Teollisuus
  { code: '10', label: 'Elintarvikkeiden valmistus', category: 'Teollisuus' },
  { code: '25', label: 'Metallituotteiden valmistus', category: 'Teollisuus' },
  { code: '28', label: 'Muiden koneiden valmistus', category: 'Teollisuus' },
  { code: '33', label: 'Koneiden ja laitteiden korjaus, huolto ja asennus', category: 'Teollisuus' },

  // Rakentaminen
  { code: '41', label: 'Talonrakentaminen', category: 'Rakentaminen' },
  { code: '42', label: 'Maa- ja vesirakentaminen', category: 'Rakentaminen' },
  { code: '43', label: 'Erikoistunut rakennustoiminta', category: 'Rakentaminen' },

  // Logistiikka
  { code: '49', label: 'Maaliikenne ja putkijohtokuljetus', category: 'Logistiikka' },
  { code: '52', label: 'Varastointi ja liikennettä palveleva toiminta', category: 'Logistiikka' },

  // Majoitus & ravintola
  { code: '55', label: 'Majoitus', category: 'Matkailu' },
  { code: '56', label: 'Ravitsemistoiminta', category: 'Matkailu' },

  // Rahoitus
  { code: '64', label: 'Rahoituspalvelut', category: 'Rahoitus' },
  { code: '66', label: 'Rahoitusta ja vakuutusta palveleva toiminta', category: 'Rahoitus' },

  // Kiinteistöt
  { code: '68', label: 'Kiinteistöalan toiminta', category: 'Kiinteistöt' },

  // Terveys & hyvinvointi
  { code: '86', label: 'Terveyspalvelut', category: 'Terveys' },
  { code: '87', label: 'Hoito- ja hoivapalvelut', category: 'Terveys' },
  { code: '96', label: 'Muut henkilökohtaiset palvelut', category: 'Terveys' },

  // Koulutus
  { code: '85', label: 'Koulutus', category: 'Koulutus' },
];

export function getIndustryLabel(code) {
  return INDUSTRIES.find((i) => i.code === code)?.label || code;
}

// Kohdeyleisöt — helpottavat Voonin AI-palvelujen kohdentamista
export const TARGET_AUDIENCES = [
  { code: 'sales-teams', label: 'Myyntitiimit (automaation tarve)' },
  { code: 'hr-recruit', label: 'HR ja rekrytointi' },
  { code: 'customer-service', label: 'Asiakaspalvelu (chatbotit)' },
  { code: 'finance-ops', label: 'Talous ja laskenta' },
  { code: 'operations', label: 'Tuotanto ja operaatiot' },
  { code: 'marketing', label: 'Markkinointi ja sisältö' },
  { code: 'exec-leadership', label: 'Johto ja strategia' },
  { code: 'any', label: 'Ei rajausta' },
];

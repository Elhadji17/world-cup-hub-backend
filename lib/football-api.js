// lib/football-api.js
const BASE_URL = "https://api.football-data.org/v4";
const API_KEY  = process.env.FOOTBALL_API_KEY;
const WC_ID    = 2000;

export async function getFinishedMatches() {
  const res = await fetch(`${BASE_URL}/competitions/${WC_ID}/matches?status=FINISHED`, {
    headers: { "X-Auth-Token": API_KEY },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`football-data.org error: ${err.message ?? res.status}`);
  }
  return (await res.json()).matches ?? [];
}

export async function getLiveMatches() {
  const res = await fetch(`${BASE_URL}/competitions/${WC_ID}/matches?status=IN_PLAY,PAUSED`, {
    headers: { "X-Auth-Token": API_KEY },
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`football-data.org error: ${err.message ?? res.status}`);
  }
  return (await res.json()).matches ?? [];
}

export const TEAM_NAME_MAP = {
  // Amériques
  "Mexico":              "Mexique",
  "Canada":              "Canada",
  "USA":                 "États-Unis",
  "United States":       "États-Unis",
  "Paraguay":            "Paraguay",
  "Uruguay":             "Uruguay",
  "Colombia":            "Colombie",
  "Ecuador":             "Équateur",
  "Bolivia":             "Bolivie",
  "Haiti":               "Haïti",
  "Jamaica":             "Jamaïque",
  "Panama":              "Panama",
  "Argentina":           "Argentine",
  "Brazil":              "Brésil",

  // Europe
  "France":              "France",
  "Germany":             "Allemagne",
  "Spain":               "Espagne",
  "Portugal":            "Portugal",
  "England":             "Angleterre",
  "Netherlands":         "Pays-Bas",
  "Belgium":             "Belgique",
  "Croatia":             "Croatie",
  "Switzerland":         "Suisse",
  "Sweden":              "Suède",
  "Norway":              "Norvège",
  "Austria":             "Autriche",
  "Serbia":              "Serbie",
  "Poland":              "Pologne",
  "Czechia":             "Tchéquie",
  "Czech Republic":      "Tchéquie",
  "Scotland":            "Écosse",
  "Wales":               "Pays de Galles",
  "Bosnia and Herzegovina": "Bosnie-et-Herzégovine",
  "Bosnia-Herzegovina":  "Bosnie-et-Herzégovine",
  "Bosnia-H.":           "Bosnie-et-Herzégovine",

  // Afrique
  "Senegal":             "Sénégal",
  "Morocco":             "Maroc",
  "Tunisia":             "Tunisie",
  "Cameroon":            "Cameroun",
  "Ghana":               "Ghana",
  "South Africa":        "Afrique du Sud",
  "Algeria":             "Algérie",
  "Egypt":               "Égypte",
  "Nigeria":             "Nigeria",
  "Ivory Coast":         "Côte d'Ivoire",
  "Cote d'Ivoire":       "Côte d'Ivoire",
  "Cape Verde":          "Cap-Vert",
  "Cape Verde Islands":  "Cap-Vert",
  "DR Congo":            "RD Congo",
  "Congo DR":            "RD Congo",

  // Asie / Océanie
  "Japan":               "Japon",
  "South Korea":         "Corée du Sud",
  "Korea Republic":      "Corée du Sud",
  "Australia":           "Australie",
  "Saudi Arabia":        "Arabie Saoudite",
  "Iran":                "Iran",
  "Iraq":                "Irak",
  "Qatar":               "Qatar",
  "Jordan":              "Jordanie",
  "Uzbekistan":          "Ouzbékistan",
  "New Zealand":         "Nouvelle-Zélande",

  // Autres
  "Turkey":              "Turquie",
  "Curaçao":             "Curaçao",
};

export function mapTeamName(englishName) {
  return TEAM_NAME_MAP[englishName] ?? englishName;
}